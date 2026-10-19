# Frontend

Vue 3 + Vite + Pinia + Vue Router + Tailwind CSS 4 + daisyUI 5.

## Pokretanje

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + produkcijski build
npm run lint     # ESLint
```

## Struktura

```
src/
├─ assets/main.css      # Tailwind + daisyUI teme (light/dark)
├─ config/app.ts        # naziv brenda, zajednica, mreža - mijenja se na jednom mjestu
├─ router/index.ts      # rute: / , /explore , /profile , 404
├─ stores/
│  ├─ theme.ts          # light/dark tema, pamti izbor, prati OS postavku
│  └─ wallet.ts         # mock wallet (sprema se za pravi provider u T4)
├─ data/mockProjects.ts # demo projekti za prikaz
├─ icons.ts             # pojedinačno uvezene Iconify ikone
├─ components/          # navbar, dock, kartice, gumbi
└─ views/               # HomeView, ExploreView, ProfileView, NotFoundView
```

## Teme

U `src/assets/main.css` uključene su samo dvije daisyUI teme:

```css
@plugin "daisyui" {
  themes: light --default, dark --prefersdark;
}
```

Tema se postavlja preko `data-theme` na `<html>`, a upravlja njome `stores/theme.ts`.
Sve boje u komponentama koriste daisyUI tokene (`bg-base-100`, `text-primary`, ...),
pa promjena teme radi bez izmjena u komponentama.

## Napomena

Wallet je trenutno demo (bez `window.ethereum`). Sve Web3 akcije su simulirane
i ne šalju transakcije.
