# Daily Bloom — Product Requirements Document

> **Status projektu:** projekt portfolio.
> **Platforma docelowa:** **iOS (App Store)** + **web demo na Vercel**.
> **Stack:** Expo + Expo Router (jeden kodebase, output iOS + web), TypeScript, NativeWind, react-native-reusables, Skia.

---

## 1. Przegląd produktu

**Daily Bloom** to mobilna aplikacja-dzienniczek, w której użytkownik codziennie wypełnia krótki kwestionariusz (6 pytań) i otrzymuje swój **personalny kwiatek dnia** — unikalną wizualizację stanu z tego dnia. Następnie zapisuje notatkę-refleksję, inspirowaną tym, co kwiatek mu pokazał.

W przyszłości aplikację wesprze **agent AI**, który będzie analizował notatki i statystyki, dostarczając podsumowań i rad. AI nie jest częścią pierwszego MVP — to feature kolejnej fazy.

### Wizja
Dziennik, który nie tylko zbiera słowa, ale pokazuje użytkownikowi *jak kwitnie* — w sposób piękny, intymny i niepowtarzalny.

### Grupa docelowa
Osoby zainteresowane dbaniem o dobrostan, journalingiem, mindfulness, samorozwojem.

### Cel projektu
Portfolio — demonstracja umiejętności produktowych, designerskich i technicznych. Polish wizualny ma wysoki priorytet.

---

## 2. Cele produktowe

- **Główny cel:** Codzienna, lekka praktyka refleksji wsparta wizualnym feedbackiem.
- **Cel zaangażowania:** Powracalność dzienna.
- **Cel wartości:** Użytkownik dostrzega wzorce w swoim życiu dzięki wizualizacji i (w przyszłości) analizie AI.

---

## 3. Kluczowe funkcjonalności (MVP)

### 3.1. Onboarding
- Krótkie wprowadzenie (1–2 ekrany) o tym, czym jest Daily Bloom.
- **Pytanie o imię** użytkownika — używane do powitania na home ("Hi [imię]").
- **Brak rejestracji / konta** — start lokalny, dane na urządzeniu. (Future: synchronizacja chmurowa.)
- Po onboardingu użytkownik od razu przechodzi do pierwszego kwestionariusza i otrzymuje swój pierwszy kwiatek.

### 3.2. Kwestionariusz dzienny (6 osi + 2 tagi)

**Część A — 6 pytań skalowanych** (każde = jeden płatek). Pełne pytanie + mikrocopy + skala 1–5:

**1. Dzień** — *"Jak dziś było?"*
*1 Ciężko / 2 Trudno / 3 Zwyczajnie / 4 Dobrze / 5 Wyjątkowo*

**2. Emocje** — *"Jak się dziś czujesz?"*
Mikrocopy: *To, co czujesz w środku — niezależnie od tego, jaki był dzień.*
*1 Smutno / 2 Słabo / 3 Spokojnie / 4 Dobrze / 5 Radośnie*

**3. Energia** — *"Ile miałaś dziś w sobie energii?"*
Mikrocopy: *Twój wewnętrzny zasób — do działania, do bycia, do reagowania.*
*1 Puste baki / 2 Ledwo ledwo / 3 Wystarczająco / 4 Z zapasem / 5 Buzowała w żyłach*

**4. Ciało** — *"Jak czuło się dziś Twoje ciało?"*
Mikrocopy: *Sen, oddech, napięcia, ruch — na ile było Ci ze sobą dobrze fizycznie.*
*1 Protestowało / 2 Zmęczone / 3 Spokojne / 4 Lekkie / 5 Rozkwitłe*

**5. Zachwyt** — *"Ile drobnych momentów Cię dziś urzekło?"*
Mikrocopy: *Małe rzeczy, które na chwilę Cię zatrzymały. Na przykład: uśmiechnęłam się, gdy zobaczyłam dziś tęczę. Albo: poczułam zapach kawy i było mi dobrze.*
*1 Żadnego / 2 Ledwo jeden / 3 Parę drobnych / 4 Sporo / 5 Cały dzień*

**6. Sens** — *"Czy to, co robiłaś dziś, było dla Ciebie ważne?"*
Mikrocopy: *Coś zgodnego z Tobą — praca nad czymś istotnym, rozmowa, która coś zmieniła, drobna decyzja po swojemu.*
*1 Wcale / 2 Ledwo / 3 Trochę / 4 Mocno / 5 W pełni*

- **Skala 1–5**, ekspresyjne odpowiedzi (nie slider, nie liczby).
- **Brak możliwości pominięcia** — środkowa pozycja działa jak "trudno powiedzieć".

**Część B — 2 tagi tak/nie** (kodują dodatkowe elementy wizualne kwiatka i zasilają statystyki/AI):

7. **Coś dobrego** — *"Czy spotkało Cię dziś coś dobrego?"* (tak/nie + opcjonalne 1 zdanie)
8. **Coś trudnego** — *"Czy spotkało Cię dziś coś trudnego?"* (tak/nie + opcjonalne 1 zdanie)

**Koncept osi Zachwyt:** inspirowane *glimmers* z teorii poliwagalnej (Deb Dana) — mikro-momenty aktywujące poczucie bezpieczeństwa. Apka uczy zauważania drobnych momentów. Osobny ekran edukacyjny w onboardingu wyjaśnia ten koncept.

Po wypełnieniu kwestionariusza → animacja kwitnięcia → kwiatek dnia → ekran zachęcający do dodania notatki.

### 3.3. Notatka dzienna
- Pole tekstowe na refleksję dnia.
- Ekran notatki pojawia się **po kwestionariuszu**, z zachętą: *"Twój kwiatek dzisiaj wygląda tak. Zapisz, co o nim myślisz / co dziś czujesz."*
- Notatka jest **opcjonalna**, ale UI silnie do niej zachęca.
- **Edytowalność:** wpisy z poprzednich dni można edytować (i kwestionariusz, i notatkę).

### 3.4. Personalny kwiatek — wizualizacja
- **6 płatków = 6 osi kwestionariusza.** Każdy płatek odpowiada jednej osi.
- **Długość płatka** zależy od odpowiedzi (skala 1–5).
- **Kolor płatka** zmienia się od odpowiedzi (np. niższe wartości → chłodniejsze/przygaszone, wyższe → ciepłe/żywe). Konkretny mapping kolorów do dopracowania w designie.
- **Personalne "DNA kwiatka"** — niepowtarzalne wizualnie dla każdego użytkownika:
  - Seed generowany z user ID (deterministyczny, stały w czasie).
  - Z seeda wyprowadzamy: bazową paletę, kształt płatka, krzywiznę, teksturę/ziarno.
  - Kwiatek użytkownika A nigdy nie wygląda jak kwiatek użytkownika B, nawet przy identycznych odpowiedziach.
  - Długość/pozycja płatków zmienia się dziennie wg odpowiedzi, ale "tożsamość wizualna" pozostaje.
- **Kwiatek dnia** wyświetlany na home.
- **Kwiatek tygodniowy/miesięczny** (uśredniony "super-kwiatek") dostępny w statystykach.
- **Brak wypełnienia danego dnia** → kwiatek "uśpiony" (pąk) na home, zachęcający do uzupełnienia.

### 3.5. Kalendarz (sekcja dolna home)
- **Widok bieżącego tygodnia** (7 komórek).
- **Każda komórka = miniaturka kwiatka** z tego dnia (lub pąk dla dni bez wpisu).
- **Strzałki nawigacji** — powrót do poprzednich tygodni (przyszłe tygodnie zablokowane / wyszarzone).
- Tap na dzień → ekran szczegółowy: notatka + kwiatek + odpowiedzi kwestionariusza (z możliwością edycji).

### 3.6. Statystyki i Ogród
- Widoki: **tygodniowy, miesięczny, kwartalny, roczny**.
- Trendy poszczególnych 6 osi w czasie (wykresy liniowe / heatmapa).
- **Super-kwiatki** — uśrednione kwiatki dla każdego okresu (tyg./mies./kw./roczny) jako wizualne podsumowanie.
- **Ogród** — galeria wszystkich dziennych kwiatków użytkownika, ułożona chronologicznie (np. grid). Każdy kwiatek klikalny → przejście do notatki i odpowiedzi z tego dnia. Mocny hook retencyjny — użytkownik widzi swoją historię "rozkwitów".

### 3.7. Agent AI (FUTURE — poza MVP)
- **Nie jest częścią pierwszego MVP.** Pole na powitanie AI na home jest zaplanowane w layoucie, ale w MVP wyświetla statyczny tekst lub prosty heurystyczny komunikat.
- W przyszłości: agent analizuje notatki + odpowiedzi kwestionariusza i dostarcza:
  - krótkie powitanie/refleksję na home,
  - cotygodniowe/miesięczne podsumowanie wzorców i sugestii,
  - statystyki wzbogacone o NLP (najczęstsze tematy, emocje).
- **Bez chatu** — AI nie jest rozmówcą, tylko analitykiem. Komunikuje się przez krótkie teksty i wzbogacone statystyki.

---

## 4. Layout ekranu głównego (zgodnie z draftem)

```
┌─────────────────────────┐
│   Daily Bloom (logo)    │  ← nagłówek
├─────────────────────────┤
│   Hi [imię],            │  ← powitanie + krótka
│   "krótka notatka..."   │     notatka (MVP: statyczna,
│                         │      future: AI)
├─────────────────────────┤
│                         │
│        🌸 KWIATEK       │  ← kwiatek dnia
│                         │
├──────── ~~~~~ ──────────┤  ← separator (falka)
│           (+)           │  ← dodaj/edytuj wpis dnia
├─────────────────────────┤
│   K A L E N D A R Z     │  ← bieżący tydzień
│  🌸 🌸 🌱 🌸 🌱 . .       │     miniaturki kwiatków
└─────────────────────────┘
```

### Flow użytkownika — pierwsze wejście
1. Onboarding (intro + imię).
2. Pierwszy kwestionariusz (6 pytań).
3. Animacja kwitnięcia → kwiatek pojawia się.
4. Ekran notatki z zachętą do zapisu refleksji.
5. Home — z kwiatkiem dnia, powitaniem, kalendarzem.

### Flow — kolejne dni
1. Wejście na home.
2. Jeśli dziś jeszcze nie wypełniono → CTA "Wypełnij kwiatek dnia".
3. Kwestionariusz → kwiatek → notatka → home.

---

## 5. User stories (MVP)

| # | Jako... | Chcę... | Aby... |
|---|---------|---------|--------|
| 1 | nowy użytkownik | przejść krótki onboarding i podać imię | poczuć, że apka jest moja |
| 2 | użytkownik | codziennie wypełnić kwestionariusz 6 pytań | zobaczyć swój kwiatek dnia |
| 3 | użytkownik | zapisać notatkę dnia | utrwalić refleksję |
| 4 | użytkownik | edytować wczorajszy wpis / kwiatek | poprawić błąd lub dopisać myśl |
| 5 | użytkownik | zobaczyć kalendarz z miniaturami kwiatków | szybko ocenić tydzień |
| 6 | użytkownik | wrócić do poprzednich tygodni | przeglądać historię |
| 7 | użytkownik | zobaczyć statystyki tygodniowe/miesięczne/kwartalne/roczne | zrozumieć swoje wzorce |
| 8 | użytkownik | zobaczyć "ogród" wszystkich moich kwiatków | poczuć dumę z konsekwencji |

---

## 6. Wymagania niefunkcjonalne

- **Prywatność:**
  - Notatki przechowywane lokalnie (brak konta w MVP).
  - **Notatki będą wysyłane do modelu AI** (gdy AI zostanie włączone — future feature). Wymaga jasnego komunikatu w UI.
  - **Eksport danych nie jest częścią MVP.**
- **Performance:** kwiatek renderowany płynnie (SVG), animacje 60fps.
- **Dostępność:** czytelne fonty, kontrast, alt-teksty dla wizualizacji.
- **Mobile-only:** projektujemy pod telefon.
- **Offline-first:** w MVP wszystko działa lokalnie bez połączenia.

---

## 7. Design — kierunek wizualny

### Inspiracje
- **Federica Fragapane** — kierunek główny: rygorystyczna wizualizacja danych w organicznej, botanicznej formie. Każdy element wizualny (długość, kolor, kontur, ornament, kropka, linia) koduje konkretną zmienną. Kwiatek nie jest dekoracją — jest językiem danych użytkownika. Apka łączy journaling z infovizem.
- Studio **Josh** — typografia i UI: duża nowoczesna antykwa, neutralne tła, duże liczby, miękkie przyciski.
- "Watercolor flower" — sam kwiatek malowany akwarelą: gradient, noise, miękkie krawędzie.

### Filozofia data-viz
- Kwiatek to **wielowymiarowy wykres** — koduje 8 zmiennych (6 osi + 2 tagi) plus metadane (data, długość notatki).
- **Legenda jest częścią produktu** — osobny ekran "Jak czytać swój kwiatek" tłumaczy, co oznacza każdy element wizualny.
- Pełny mapping zmiennych → elementów wizualnych: patrz `FLOWER_DNA.md`.

### Język wizualny
- **Tła neutralne, ciepłe** — kremowy/off-white, efekt starej kartki papieru z subtelnym noise/grain. **Bez kolorowych ekranów.**
- **Typografia:** duża, nowoczesna **antykwa (serif)** dla nagłówków i liczb (np. *Fraunces, PP Editorial, Instrument Serif*). Sans-serif dla treści (np. *Inter*).
- **Duże liczby** w statystykach (jak w referencji Josh — "2B", "86+", "3.8M").
- **Duże, miękkie przyciski** — kółka, dużo whitespace, czarne CTA na neutralnym tle.
- **Subtelny noise/grain** jako global texture overlay — paper feel.
- **Mikro-animacje** organiczne, miękkie, bez "techno" akcentów.

### Kwiatek — styl
- Estetyka **trzeciego screenshota (akwarela + noise + gradient)** — organiczne, miękkie krawędzie, transparentne warstwy płatków przenikające się.
- Renderowanie: **SVG/Canvas + filter noise + gradient mesh**.
- Każdy płatek ma własny gradient (paleta z DNA użytkownika) i delikatne ziarno.
- Cała kompozycja powinna sprawiać wrażenie ręcznie namalowanej, nie generowanej.

### Statystyki — "kwiatek procentowy"
- Inspiracja: drugi screenshot (kwiatek z procentami w płatkach — sałatka).
- **Tygodniowe podsumowanie mood** w formie kwiatka, gdzie każdy płatek = jedna z 6 osi, a w środku/na płatku **procent** (np. "Radość 34%", "Spokój 22%").
- Procenty opisują, jak duży udział danej osi miał w samopoczuciu tygodnia (np. relatywny wkład w sumę, lub średnia z 1–5 jako %).

### Biblioteka komponentów
- **`react-native-reusables`** — port shadcn/ui na React Native (te same wzorce komponentów, ta sama estetyka, ale działa natywnie na iOS i web).
- **NativeWind** — Tailwind CSS dla React Native (klasy `className` działają zarówno na natywie, jak i webie).

---

## 8. Stack i platformy docelowe

### Cele dystrybucji
- **iOS App Store** — główny target, build natywny.
- **Web demo na Vercel** — link do portfolio, ten sam kodebase eksportowany jako web build.

### Stack
- **Framework:** **Expo (SDK najnowszy) + Expo Router** — jeden kodebase, output: iOS + web.
- **Język:** TypeScript.
- **Styling:** NativeWind (Tailwind) + design tokens.
- **Komponenty:** react-native-reusables (shadcn-style).
- **Wizualizacja kwiatka:**
  - **iOS:** `@shopify/react-native-skia` — pełne wsparcie dla gradientów, noise, masek, akwarelowych efektów.
  - **Web:** SVG + Canvas fallback (Skia ma też wersję webową — `CanvasKit`).
- **Animacje:** `react-native-reanimated` + `Moti`.
- **Storage MVP:** `expo-sqlite` (iOS) / IndexedDB (web) — abstrakcja przez wspólny adapter.
- **Build i deploy:**
  - iOS → **EAS Build** + TestFlight → App Store.
  - Web → `expo export --platform web` → **Vercel** (statyczny eksport lub SSR przez Expo Router).
- **Backend (future):** Supabase (Postgres + Auth + Storage).
- **AI (future):** Claude API przez Edge Function.

### Priorytet: iOS first
- Projektujemy i testujemy najpierw na iPhone (Expo Go / EAS Build).
- Web build to wersja "showcase" do portfolio — może mieć drobne ograniczenia (np. mniej zaawansowane efekty Skia).

---

## 9. Decyzje podjęte

- ✅ **6 osi** kwestionariusza (energia, spokój, radość, relacje, sens, ciało).
- ✅ **Skala 1–5 z opisami tekstowymi** (nie slider). Pytania zawsze te same.
- ✅ **Brak możliwości pominięcia pytania** — jest opcja "trudno powiedzieć".
- ✅ **Kolejność flow:** kwestionariusz → kwiatek → notatka (zachęta).
- ✅ **Edytowalność** wpisów z poprzednich dni.
- ✅ **Kwiatek dzienny** na home + **uśredniony** w statystykach.
- ✅ **6 sztywnych płatków** — różnorodność między użytkownikami przez DNA wizualne.
- ✅ **Kolor płatka** zmienia się od odpowiedzi.
- ✅ **Unikalne DNA wizualne** seedowane z user ID.
- ✅ **Mobile-only** (React Native / Expo).
- ✅ **Kalendarz:** tydzień bieżący + nawigacja do poprzednich, miniatury kwiatków w komórkach.
- ✅ **Ogród** — historyczna galeria kwiatków.
- ✅ **Bez rejestracji** w MVP — start lokalny, imię w onboardingu.
- ✅ **Bez eksportu danych** w MVP.
- ✅ **AI = future feature** — analityk, nie czat. W MVP powitanie statyczne/heurystyczne.

## 10. Otwarte pytania (do dalszego doprecyzowania)

1. **Etykiety skali 1–5** — czy *bardzo źle / źle / średnio / dobrze / super* dla każdej osi pasuje, czy każda oś ma własne etykiety (np. dla "Ciała" → *boli / słabo / ok / dobrze / pełnia*)?
2. **Mapping kolorów ↔ odpowiedzi** — czy chcemy uniwersalny system (1 = chłodny/szary, 5 = ciepły/żywy), czy każda oś ma własną paletę?
3. **Powitanie statyczne w MVP** — jeden tekst? Rotacyjny zestaw? Zależny od pory dnia?
4. **Notyfikacje** — przypomnienie wieczorem o wypełnieniu kwiatka? (Sugestia: tak, w MVP.)
5. **Język** — PL only na start?
6. **Animacja kwitnięcia** — jaki styl: delikatna, organiczna, magiczna z particlami?

---

## 11. Roadmap

**Faza 0 — Discovery i design (1–2 tyg.)**
Etykiety osi, system kolorów, prototyp generatora DNA kwiatka, design system.

**Faza 1 — MVP (6–8 tyg.)**
Onboarding (imię), kwestionariusz 6 pytań, kwiatek dnia, notatka, kalendarz tygodniowy z miniaturami, edycja wpisów.

**Faza 2 — Statystyki + Ogród (3–4 tyg.)**
Widoki tyg./mies./kw./roczne, super-kwiatki, ogród.

**Faza 3 — AI (3–4 tyg.)**
Integracja Claude API: powitanie dynamiczne, podsumowania okresowe, analiza emocji/tematów z notatek. Wprowadzenie konta + sync chmurowy.

---

## 12. Metryki sukcesu (jako projekt portfolio)

- Spójność wizualna i polish — kwiatek wygląda "wow".
- Płynność animacji i flow użytkownika.
- Pełna ścieżka MVP działająca end-to-end na realnym urządzeniu.
- Demonstracja unikalności DNA — kilka kwiatków obok siebie wyraźnie się różni.
