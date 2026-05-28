# CLAUDE.md — Daily Bloom

> Plik automatycznie ładowany do kontekstu w każdej sesji Claude Code w tym katalogu. Trzyma najważniejsze fakty o projekcie — szczegóły w `SESSION_HANDOFF.md`, `PRD.md`, `FLOWER_DNA.md`.

## O projekcie

**Daily Bloom** — mobilna aplikacja-dzienniczek łącząca journaling z wizualizacją danych. Codzienny krótki kwestionariusz (6 osi + 2 tagi) generuje unikalny **kwiatek dnia**, w którym każdy element wizualny koduje konkretną zmienną (inspiracja: Federica Fragapane). Notatka tekstowa jako uzupełnienie. Statystyki tyg./mies./kw./roczne + galeria "Ogród".

- **Status:** projekt portfolio.
- **Target:** iOS App Store (główny) + web demo na Vercel (jeden kodebase).
- **Stack:** Expo + Expo Router, TypeScript, NativeWind, react-native-reusables (shadcn dla RN), Skia (wizualizacja kwiatka), Reanimated.
- **Storage MVP:** lokalny (expo-sqlite / IndexedDB). Bez konta, bez rejestracji.

## Jak pracujemy

- Język rozmów: **polski**.
- Iteracyjnie — kolejne wątki dopracowujemy krok po kroku.
- Lubię konkretne propozycje z rekomendacją + uzasadnieniem ("zrób tak jak uważasz").
- Estetyka: organiczna, akwarelowa, neutralna, ciepła. Duża antykwa, dużo whitespace, kremowe tła z noise, **bez kolorowych ekranów**.
- Wrażliwa na wykluczające sformułowania (z tego powodu wyrzuciliśmy oś "Relacje" — niektórzy pracują zdalnie, są samotni; nie chcemy negatywnych skojarzeń).
- Referencje wizualne: studio **Josh** (typografia, UI), **Federica Fragapane** (data-viz w organicznej formie), watercolor flowers.

## Najważniejsze decyzje (lock)

- **6 osi kwestionariusza:** Dzień, Emocje, Energia, Ciało, Zachwyt, Sens — każda = jeden płatek, skala 1–5.
- **2 tagi tak/nie:** Coś dobrego, Coś trudnego (opcjonalne 1 zdanie).
- **Flow:** kwestionariusz → animacja kwitnięcia → kwiatek → ekran notatki z zachętą.
- **Kwiatek dzienny** na home + **uśredniony** w statystykach. **Ogród** = historyczna galeria.
- **AI = future feature** (analityk, nie chat). W MVP powitanie statyczne.
- **DNA kwiatka** deterministyczne z user_id — każdy użytkownik ma rozpoznawalnie inny kwiatek, nawet przy identycznych odpowiedziach. Pełny mapping w `FLOWER_DNA.md`.

## Następne kroki

Patrz sekcja "Następne kroki sugerowane" w `SESSION_HANDOFF.md`. Najbliższe kandydaty:
1. Projekt UI ekranów (onboarding, kwestionariusz, home).
2. Prototyp kwiatka (DNA + render Skia).
3. Projekt palet (~40 sztuk artystycznych).

## Gdzie szukać szczegółów

| Plik | Co zawiera |
|---|---|
| `PRD.md` | Pełne wymagania produktu, user stories, flow, stack, roadmap. |
| `FLOWER_DNA.md` | System wizualizacji kwiatka — DNA użytkownika, mapping danych na elementy wizualne, render pipeline, pseudokod. |
| `SESSION_HANDOFF.md` | Skompresowane podsumowanie pierwszej sesji + finalny kwestionariusz z mikrocopy + otwarte pytania. |
