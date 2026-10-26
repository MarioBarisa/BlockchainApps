# Frontend

Vue 3 + Vite + Pinia + Vue Router + Tailwind CSS 4 + daisyUI 5.

## Pokretanje

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + produkcijski build
npm run lint     # ESLint
npm test         # testovi dohvata i povijesti walleta
```

## Struktura

```
src/
├─ assets/main.css      # Tailwind + sve daisyUI teme
├─ config/app.ts        # naziv brenda, zajednica, mreža - mijenja se na jednom mjestu
├─ router/index.ts      # rute: / , /explore , /profile , 404
├─ stores/
│  ├─ theme.ts          # automatski Light/Dark ili spremljeni ručni izbor teme
│  └─ wallet.ts         # Ethereum wallet, saldo, slanje i povijest transakcija
├─ services/walletHistory.ts # Sepolia povijest preko Blockscout API-ja
├─ data/mockProjects.ts # demo projekti za prikaz
├─ icons.ts             # pojedinačno uvezene Iconify ikone
├─ components/          # navbar, dock, kartice, gumbi
└─ views/               # HomeView, ExploreView, ProfileView, NotFoundView
```

## Teme

Uključene su sve ugrađene DaisyUI teme. Izbornik u zaglavlju prikazuje uzorke boja
te sprema ručno odabranu temu u lokalnu pohranu preglednika. Zadani način
„Automatski” prati postavku preglednika/uređaja: Light za svijetli i Dark
za tamni način, uključujući promjene postavke tijekom rada aplikacije.

Ručni odabir bilo koje teme ima prednost pred sustavom i ostaje spremljen za
sljedeći posjet. Ponovnim odabirom „Automatski” uklanja se ručna postavka i
vraća praćenje uređaja. Ranije spremljeni odabiri ostaju sačuvani.

Tema se postavlja preko `data-theme` na `<html>`, a upravlja njome `stores/theme.ts`.
Komponente koriste DaisyUI tokene boja.

## Wallet i povijest

Wallet se povezuje preko `window.ethereum` (MetaMask ili kompatibilni wallet).
Slanje se potvrđuje u walletu i dopušteno je samo na Sepoliji. Saldo se osvježava
svakih 12 sekundi. QR kod sadrži javnu adresu za primanje.

Povijest dolazi iz javnog Sepolia Blockscout API-ja, bez API ključa. Dohvaćaju se
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
