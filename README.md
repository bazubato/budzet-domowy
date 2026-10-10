# Budżet Domowy 💼

Osobista aplikacja do zarządzania budżetem domowym — zbudowana jako projekt
portfolio przy współpracy z Claude (Anthropic). Motyw wizualny: zeszyt w
kratkę, z czytelną, nowoczesną typografią dopasowaną do danych finansowych.

**Live demo:** [budzet-domowy-app-beta.vercel.app](https://budzet-domowy-app-beta.vercel.app)

## Funkcje

**Przegląd**
- Bilans miesiąca na pierwszy rzut oka: wpływy, wydatki, ile jeszcze można
  wydać do końca miesiąca (z uwzględnieniem zaplanowanych wpłat na cele)
- Największa kategoria wydatków, największy pojedynczy wydatek, dni
  pozostałe do końca miesiąca
- Porównanie z poprzednim miesiącem — ogólne i wg kategorii

**Zapisy**
- Dodawanie wydatków i wpływów z kategorią, kwotą, datą i notatką
- **Pełna edycja już dodanych wpisów** — bez konieczności usuwania i
  dodawania od nowa
- Własny okres czasu do przeglądania danych (nie tylko pełny miesiąc)

**Kategorie**
- Dowolne własne kategorie z opcjonalnym limitem budżetu
- Zmiana nazwy kategorii — automatycznie aktualizuje historię wcześniejszych
  zapisów
- Kolorowe oznaczenia i pasek wykorzystania limitu

**Cele oszczędnościowe**
- Cele z kwotą docelową, terminem i śledzeniem wpłat
- Wyliczanie sugerowanej miesięcznej wpłaty, żeby zdążyć na czas

**Transakcje cykliczne**
- Stałe wydatki i wpływy (np. czynsz, wynagrodzenie) — tygodniowe,
  miesięczne, roczne
- Automatyczne dopisywanie do zapisów w odpowiednim terminie, bez
  duplikatów

**Rok**
- Podsumowanie roczne: średnie miesięczne, najlepszy/najdroższy miesiąc,
  ranking kategorii, wykres wpływów i wydatków w każdym miesiącu

**Analiza**
- Automatyczne spostrzeżenia liczone wyłącznie na podstawie realnych danych
  (bez losowych porad): wzrosty wydatków względem średniej, tempo
  oszczędzania na cele, ostrzeżenia o zbliżającym się limicie

**Dane**
- Eksport do CSV i pełnej kopii zapasowej JSON
- Import z potwierdzeniem przed nadpisaniem danych

**Personalizacja**
- Nazwy wszystkich zakładek można zmienić na własne

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

Jeśli w przyszłości zajdzie potrzeba synchronizacji między urządzeniami,
wymagałoby to dodania prawdziwego backendu (baza danych, logowanie) — to
już osobny, większy projekt.

## Instalacja na telefonie (jak zwykła aplikacja)

Aplikacja ma wbudowaną obsługę „Dodaj do ekranu głównego" — po wdrożeniu
będzie miała własną ikonę i otwierać się na pełnym ekranie, bez paska
przeglądarki.

1. Otwórz [adres aplikacji](https://budzet-domowy-app-beta.vercel.app) w
   przeglądarce na telefonie.
2. **iPhone (Safari):** stuknij ikonę „Udostępnij" (kwadrat ze strzałką) na
   dole ekranu → „Dodaj do ekranu początkowego".
3. **Android (Chrome):** stuknij trzy kropki w prawym górnym rogu →
   „Dodaj do ekranu głównego" (albo Chrome sam zaproponuje to jako baner
   „Zainstaluj aplikację").

## Stos technologiczny

- **React** + **Vite**
- **lucide-react** — ikony
- Czyste CSS (custom properties, bez frameworków UI)
- `localStorage` do przechowywania danych (zamiennik `window.storage` z
  artefaktów Claude.ai — patrz `src/storage.js`)

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

1. Załóż darmowe konto na [vercel.com](https://vercel.com) lub
   [netlify.com](https://netlify.com).
2. Połącz swoje repozytorium z GitHuba — obie platformy same wykryją, że to
   projekt Vite, i zbudują go automatycznie. Nie trzeba nic konfigurować.
3. Po chwili dostaniesz gotowy adres, a każdy kolejny `git push` będzie
   automatycznie wdrażał nową wersję.

### Opcja B: GitHub Pages

```bash
npm run deploy
```

To polecenie zbuduje aplikację i wypchnie ją na gałąź `gh-pages` w Twoim
repozytorium. W ustawieniach repozytorium na GitHubie (Settings → Pages)
wybierz jako źródło gałąź `gh-pages`.

## Struktura projektu

```
├── index.html                punkt wejścia HTML (z manifestem PWA)
├── public/
│   ├── manifest.json           opis aplikacji dla „Dodaj do ekranu głównego"
│   ├── icon-192.png             ikona aplikacji
│   ├── icon-512.png             ikona aplikacji (duża)
│   └── apple-touch-icon.png     ikona dla iOS
├── src/
│   ├── main.jsx               start aplikacji, podpięcie localStorage
│   ├── App.jsx                 cały komponent aplikacji (logika + wygląd)
│   ├── storage.js              zamiennik window.storage oparty o localStorage
│   └── index.css               minimalny reset stylów
├── package.json
└── vite.config.js
```

Cała logika i wygląd aplikacji znajdują się w jednym pliku — `src/App.jsx`.

## Licencja

Projekt osobisty / portfolio. Swobodnie forkuj i dostosuj do własnych
potrzeb.
