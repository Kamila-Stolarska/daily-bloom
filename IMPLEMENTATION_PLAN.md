# Daily Bloom — Implementation Plan

> Plan wdrożenia MVP. Faza 0–1 jest krytyczna i robimy ją przed resztą UI, bo prototyp kwiatka odblokowuje wszystkie kolejne decyzje wizualne.

---

## Faza 0 — Fundament techniczny (1–2 dni)

1. `create-expo-app` z TypeScript + Expo Router.
2. Instalacja: NativeWind, react-native-reusables, fonty (Fraunces + Inter przez `expo-font`), `@shopify/react-native-skia`, Reanimated, Moti.
3. Design tokens w Tailwind config: kremowy off-white, czerń CTA, skala typo, spacing.
4. Global noise overlay jako reużywalny komponent (paper feel).
5. EAS Build skonfigurowany (iOS) + skrypt `expo export --platform web`.
6. Storage adapter (interfejs) — `expo-sqlite` (iOS) i fallback IndexedDB (web), jedno API.

**Deliverable:** pusty home z logiem, fontem, kremowym tłem. iOS sym + web localhost.

---

## Faza 1 — Prototyp kwiatka w Skia (3–5 dni) ⭐ krytyczne

1. Generator DNA (`lib/flower/dna.ts`): SHA-256(userId) → mulberry32 → cechy z FLOWER_DNA.md.
2. 3–5 ręcznych palet na start (40 zrobimy później).
3. 2–3 archetypy płatka (kropla, owal, łopatka) jako parametryczne ścieżki Skia.
4. Render pipeline: tło → aura → płatki (gradient + noise) → środek → ornamenty → mikro-akcent dnia tygodnia.
5. Ekran-laboratorium (poza nawigacją): siatka 6 DNA × 3 zestawy danych (skrajne min, średnie, skrajne max).
6. **Decyzja: 4+2 vs 6 indywidualnych płatków** na podstawie tego, co zobaczymy.

**Deliverable:** lab-screen z kilkunastoma kwiatkami obok siebie. Review razem.

---

## Faza 2 — Model danych + storage (1 dzień)

- Schema: `users (id, name, createdAt)`, `entries (id, date, day, emotions, energy, body, delight, meaning, somethingGood, somethingGoodNote, somethingHard, somethingHardNote, note, createdAt, updatedAt)`.
- Repo: `getEntry(date)`, `upsertEntry`, `listEntriesInRange`, `getAllEntries`.
- Hook `useEntry(date)`.

---

## Faza 3 — Onboarding + kwestionariusz (3–4 dni)

- Onboarding: 2 ekrany intro + ekran imienia.
- Kwestionariusz: ekran per pytanie, 6 osi + 2 tagi. Skala 1–5 z ekspresyjnymi etykietami z PRD. Progress bar. Brak pomijania.
- Tagi tak/nie + opcjonalne 1 zdanie.

---

## Faza 4 — Animacja kwitnięcia + ekran notatki (2 dni)

- Animacja pąk → rozkwit (Reanimated + Skia, ~2s, organiczna).
- Ekran "twój kwiatek dziś wygląda tak" + pole notatki + CTA.

---

## Faza 5 — Home + kalendarz tygodniowy (2–3 dni)

- Home wg drafta z PRD: logo → powitanie → kwiatek → falka → (+) → kalendarz.
- Powitanie statyczne (kilka rotacyjnych wg pory dnia — do uzgodnienia).
- CTA (+) jeśli dziś bez wpisu / "zobacz wpis" jeśli wypełniony.
- Kalendarz 7 komórek z miniaturami, strzałki, przyszłe wyszarzone.
- Tap → ekran szczegółowy dnia (edycja).

---

## Faza 6 — Legenda "Jak czytać swój kwiatek" (1 dzień)

- Schemat kwiatka z opisem każdego elementu.
- "Twoje DNA" — paleta, kształt, tekstura.
- Mini-galeria "ten sam dzień, różne odpowiedzi".

---

## Faza 7 — Statystyki + Ogród (4–5 dni)

- Widoki tyg./mies./kw./roczne, toggle u góry.
- Trendy 6 osi (linie / heatmapa).
- Super-kwiatek + procenty per oś (viz "sałatkowy").
- Ogród — grid chronologiczny, tap → szczegóły dnia.

---

## Faza 8 — Polish + deploy (2–3 dni)

- Notyfikacja wieczorna (`expo-notifications`).
- Mikro-animacje, transitions.
- 40 palet (iteracyjnie).
- Web build → Vercel.
- EAS Build → TestFlight.

---

## Otwarte pytania (do rozstrzygnięcia w trakcie)

- Mapping kolorów: uniwersalny (1=przygaszony, 5=żywy) z paletą per oś z DNA — domyślna propozycja, walidujemy w Fazie 1.
- 4+2 vs 6 indywidualnych płatków — decyzja po prototypie.
- Powitanie statyczne: rotacyjne wg pory dnia (domyślne).
- Notyfikacje wieczorne: tak.
- Język: PL only na start.
- Animacja kwitnięcia: styl i czas po prototypie Skia.
