# Specifikacija: ProofNews

Verzija 1.1 · 2. studenoga 2026. · Specifikacija s obrađenim nalazima recenzije

## Opis

ProofNews povezuje izravan odgovor AI servisa s javnim blockchain dokazom. Svatko može provjeriti odgovaraju li sažetak, prompt, model i izvori registriranoj verziji. Koristi se kroz jednostavnu web aplikaciju ili API te kao dodatak drugom sustavu za AI sažetke.

Korisnik prije generiranja odabire „Generiraj s ProofNews dokazom”, povezuje novčanik i dostavlja 1–3 poveznice, prompt, AI servis, model i API ključ. ProofNews poslužitelj dohvaća izvore, izravno poziva AI servis, sprema neizmijenjeni odgovor i priprema potpisanu potvrdu. Korisnik svojim novčanikom šalje registracijsku transakciju. Uspješan upis istodobno izdaje jedan ERC-20 token kao evidenciju registracije.

| Svojstvo | Pravilo |
| --- | --- |
| Svrha | Evidencija prijavljenog AI podrijetla i provjera nepromijenjenosti zapisa. |
| Generiranje | Svako generiranje koje dobiva ProofNews dokaz prolazi kroz ProofNews poslužitelj. Gotov korisnički sažetak nije dopušten ulaz registracije. |
| Blockchain | Sepolia, chainId 11155111; za vježbe Remix VM sa svojim stvarnim chainId-jem i zasebnom konfiguracijom. |
| Token | ERC-20 ProofNews Proof (PNP), jedna neprenosiva jedinica po uspješno registriranoj generaciji. |
| Modul | Vlastiti modul registra dokaza. Odstupanje od ponuđenih modula vježbe navedeno je u Otvorenim pitanjima. |
| Registracija | Korisnik plaća mrežni gas u ETH-u. Nema dodatne ugovorne naknade, kupnje tokena ili odobravanja potrošnje. Trošak gasa nije fiksan niti unaprijed zajamčeno iznimno malen. |
| AI trošak | Određuje ga AI servis preko korisničkog API ključa; nije naknada ProofNews ugovora. |
| Provjera | Javna i besplatna; bez novčanika, ETH-a, API ključa AI servisa ili nove transakcije. |
| Puni sadržaj | Javan kroz aplikaciju/API, pohranjen u MongoDB-u. Pristupni ključevi nisu javni. |
| Dostava sadržaja | Povezana aplikacija odlučuje kada prikazuje sažetak ili upozorenje. ProofNews ne nameće blokiranje dostave. |

### Granica povjerenja

ProofNews poslužitelju vjeruje se da je pozvao konfigurirani AI servis, točno preuzeo odgovor i potpisao odgovarajući zapis. Blockchain provjerava taj potpis i čuva dokaz registracije. Sam hash, korisnički potpis ili PNP saldo nisu dokaz AI generiranja. Sustav ne potvrđuje istinitost vijesti ili kvalitetu izvora.

Poslužitelj s kompromitiranim potpisnim ključem može izdavati lažne nove potvrde. Vlasnik koji postavi nepoštenog potpisnika također može narušiti vjerodostojnost budućih registracija. Ne mogu se prepisati raniji dokazi. Ovo nije neovisan kriptografski dokaz izvršavanja AI modela bez povjerenja u poslužitelj i AI servis.

~~~mermaid
sequenceDiagram
    participant U as "Korisnik i novčanik"
    participant P as "ProofNews poslužitelj"
    participant A as "AI servis"
    participant D as "MongoDB"
    participant R as "Registar dokaza"
    participant T as "PNP token"

    U->>P: Izvori, prompt, servis, model, API ključ, adresa
    P->>P: Dohvat i provjera svih izvora
    P->>A: Prompt i sačuvani tekstovi izvora
    A-->>P: Izravan AI odgovor
    P->>D: Neizmijenjeni zapis i komprimirani izvori
    P-->>U: Hash i potvrda vezana uz korisnikovu adresu
    U->>R: Registracija, korisnik plaća gas
    R->>R: Provjera potvrde i jedinstvenosti generacije
    R->>T: Izdaj korisniku 1 PNP
    R-->>U: Potvrđena registracija
    Note over R,T: Upis i mint uspijevaju ili padaju zajedno
    U->>P: Besplatna provjera kroz web ili API
    P->>D: Dohvat izvornog zapisa
    P->>R: Čitanje postojećeg dokaza bez transakcije
    P-->>U: original / not_original / not_found ili greška zahtjeva
~~~

## Korisnici i uloge

| Uloga | Ovlasti i ograničenja |
| --- | --- |
| Korisnik / registrator | Bilo koji novčanik, bez prethodnog odobrenja administratora. Pokreće generiranje i registrira dokaz vezan uz svoju adresu. |
| Javni provjeravatelj | Svatko, uključujući posjetitelja bez novčanika. Dohvaća javni sadržaj i besplatno provjerava dokaz. |
| ProofNews poslužitelj | Izravno poziva AI servis i izdaje potvrdu. Njegov potpis nije registracijska transakcija. Sam ne smije izdavati PNP. |
| Ugovor registra | Jedina ugovorna adresa koja smije izdati PNP, unutar uspješne registracije. |
| Vlasnik | Objavitelj pojedinog ugovora, prema Ownable(msg.sender). Jednom povezuje token s registrom, upravlja službenim potpisnikom registra i prenosi vlasništvo. Ne uređuje dokaze niti ručno izdaje ili oduzima tokene. |

Nema dodatnih administratora, funkcija dodavanja/uklanjanja administratora ni popisa odobrenih korisnika. Vlasnik nema iznimku od zabrane prijenosa tokena ili pravila registracije. Ista adresa može imati više uloga, ali mora zadovoljiti uvjete konkretne funkcije.

Token i registar imaju zasebno vlasništvo, početno istog objavitelja. Prijenos vlasništva jednog ne prenosi vlasništvo drugoga. Koristi se izravan Ownable transferOwnership uz nenultu adresu. Ako je adresa ista kao trenutačni owner, vlasnik zadržava ovlasti i emitira se OwnershipTransferred s jednakim previousOwner i newOwner; nije potreban novi revert. Odricanje vlasništva zabranjeno je. Poseban oporavak izgubljenog vlasničkog ključa nije podržan: postojeći dokazi ostaju provjerljivi, a izgubljene upravljačke ovlasti nemaju zaobilazni pristup. Ako su potrebni novi ugovori, objavljuje se novi par i konfiguracija; stari dokazi ostaju vezani uz stare adrese.

## Odluke o tokenu

### Najmanja ERC-20 dopuna izvornom konceptu

PNP je evidencija registracija: korisnik ga ne kupuje, ne troši i ne odobrava njegovu potrošnju. Dobiva jednu jedinicu po uspješno registriranoj generaciji. balanceOf prikazuje broj njegovih registracija, a totalSupply njihov ukupan broj u povezanom registru. Token nije NFT; pojedinačni dokaz provjerava se po identifikatoru generacije, a ne po PNP saldu.

| Odluka | Konačno pravilo |
| --- | --- |
| Ugovor i tehnologija | ProofNewsToken, Solidity ^0.8.24, OpenZeppelin Contracts 5.x: ERC20 i Ownable. Pri implementaciji odabire se i zaključava izdanje kompatibilno s kompajlerom 0.8.24. |
| Naziv / oznaka / decimale | ProofNews Proof / PNP / 0. Jedna jedinica ugovora znači jedan token. |
| Početna količina | 0; vlasnik nema početnu dodjelu. |
| Izdavanje | Samo povezani registar, funkcijom mintProof(address recipient), točno 1 PNP po pozivu. Nema parametra proizvoljnog iznosa ili skupnog minta. |
| Primatelj | Adresa uspješnog registratora. Nulta adresa zabranjena je. |
| Ukupna količina | Nema poslovnog capa jer nova generacija mora moći dobiti potvrdu. Tehnička granica uint256 je 2^256 − 1; na njoj novo izdavanje pada. |
| Prenosivost | transfer i transferFrom uvijek padaju, uključujući iznos 0 i prijenos samome sebi. |
| Odobravanje | approve uvijek pada; allowance uvijek vraća 0. Nema permit potpisa ni drugog načina prijenosa. |
| Trošenje / spaljivanje | Nema burn/burnFrom ili potrošnje. Token nije uvjet za besplatnu provjeru. |
| Veza s registrom | Vlasnik jednom poziva setRegistry s adresom ugovora čiji token() vraća adresu ovog tokena. Neuspješan poziv ili neispravan povrat odbija se. Nakon toga veza nije promjenjiva. |
| Administracija | Vlasnik nije minter. Nema dodatnih administratora. Gubitak korisničkog ključa ne omogućuje premještanje salda. |
| ETH | PNP nije ETH i ne služi plaćanju gasa. Ugovori nemaju payable funkcije, trezor, prodaju ili isplate. |

Zadržavaju se ERC-20 funkcije i događaji uz namjerno ograničenu prenosivost. Tržišna vrijednost nije definirana ni potrebna. Standardni ERC-20 dio temelji se na [OpenZeppelin ERC-20](https://docs.openzeppelin.com/contracts/5.x/erc20).

Redoslijed objave: token → registar s adresom tokena i poslužiteljeva potpisnika → vlasnikov jednokratni setRegistry na tokenu. Prije povezivanja nema registracija. Registar ne može zamijeniti svoj token.

Početno povezivanje pouzdana je deployment operacija: prije setRegistry operator provjerava da objavljeni kod i konstruktor odgovaraju pregledanoj implementaciji ProofNewsRegistry i namjeravanom tokenu. Uzajamna provjera token() sprječava pogrešno povezivanje, ali nije dokaz ponašanja zlonamjernog ugovora koji laže kroz taj getter. Ne uvode se tvornica ugovora ili on-chain whitelist implementacija. Tvrdnja da saldo odgovara broju registracija zato pretpostavlja ispravno objavljen i povezan par ugovora; protiv zlonamjernog početnog vlasnika ne jamči se to svojstvo.

## Odluke o modulu

### Registar dokaza

| Odluka | Konačno pravilo |
| --- | --- |
| Ugovor | ProofNewsRegistry, Solidity ^0.8.24, Ownable, EIP-712 i provjera ECDSA potpisa. |
| Predmet dokaza | Jedna generacija s nenultim bytes32 generationId. ID kriptografski nasumično stvara poslužitelj; MongoDB jedinstveni indeks odbija koliziju, nakon koje se prije odgovora bira novi ID. |
| Jedinstvenost | Isti ID može se registrirati samo jednom u istom registru, ne jednom po korisniku. Novo generiranje dobiva novi ID i ako vrati jednak tekst. |
| Korisnici | Svaki novčanik može registrirati vlastiti rezultat uz službenu potvrdu. |
| Izmjene / brisanje | Nema izmjene ili brisanja dokaza ni generacijskog sadržaja kroz aplikaciju. Novo generiranje zaseban je zapis. |
| PNP | Točno jedna jedinica po registraciji. Ako mint padne, pada i upis dokaza. Ako registracija padne, nema tokena. |
| Odbijena/propala transakcija | Izvorni sadržaj ostaje spremljen kao pending; dopušten ponovni pokušaj bez novog AI poziva. |
| Potvrda upisa | Uspješan receipt sa statusom 1 i blokom na kanonskom lancu. Sam transactionHash nije potvrda. Provjera čita aktualni zapis ugovora; reorganizacijom uklonjeni upis vraća se u pending. |
| Prikaz | Nema uređivanja prije pripreme dokaza. Povezana aplikacija odlučuje o dostavi; prikaz teksta nije potvrda blockchain upisa. |

### AI servisi, izvori i ulazna ograničenja

Ne postoji poslovno ograničenje na jedan servis ili model. Zahtjev navodi provider i model; adapter prosljeđuje točan odabrani model bez prešutne zamjene. Ako servis prijavi razriješeni naziv/verziju modela, sprema se modelReported; ako ga ne prijavi, sprema se prazan string.

Različiti servisi nemaju zajednički API. Početna tehnička podrška obuhvaća adaptere za OpenAI Chat Completions i kompatibilne servise, Anthropic Messages te Google Gemini GenerateContent. Servis s istim protokolom dodaje se konfiguracijom; novi protokol zahtijeva novi adapter. Nema ručnog poslovnog ograničenja na jedan model. To nije tvrdnja da je svaki postojeći ili budući servis već implementiran: nepodržan provider ili format odgovora daje jasnu grešku.

Operator konfigurira pouzdane endpointove i adaptere. Korisnik ne može zadati vlastiti lažni AI endpoint i njime podmetnuti gotov tekst. Model koji servis ne prihvati uzrokuje neuspješan zahtjev; ne bira se drugi servis koji troši korisnikov ključ.

| Ulaz / ograničenje | Pravilo |
| --- | --- |
| Broj izvora | 1–3 različita URL-a, redoslijedom koji je korisnik dostavio. |
| URL | Apsolutni HTTPS URL bez korisničkog imena/lozinke. Fragment se uklanja, ostatak serijalizira standardnim URL parserom. Duplicirani normalizirani URL-ovi odbijaju se. |
| Formati | HTML članak, text/plain, RSS 2.0 i Atom 1.0. HTML parser izdvaja tekst članka bez skripti/stilova; feed parser izdvaja naslov i tekst stavki redom iz feeda, bez automatskog dohvaćanja njihovih poveznica. |
| Izvorni tekst | Parser prije AI poziva pretvara CRLF/CR u LF. Sprema se upravo konačni tekst poslan AI-ju; nakon toga nema dodatnog čišćenja prije hashiranja. |
| Neuspješan izvor | Ako ijedan izvor nije dostupan, ne može se parsirati, nije podržan ili daje prazan tekst, odbija se cijeli zahtjev prije AI poziva. Nema prešutnog izostavljanja izvora. |
| Dohvat | Do 15 s po URL-u, do 5 preusmjeravanja. Svaki cilj mora ostati javni HTTPS endpoint; privatne, loopback i link-local adrese te XML vanjski entiteti zabranjeni su. |
| Veličina izvora | Do 5 MiB dekomprimiranog mrežnog odgovora i 100.000 Unicode znakova izdvojenog teksta po izvoru; prekoračenje se odbija, ne skraćuje. |
| Prompt | Barem jedan znak koji nije praznina, najviše 10.000 Unicode znakova. Provjera praznine ne mijenja stvarni prompt. |
| Provider / model | Konfigurirani provider ID do 64 znaka i neprazan model do 200 znakova. Naziv modela potvrđuje odabrani AI servis. |
| AI odgovor | Neprazan tekst do 50.000 Unicode znakova, do 120 s čekanja. Više tekstualnih blokova adapter spaja redom s LF separatorom. Taj je tekst konačni summary. |
| Izlazi izvan opsega | Slike, audio, tools i djelomični streaming dokazi. |
| API ključ | HTTPS prijenos, samo za taj AI zahtjev; ne ulazi u prompt, hash, URL, javne podatke, trajnu pohranu ili logove. |

Sve tekstualne duljine mjere se brojem Unicode kodnih točaka, ne UTF-16 jedinica, UTF-8 bajtova ili vizualnih grafema. Nedopušteni usamljeni UTF-16 surogati odbijaju se kao neispravan zahtjev. Posebna granica mrežnog odgovora i dalje mjeri dekomprimirane bajtove.

Za izvor se prije povezivanja provjeravaju sve razriješene IPv4/IPv6 adrese. Ako je ijedna nedopuštena, cijeli dohvat pada. HTTP klijent smije se povezati samo na provjerenu adresu, uz izvorni hostname za TLS provjeru i SNI; ne smije napraviti drugo neprovjereno DNS razrješenje. Ista pravila vrijede za svako preusmjeravanje, ponovni pokušaj i alternativnu vezu. Odbijeni cilj daje HTTP 400 i "Neispravna poveznica izvora", bez pristupa privatnoj mreži ili AI poziva.

Najviše su 3 aktivna generacijska zahtjeva po stvarnoj klijentskoj IP adresi. Brojač je zajednički instancama poslužitelja; proizvoljni X-Forwarded-For ne prihvaća se izvan konfiguriranog pouzdanog proxyja. Četvrti zahtjev odbija se s HTTP 429 i "Previse istodobnih zahtjeva" prije dohvata izvora ili AI poziva. Ponovljeni zahtjev s istim requestId ne zauzima novo mjesto; mjesto se oslobađa po završetku ili prekidu. Ovo ograničava istodobno opterećenje, ali ne jamči zaštitu od distribuiranih napada ili neograničenog dugoročnog rasta javne arhive.

Nakon dobivenog AI odgovora nema automatskog ponovnog generiranja istog zahtjeva. Neuspjeh AI-ja ne izdaje potvrdu, dokaz ili PNP. Prije izdavanja potvrde moraju uspjeti kompresija i spremanje izvornog zapisa u MongoDB.

### Kanonski zapis i hashiranje

Za svaki tekst stvarno poslan AI-ju računa se textHash = keccak256(UTF-8(text)). Hash je 0x i 64 mala heksadekadska znaka. Pri provjeri ponovno se računa iz teksta; dostavljeno polje textHash nije dokaz samo po sebi.

Kanonski zapis verzije 1 ima samo sljedeća polja:

| Polje | Tip / sadržaj |
| --- | --- |
| schemaVersion | String "1". |
| generationId | 0x i 64 mala heksadekadska znaka; ID registra. |
| creator | 0x i 40 malih heksadekadskih znakova korisnikove adrese. |
| provider | Konfigurirani provider ID, mala slova. |
| model | Točan naziv modela poslan servisu. |
| modelReported | Točan model iz odgovora ili prazan string. |
| prompt | Točan korisnički prompt poslan servisu. |
| sources | Uređeni niz 1–3 objekta s poljima url, resolvedUrl, textHash. resolvedUrl je konačni URL nakon dopuštenih preusmjeravanja. |
| summary | Konačni neizmijenjeni tekstualni odgovor adaptera. |

Objekt se serijalizira prema [RFC 8785 / JCS](https://www.rfc-editor.org/info/rfc8785/), kodira u UTF-8 i hashira: contentHash = keccak256(UTF-8(JCS(record))). Koristi se Keccak-256, ne NIST SHA3-256. JCS određuje redoslijed ključeva, a redoslijed sources niza ostaje značajan. Nakon pripreme ulaza nema dodatnog trimanja ili Unicode normalizacije. Neispravan Unicode i nepoznata shema odbijaju se.

U contentHash ne ulaze API ključ, gzip bajtovi, MongoDB _id, tehnički status, vrijeme spremanja u bazu, transactionHash, vrijeme blockchain registracije, potpis ili signerVersion. Dokaz obuhvaća navedena polja, a ne sve interne postavke ili skriveni tijek AI servisa.

### Kompresija

Gzip bez gubitaka, razina 6, primjenjuje se nad UTF-8 bajtovima sačuvanog teksta. Bajtovi se spremaju kao MongoDB BSON binary, ne Base64 string. Dekompresija mora vratiti identične bajtove; provjeravaju se valjan UTF-8, granica veličine i textHash. JavaScript backend može koristiti ugrađeni [Node.js zlib](https://nodejs.org/api/zlib.html); ovim dokumentom ne instaliraju se biblioteke.

Svaki source objekt u bazi ima url, resolvedUrl, textHash, textGzip i compression = "gzip". URL nije dinamički MongoDB naziv polja: veza ključ–vrijednost ostvarena je poljima objekta. Isti URL u novoj generaciji zato može imati drugu sačuvanu verziju. Promjena gzip reprezentacije bez promjene izvornog teksta ne mijenja dokaz.

### Potpisana potvrda ProofNewsa

Koristi se EIP-712 i ECDSA/secp256k1. Domena: name = "ProofNewsRegistry", version = "1", aktualni chainId i verifyingContract = adresa registra. Točan tip potvrde je:

Registration(bytes32 generationId,bytes32 contentHash,address creator,uint256 signerVersion)

Poslužitelj potpisuje samo izravan AI odgovor koji je uspješno spremio. Potpis ima 65 bajtova r/s/v, low-s i v = 27 ili 28. Koriste se OpenZeppelin EIP712 i ECDSA.tryRecover kako bi nevaljan potpis dao dogovorenu aplikacijsku poruku.

EIP-712 sam ne sprječava ponavljanje. Registar zasebno odbija iskorišteni generationId i zahtijeva msg.sender == creator. Domena veže potvrdu uz chainId i adresu ugovora. Osnova su [EIP-712](https://eips.ethereum.org/EIPS/eip-712) i [OpenZeppelin kriptografske funkcije](https://docs.openzeppelin.com/contracts/5.x/api/utils/cryptography).

serverSigner početno je nenulta službena potpisnička adresa, signerVersion je 1. Vlasnikov setServerSigner na drugu nenultu adresu povećava verziju za 1. Ranije potvrde nakon promjene ne vrijede za nove registracije, čak ni ako se kasnije vrati ranija adresa. Već upisani dokazi zadržavaju izvornog potpisnika (attestor) i verziju; njihova valjanost ne ovisi o aktualnom potpisniku.

Potvrda nema rok trajanja. Za neizmijenjen, spremljen i neregistriran zapis može se zatražiti nova potvrda aktualnog potpisnika bez novog AI poziva. Ne mijenjaju se ID, creator ili contentHash. Pri obnovi se provjeravaju i početno spremljena potpisana potvrda i identitet njezina potpisnika prema operatorovoj evidenciji potpisničkih verzija; nije dovoljno ponovno izračunati hash i prepisati ga u bazu. Za već registrirani ID obnova se odbija. Početna potvrda sprema se prije predaje korisniku; neuspjeh njezina spremanja ne objavljuje nepotvrđenu generaciju kao spremnu za registraciju.

Evidencija potpisničkih verzija razlikuje redovnu rotaciju od oznake compromised. Ako je početna potvrda zapisa iz kompromitirane verzije, obnova se odbija s HTTP 409 i "Potvrda je opozvana", čak i kada zapis i stari potpis međusobno odgovaraju. Ne izdaje se nova potvrda samo na temelju tog starog potpisa. Operator označava incident i postojećim setServerSigner postavlja novi ključ; zabrana stare verzije na lancu počinje potvrdom te transakcije. Pravilo ne briše niti retroaktivno proglašava lažnima već registrirane dokaze. Za novo pouzdano generiranje korisnik šalje novi zahtjev s novim requestId.

Za svaku novu instancu lokalnog/Remix VM okruženja nakon reseta koristi se nov poslužiteljev potpisni ključ koji se ne preuzima iz ponovljivih zadanih VM računa. Operator prije izdavanja potvrda evidentira instancu i novu javnu potpisničku adresu izvan resetiranog VM-a. Tako se stara potvrda odbija čak i ako se ponove chainId i adresa registra. EIP-712 domena i getter ostaju nepromijenjeni; ne dodaje se salt ni nova on-chain funkcija.

### Tri rezultata provjere

| Poslovni rezultat | API | Značenje |
| --- | --- | --- |
| Izvorni registrirani zapis | verified: true; result: "original" | Dokaz postoji i svi provjereni sadržajni podaci odgovaraju registriranoj verziji. AI podrijetlo temelji se na službenoj potvrdi pri registraciji. |
| Ne odgovara izvornom zapisu | verified: false; result: "not_original" | Dokaz postoji, ali dostavljeni sadržaj ne odgovara. Ne tvrdi se da tekst nužno nije nastao AI-jem. |
| Nije pronađen dokaz | verified: null; result: "not_found" | U dostupnom konfiguriranom registru nema dokaza za zadani ID. Ne zaključuje se tko je autor sadržaja. |

To su jedini poslovni rezultati. Neispravan zahtjev, nedostupna mreža ili nedostajući podaci za postojeći dokaz jesu tehnička greška zahtjeva: odgovor ima error, bez verified i result. Nije dopušteno nedostupnost pretvoriti u false ili not_found.

Odvojeni životni ciklus registracije: pending = spremljen AI odgovor bez potvrđenog upisa; submitted = poslana transakcija; registered = potvrđen aktualni blockchain upis. Submitted je privremeno stanje web klijenta koji raspolaže hashom upravo poslane transakcije. MongoDB čuva pending ili registered i potvrđenu transakcijsku referencu koju poslužitelj sam očita iz lanca. Odbijena, propala ili reorganizacijom uklonjena transakcija vraća se u pending. Poslužitelj usklađuje status čitanjem registra i događaja pri dohvaćanju zapisa. To nisu dodatni rezultati provjere; status iz baze nije dokaz.

## Funkcije

Slijede potpisi i pravila bez implementacije. Sve poruke greške normativne su i bez dijakritike. Kad je nevaljano više uvjeta, vrijedi prva navedena greška. Neuspjeh transakcije ne ostavlja djelomično stanje ili događaje.

### Token: ProofNewsToken

| Funkcija / ulaz | Tko smije | Učinak / povrat | Uvjeti pada, redom |
| --- | --- | --- | --- |
| constructor() | Objavitelj | owner = msg.sender, fiksni metapodaci, ponuda 0, registry nulta adresa. | Nema aplikacijskih ulaznih grešaka. |
| name(), symbol(), decimals() | Svi | string ProofNews Proof, string PNP, uint8 0. | Ne padaju za valjan poziv. |
| totalSupply() | Svi | uint256 ponuda. | Ne pada. |
| balanceOf(address account) | Svi | uint256 saldo; za nultu adresu 0. | Ne pada. |
| allowance(address account,address spender) | Svi | uint256 0 za sve adrese. | Ne pada. |
| registry() | Svi | address povezanog registra ili nula prije povezivanja. | Ne pada. |
| setRegistry(address registryAddress) | Vlasnik tokena | Jednom povezuje registar; RegistrySet. | Ne-vlasnik: "Nisi vlasnik"; već postavljeno: "Registar je vec postavljen"; nulta adresa, bez koda, neuspješan/neispravan token() ili povrat različit od ovog tokena: "Neispravan registar". |
| mintProof(address recipient) | Samo povezani registar | Izdaje točno 1 PNP i emitira ERC-20 Transfer iz nulte adrese. | Drugi pozivatelj: "Samo registar moze izdati token"; nulti primatelj: "Neispravan primatelj"; ponuda na uint256 granici: "Dosegnuta maksimalna kolicina". |
| transfer(address to,uint256 amount) | Nitko | Nema prijenosa. | Uvijek "Prijenos tokena nije dopusten", prije provjera iznosa/salda/adrese. |
| transferFrom(address from,address to,uint256 amount) | Nitko | Nema alternativnog prijenosa. | Uvijek "Prijenos tokena nije dopusten", prije drugih provjera. |
| approve(address spender,uint256 amount) | Nitko | Nema odobravanja. | Uvijek "Odobravanje tokena nije dopusteno". |
| owner() | Svi | address vlasnika tokena. | Ne pada. |
| transferOwnership(address newOwner) | Vlasnik tokena | Prenosi vlasništvo; OwnershipTransferred. Za istu adresu owner ostaje isti i događaj ima jednake adrese. | Ne-vlasnik: "Nisi vlasnik"; nulta adresa: "Neispravan vlasnik". |
| renounceOwnership() | Nitko | Zabranjeno odricanje. | Uvijek "Odricanje vlasnistva nije dopusteno". |

Nema općeg minta, burn/burnFrom, mijenjanja metapodataka ili ponovnog povezivanja registra. Relevantne Ownable provjere prilagođavaju se navedenim porukama, umjesto drukčijih izvornih OpenZeppelin custom errors.

### Registar: ProofNewsRegistry

| Funkcija / ulaz | Tko smije | Učinak / povrat | Uvjeti pada, redom |
| --- | --- | --- | --- |
| constructor(address tokenAddress,address initialSigner) | Objavitelj | Nepromjenjivi token, serverSigner, signerVersion 1 i owner = msg.sender. | Token nulti ili bez koda: "Neispravan token"; nulti potpisnik: "Neispravan potpisnik". |
| registerProof(bytes32 generationId,bytes32 contentHash,address creator,uint256 version,bytes signature) | Svaki creator uz potvrdu | Provjerava potvrdu, upisuje dokaz i izdaje 1 PNP. | Točan redoslijed ispod tablice. |
| getProof(bytes32 generationId) | Svi | contentHash: bytes32, creator: address, registeredAt: uint256, attestor: address, signerVersion: uint256; za nepostojeći ID sve vrijednosti nula. | Ne pada ni za nulti/nepostojeći ID. |
| verifyProof(bytes32 generationId,bytes32 candidateHash) | Svi | view; bool exists, bool matches. Bez dokaza (false,false); isti hash (true,true); različit hash (true,false). | Ne pada zbog nepostojećeg ID-ja ili različitog hasha. |
| token() | Svi | address nepromjenjivog tokena. | Ne pada. |
| serverSigner() | Svi | address aktualnog potpisnika. | Ne pada. |
| signerVersion() | Svi | uint256 aktualne verzije. | Ne pada. |
| eip712Domain() | Svi | Naslijeđeni javni view iz EIP712: bytes1 fields = 0x0f, string name = ProofNewsRegistry, string version = 1, uint256 chainId = aktualni lanac, address verifyingContract = ovaj registar, bytes32 salt = 0, uint256[] extensions = prazan niz. | Ne pada za valjan poziv. |
| setServerSigner(address newSigner) | Vlasnik registra | Mijenja potpisnika, povećava verziju za 1; ServerSignerUpdated. | Ne-vlasnik: "Nisi vlasnik"; nulta adresa: "Neispravan potpisnik"; ista adresa: "Potpisnik je vec postavljen"; uint256 granica verzije: "Dosegnuta maksimalna verzija". |
| owner() | Svi | address vlasnika registra. | Ne pada. |
| transferOwnership(address newOwner) | Vlasnik registra | Prenosi vlasništvo registra; OwnershipTransferred. Za istu adresu owner ostaje isti i događaj ima jednake adrese. | Ne-vlasnik: "Nisi vlasnik"; nulta adresa: "Neispravan vlasnik". |
| renounceOwnership() | Nitko | Zabranjeno odricanje. | Uvijek "Odricanje vlasnistva nije dopusteno". |

registerProof provjerava, ovim redom:

1. generationId nije nula: inače "Neispravan ID generacije".
2. contentHash nije nula: inače "Neispravan hash".
3. creator nije nulta adresa: inače "Neispravan registrator".
4. msg.sender == creator: inače "Potvrda ne pripada ovom novcaniku".
5. ID još nije registriran: inače "Generacija je vec registrirana".
6. token.registry() jest adresa ovog registra: inače "Token nije povezan s registrom".
7. version == signerVersion: inače "Potvrda vise ne vrijedi".
8. Potpis postoji, ispravnog je formata i vrijedi za točne podatke i EIP-712 domenu te se oporavlja na serverSigner: inače "Nevaljana potvrda ProofNewsa".
9. Upisuje dokaz s block.timestamp, aktualnim potpisnikom i verzijom, označava ID iskorištenim i poziva tokenov mintProof za creatora. Ako mint padne, njegova poruka propagira se i cijeli upis poništava. Tek uspješna transakcija ostavlja ProofRegistered.

Sve funkcije promjene stanja ne-payable su. Slanje ETH-a, prazni poziv ili nepoznata funkcija odbijaju se EVM/ABI obradom, bez obećanja posebne poslovne revert poruke. Nema funkcije povlačenja prisilno poslanog ETH-a.

### Događaji

| Ugovor | Potpis | Kada |
| --- | --- | --- |
| Token | Transfer(address indexed from,address indexed to,uint256 value) | Uspješan mint: from nula, to creator, value 1. |
| Token | Approval(address indexed owner,address indexed spender,uint256 value) | Dio ERC-20 deklaracije; ne emitira se jer approve uvijek pada. |
| Token | RegistrySet(address indexed registry) | Jedino uspješno povezivanje registra. |
| Oba, zasebno | OwnershipTransferred(address indexed previousOwner,address indexed newOwner) | Objava i dopušten prijenos vlasništva. |
| Registar | ServerSignerUpdated(address indexed previousSigner,address indexed newSigner,uint256 signerVersion) | Uspješna promjena potpisnika; početno stanje dostupno getterima. |
| Registar | EIP712DomainChanged() | Naslijeđena deklaracija IERC5267; nema aplikacijske funkcije promjene domene niti aplikacijskog emitiranja ovog događaja. |
| Registar | ProofRegistered(bytes32 indexed generationId,bytes32 indexed contentHash,address indexed creator,uint256 registeredAt,address attestor,uint256 signerVersion) | Uspješan upis i mint u jednoj transakciji. |

### Web i API funkcije

Prefiks ruta je /api. Registracija/generiranje ne prima gotov summary, proizvoljan contentHash ili korisničku potvrdu kao zamjenu za AI odgovor. Web generiranje traži povezani novčanik; API prima creator adresu bez dodatne prijave i ne tvrdi da time potvrđuje njezino vlasništvo. Kontrolu adrese konačno provjerava ugovor zahtjevom msg.sender == creator. Samo zadavanje tuđe adrese ne omogućuje registraciju ili trošenje njezina ETH-a.

| Funkcija / ruta | Tko / ulaz | Ponašanje |
| --- | --- | --- |
| generiraj: POST /api/generations | Svatko; requestId, creator, sourceUrls, prompt, provider, model, apiKey, register = true. | Provjerava ulaze i rezervaciju zahtjeva, dohvaća sve izvore, poziva AI, gzipira i sprema zapis i početnu potvrdu kao pending. Vraća javni sadržaj, ID, hash, domenu i aktualnu potvrdu za korisničku transakciju. Ne šalje transakciju umjesto korisnika. |
| dohvatiGeneraciju: GET /api/generations/:id | Svi; ID. | Vraća javni sadržaj s dekomprimiranim tekstovima, hashom i odvojenim statusom. Nedostatak MongoDB dokumenta nije zaključak o blockchain dokazu. |
| obnoviPotvrdu: POST /api/generations/:id/attestation | Svi mogu zatražiti; potvrda uvijek ostaje vezana uz izvornog creatora. | Provjerava sačuvani sadržaj i nepostojanje blockchain upisa; za isti zapis izdaje aktualnu potvrdu bez AI poziva. Ne prima novi sadržaj ili drugog creatora. |
| provjeri: POST /api/verifications | Svi; generationId i neobvezni cijeli record. | Čita stvarni dokaz iz konfiguriranog registra. Bez dokaza vraća not_found. Ako record postoji, provjerava upravo dostavljeni sadržaj; inače dohvaća puni sadržaj iz MongoDB-a. Vraća tri poslovna ishoda ili tehničku grešku. |

Record za provjeru uključuje sva kanonska polja i dodatno text za svaki izvor; to je jedino dodatno dopušteno polje source objekta. textHash ponovno se računa iz tog teksta, ne prihvaća na povjerenje. Dostavljeni nepotpuni record ne popunjava se prešutno iz baze. Nepoznata polja i shema odbijaju se; generationId u recordu mora odgovarati ID-ju upita. Najprije se provjeravaju format ID-ja, shema i potpunost dostavljenog recorda, a zatim postojanje blockchain dokaza. Sintaktički valjan nulti bytes32 ID u provjeri dopušten je i nema dokaz. Kod povijesne provjere ne traži se da provider ili model još budu dostupni za novo generiranje. Ovaj unos služi samo usporedbi, ne registraciji ili uređivanju sadržaja.

Vlastito web sučelje za provjeru šalje cijeli upravo prikazani ili korisnikom uneseni record. Rezultat se veže uz taj sadržaj; ako ga korisnik promijeni nakon provjere, oznaka rezultata uklanja se do nove provjere. API poziv samo s ID-jem ostaje dopušten, ali označava provjeru arhiviranog zapisa, ne proizvoljnog drugog teksta s istim ID-jem.

requestId je obvezni klijentski UUID v4, isti pri ponovnom pokušaju istog generiranja. U bazi postoji jedinstvena rezervacija (creator, requestId), prije vanjskih poziva. Otisak zahtjeva računa se Keccak-256 nad JCS objektom s poljima creator, normalizirani sourceUrls redom, prompt, provider, model, register, chainId i registryAddress; API ključ i requestId ne ulaze u otisak. Rezervacija i requestId nisu dio javnog kanonskog sadržaja. API ključ ne sprema se ni u rezervaciju ni kao njezin otisak.

Ponovljeni isti zahtjev koji je dovršen vraća isti generationId i spremljeni sadržaj bez novog dohvata ili AI poziva; uz njega se može pripremiti aktualna dopuštena potvrda. Ako je registracija već obavljena, vraća se postojeći dokaz umjesto nove potvrde. Različiti sadržajni ulazi za isti (creator, requestId) daju HTTP 409 i "Zahtjev je vec iskoristen s drugim podacima". Za aktivni isti zahtjev vraća se HTTP 202 i "Zahtjev se jos obradjuje", bez verified/result i bez drugog AI poziva. Već završena greška vraća isti sanitizirani odgovor. Prekinut zahtjev bez spremljenog ishoda nakon 240 s označava se neuspjelim s HTTP 503 i "Obrada zahtjeva je prekinuta"; pozadinski zakašnjeli rezultat nakon toga ne objavljuje se. Isti requestId ne ponavlja AI automatski. Novo generiranje nakon takve greške zahtijeva novi requestId i izričitu korisničku radnju; ne jamči se da AI servis nije naplatio prekinuti poziv.

Uspjeh generiranja ne vraća se dok sadržaj i početna potpisana potvrda nisu oboje uspješno spremljeni. Djelomičan dokument bez početne potvrde nije javna pending generacija; javni dohvat takvog nedovršenog zapisa vraća HTTP 503 i "Spremanje zapisa nije uspjelo". Njegova obrada nastavlja se samo unutar rezerviranog istog zahtjeva, bez novog AI poziva.

Redoslijed generacijskih provjera: shema zahtjeva → broj izvora → prompt → model → API ključ → provider → normalizacija URL-ova → provjera/rezervacija requestId i ograničenja istodobnosti → dohvat i ograničenja izvora redom → AI poziv → kompresija/spremanje → potpis i njegovo spremanje. Reakcije providera sanitiziraju se; sirova poruka s tajnama ne prosljeđuje se korisniku.

| Situacija | HTTP / točna poruka |
| --- | --- |
| Neispravna shema, creator ili register vrijednost | 400 / "Neispravan zahtjev" |
| Broj izvora izvan 1–3 | 400 / "Potrebno je navesti od 1 do 3 izvora" |
| Prazan prompt / preko 10.000 znakova | 400 / "Prompt je obavezan" / "Prompt je predug" |
| Prazan model / preko 200 znakova | 400 / "Model je obavezan" / "Naziv modela je predug" |
| Prazan API ključ | 400 / "API kljuc je obavezan" |
| Nepodržan provider ili ID preko 64 znaka | 400 / "AI servis nije podrzan" |
| Dupliciran normalizirani URL | 400 / "Izvori se ne smiju ponavljati" |
| Neispravan URL, nedopušten mrežni cilj ili preusmjeravanje | 400 / "Neispravna poveznica izvora" |
| Nedostupan, neparsiran, nepodržan ili prazan izvor | 422 / "Izvor nije moguce procitati"; zasebno redni broj izvora 1–3. |
| Prevelik odgovor ili izdvojeni tekst | 422 / "Izvor je prevelik" |
| AI timeout, odbijen ključ/model kod providera ili drugi neuspjeh poziva | 502 / "AI generiranje nije uspjelo" |
| Prazan, prevelik ili nepodržan AI odgovor | 502 / "AI odgovor nije valjan" |
| Neuspjeh kompresije ili MongoDB spremanja prije potvrde | 503 / "Spremanje zapisa nije uspjelo" |
| Zapis ne postoji u MongoDB-u | 404 / "Zapis nije pronadjen" |
| Puni podaci nedostupni/oštećeni za postojeći blockchain dokaz | 503 / "Podaci za provjeru nisu dostupni" |
| Promijenjen sačuvani sadržaj pri obnovi potvrde | 409 / "Spremljeni zapis je izmijenjen" |
| Obnova potvrde za već registrirani ID | 409 / "Generacija je vec registrirana" |
| Neispravan ID ili record za provjeru | 400 / "Neispravan zapis za provjeru" |
| Nepoznata schemaVersion | 400 / "Verzija zapisa nije podrzana" |
| Nedostupan RPC/ugovor ili neispravna deployment konfiguracija | 503 / "Provjera trenutno nije dostupna" |
| Nemoguće izdavanje potvrde | 503 / "Potvrdu nije moguce izdati" |
| Isti requestId i creator, ali različiti sadržajni ulazi ili deployment | 409 / "Zahtjev je vec iskoristen s drugim podacima" |
| Ponovljen isti još aktivni zahtjev | 202 / "Zahtjev se jos obradjuje"; status obrade, ne rezultat provjere. |
| Prekinuta obrada bez spremljenog ishoda nakon 240 s | 503 / "Obrada zahtjeva je prekinuta" |
| Četvrti aktivni generacijski zahtjev iste IP adrese | 429 / "Previse istodobnih zahtjeva" |
| Obnova zasnovana na početnoj potvrdi kompromitirane verzije | 409 / "Potvrda je opozvana" |

not_original uključuje poruku "Podaci se ne podudaraju s registriranim dokazom"; not_found poruku "Dokaz nije pronadjen". To su poslovni odgovori, ne revert poruke. Odbijen novčanik prikazuje se kao "Registracija nije potvrdena u novcaniku", propala transakcija kao "Registracija nije uspjela"; oba dopuštaju ponovni pokušaj istog zapisa.

## Matrica ovlasti

Sve uvjetne ćelije uključuju provjere iz Funkcija. Uloge mogu pripadati istoj adresi, ali ne daju međusobne iznimke.

| Funkcija | Vlasnik odgovarajućeg ugovora | Poslužitelj | Ugovor registra | Korisnik s novčanikom | Javni posjetitelj bez novčanika |
| --- | --- | --- | --- | --- | --- |
| Generiranje kroz web/API | Da, kao korisnik | Da, obrađuje zahtjev | Ne | Da | API: da, uz creator i AI ključ; registracija i dalje zahtijeva novčanik |
| Dohvat i provjera kroz web/API | Da | Da | Ne, ne dohvaća HTTP podatke | Da | Da |
| Obnova potvrde kroz API | Da, izvorni zapis | Da, izdaje potvrdu | Ne | Da, bez promjene creatora | Da, bez promjene creatora |
| Izrada službene potvrde | Ne, osim ako je službeni potpisnik | Da | Ne | Ne | Ne |
| registerProof | Da, kao creator uz potvrdu | Da, samo za vlastitu adresu uz iste uvjete | Ne, nema zaobilaženja creatora | Da, kao creator uz potvrdu | Ne |
| mintProof | Ne | Ne | Da, unutar uspješne registracije | Ne | Ne |
| setRegistry | Da, vlasnik tokena, jednom | Ne | Ne | Ne | Ne |
| setServerSigner | Da, vlasnik registra | Ne | Ne | Ne | Ne |
| transferOwnership | Da, za svoj ugovor | Ne | Ne | Ne | Ne |
| renounceOwnership | Ne | Ne | Ne | Ne | Ne |
| transfer, transferFrom, approve | Ne | Ne | Ne | Ne | Ne |
| name, symbol, decimals, totalSupply, balanceOf, allowance, registry, owner | Da | Da | Da | Da | Da |
| getProof, verifyProof, token, serverSigner, signerVersion, eip712Domain | Da | Da | Da | Da | Da |
| Izmjena/brisanje sadržaja ili dokaza kroz aplikaciju | Ne | Ne | Ne | Ne | Ne |

Infrastrukturni administratorski pristup MongoDB-u tehnički može oštetiti bazu; nije dopuštena poslovna funkcija. Promjena baze ne mijenja blockchain dokaz i mora dati nepodudaranje ili grešku nedostupnih/oštećenih podataka.

## Model podataka na lancu

### Token

| Podatak | Tip | Pravilo |
| --- | --- | --- |
| Metapodaci | string name, string symbol, uint8 decimals | Fiksne vrijednosti PNP-a. |
| Ponuda i salda | uint256; mapping(address => uint256) | Broj registracija; početno 0. |
| registry | address | Početno nula, jedno nepovratno postavljanje. |
| owner | address | Vlasnik nije automatski minter. |

### Registar

| Podatak | Tip | Pravilo |
| --- | --- | --- |
| token | Nepromjenjivi address | Token zadan konstruktorom. |
| owner, serverSigner | address, address | Vlasnik registra i aktualni službeni potpisnik. |
| signerVersion | uint256 | Početno 1; raste po promjeni potpisnika. |
| proofs | mapping(bytes32 => Proof) | generationId kao jedinstveni ključ. |
| Proof.contentHash | bytes32 | Nenulti hash; nula znači da dokaz ne postoji. |
| Proof.creator | address | Registrator i primatelj 1 PNP. |
| Proof.registeredAt | uint256 | block.timestamp upisa; vrijeme evidencije, ne zajamčeno vrijeme nastanka sadržaja. |
| Proof.attestor | address | Službeni potpisnik u trenutku registracije. |
| Proof.signerVersion | uint256 | Verzija pri registraciji; ne mijenja se rotacijom potpisnika. |

Identitet dokaza je **chainId + adresa registra + generationId**. Web/API koriste operatorovu pouzdanu deployment konfiguraciju, ne proizvoljan korisnički ugovor. Stari deployevi imaju zasebnu konfiguraciju za provjeru. transactionHash čuva se izvan ugovora kao referenca.

## Što se NE sprema na blockchain

| Podatak | Pohrana / pravilo |
| --- | --- |
| Prompt, provider, model, modelReported i summary | Neizmijenjeni javni generacijski dokument u MongoDB-u; ulaze u contentHash. |
| Izvori | URL i resolvedUrl kao stringovi, textHash kao heksadekadski string i textGzip kao BSON binary u povezanim source objektima. Javni API dekomprimira izvorni tekst. |
| Identitet generacije | schemaVersion, generationId s jedinstvenim indeksom, creator, chainId, registryAddress i contentHash u MongoDB-u. |
| Tehnički status | MongoDB: pending/registered i neobvezni potvrđeni transactionHash; web klijent dodatno prati submitted. Nisu dio sadržajnog hasha. |
| Potvrda | Početni javni potpis, njegova potpisnička adresa/verzija i domena obvezno se spremaju prije uspješnog odgovora korisniku; naknadne potvrde ne prepisuju početnu. Potpis je vidljiv i u transakcijskim podacima, iako nije posebno polje Proof strukture. |
| Rezervacija zahtjeva | Interni requestId, creator, otisak ulaza i stanje obrade; jedinstveni indeks (creator, requestId). Nema API ključa, njegova otiska ili uključivanja u javni contentHash. |
| Evidencija potpisničkih verzija | Operatorova evidencija deploymenta, adrese/verzije potpisnika i oznake compromised; ne sadrži privatne ključeve. Koristi se za obnovu i ne mijenja postojeće blockchain dokaze. |
| Korisnički API ključ | Samo memorija za trenutačni HTTPS zahtjev/AI poziv; bez trajne pohrane u bazi, datotekama, pregledniku ili logovima. Ne zadržava se za buduće pozive. |
| Korisnički privatni ključ novčanika | Nikada se ne traži, šalje backendu ili sprema u ProofNews. |
| Poslužiteljev potpisni ključ i MongoDB pristup | Infrastrukturne tajne izvan javnih dokumenata i repozitorija, bez prikaza i logiranja sadržaja. |
| Ime, e-mail i drugi profilni podaci | Ne prikupljaju se; koristi se adresa novčanika. |

Javnost uključuje prompt i izvorne tekstove. Kompresija nije enkripcija. Prije generiranja sučelje jasno navodi javnost sadržaja i da se ne unose tajne ili osobni podaci. Nije moguće automatski zajamčiti da ih prirodni tekst nikad ne sadrži. API ključevi i autorizacijska zaglavlja ne smiju se odraziti u javnim podacima ili greškama.

Nema aplikacijskog uređivanja ili brisanja generacijskog sadržaja, uključujući pending sadržaj uspješnog AI odgovora. Nema jamstva vječne dostupnosti MongoDB-a. Ako baza nestane, blockchain dokaz ostaje: korisnik s cjelovitim zapisom i dalje može provjeriti sadržaj, dok nedostupna baza daje tehničku grešku.

## Kriteriji prihvaćanja

Svaki red ima oblik **Zadano / Kada / Tada**. Negativni slučajevi navode točnu poruku ili rezultat; svi revert/error tekstovi bez su dijakritike.

### Token i administracija

| ID | Zadano | Kada | Tada |
| --- | --- | --- | --- |
| K1 | Token nije objavljen. | Novčanik objavi token. | name ProofNews Proof, symbol PNP, decimals 0, totalSupply 0, owner objavitelj, registry nulta adresa. |
| K2 | Token nema registar i vlasnik ima adresu objavljenog registra. | Pozove setRegistry s tom adresom. | registry postaje ta adresa; emitira se RegistrySet. |
| K3 | Pozivatelj nije vlasnik tokena. | Pozove setRegistry s inače valjanom adresom. | Pada s "Nisi vlasnik"; stanje ostaje isto. |
| K4 | Token već ima registar. | Vlasnik ponovno pozove setRegistry. | Pada s "Registar je vec postavljen"; veza ostaje ista. |
| K5 | Registar nije postavljen. | Vlasnik postavi nultu adresu ili adresu bez koda. | Pada s "Neispravan registar"; registry ostaje nula. |
| K6 | Pozivatelj nije povezani registar, uključujući vlasnika ili poslužitelja. | Pozove mintProof s valjanim primateljem. | Pada s "Samo registar moze izdati token"; nema promjene ponude ili salda. |
| K7 | Registar je povezan, korisnikov saldo n, ponuda s ispod granice. | Uspješna registracija pozove mintProof. | Saldo n+1, ponuda s+1 i Transfer iz nulte adrese s value 1. |
| K8 | Povezani registar poziva token. | Pokuša mintProof nultoj adresi. | Pada s "Neispravan primatelj"; nema minta. |
| K9 | Testna priprema postavila je ponudu na uint256 granicu. | Registar zatraži mint valjanom primatelju. | Pada s "Dosegnuta maksimalna kolicina"; nema overflowa ni promjene stanja. |
| K10 | Bilo koja adresa ima bilo koji saldo. | Pozove transfer ili transferFrom, uključujući 0, manjak salda ili prijenos sebi. | Pada s "Prijenos tokena nije dopusten"; sva salda ostaju ista. |
| K11 | Bilo koja adresa želi odobriti potrošnju. | Pozove approve s bilo kojim iznosom. | Pada s "Odobravanje tokena nije dopusteno"; allowance ostaje 0 i nema Approval događaja. |
| K12 | Token ima izdane jedinice. | Svatko čita totalSupply, balanceOf i allowance. | Čitanje je javno, allowance 0, bez promjene salda; nema javnog spaljivanja. |
| K13 | Pozivatelj nije vlasnik pojedinog ugovora. | Pozove transferOwnership ili registra setServerSigner. | Pada s "Nisi vlasnik"; owner/potpisnik ostaju isti. |
| K14 | Pozivatelj je vlasnik pojedinog ugovora. | Prenese vlasništvo na drugu nenultu adresu. | Novi owner preuzima ovlasti, stari ih gubi, emitira se OwnershipTransferred; drugi ugovor ne mijenja vlasnika. |
| K15 | Pozivatelj je vlasnik. | Prenese vlasništvo na nultu adresu. | Pada s "Neispravan vlasnik"; nema promjene. |
| K16 | Pozivatelj je bilo tko. | Pozove renounceOwnership na bilo kojem ugovoru. | Pada s "Odricanje vlasnistva nije dopusteno"; owner ostaje isti. |

### Generiranje i pohrana

| ID | Zadano | Kada | Tada |
| --- | --- | --- | --- |
| K17 | Korisnik prije generiranja bira dokaz i dostavlja sve valjane ulaze. | Svi izvori uspiju, AI vrati valjan tekst i baza spremi zapis. | Summary jednak izravnom odgovoru adaptera, novi ID, pending status i potvrda vezana uz creatora; nema automatskog slanja transakcije. |
| K18 | Zahtjev ima 0 ili 4 izvora. | Pokrene generiranje. | HTTP 400, "Potrebno je navesti od 1 do 3 izvora"; nema AI poziva, potvrde ili tokena. |
| K19 | Prompt je prazan ili samo od praznina. | Pokrene generiranje. | HTTP 400, "Prompt je obavezan"; nema AI poziva. |
| K20 | Ostali ulazi valjani. | Model je prazan, odnosno API ključ prazan. | HTTP 400, "Model je obavezan", odnosno "API kljuc je obavezan"; nema AI poziva. |
| K21 | Zasebni zahtjevi imaju predug prompt/model, dupliciran/neispravan URL ili nepodržan provider. | Pokrene generiranje. | Odgovarajuća točna API poruka iz tablice grešaka; nema AI poziva ili potvrde. |
| K22 | Barem jedan izvor nije dostupan, ne može se parsirati ili ne daje tekst. | Obrađuju se izvori. | HTTP 422, "Izvor nije moguce procitati" s rednim brojem; cijeli zahtjev staje prije AI poziva, uključujući neispravan RSS/Atom. |
| K23 | Izvor prelazi definiranu mrežnu ili tekstualnu veličinu. | Dohvaća se ili parsira. | HTTP 422, "Izvor je prevelik"; sadržaj se ne skraćuje i AI se ne poziva. |
| K24 | Korisnik bira konfigurirani servis i model. | Adapter šalje AI zahtjev. | Nema prešutne zamjene modela; spremaju se provider, model i modelReported; gotov korisnički summary nije dopušten ulaz generiranja. |
| K25 | AI poziv ne uspije ili odgovor nije dopušten. | Zahtjev završi. | HTTP 502, "AI generiranje nije uspjelo", odnosno "AI odgovor nije valjan"; nema potvrde, upisa ili PNP-a. |
| K26 | Postoji točan tekst poslan AI-ju i pripadajući URL. | Gzipira se, spremi kao BSON binary i dekomprimira. | Dobivaju se identični UTF-8 bajtovi, URL i textHash; promjena članka na webu ne mijenja snapshot. |
| K27 | AI vrati valjan tekst, ali kompresija/spremanje ne uspije. | Treba izdati potvrdu. | HTTP 503, "Spremanje zapisa nije uspjelo"; nema potvrde za nespremljen sadržaj. |
| K28 | Zahtjev koristi korisnički API ključ. | Završava uspjehom ili greškom. | Ključ se ne dodaje trajnoj pohrani, logovima, promptu, hashu, blockchainu, javnom odgovoru ili grešci i ne zadržava se za buduće pozive; postupak provjere određen je kriterijem K70. |
| K29 | Postoji pending ili registered generacijski zapis. | Svatko ga dohvati kroz web/API. | Dobiva puni javni sadržaj s dekomprimiranim izvorima i odvojenim statusom, bez pristupnih tajni. |
| K30 | Postoji spremljen pending zapis i potvrda. | Korisnik odbije novčanik ili transakcija propadne. | Pending ostaje, poruka "Registracija nije potvrdena u novcaniku", odnosno "Registracija nije uspjela"; ponovni pokušaj koristi isti sadržaj bez AI poziva; nema tokena pri neuspjehu. |

### Registar i potvrda

| ID | Zadano | Kada | Tada |
| --- | --- | --- | --- |
| K31 | Postoje token ugovor i nenulti potpisnik. | Objavi se registar. | token i serverSigner imaju zadane adrese, signerVersion 1, owner objavitelj; getteri su javni. |
| K32 | Token je nevaljana adresa ili početni potpisnik nulta adresa, zasebno. | Pokuša se objava registra. | Pada s "Neispravan token", odnosno "Neispravan potpisnik". |
| K33 | Token povezan, ID nov, običan korisnik ima aktualnu potvrdu za svoj zapis/adresu. | Pošalje registerProof. | Upisani hash, creator, block.timestamp, attestor i verzija, 1 PNP korisniku, ProofRegistered; nema administratorskog odobrenja korisnika. |
| K34 | Ostali uvjeti valjani. | ID, hash ili creator su nula, zasebno. | Pada s "Neispravan ID generacije", "Neispravan hash", odnosno "Neispravan registrator"; nema upisa/minta. |
| K35 | Potvrda je vezana uz A. | B šalje registraciju s creatorom A. | Pada s "Potvrda ne pripada ovom novcaniku"; nema preuzimanja dokaza ili tokena. |
| K36 | ID je već registriran. | Uz ispunjen creator uvjet ponovi se registracija. | Pada s "Generacija je vec registrirana"; ostaje jedan dokaz i jedan token za tu generaciju. |
| K37 | Token.registry nije adresa registra. | Pokuša se inače dopuštena registracija. | Pada s "Token nije povezan s registrom"; nema djelomičnog stanja. |
| K38 | ID nov, ostali uvjeti i verzija valjani. | Potpis nedostaje, nevaljan je, od drugog potpisnika ili ne odgovara izmijenjenom hashu/creatoru. | Pada s "Nevaljana potvrda ProofNewsa"; nema upisa/tokena. |
| K39 | Potvrda vrijedi za drugi chainId ili registar. | Upotrijebi se u ovom registru. | Uz ostale valjane uvjete pada s "Nevaljana potvrda ProofNewsa". |
| K40 | Vlasnik postavlja novog nenultog potpisnika. | Promjena uspije, zatim se koristi stara potvrda. | Verzija raste za 1, ServerSignerUpdated; stara potvrda pada s "Potvrda vise ne vrijedi". |
| K41 | Vlasnik bira nultu ili istu potpisničku adresu, zasebno. | Pozove setServerSigner. | Pada s "Neispravan potpisnik", odnosno "Potpisnik je vec postavljen"; nema rasta verzije. |
| K42 | Testna priprema postavila je verziju na uint256 granicu. | Vlasnik postavi drugu valjanu adresu. | Pada s "Dosegnuta maksimalna verzija"; nema overflowa ni izmjene. |
| K43 | Neizmijenjen spremljeni zapis nije registriran, početna potvrda potječe iz redovne rotacije i njezina verzija nije označena kompromitiranom. | Zatraži se obnova potvrde. | Nova potvrda za isti ID/hash/creator, bez AI poziva; izmijenjen zapis daje 409 "Spremljeni zapis je izmijenjen", već registriran ID 409 "Generacija je vec registrirana". |
| K44 | Token odbije mint tijekom registerProof. | Registracijska transakcija završava. | Pada s tokenovom porukom; upis/događaji poništeni, salda/ponuda isti, ID ostaje slobodan. |
| K45 | Postoji registrirani dokaz. | Vlasnik promijeni potpisnika ili vlasništvo. | Hash, creator, registeredAt, attestor i verzija starog dokaza ostaju isti; nema funkcije promjene/brisanja. |
| K46 | Postoji poslana transakcija bez uspješnog receipta ili je upis uklonjen reorganizacijom. | Osvježi se status. | Sam transactionHash ne daje registered; nepotvrđeni upis submitted, propali/uklonjeni upis pending. |

### Provjera i nepromjenjivost

| ID | Zadano | Kada | Tada |
| --- | --- | --- | --- |
| K47 | Postoji dokaz i dostavljen je cijeli identični zapis s izvornim tekstovima. | Ponovno se izračunaju textHashovi i kanonski contentHash te pozove verifyProof. | Ugovor (true,true); API verified true, result original. |
| K48 | Postoji dokaz, sintaktički je valjano promijenjeno samo jedno sadržajno polje ili redoslijed izvora: summary, prompt, provider, model, modelReported, creator, URL, resolvedUrl ili tekst izvora. | Provjeri se isti ID s izmijenjenim sadržajem. | Ugovor za različiti hash (true,false); API verified false, result not_original i "Podaci se ne podudaraju s registriranim dokazom". |
| K49 | Dostupni registar nema traženi ID, uključujući nulti ID. | Pozovu se getProof, verifyProof ili API provjera. | getProof vraća nule; verifyProof (false,false); API verified null, result not_found, "Dokaz nije pronadjen"; nema tvrdnje da tekst nije AI. |
| K50 | Provjeravatelj nema novčanik, ETH ili AI API ključ. | Provjeri dostupan zapis kroz web/API. | Dobiva rezultat bez prijave, potpisa, transakcije ili naknade; AI se ne poziva. |
| K51 | RPC/ugovor nije dostupan ili deployment konfiguracija nije ispravna. | Pokrene se provjera. | HTTP 503, "Provjera trenutno nije dostupna", bez verified/result i bez lažnog poslovnog ishoda. |
| K52 | Dokaz postoji, ali puni sadržaj nedostaje ili gzip nije ispravan. | Provjera nije dobila korisnikov cijeli record. | HTTP 503, "Podaci za provjeru nisu dostupni"; korisnikov cijeli record i dalje se može usporediti s dokazom. |
| K53 | Sadržaj je isti, ali redoslijed JSON ključeva ili gzip reprezentacija je drukčija. | Ponovi se propisano hashiranje. | contentHash ostaje isti; nema lažnog nepodudaranja. |
| K54 | Predan je nepotpun record, neispravan ID, nepoznata polja ili record s drugim generationId-jem. | Provjeri se postojeći dokaz. | HTTP 400, "Neispravan zapis za provjeru"; podaci se ne popunjavaju prešutno iz baze. |
| K55 | Record ima schemaVersion različit od 1. | Pokuša se provjera. | HTTP 400, "Verzija zapisa nije podrzana"; shema se ne nagađa. |
| K56 | Postoji spremljeni sadržaj i blockchain dokaz. | Autor pokuša izmjenu kroz aplikaciju ili operator baze ručno promijeni sadržaj. | Nema aplikacijske funkcije izmjene/brisanja; potpuni čitljiv promijenjeni zapis daje nepodudaranje, oštećeni/nedostajući podaci tehničku grešku; dokaz ostaje isti. |
| K57 | MongoDB nema traženi generacijski dokument. | Dohvati se generacija ili zatraži obnova potvrde. | HTTP 404, "Zapis nije pronadjen"; to ne zamjenjuje zasebnu provjeru blockchain postojanja dokaza. |
| K58 | Poslužitelj ne može izdati potpis. | Spremljena generacija ili obnova zatraži potvrdu. | HTTP 503, "Potvrdu nije moguce izdati"; nema upisa/tokena; sačuvani sadržaj ostaje neizmijenjen za ponovni pokušaj. |
| K59 | Registar je objavljen na određenom lancu i adresi. | Svatko pozove eip712Domain. | Dobiva fields 0x0f, name ProofNewsRegistry, version 1, stvarni chainId i adresu registra, salt nula i prazne extensions, bez promjene stanja ili naknade za čitanje. |

## Izvan opsega

- Kupnja, prodaja, prijenos, potrošnja i spaljivanje PNP-a, plaćanje gasa PNP-om, trezor, prikupljanje kapitala ili isplate ETH-a.
- NFT iskaznice, nagradna trgovina, glasanje i crowdfunding; odabran je vlastiti registar dokaza.
- Registracija gotovih/ručno uređenih/uvezenih sažetaka kao izravnih AI odgovora. Unos sadržaja za usporedbu s postojećim dokazom ostaje dopušten.
- Skupna registracija/provjera, serversko plaćanje korisničkog gasa, relayeri i gas sponsorship.
- Trajna pohrana korisničkih API ključeva ili upravljanje korisničkim privatnim ključevima.
- Utvrđivanje istinitosti vijesti i neovisan dokaz izvršavanja modela bez povjerenja u ProofNews/AI servis.
- Pravila dostave ili skrivanja sadržaja u drugim aplikacijama.
- Uređivanje/brisanje generacijskog sadržaja i dokaza, administratorsko prepisivanje prošlosti.
- Dodatni administratori, poseban oporavak izgubljenih ključeva, upgradeable ugovori, migracija starih dokaza i jamstvo vječne MongoDB dostupnosti.
- Vlastiti AI model, proizvoljni korisnički AI endpointovi, multimodalni izlazi, tools i streaming dokazi.

## Otvorena pitanja

Poslovna i tehnička pravila za opisani tok definirana su. RPC URL-ovi, stvarne deployment adrese i pouzdani provider endpointovi konfiguracijske su vrijednosti za implementaciju; korisnički API ključevi nisu dio dokumenta ili repozitorija.

**Vanjsko usklađivanje kolegija:** ERC-20 zahtjev pokriven je PNP-om. Registar dokaza vlastiti je modul, izvan četiri modula ponuđena u PDF-u. Prihvatljivost te zamjene treba potvrditi s nastavnikom; odobrenje se ne pretpostavlja. Ako se zahtijeva baš ponuđeni modul, njegov izbor i pravila trebaju zasebnu dopunu prije dovršetka tog uvjeta vježbe.

**Zahtjev o svim AI servisima:** proizvod nije ograničen na jedan servis, ali stvarna podrška zahtijeva konfigurirani pouzdani endpoint i kompatibilan adapter. Model string sam ne omogućuje pozivanje svakog API-ja. Ako demonstracija zahtijeva servis izvan navedenih protokola, njegov adapter mora biti uključen u implementacijski opseg prije koda.

## Sljedivost

Formalna tablica Funkcija | Kriteriji i provjera oba smjera popunjavaju se u Dijelu 4 nakon izrade sučelja, prema redoslijedu vježbe. Oznake K1–K72 pripremljene su za taj korak; K60–K72 nalaze se u završnoj obradi recenzije. Kriteriji AI poziva, kompresije i API-ja mapiraju se na aplikacijske funkcije, ne na sposobnosti koje Solidity ugovor samostalno izvršava.

## Obrada nalaza recenzije i minimalne dopune

Ovaj odjeljak obrađuje nalaze N1–N11 iz recenzije verzije 1.0. Odluke i kriteriji normativni su dio verzije 1.1; odgovarajuće odredbe prethodnih odjeljaka već su usklađene. Dopune ne uvode novi poslovni modul, plaćanje provjere ili trgovanje tokenom. Promjene se odnose na specifikaciju, ne predstavljaju već implementirane i testirane zaštite.

| Nalaz | Odluka | Minimalni zahvat i obrazloženje | Provjera |
| --- | --- | --- | --- |
| N1 — proizvoljan registar | Prihvaćeno djelomično | setRegistry dodatno provjerava da kandidatov token() odgovara ovom tokenu. Prije povezivanja provjeravaju se objavljena implementacija i parametri. Odbijeno je uvođenje tvornice ili on-chain whiteliste: to bi proširilo arhitekturu. Zlonamjerni početni vlasnik koji ručno zaobiđe deployment provjeru ostaje izričita granica povjerenja; getter sam ne dokazuje ponašanje. | K60 i deployment provjera prije jednokratnog povezivanja. |
| N2 — neobvezno/obvezno spremanje potvrde | Prihvaćeno | Početna potvrda i njezini podaci obvezno se spremaju prije uspješnog odgovora. Nedovršen dokument nije javni pending zapis. | K62. |
| N3 — prijenos vlasništva sebi | Prihvaćeno; odbijen predloženi novi revert | Zadržava se postojeće Ownable ponašanje bez dodatne zabrane. K14 se odnosi na drugu adresu, a samoprijenos izričito zadržava vlasnika uz događaj jednakih adresa. | K14 i K61. |
| N4 — ponovljeni HTTP zahtjev | Prihvaćeno | Dodaje se requestId i jedinstvena rezervacija uz creator. Završeni rezultat vraća se bez ponovnog AI poziva; aktivni zahtjev ima 202, promijenjeni ulazi 409. API ključ se ne pohranjuje. | K63–K65. |
| N5 — nekontrolirana istodobnost | Prihvaćeno ograničenje opterećenja | Najviše 3 aktivna generiranja po stvarnoj IP adresi, uz zajednički brojač. Ne dodaje se naplata, registracija računa ili brisanje pending sadržaja. Distribuirani napadi i dugoročni rast arhive nisu ovime potpuno riješeni. | K66. |
| N6 — DNS zaobilaženje zabrane privatnih adresa | Prihvaćeno | HTTP veza koristi isključivo već provjerene IP adrese. Provjera vrijedi za IPv4/IPv6, preusmjeravanja i ponovne veze; TLS hostname provjera ostaje uključena. | K67. |
| N7 — obnova nakon kompromitacije ključa | Prihvaćeno | Evidencija razlikuje redovnu rotaciju i kompromitiranu verziju. Početna potvrda kompromitirane verzije ne može biti osnova nove potvrde. Postojeći on-chain dokazi ne prepisuju se. | K43 i K68. |
| N8 — rezultat nije vezan uz prikazani tekst | Prihvaćeno | Vlastito sučelje provjerava cijeli prikazani record i uklanja oznaku nakon uređivanja. Provjera samo ID-ja označava provjeru arhiviranog zapisa. | K69. |
| N9 — neodređena provjera tajnosti API ključa | Prihvaćeno | Definira se ponovljiv test s probnim ključem, uspjehom i greškama, uz pregled konkretnih pohrana i logova pod kontrolom ProofNewsa. Ne obećava se dokaz fizičkog brisanja svakog RAM bajta niti kontrola providerovih internih logova. | K28 i K70. |
| N10 — neprecizan Unicode limit | Prihvaćeno | Sve tekstualne granice mjere Unicode kodne točke. Ne mijenjaju se postojeći brojčani limiti ili kanonski sadržaj. | K71. |
| N11 — reset VM-a i ista domena | Prihvaćena operativna zaštita; odbijeno proširenje domene | Nova VM instanca obvezno dobiva nov službeni potpisni ključ i zapis u deployment evidenciji izvan VM-a. Ne dodaju se salt, nova ugovorna funkcija ili promjena eip712Domain. Zaštita ovisi o poštovanju tog deployment pravila. | K72. |

### Dodatni kriteriji prihvaćanja

| ID | Zadano | Kada | Tada |
| --- | --- | --- | --- |
| K60 | Token još nije povezan, a kandidat je ugovor čiji token() ne postoji, pada, vraća neispravan odgovor ili adresu drugog tokena. | Vlasnik pozove setRegistry. | Pada s "Neispravan registar" i registry ostaje nulta adresa. Ugovor s odgovarajućim getterom i pregledanom implementacijom povezuje se prema K2. |
| K61 | Vlasnik ugovora je A. | A pozove transferOwnership(A). | Owner ostaje A, ovlasti ostaju iste i emitira se OwnershipTransferred(A,A); poziv ne pada. Vrijedi za oba ugovora. |
| K62 | Sadržaj generacije spremljen je, ali početna potvrda ili njezini obvezni podaci nisu uspješno spremljeni. | API treba vratiti uspjeh ili javno dohvatiti takvu generaciju. | Vraća HTTP 503 i "Spremanje zapisa nije uspjelo"; ne objavljuje zapis kao spreman za registraciju i ne vraća uspješan generacijski odgovor. |
| K63 | Za creator A i requestId R već postoji dovršen uspješan zahtjev, ali korisnik nije primio odgovor. | Korisnik ponovi iste sadržajne ulaze i isti deployment s R. | Dobiva isti generationId, summary i contentHash, bez novog dohvata izvora ili AI poziva; potvrda ostaje vezana uz A. Ako je dokaz već registriran, vraća se postojeći dokaz. |
| K64 | Rezervacija (A,R) već postoji. | Ponovi se R s drugim promptom, izvorima, providerom, modelom ili deploymentom. | HTTP 409 i "Zahtjev je vec iskoristen s drugim podacima"; nema novog AI poziva niti promjene prvog zapisa. |
| K65 | Za (A,R) obrada još traje. | Istodobno stigne isti zahtjev s R. | HTTP 202 i "Zahtjev se jos obradjuje", bez verified/result i bez drugog AI poziva. Obrada koja ostane bez spremljenog ishoda nakon 240 s daje HTTP 503 i "Obrada zahtjeva je prekinuta"; isti R ne pokreće AI ponovno. |
| K66 | Stvarna klijentska IP adresa već ima 3 aktivna generacijska zahtjeva s različitim requestId-jevima. | Stigne četvrti, uključujući drugu instancu poslužitelja ili lažirani X-Forwarded-For. | HTTP 429 i "Previse istodobnih zahtjeva" prije dohvata izvora/AI poziva. Završetak prethodnog zahtjeva oslobađa mjesto; ponavljanje istog aktivnog R ne stvara novu obradu. |
| K67 | Domena pri provjeri daje javni IP, a naknadno razrješenje ili preusmjeravanje nudi privatni/loopback/link-local IPv4 ili IPv6 cilj. | Dohvaća se izvor. | Ne šalje se zahtjev nedopuštenoj adresi. Povezivanje se veže uz provjereni javni IP ili dohvat daje HTTP 400 i "Neispravna poveznica izvora"; u slučaju odbijanja nema AI poziva. |
| K68 | Početna potvrda spremljene neregistrirane generacije pripada verziji označenoj compromised, a aktualni potpisnik je drugi. | Zatraži se obnova, iako zapis odgovara starom potpisu. | HTTP 409 i "Potvrda je opozvana"; ne izdaje se nova potvrda niti mijenja sadržaj. Stari već registrirani dokazi ostaju čitljivi. |
| K69 | Vlastiti web prikazuje izmijenjeni summary uz ID postojećeg izvornog dokaza. | Korisnik klikne Provjeri. | Šalje se cijeli prikazani record; verified je false i result not_original, bez zamjene prikazanog sadržaja arhivskim. Naknadna promjena teksta uklanja prethodnu oznaku rezultata do nove provjere. |
| K70 | Test koristi prepoznatljiv probni API ključ, a prompt i izvori namjerno ga ne sadrže. | Odvojeno se simuliraju uspjeh, provider greška, greška baze i prekid zahtjeva. | Ključa nema u MongoDB-u uključujući rezervacije, datotekama, localStorage/sessionStorage/IndexedDB/cookies, aplikacijskim i proxy logovima ni javnim HTTP odgovorima. Izlazni promet poslužitelja ključ sadrži samo u autorizaciji konfiguriranog AI servisa; početni HTTPS prijenos od korisnika do ProofNewsa dopušten je. Novi zahtjev bez ključa vraća HTTP 400 i "API kljuc je obavezan". |
| K71 | Ostali ulazi su valjani i testni AI adapter prihvaća zahtjev. | Pošalje se prompt od 10.000 Unicode kodnih točaka izvan osnovne ravnine, zatim od 10.001 takve točke. | Prvi prolazi provjeru duljine, drugi daje HTTP 400 i "Prompt je predug". Usamljeni surogat daje HTTP 400 i "Neispravan zahtjev". |
| K72 | Sačuvana je stara potvrda, VM je resetiran, a novi deployment ponavlja chainId i adresu registra. | Operator konfigurira novu instancu i korisnik pokuša staru potvrdu. | Nova instanca ima nov službeni potpisnički ključ evidentiran izvan VM-a; uz ostale valjane uvjete stari potpis pada s "Nevaljana potvrda ProofNewsa". Ponovna uporaba starog ključa nije dopušten deployment. |
