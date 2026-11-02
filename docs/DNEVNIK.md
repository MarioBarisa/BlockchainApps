# AI dnevnik

## T1 — Postavljanje projekta (datum)
- Cilj termina: Napraviti osnovni kostur projekta.
- Najkorisniji prompt (kopiran u cijelosti): Ovo je početno stanje projekta. Još nemam specifično / spcifičnu ideju što želim da moj projekt radi / koja je tema navedenog. Napravi mi osnovni frontend kostur aplikacije koja implementira Web3 / Blokchain tehnoglogiju. Pitaj pitanja za preciziranje izgleda. Neka app odmah bude desktop & mobile frinedly i od početka implementiraj theming support za daisyUI. 
- Što je AI napravio dobro: Dobro je postavio kostur projekta.
- Što je AI napravio drugačije nego što sam očekivao:
- Što sam dodao u AGENTS.md: Minimalne dopune za odžavanje kvalitete projekta.
- Model: Deepseek V4.1 high
- Provjera:
- Commit: 1. f8f1bb6f20e65edb39461147bad172cef778adcf , 2. a0d95cc5a7d269390826b66e2290ba21e43d27f9

## T2 — Spajanje na Testnet (datum)
- Cilj termina: Spojiti se na Sepolia ETH testnet
- Najkorisniji prompt (kopiran u cijelosti): Napravi izmjene na forntendu da se može user spojiti sa svojim ETH ( Sepolia ) walletom i slati i primati seplia tokene.
- Što je AI napravio dobro: Dobro je postavio kostur walleta.
- Što je AI napravio drugačije nego što sam očekivao: --
- Što sam dodao u AGENTS.md: ništa od zadnji puta
- Model: GPT 6.1 Sol medium
- Provjera:
- Commit: 1. ab8b8ae8177cb42d7acbe001ff6ae734b90e50f3 , 2. 61f5efb68fcb85e4ce34e4f996ad78fafd0739cf

## T3: specifikacija, prva verzija i T3 Kritičar
- Cilj termina: Napraviti osnovnu specifikaciju aplikacije
- Najkorisniji prompt (kopiran u cijelosti): Promptovi sa 3. Vježbe ( svi )
- Što je AI napravio dobro: Relativno dobro je pohavato osnovnu ideju pametnog ugovora.
- Što je AI napravio drugačije nego što sam očekivao: Išao je komplicirati bez potrebe.
- Što sam dodao u AGENTS.md: ništa od zadnji puta
- Model: GPT 6.1 Sol high
- Commit: 1. 06766fe471af6c2edb6638d9e246b9adde7f93cc , 2. 96837748cf70484ad8926e88a07eb3a4379f0e83
- 
| ID | Vrsta | Točan odjeljak | Nalaz | Predloženi kriterij prihvaćanja |
| --- | --- | --- | --- | --- |
| N1 | Moguća administratorska zlouporaba | **Funkcije → Token: ProofNewsToken → setRegistry**; **Odluke o tokenu** | `setRegistry` provjerava samo da adresa ima kod. Vlasnik može povezati ugovor koji poziva `mintProof` bez registriranja dokaza. Time prestaje vrijediti tvrdnja da PNP saldo predstavlja broj registracija. Pogrešna veza ujedno je nepovratna. | **Zadano:** kandidat za registar ima kod, ali nije dopuštena implementacija ProofNewsRegistry ili njegov `token()` pokazuje na drugi token. **Kada:** vlasnik pozove `setRegistry`. **Tada:** poziv pada s `"Neispravan registar"` i veza ostaje nepostavljena. Specifikacija mora odrediti kako se prepoznaje dopuštena implementacija; sama prisutnost koda nije dovoljna. |
| N2 | Kontradikcija | **Odluke o modulu → Potpisana potvrda ProofNewsa**; **Što se NE sprema na blockchain → Potvrda** | Prvi odjeljak zahtijeva spremanje početne potvrde prije predaje korisniku, dok drugi kaže da se potpis i verzija **smiju** spremiti. Obnova potvrde ovisi o njihovu postojanju, pa pohrana ne može biti neobvezna. | **Zadano:** sadržaj je spremljen i početna potvrda potpisana. **Kada:** spremanje potpisa ili njegove verzije ne uspije. **Tada:** API vraća HTTP 503 i `"Spremanje zapisa nije uspjelo"` te ne vraća uspješan odgovor s potvrdom spremnom za registraciju. |
| N3 | Kontradikcija i rubni slučaj | **Funkcije → transferOwnership**, u oba ugovora; **K14** | Funkcija zabranjuje samo nultu adresu, pa dopušta prijenos na trenutačnog vlasnika. K14 istodobno zahtijeva da stari vlasnik izgubi ovlasti, što u tom slučaju nije moguće. | **Zadano:** vlasnik ugovora je A. **Kada:** A pozove `transferOwnership(A)`. **Tada:** poziv pada s `"Vlasnik je vec postavljen"`, vlasništvo ostaje isto i nema novog događaja. Alternativno treba izričito dopustiti taj slučaj i suziti K14. |
| N4 | Nepokriven rubni slučaj | **Funkcije → Web i API funkcije → POST /api/generations**; **K17, K30** | Nije definirano ponavljanje istog HTTP zahtjeva nakon izgubljenog odgovora. Poslužitelj može uspješno generirati i spremiti sadržaj, a korisnikov ponovni pokušaj izazvati novi AI poziv, novi trošak i novi ID. Ponovni pokušaj blockchain registracije ne pokriva taj slučaj. | **Zadano:** zahtjev s identifikatorom zahtjeva R već je završio, ali odgovor nije stigao korisniku. **Kada:** korisnik ponovi iste ulaze s R. **Tada:** dobiva isti generationId i sadržaj, bez novog AI poziva. Ponovna uporaba R s drugim ulazima vraća HTTP 409 i `"Zahtjev je vec iskoristen s drugim podacima"`. |
| N5 | Moguća korisnička zlouporaba | **Funkcije → Web i API funkcije**; **Što se NE sprema na blockchain** | Generiranje je javno, a svaki uspješan rezultat trajno se sprema i kada korisnik nikada ne plati registraciju. Nisu definirana ograničenja učestalosti ili istodobnih zahtjeva. Korisnik s valjanim AI ključem može opterećivati dohvat izvora, kompresiju i bazu bez ijedne blockchain transakcije. | **Zadano:** ista IP adresa već ima 3 aktivna zahtjeva generiranja. **Kada:** pošalje četvrti. **Tada:** API vraća HTTP 429 i `"Previse istodobnih zahtjeva"` prije dohvata izvora i AI poziva. Broj 3 predložena je granica koju treba prihvatiti ili zamijeniti. |
| N6 | Nepokriven način zaobilaženja zaštite | **Odluke o modulu → AI servisi, izvori i ulazna ograničenja → Dohvat**; **K21–K23** | Zabranjene su privatne adrese, ali nema kriterija za promjenu DNS odgovora između provjere URL-a i povezivanja. Provjera domene prije zahtjeva ne jamči da HTTP klijent zatim pristupa provjerenoj adresi. Taj slučaj obrađuju i [OWASP smjernice za SSRF](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html). | **Zadano:** domena pri početnoj provjeri pokazuje na javnu adresu, a pri povezivanju ili preusmjeravanju na privatnu adresu. **Kada:** ProofNews pokuša dohvat izvora. **Tada:** ne šalje zahtjev privatnoj adresi, vraća HTTP 400 i `"Neispravna poveznica izvora"` te ne poziva AI. |
| N7 | Neodređena sigurnosna politika | **Odluke o modulu → Potpisana potvrda ProofNewsa**; **K40, K43** | Nije razlikovana redovna promjena potpisnika od opoziva zbog kompromitacije ključa. Obnova prihvaća početni potpis prema povijesnoj evidenciji, ali nije određeno smije li se obnavljati potvrda verzije proglašene kompromitiranom. Postojanje potpisa tada nije pouzdana potvrda izvornog generiranja. | **Zadano:** operator je staru potpisničku verziju označio kompromitiranom. **Kada:** zatraži se obnova još neregistriranog zapisa koji se oslanja samo na tu verziju. **Tada:** API vraća HTTP 409 i `"Potvrda je opozvana"` te ne izdaje novu potvrdu. Redovna rotacija bez kompromitacije ostaje zaseban slučaj. |
| N8 | Moguće pogrešno predstavljanje rezultata | **Funkcije → Web i API funkcije → provjeri**; **Tri rezultata provjere**; **K47–K48** | Poziv provjere bez `record` provjerava sadržaj iz MongoDB-a. Nije izričito propisano da vlastito web sučelje rezultat veže uz tekst koji korisnik upravo vidi ili provjerava. Sučelje bi moglo prikazati izmijenjen sažetak, poslati samo ID i dobiti `original` za drugi, spremljeni sadržaj. | **Zadano:** u web provjeri prikazan je izmijenjeni sažetak uz ID izvornog dokaza. **Kada:** korisnik klikne „Provjeri”. **Tada:** provjerava se upravo prikazani sadržaj i rezultat je `verified: false`, `result: "not_original"`; sučelje ga ne zamjenjuje izvornim sadržajem iz baze prije usporedbe. |
| N9 | Nedovoljno određen kriterij provjere | **Kriteriji prihvaćanja → K28** | K28 tvrdi da ključ nije pohranjen ili zabilježen, ali ne određuje koje se pohrane, dnevnici i izlazi pregledavaju. Bez definiranog opsega provjere nije jasno što predstavlja dokaz prolaska, osobito kod grešaka i posredničkog HTTP zapisivanja. | **Zadano:** test koristi prepoznatljiv probni API ključ i odvojeno simulira uspjeh, provider grešku i grešku baze. **Kada:** svaki zahtjev završi. **Tada:** ključ se ne pojavljuje u MongoDB-u, preglednikovoj pohrani, aplikacijskim/proxy logovima ni javnim odgovorima; novi zahtjev bez ključa vraća `"API kljuc je obavezan"`. |
| N10 | Nepokrivena granica ulaza | **Odluke o modulu → AI servisi, izvori i ulazna ograničenja**; **K21, K23** | „Unicode znak” nije dovoljno precizna jedinica. Broj Unicode kodnih točaka, UTF-16 jedinica i vizualnih znakova može se razlikovati. Različite implementacije zato mogu različito prihvaćati iste promptove na granici. | **Zadano:** duljina se definira brojem Unicode kodnih točaka, a testni AI adapter prihvaća zahtjev. **Kada:** korisnik pošalje prompt od 10.000 znakova izvan osnovne Unicode ravnine, zatim od 10.001 takvog znaka. **Tada:** prvi prolazi provjeru duljine, a drugi vraća HTTP 400 i `"Prompt je predug"`. |
| N11 | Nepokriven slučaj razvojnog okruženja | **Opis → Blockchain**; **Potpisana potvrda ProofNewsa**; **K39, K59** | Nije obrađen reset Remix VM-a nakon kojeg se mogu ponoviti chainId, adresa ugovora, potpisnik i njegova verzija. Ako su svi potpisani podaci ponovno isti, stara potvrda nema oznaku koja razlikuje dvije instance deploymenta. EIP-712 razlikuje samo uključena polja domene. ([EIP-712](https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator)) | **Zadano:** sačuvana je potvrda prije reseta VM-a, a novi deployment ponavlja chainId i adresu registra. **Kada:** korisnik pokuša staru potvrdu na novoj instanci. **Tada:** registracija pada s `"Nevaljana potvrda ProofNewsa"`. Specifikacija treba odrediti razlikovanje instanci, primjerice jedinstvenom domenom ili obveznim novim potpisnikom. |

## T3: Ispravak pronađenih problema spec-a
- Cilj termina: Ispraviti problematike koje je pronašao kritičar
- Najkorisniji prompt (kopiran u cijelosti): Sada na kraju SPEC-a dodaj dio u kojem adresiraš pronađene probleme te minimalni kirurški fix kojim se oni rješavaju unutar SPEC-a.
- Što je AI napravio dobro: Dobro je svatio da želim minimalne kirurške izmjene umjesto velikih pormjena / opesga
- Što je AI napravio drugačije nego što sam očekivao: ništa
- Model: GPT 6.1 Terra xhigh ultrafast
- Što sam dodao u AGENTS.md: ništa od zadnji puta
- Commit: 
 
## T3: sucelje i sljedivost
- Cilj termina: Napraviti osnovnu specifikaciju aplikacije
- Najkorisniji prompt (kopiran u cijelosti): Promptovi sa 3. Vježbe ( svi )
- Što je AI napravio dobro: Relativno dobro je pohavato osnovnu ideju pametnog ugovora.
- Što je AI napravio drugačije nego što sam očekivao: Išao je komplicirati bez potrebe.
- Što sam dodao u AGENTS.md: ništa od zadnji puta
- Model: GPT 6.1 Sol High
- Commit: 
