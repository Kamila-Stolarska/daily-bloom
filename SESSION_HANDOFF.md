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

## Stan implementacji (po sesji 5 — 2026-05-29)

### Co dorzucone w sesji 5
- **Home responsywny + reorganizacja przestrzeni.** `useWindowDimensions` + `onLayout` na kontenerze kwiatka. Skale `tight` (h<720) / `roomy` (h>880): headline 34/42/48px, paddingi 20/28/32, marginesy heroGap/ctaGap. Kwiatek wypełnia 98% min(w,h) dostępnego środka, cap 640px. Zweryfikowane na 375×667, 430×932, 768×1024.
- **Klikalny kalendarz + selectedDate.** Stan `selectedDate` (default today). Klik dnia → cały widok (subtitle, kwiatek, data label "Piątek, 29 Maja") reaguje. Kalendarz pokazuje numery dni (25-31), wybrany w czarnym kółku, marker pod kółkiem dla wpisów/notatek. Polski formatter `WEEKDAY_FULL_PL` + `MONTHS_PL`.
- **Klik na kwiatek → edycja wpisu.** Pressable wokół `FlowerLazy` → `router.push({ pathname: '/entry', params: { date: selectedDate } })`. `entry.tsx` przyjmuje `?date=` przez `useLocalSearchParams`, hydratuje draft z `entries[targetDate]` jeśli istnieje (raz, przez `draftHydrated` guard), `saveEntry` zapisuje pod `targetDate` zamiast `todayIso()`. Analogicznie `/note?date=`.
- **Usunięty pill "edytuj dzień" i okrągły "+".** Zamiast tego jeden czarny CTA "dodaj notatkę" centrowany pod kwiatkiem (`bg-ink`, `paddingHorizontal: 28`, `paddingVertical: 16`, `minWidth: 220`).
- **Kwiatek czysty bez grain i blur.** `OrganicFlower` prop `grain?: boolean` (default `false`). Wcześniej Turbulence (multiply 0.32) + `BlurMask blur=2.2` dawały "rozmyty smutny" wygląd. Teraz tylko gradient per płatek + opacity 0.85 (przenikanie nakładających się płatków). Lab może wciąż przekazać `grain={true}`.
- **Krok NOTE w kwestionariuszu = wzorzec `/note`.** Topbar `← NOTATKI [zapisz|pomiń]`, composer w kremowym pudełku `#FBFAF1` z PaperLines (linie zeszytu), `autoFocus`, dynamiczna wysokość przez `onContentSizeChange`. Wyrzucony flower thumbnail, eyebrow "DZIENNIK", headline z `NOTE_PROMPTS` — prompt jest teraz `placeholder` w composerze. Brak dolnego pilla. Pomocnik `PaperLines` zduplikowany w entry.tsx (mała kopia z note.tsx).
- **Font: Fraunces → Libre Bodoni.** `@expo-google-fonts/libre-bodoni` (wagi 400/500/600/700 + italic 400). Te same klasy `font-serif`, `font-serif-medium/semibold/bold/italic` — tylko mapping w tailwind.config.js. Pakiet `@expo-google-fonts/fraunces` odinstalowany. Wymaga restartu Metro po zmianie tailwind config.
- **Falka pod kwiatkiem usunięta** (była organic separator).

### Otwarte
1. **Tiptap** (`@10play/tentap-editor`) jako edytor markdown w `/note` i note-step. Cross-platform przez WebView na iOS, natywny Tiptap na web. Dziś plain TextInput.
2. **Animacja kwitnięcia** — wciąż instant.
3. **Mini-kwiatki w pasku tygodnia** — zamiast markerów-kropek.
4. **iOS test** — wciąż tylko web.
5. **Nawigacja tygodniami** — kalendarz pokazuje tylko bieżący tydzień. Strzałki ← / → do poprzednich tygodni.
6. **PaperLines duplicate** — `PaperLines` jest skopiowany w `note.tsx` i `entry.tsx`. Wydzielić do `src/components/PaperLines.tsx`.

## Stan implementacji (po sesji 4 — 2026-05-29)

### Co dorzucone w sesji 4
- **Skrócony kwestionariusz:** 6 osi, **bez 2 tagów** (`somethingGood/somethingHard` zostają w `Entry` jako `false`, dawne TAG_QUESTIONS niewywoływane). **Auto-advance** po wybraniu odpowiedzi — przycisk "dalej" usunięty. Onboarding po imieniu kieruje od razu do `/entry`, nie do `/`.
- **Notatki jako osobny byt:** nowy slice `notesByDate: Record<string, Note[]>` w store. `Note = { id, text, createdAtIso }`. Akcje: `addNote(dateIso, text)`, `deleteNote(dateIso, id)`. `Entry.note` usunięte z typu. Migracja w `hydrate()` przenosi stare `entry.note` jako pierwszą `Note` na danej dacie. `entryToDayData(e, noteLen)` przyjmuje teraz długość notatek jako drugi argument (suma długości tekstu wszystkich notatek z dnia via `notesLength()`).
- **Nowy ekran `/note`** (`src/app/note.tsx`): composer + lista poprzednich notatek z dziś. "Paper feel" — kremowe tło `#FBFAF1`, subtelne linie zeszytu (SVG `<Line>` co `LINE_HEIGHT=32px`, opacity 0.18), antykwa Fraunces, autofocus. Wiele notatek dziennie. Działa niezależnie od kwestionariusza — można dodać notatkę nawet bez wpisu. "zapisz" w prawym górnym, każda notatka ma godzinę `HH:MM` i "usuń". `outlineStyle: 'none'` na input żeby ubić web focus border.
- **Home compact pod iPhone 16 Pro Max (430×932) — bez scrolla.** `ScrollView` → `View flex-1`. Display headline 40px (zamiast 52), kwiatek 240px (zamiast 300), pasek tygodnia kompakt (7px kropki), kółka 28×28 zamiast 36×36. **Dwa CTA obok siebie:** pill "edytuj dzień"/"zapisz dzień" + okrągły outline "+" 56×56 → `/note`. Subtytuł reaguje na (wpis × notatki): np. "1 notatka dziś. Kwiatek czeka." vs "Dzień zapisany. 2 notatki dziś."
- **Hydration guard** w `/note` i `/entry`. Bug: na hard nav `addNote` wywoływane przed `hydrate()` resetowało `name`/`userId` w persisted. Teraz oba ekrany triggerują `hydrate()` w `useEffect` i renderują puste `SafeAreaView` dopóki `!hydrated`.
- **Deploy Vercel:** `vercel.json` + `vercel-build` script (`expo export -p web` + kopia `canvaskit.wasm` do `dist/`). Rewrite `/(.*)` → `/index.html` dla client routingu Expo Routera. Vercel blokował pierwszy deploy bo `git config user.email = "kamila@local"` nie pasował do GitHuba — ustawione na `kamila0212@gmail.com`, działa: https://daily-bloom-self.vercel.app/.

### Otwarte
1. **Tiptap (jutro):** `@10play/tentap-editor` jako edytor markdown w `/note` i w note-step kwestionariusza. Cross-platform przez WebView na iOS, natywny Tiptap na web. Dziś plain TextInput jako placeholder.
2. **Animacja kwitnięcia** — dziś instant (z sesji 3, nieruszone).
3. **Mini-kwiatki w pasku tygodnia** — dziś kropki: czarna 3.5px = wpis, szara 1.5px = sama notatka bez wpisu, mała szara = nic. Powinny być realne mini-kwiatki Skia.
4. **iOS test** — wciąż tylko web.

## Stan implementacji (po sesji 3 — 2026-05-28)

### Faza 0 — fundament — ✅ ZROBIONE
- Expo SDK 56 + Expo Router (TS, struktura `src/app/`)
- NativeWind 4 + Tailwind 3 z design tokens
- Fonty: Fraunces 400/500/600/**700** + italic, Inter 400/500/**600** (`@expo-google-fonts/*`)
- Skia, moti, reanimated, expo-sqlite, expo-crypto, react-native-svg

### Faza 1 — prototyp kwiatka — ✅ ZROBIONE (z lockiem na 1 paletę)
- `src/lib/flower/dna.ts` — cyrb53 + mulberry32, DNA z userId
- **MVP lock:** `paletteIndex = 0` (Akwarela). Pozostałe 5 palet w `palettes.ts` istnieje, ale są "szkicowe" (monochromatyczne). Wrócimy do losowania DNA gdy zaprojektujemy ~40 palet poziomu Akwareli.
- `src/lib/flower/organic.ts` — `organicPetalPath()` jako teardrop z 1 łukiem per strona + jitter (poprzednia wersja z 4 CP i "garbami" się nie sprawdziła — wyglądała jak lobed lazy snowflake, wróciliśmy do prostego kropelkowatego płatka).
- `src/components/OrganicFlower.tsx` — render dwuwarstwowy: gradient + BlurMask (krwawiące krawędzie), potem Turbulence × multiply z opacity 0.32 **wewnątrz tych samych ścieżek** (grain widoczny tylko na obszarze kwiatka, nie na tle).
- `src/components/FlowerLazy.tsx` — wrapper z lazy-load Skia (na web `LoadSkiaWeb({ locateFile: '/canvaskit.wasm' })` przed importem `OrganicFlower`; Skia.web.js robi `JsiSkApi(global.CanvasKit)` przy imporcie i bez wcześniejszego wasm jest broken).

### Faza 2 — używalna aplikacja — ✅ ZROBIONE
- **Storage:** `src/lib/store.ts` — zustand + `@react-native-async-storage/async-storage` (na web mapuje na `localStorage`, klucz `daily-bloom:v1`). Trzyma `name`, `userId`, `entries: Record<dateIso, Entry>`. `hydrate()`, `setName()`, `saveEntry()`, `setNote()`.
- **Onboarding** (`/onboarding`) — pyta o imię, jednorazowo. Gating w `index.tsx` przez `useEffect(() => router.replace('/onboarding'))` jeśli `!name` po hydracji.
- **Home** (`/`) — wg szkicu Kamili: top "DAILY — BLOOM" + kropka, headline powitania zależny od pory dnia, separator, kwiatek dnia (lub placeholder "jeszcze nie zakwitł" w okręgu), falka, pill CTA, pasek tygodnia (pn–nd, dzisiaj obrysem, dni z wpisem mają kropkę).
- **Kwestionariusz** (`/entry`) — jeden route z wewnętrzną maszyną stanu `Step`: 6 osi → 2 tagi (8/8) → bloom → note. 6 osi i 2 tagi z `src/lib/questions.ts` (mikrocopy zgodne z SESSION_HANDOFF). Po kroku 8 (zakwitnij) wpis zapisany do store, kwiatek wybloomowany, potem ekran notatki pełnoekranowy (Fraunces, dużo whitespace, "pomiń" jako dyskretny link). Po `finishNote()` → `router.replace('/')`.
- **DayData → kwiatek:** `entryToDayData()` w store.

### Faza 3 — UI primitives + typografia "studio Josh" — ✅ ZROBIONE
- **Tło:** `#F6F6EA` (poprzednie `#F5EFE4` było zbyt brzoskwiniowe).
- **Typografia:** wywaliliśmy italic Fraunces z body — to on dawał "retro" feel. Headline: Fraunces 700 z tracking -0.02em, leading ≈ 0.95. Body: Inter 400/500. Eyebrow labels: Inter 500 tracked 2px UPPERCASE.
- **react-native-reusables stack** (port shadcn na RN): `class-variance-authority`, `clsx`, `tailwind-merge`, `@rn-primitives/slot`, `@rn-primitives/types`.
- `src/lib/utils.ts` — `cn()` (twMerge + clsx).
- `src/components/ui/text.tsx` — `<Text variant="display|h1|h2|h3|body|bodyMedium|eyebrow|caption|mono" tone="ink|muted|paper|paper-muted">` z cva + tabelą `variantStyle` na fontSize/lineHeight/letterSpacing.
- `src/components/ui/button.tsx` — `<Button variant="pill|solid|ghost|link">` z cva + opcjonalnym `asChild` przez Slot. Wariant `pill` = czarny pill + label po lewej + arrow w okrągłym jasnym chipie po prawej (jak Josh).
- Wszystkie 3 ekrany (`index.tsx`, `entry.tsx`, `onboarding.tsx`) przebudowane na `<Text variant=...>` + `<Button variant=...>`.

### Strona laboratoryjna (`/lab`)
- Zostaje. Wcześniejsza siatka DNA × dni — używana do iterowania kwiatka. Teraz `LabContent.tsx` pokazuje **jeden** kwiatek 420×420 (Akwarela, max odpowiedzi). Otwierane przez `/lab` (nie ma linka z UI).

## Następne kroki sugerowane

1. **Animacja kwitnięcia** — dziś natychmiastowa. Reanimated/Moti: fade + scale + lekka rotacja per płatek, ~1.2s.
2. **Edycja istniejącego wpisu** — `/entry` zawsze startuje od pustego draftu i nadpisuje. Powinno hydratować `draft` z `entries[today]` jeśli istnieje.
3. **Mini-kwiatki w pasku tygodnia** — dziś tylko czarne kropki dla dni z wpisem. Powinny być małe (≈28px) renderowane kwiatki z DayData danego dnia. Uwaga na wydajność Skia × 7.
4. **Test na iOS** (TestFlight) — cały flow do tej pory walidowany tylko na web.
5. **Palety:** zaprojektować ~40 palet poziomu Akwareli (ref. Federica Fragapane + akwarele). Dopiero potem odblokować losowanie w DNA.
6. **Ogród / Statystyki** — z PRD, dopiero gdy MVP flow stabilny.

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

> *"Kontynuujemy projekt Daily Bloom. Cały kontekst jest w `Desktop/Daily-Bloom/SESSION_HANDOFF.md`, `PRD.md`, `FLOWER_DNA.md`. Przeczytaj sekcję 'Stan implementacji (po sesji 3)' i 'Następne kroki sugerowane'. Aplikacja jest już używalna — flow onboarding → home → kwestionariusz → kwiatek → notatka działa. Kolejny krok dobierzemy z listy."*
