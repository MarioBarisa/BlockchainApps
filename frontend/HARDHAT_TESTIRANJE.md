# Testiranje Hardhat mreže kroz frontend

1. U prvom terminalu potrebno je pokrenuti lokalni čvor i ostaviti ga da radi.

   ```sh
   cd hardhat
   nvm use
   npm run node
   ```

2. U drugom terminalu, također iz mape `hardhat/`, potrebno je objaviti token.

   ```sh
   nvm use
   npm run deploy:local
   ```

   Skripta sprema adresu i ABI u `frontend/public/deployments/localhost.json`. 

3. U trećem terminalu, iz korijena projekta, potrebno je pokrenuti frontend.

   ```sh
   cd frontend
   nvm use 24.14.1
   npm run dev
   ```

4. Potrebno je otvoriti adresu koju ispiše Vite i otići na **Profil**. Zatim je potrebno odabrati **Hardhat localhost**, kliknuti **Potvrdi mrežu** pa **Poveži wallet**. U MetaMasku je potrebno potvrditi dodavanje/prebacivanje mreže: RPC `http://127.0.0.1:8545`, chainId `31337`, valuta ETH.

5. Iz profila je potrebno kopirati javnu adresu walleta. Kako bi se moglo testirati slanje, na tu adresu potrebno je poslati željeni iznos lokalnog ETH-a iz mape `hardhat/`, npr. 2.5 ETH.

   ```sh
   RECIPIENT=0xTVOJA_JAVNA_ADRESA npm run fund:local -- 2.5
   ```

   Primjer je potrebno zamijeniti vlastitom javnom adresom i željenim iznosom pa kliknuti **Osvježi** u profilu. Bez argumenta iznosa šalje se 1 ETH. Potrebno je koristiti decimalnu točku; dopušteno je najviše 18 decimala. Privatni ključ nije potreban.

6. Potrebno je provjeriti prikaz PNP tokena: adresa treba odgovarati objavi, saldo i ukupna ponuda trebaju biti **0 PNP**, a registar još nije povezan. PNP se ne može ručno izdavati niti prenositi. Zatim je potrebno poslati npr. **0.01 lokalni ETH** na drugu adresu, potvrditi slanje u walletu i provjeriti status i novi saldo.

7. Potrebno je provjeriti da povijest sadrži i raniju uplatu preko `fund:local`. Nakon nove uplate ili ponovnog otvaranja aplikacije potrebno je osvježiti povijest i provjeriti sve ulazne i izlazne transakcije za adresu iz lokalnih blokova. Uz adresu primatelja odnosno pošiljatelja potrebno je kliknuti ikonu kopiranja i provjeriti potvrdu kopiranja.

8. Potrebno je prebaciti mrežu na **Sepoliju** i provjeriti da se lokalni saldo i transakcije ne prikazuju na toj mreži. Kopiranje adresa dostupno je i na Sepoliji, čija se povijest dohvaća s Blockscouta.

Nakon gašenja čvora lokalno stanje se gubi. Potrebno je ponovno pokrenuti čvor, ponoviti objavu i financiranje pa osvježiti profil. Ako MetaMask nakon reseta prijavi stari nonce, u postavkama walleta potrebno je očistiti podatke aktivnosti samo za lokalni račun/mrežu. Frontend i čvor potrebno je pokretati na istom računalu. Nakon novog deploya nije potrebno ponovno pokretati Vite.

Ako MetaMask pri slanju vrati grešku `4100`, potrebno je kliknuti **Ponovno odobri wallet** i potvrditi pristup odabranom računu u MetaMasku. Nakon toga potrebno je provjeriti mrežu, primatelja i iznos te ponovno pokrenuti slanje. Samo ponovno odobrenje walleta ne šalje transakciju.

Automatske provjere: `npm test`, `npm run lint` i `npm run build` iz `frontend/`; testovi ugovora su u `hardhat/`.
