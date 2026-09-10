# Budżet Domowy

Aplikacja do zarządzania budżetem domowym: kategorie z limitami, cele
oszczędnościowe, transakcje cykliczne, porównania miesięczne, podsumowanie
roczne i prosta analiza finansów.

## Ważne: gdzie trzymane są dane

Aplikacja zapisuje dane w **`localStorage` przeglądarki** — czyli lokalnie,
na tym konkretnym urządzeniu i w tej konkretnej przeglądarce. To oznacza:

- Dane **nie synchronizują się** między telefonem a komputerem ani między
  różnymi przeglądarkami.
- Wyczyszczenie danych przeglądarki (albo tryb prywatny/incognito) usunie
  zapisy.
- **Rób regularnie kopię zapasową** przez zakładkę „dane" w aplikacji
  (eksport JSON) — to jedyny sposób na przeniesienie danych między
  urządzeniami albo ich odzyskanie.

Jeśli w przyszłości zechcesz synchronizacji między urządzeniami, trzeba
będzie dodać prawdziwy backend (np. bazę danych i logowanie) — to już
osobny, większy projekt.

## Uruchomienie lokalne

Wymagany [Node.js](https://nodejs.org) (wersja 18 lub nowsza).

```bash
npm install
npm run dev
```

Aplikacja wystartuje pod adresem pokazanym w terminalu (zwykle
`http://localhost:5173`).

## Budowanie wersji produkcyjnej

```bash
npm run build
```

Gotowa, statyczna wersja aplikacji trafi do folderu `dist/`.

## Wystawienie w internecie

### Opcja A: Vercel lub Netlify (najprostsze)

1. Wrzuć ten folder jako repozytorium na GitHub (patrz niżej).
2. Załóż darmowe konto na [vercel.com](https://vercel.com) lub
   [netlify.com](https://netlify.com).
3. Połącz swoje repozytorium z GitHuba — obie platformy same wykryją, że to
   projekt Vite, i zbudują go automatycznie. Nie trzeba nic konfigurować.
4. Po chwili dostaniesz gotowy adres (np. `budzet-domowy.vercel.app`).

### Opcja B: GitHub Pages

```bash
npm run deploy
```

To polecenie zbuduje aplikację i wypchnie ją na gałąź `gh-pages` w Twoim
repozytorium. W ustawieniach repozytorium na GitHubie (Settings → Pages)
wybierz jako źródło gałąź `gh-pages`.

## Wrzucenie na GitHub (jeśli jeszcze nie masz repozytorium)

```bash
git init
git add .
git commit -m "Pierwsza wersja aplikacji budżet domowy"
git branch -M main
git remote add origin https://github.com/TWOJA-NAZWA/budzet-domowy.git
git push -u origin main
```

(Wcześniej załóż puste repozytorium na github.com — bez README, bez
.gitignore, żeby uniknąć konfliktów przy pierwszym push).

## Struktura projektu

```
├── index.html          punkt wejścia HTML
├── src/
│   ├── main.jsx         start aplikacji, podpięcie localStorage
│   ├── App.jsx           cały komponent aplikacji (logika + wygląd)
│   ├── storage.js        zamiennik window.storage oparty o localStorage
│   └── index.css         minimalny reset stylów
├── package.json
└── vite.config.js
```

Cała logika i wygląd aplikacji znajdują się w jednym pliku — `src/App.jsx`
— dokładnie takim, jaki był rozwijany jako artefakt w Claude.ai. Jedyna
różnica funkcjonalna względem wersji z Claude.ai to sposób zapisu danych
(`localStorage` zamiast `window.storage`).
