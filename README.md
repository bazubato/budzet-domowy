Budżet Domowy 💼

Osobista aplikacja do zarządzania budżetem domowym — zbudowana jako projekt portfolio przy współpracy z Claude (Anthropic). Motyw wizualny: zeszyt w kratkę, z czytelną, nowoczesną typografią dopasowaną do danych finansowych.

Live demo: budzet-domowy-app-beta.vercel.app

Funkcje

Przegląd

Bilans miesiąca na pierwszy rzut oka: wpływy, wydatki, ile jeszcze można wydać do końca miesiąca (z uwzględnieniem zaplanowanych wpłat na cele)
Największa kategoria wydatków, największy pojedynczy wydatek, dni pozostałe do końca miesiąca
Porównanie z poprzednim miesiącem — ogólne i wg kategorii

Zapisy

Dodawanie wydatków i wpływów z kategorią, kwotą, datą i notatką
Pełna edycja już dodanych wpisów — bez konieczności usuwania i dodawania od nowa
Własny okres czasu do przeglądania danych (nie tylko pełny miesiąc)

Kategorie

Dowolne własne kategorie z opcjonalnym limitem budżetu
Zmiana nazwy kategorii — automatycznie aktualizuje historię wcześniejszych zapisów
Kolorowe oznaczenia i pasek wykorzystania limitu

Cele oszczędnościowe

Cele z kwotą docelową, terminem i śledzeniem wpłat
Wyliczanie sugerowanej miesięcznej wpłaty, żeby zdążyć na czas

Transakcje cykliczne

Stałe wydatki i wpływy (np. czynsz, wynagrodzenie) — tygodniowe, miesięczne, roczne
Automatyczne dopisywanie do zapisów w odpowiednim terminie, bez duplikatów

Rok

Podsumowanie roczne: średnie miesięczne, najlepszy/najdroższy miesiąc, ranking kategorii, wykres wpływów i wydatków w każdym miesiącu

Analiza

Automatyczne spostrzeżenia liczone wyłącznie na podstawie realnych danych (bez losowych porad): wzrosty wydatków względem średniej, tempo oszczędzania na cele, ostrzeżenia o zbliżającym się limicie

Dane

Eksport do CSV i pełnej kopii zapasowej JSON
Import z potwierdzeniem przed nadpisaniem danych

Personalizacja

Nazwy wszystkich zakładek można zmienić na własne
Ważne: gdzie trzymane są dane

Aplikacja zapisuje dane w localStorage przeglądarki — czyli lokalnie, na tym konkretnym urządzeniu i w tej konkretnej przeglądarce. To oznacza:

Dane nie synchronizują się między telefonem a komputerem ani między różnymi przeglądarkami.
Wyczyszczenie danych przeglądarki (albo tryb prywatny/incognito) usunie zapisy.
Rób regularnie kopię zapasową przez zakładkę „dane" w aplikacji (eksport JSON) — to jedyny sposób na przeniesienie danych między urządzeniami albo ich odzyskanie.

Jeśli w przyszłości zajdzie potrzeba synchronizacji między urządzeniami, wymagałoby to dodania prawdziwego backendu (baza danych, logowanie) — to już osobny, większy projekt.

Instalacja na telefonie (jak zwykła aplikacja)

Aplikacja ma wbudowaną obsługę „Dodaj do ekranu głównego" — po wdrożeniu będzie miała własną ikonę i otwierać się na pełnym ekranie, bez paska przeglądarki.

Otwórz adres aplikacji w przeglądarce na telefonie.
iPhone (Safari): stuknij ikonę „Udostępnij" (kwadrat ze strzałką) na dole ekranu → „Dodaj do ekranu początkowego".
Android (Chrome): stuknij trzy kropki w prawym górnym rogu → „Dodaj do ekranu głównego" (albo Chrome sam zaproponuje to jako baner „Zainstaluj aplikację").
Stos technologiczny
React + Vite
lucide-react — ikony
Czyste CSS (custom properties, bez frameworków UI)
localStorage do przechowywania danych (zamiennik window.storage z artefaktów Claude.ai — patrz src/storage.js)
