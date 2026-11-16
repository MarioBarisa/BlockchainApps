# Frontend

Vue 3 + Vite + Pinia + Vue Router + Tailwind CSS 4 + daisyUI 5.

## Pokretanje

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + produkcijski build
npm run lint     # ESLint
npm test         # testovi walleta, mreza i PNP tokena
```

## Struktura

```
src/
├─ assets/main.css      # Tailwind + sve daisyUI teme
├─ config/app.ts        # naziv brenda i zajednica
├─ config/networks.ts   # Sepolia i Hardhat localhost
├─ router/index.ts      # rute: / , /explore , /profile , 404
├─ stores/
│  ├─ theme.ts          # automatski Light/Dark ili spremljeni ručni izbor teme
│  └─ wallet.ts         # Ethereum wallet, saldo, slanje i povijest transakcija
├─ services/walletHistory.ts # Sepolia povijest preko Blockscout API-ja
├─ services/localWalletHistory.ts # cijela povijest lokalne adrese iz Hardhat blokova
├─ services/proofNewsToken.ts # provjera lokalne objave i citanje PNP tokena
├─ data/mockProjects.ts # demo projekti za prikaz
├─ icons.ts             # pojedinačno uvezene Iconify ikone
├─ components/          # navbar, dock, kartice, gumbi
└─ views/               # HomeView, ExploreView, ProfileView, NotFoundView
```

## Teme

Uključene su sve ugrađene DaisyUI teme. Izbornik u zaglavlju prikazuje uzorke boja
te sprema ručno odabranu temu u lokalnu pohranu preglednika. Zadani način
„Automatski” prati postavku preglednika/uređaja: Garden za svijetli i Forest
za tamni način, uključujući promjene postavke tijekom rada aplikacije.

Ručni odabir bilo koje teme ima prednost pred sustavom i ostaje spremljen za
sljedeći posjet. Ponovnim odabirom „Automatski” uklanja se ručna postavka i
vraća praćenje uređaja. Ranije spremljeni odabiri ostaju sačuvani.

Tema se postavlja preko `data-theme` na `<html>`, a upravlja njome `stores/theme.ts`.
Komponente koriste DaisyUI tokene boja.

## Wallet i povijest

Wallet se povezuje preko `window.ethereum` (MetaMask ili kompatibilni wallet).
Slanje se potvrđuje u walletu i dopušteno je na odabranoj mreži: Sepolia ili Hardhat localhost.
Mrežu odaberi i potvrdi u profilu; lokalna mreža po potrebi se dodaje kroz wallet. Saldo se osvježava
svakih 12 sekundi. QR kod sadrži javnu adresu za primanje.

Na Sepoliji povijest dolazi iz javnog Blockscout API-ja, bez API ključa. Dohvaćaju se
obične transakcije i interni ETH prijenosi s iznosom većim od nule. Stariji zapisi
učitavaju se po stranicama gumbom „Učitaj starije”; „Osvježi povijest” vraća
najnovije stranice. Povijest se ponovno dohvaća pri spajanju walleta, pa je
neovisna o prethodnoj sesiji aplikacije. Svaki zapis ima Etherscan poveznicu.
ERC-20 prijenosi nisu dio ETH popisa.

Dohvat šalje javnu adresu Blockscout servisu i ovisi o njegovoj dostupnosti,
indeksiranju i ograničenjima. Instance API-ja trenutačno rade bez ključa;
Blockscout najavljuje prelazak na Universal API pa će se izvor možda morati
promijeniti u `services/walletHistory.ts`. Greška dohvata vidljiva je u sučelju;
povijest drugog računa ili mreže nikad se ne prikazuje kao aktualna.

Projekti i ostali placeholder podaci ostaju demonstracijski.

## Lokalni PNP token

Na Hardhat mreži profil prikazuje PNP saldo, ukupnu ponudu, vlasnika i registar iz stvarnog ugovora.
`npm run deploy:local` iz `hardhat/` sprema ABI i javne podatke objave u `public/deployments/localhost.json`.
Datoteka se dohvaća pri osvježavanju i isključena je iz Gita. Nakon reseta čvora treba ponoviti objavu;
frontend provjerava mrežu, kod ugovora i receipt da ne prikaže podatke stare objave.

Lokalna povijest čita sve transakcije iz Hardhat blokova u kojima je povezana adresa pošiljatelj ili
primatelj, uključujući `fund:local`, slanja izvan aplikacije, nulte iznose i neuspjele transakcije.
Ponovno spajanje dohvaća ranije zapise; pri osvježavanju čitaju se samo novi blokovi dok prethodni
hash bloka ostaje isti. Reset ili promjena lanca odbacuje ranije lokalne zapise. Nema poziva
Blockscoutu ni Etherscan poveznica za lokalnu mrežu. Zapisi i receiptovi odvojeni su po chainId-ju.

Uz adresu primatelja odnosno pošiljatelja u povijesti nalazi se gumb za kopiranje, na lokalnoj mreži
i na Sepoliji. Poruka potvrđuje kopiranje ili objašnjava ručno kopiranje ako preglednik odbije pristup.

Kratke upute: [HARDHAT_TESTIRANJE.md](HARDHAT_TESTIRANJE.md).
