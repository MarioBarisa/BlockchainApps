# ProofNews — Hardhat

Hardhat 3, JavaScript ESM, Solidity 0.8.24 i Mocha + Chai + ethers v6 prema uputama vježbe. Verzije su zaključane u `package-lock.json`.

- `contracts/` — token, sučelja i testna zamjena registra.
- `test/` — 18 testova tokena.
- `scripts/` — lokalni čvor, objava i mutacijska provjera.
- `hardhat.config.js` — kompajler i lokalna mreža.
- `HardhatInfo.md` — lokalne bilješke, isključene preko korijenskog `.gitignore`.

Specifikacija i sljedivost su u [SPEC.md](../docs/SPEC.md), a evidencija vježbe u [DNEVNIK.md](../docs/DNEVNIK.md).

Iz korijena projekta:

```sh
cd hardhat
nvm use
npm ci
npx hardhat build
npx hardhat test
npm run test:mutation
```

Za lint se koristi postojeći ESLint iz frontenda, bez dodatnih paketa:

```sh
npm --prefix ../frontend ci
npm run lint
```

Za lokalnu objavu u jednom terminalu, iz ove mape, pokreni `npm run node`, a u drugom `npm run deploy:local`. Čvor koristi `127.0.0.1:8545`, chainId 31337 i filtrira ispis privatnih ključeva. Skripta objavljuje samo token; testni registar nije produkcijski registar.
