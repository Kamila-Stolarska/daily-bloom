# Daily Bloom — Session Handoff

> Skompresowane podsumowanie pierwszej sesji projektowej. Wklej / przeczytaj w nowym czacie, żeby kontynuować pracę bez utraty kontekstu.

---

## TL;DR

**Daily Bloom** — mobilna aplikacja-dzienniczek łącząca **journaling** z **wizualizacją danych** (inspiracja: Federica Fragapane). Codzienny krótki kwestionariusz generuje unikalny **kwiatek dnia** — gdzie każdy element wizualny koduje konkretną zmienną. Notatka tekstowa jako uzupełnienie. Statystyki tyg./mies./kw./roczne + galeria historycznych kwiatków ("Ogród").

Projekt **portfolio**, główny target **iOS App Store**, dodatkowo **web demo na Vercel** (jeden kodebase, Expo).

---

## Dokumenty w projekcie

- `PRD.md` — pełny Product Requirements Document.
- `FLOWER_DNA.md` — system generowania kwiatka (DNA użytkownika + mapping danych dnia na wizualizację).
- `SESSION_HANDOFF.md` — ten plik.

---

## Kluczowe decyzje (lock)

### Produkt
- **6 osi** kwestionariusza + **2 tagi tak/nie** + opcjonalna **notatka**.
- **Flow:** kwestionariusz → animacja kwitnięcia → kwiatek → ekran notatki z zachętą.
- **Edycja** wpisów z poprzednich dni: tak.
- **Kwiatek codziennie** na home + **uśredniony** super-kwiatek tyg./mies./kw./roczny w statystykach.
- **Ogród** — historyczna galeria wszystkich kwiatków.
- **Statystyki**: trendy 6 osi + "kwiatek procentowy" (inspiracja: viz sałatkowy) pokazujący udział % osi w tygodniu.
- **AI = future feature**, nie MVP. AI to **analityk**, nie chat. W MVP powitanie na home jest statyczne.
- **Bez rejestracji** w MVP — start lokalny, imię w onboardingu.
- **Bez eksportu danych** w MVP.

### Kwestionariusz — finalny zestaw

**A. 6 osi skalowanych (1–5)** — każda = jeden płatek kwiatka:

1. **Dzień** — *"Jak dziś było?"*
   `Ciężko / Trudno / Zwyczajnie / Dobrze / Wyjątkowo`

2. **Emocje** — *"Jak się dziś czujesz?"*
   *Mikrocopy: To, co czujesz w środku — niezależnie od tego, jaki był dzień.*
   `Smutno / Słabo / Spokojnie / Dobrze / Radośnie`

3. **Energia** — *"Ile miałaś dziś w sobie energii?"*
   *Mikrocopy: Twój wewnętrzny zasób — do działania, do bycia, do reagowania.*
   `Puste baki / Ledwo ledwo / Wystarczająco / Z zapasem / Buzowała w żyłach`

4. **Ciało** — *"Jak czuło się dziś Twoje ciało?"*
   *Mikrocopy: Sen, oddech, napięcia, ruch — na ile było Ci ze sobą dobrze fizycznie.*
   `Protestowało / Zmęczone / Spokojne / Lekkie / Rozkwitłe`

5. **Zachwyt** — *"Ile drobnych momentów Cię dziś urzekło?"*
   *Mikrocopy: Małe rzeczy, które na chwilę Cię zatrzymały. Na przykład: uśmiechnęłam się, gdy zobaczyłam dziś tęczę. Albo: poczułam zapach kawy i było mi dobrze.*
   `Żadnego / Ledwo jeden / Parę drobnych / Sporo / Cały dzień`
   *Koncept inspirowany glimmers (Deb Dana, teoria poliwagalna) — mikro-momenty aktywujące poczucie bezpieczeństwa.*

6. **Sens** — *"Czy to, co robiłaś dziś, było dla Ciebie ważne?"*
   *Mikrocopy: Coś zgodnego z Tobą — praca nad czymś istotnym, rozmowa, która coś zmieniła, drobna decyzja po swojemu.*
   `Wcale / Ledwo / Trochę / Mocno / W pełni`

**B. 2 tagi tak/nie:**

7. **Coś dobrego** — *"Czy spotkało Cię dziś coś dobrego?"* + opcjonalne 1 zdanie
8. **Coś trudnego** — *"Czy spotkało Cię dziś coś trudnego?"* + opcjonalne 1 zdanie

> Wyrzucona z poprzednich wersji: oś "Relacje" — uznana za wykluczającą (osoby pracujące zdalnie, samotne, bez rodziny). Zastąpiona przez "Zachwyt".

### Design — kierunek wizualny
- **Inspiracja główna:** Federica Fragapane (rygorystyczna data-viz w organicznej formie). Każdy element kwiatka koduje konkretną zmienną.
- **Inspiracja UI:** studio Josh (duża nowoczesna antykwa, neutralne kremowe tła, duże liczby, miękkie przyciski).
- **Kwiatek:** akwarela + noise + gradient, miękkie organiczne krawędzie. Ma wyglądać jakby był malowany ręcznie.
- **Tło:** kremowy off-white, paper feel z subtelnym noise/grain. **Bez kolorowych ekranów.**
- **Typografia:** duża antykwa (Fraunces / PP Editorial / Instrument Serif) na nagłówki i liczby, sans-serif (Inter) na treść.
- **Legenda jest częścią produktu** — osobny ekran "Jak czytać swój kwiatek".

### Stack
- **Expo + Expo Router** + TypeScript — jeden kodebase, output iOS + web.
- **NativeWind** (Tailwind dla RN).
- **react-native-reusables** (port shadcn/ui na RN) — komponenty.
- **@shopify/react-native-skia** — renderowanie kwiatka (na webie: Skia CanvasKit).
- **react-native-reanimated** + Moti — animacje.
- **expo-sqlite** / IndexedDB — storage MVP (offline-first).
- **Deploy:** EAS Build → TestFlight → App Store (iOS), `expo export --platform web` → Vercel.
- **Future:** Supabase (auth, sync) + Claude API (analiza AI).

### Layout home (zgodnie z draftem użytkownika)
1. Nagłówek: logo "Daily Bloom"
2. Powitanie: "Hi [imię]" + krótka notatka (MVP: statyczna; future: AI)
3. Kwiatek dnia (środek, duży)
4. Separator: falka
5. Przycisk (+) — dodaj/edytuj wpis dnia
6. Kalendarz: bieżący tydzień z miniaturkami kwiatków + nawigacja do poprzednich tygodni

---

## System kwiatka (FLOWER_DNA — skrót)

**Dwie warstwy:**

- **A. DNA użytkownika** — deterministyczne z `user_id`. Stałe na zawsze. Określa: paletę (40 zaprojektowanych), archetyp płatka (8), krzywiznę, asymetrię, teksturę (4 warianty), rytm rotacji, formę środka.
- **B. Dane dnia** — 6 skal + 2 tagi + metadane animują tożsamość DNA.

**Mapping danych → wizualizacja:**
- Dzień → globalny rozmiar kwiatka
- Emocje → saturacja palety
- Energia, Ciało, Zachwyt, Sens → długości 4 płatków (płatki "Dzień" i "Emocje" są globalne; długość = średnia)
- Coś dobrego → złota aura wokół kwiatka
- Coś trudnego → cień/pęknięcie na płatku (deterministycznie z daty)
- Długość notatki → ornamenty wokół środka
- Godzina wypełnienia → kierunek światła w gradientach
- Dzień tygodnia → mikro-akcent na obwodzie

**Otwarte do dyskusji:** alternatywa, gdzie wszystkie 6 osi sterują długością płatków, a "Dzień" i "Emocje" są globalnymi modyfikatorami zakodowanymi inaczej (tło, otoczka). Do prototypowania.

---

## Otwarte pytania / następne kroki

### Pytania do rozstrzygnięcia
1. **Mapping 6 osi na płatki:** 4 indywidualne + 2 globalne (jak teraz), czy 6 indywidualnych + globalne modyfikatory osobno? → przetestować w prototypie.
2. **Etykiety skali 1–5** — zaakceptowane (są w PRD i handoff). ✓
3. **Mapping kolorów ↔ odpowiedzi** — uniwersalny system (1=chłodny/przygaszony, 5=żywy) vs. paleta per oś? → do designu.
4. **Powitanie statyczne w MVP** — rotacyjne / zależne od pory dnia / jedno? → do designu.
5. **Notyfikacje** w MVP (wieczorne przypomnienie)? Sugestia: tak.
6. **Język:** PL only na start.
7. **Animacja kwitnięcia** — styl i czas trwania.
8. **Liczba palet DNA** — 40 sztuk artystycznych vs. generator ciągły.

### Następne kroki sugerowane
1. **Prototyp kwiatka w Figmie** — 5–6 wariantów DNA × 3 warianty dnia (skrajne odpowiedzi). Walidacja: czy skrajne kwiatki nie wyglądają na "zepsute".
2. **Projekt palet** (~40) — wspólnie z designem, na bazie referencji Federici + akwarel.
3. **Proof of concept Skia** — wyrenderowanie jednego kwiatka z gradientem, noise, teksturą.
4. **Decyzja: 4+2 czy 6 indywidualnych płatków** po pierwszym prototypie.
5. **Projekt UI screenów** — onboarding, kwestionariusz, home, kalendarz, statystyki, ogród, legenda "Jak czytać swój kwiatek".

---

## Profil użytkowniczki (kontekst do dalszej współpracy)

- Projekt portfolio.
- Język współpracy: polski.
- Estetyka: organiczna, akwarelowa, neutralna, ciepła. Duża antykwa.
- Lubi konkretne propozycje z rekomendacją + uzasadnieniem ("zrób tak jak uważasz").
- Wrażliwa na wykluczające sformułowania (z tego powodu wyrzuciliśmy oś "Relacje").
- Lubi referencje wizualne (Josh, Federica Fragapane).
- Pracujemy iteracyjnie — kolejne wątki dopracowywane krok po kroku.

---

## Stan implementacji (po sesji 2 — 2026-05-28)

### Faza 0 — fundament — ✅ ZROBIONE
- Expo SDK 56 + Expo Router (TS, struktura `src/app/`)
- NativeWind 4 + Tailwind 3 z design tokens (`paper`, `ink`, `accent`, fonty)
- Fonty Fraunces (serif) + Inter (sans) przez `@expo-google-fonts/*`
- Zainstalowane: `@shopify/react-native-skia`, `moti`, `reanimated`, `expo-sqlite`, `expo-crypto`, `react-native-svg`
- Home placeholder: "Daily Bloom" antykwą na kremowym tle `#F5EFE4`
- `app.json`: name="Daily Bloom", slug="daily-bloom", bundleId="com.kamila.dailybloom"
- TypeScript zielony, kod pushnięty na https://github.com/Kamila-Stolarska/daily-bloom
- Pełny plan: `IMPLEMENTATION_PLAN.md`

### Co dalej — Faza 1: prototyp kwiatka w Skia
Patrz `IMPLEMENTATION_PLAN.md` → Faza 1. Punkt startowy:
1. `lib/flower/dna.ts` — SHA-256(userId) → mulberry32 → cechy z `FLOWER_DNA.md`
2. 3–5 ręcznych palet
3. 2–3 archetypy płatka jako parametryczne ścieżki Skia
4. Ekran-laboratorium: siatka kwiatków różne DNA × różne dane dnia
5. Decyzja: 4+2 vs 6 indywidualnych płatków

### Środowisko (UWAGA)
- Node 20.20.2 jest w `~/.nvm/versions/node/v20.20.2/bin` — system ma stary Node 14 pierwszy w PATH. **Każdą komendę npm/npx prependować:**
  ```
  export PATH="/Users/kamilastolarska/.nvm/versions/node/v20.20.2/bin:$PATH" && <cmd>
  ```
- Brak Homebrew i `gh` CLI.
- Git PAT zapisany w macOS Keychain — push działa.
- Dev server: `npm run web` (port 8081) lub `npm run ios`.

## Jak otworzyć nową sesję

W nowym czacie wystarczy napisać np.:

> *"Kontynuujemy projekt Daily Bloom. Cały kontekst jest w `Desktop/Daily-Bloom/SESSION_HANDOFF.md`, `PRD.md`, `FLOWER_DNA.md` i `IMPLEMENTATION_PLAN.md`. Przeczytaj je i ruszamy z Fazą 1 (prototyp kwiatka w Skia)."*
