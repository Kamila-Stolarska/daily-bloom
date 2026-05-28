# Flower DNA — system wizualizacji kwiatka

> Specyfikacja techniczno-designerska: jak z danych użytkownika powstaje unikalny, codzienny kwiatek-wizualizacja.
>
> Inspiracja: **Federica Fragapane** — każdy element wizualny koduje zmienną. Kwiatek to wykres, nie dekoracja.

---

## 1. Dwa źródła sygnału

Kwiatek powstaje z **dwóch warstw danych**:

### A. **DNA użytkownika** (stałe w czasie)
Tożsamość wizualna — to, co sprawia, że "twój kwiatek" zawsze rozpoznasz, nawet po roku.
- Wyprowadzone deterministycznie z `user_id` (seed).
- **Stałe na zawsze** dla danego użytkownika.
- Określa: paletę bazową, archetyp kształtu płatka, krzywiznę, teksturę.

### B. **Dane dnia** (zmienne dziennie)
8 zmiennych z kwestionariusza, które animują tożsamość w danym dniu.
- 6 skal 1–5 (osie well-beingu).
- 2 tagi tak/nie (pozytywne / trudne wydarzenie).
- + metadane: data, długość notatki, godzina wypełnienia.

---

## 2. Generowanie DNA użytkownika (warstwa A)

### Seed
```
seed = hash(user_id)   // np. SHA-256 → liczba całkowita
```
Wszystkie poniższe cechy są pochodnymi `seed` przez deterministyczny PRNG (np. `mulberry32(seed)`).

### Cechy wyprowadzane z seeda

| Cecha | Zakres / wybór | Opis |
|---|---|---|
| **Paleta bazowa** | 1 z ~40 starannie zaprojektowanych palet | Każda paleta = 6 kolorów (po jednym dla każdej osi) + kolor tła/akcent |
| **Archetyp płatka** | 1 z ~8 kształtów | Np. *kropla, owal, łopatka, romb, fala, kolec, serce, łuk* |
| **Krzywizna** | wartość 0.2–1.0 | Jak bardzo "miękkie" są krawędzie płatka |
| **Asymetria** | 0–0.3 | Lekka, organiczna nieregularność (różne strony płatka) |
| **Tekstura/noise** | 1 z 4 wariantów | *Akwarela, pastel, gęsty grain, miękka mgła* |
| **Rytm rotacji** | 0°–60° | Czy płatki wystają idealnie co 60°, czy z lekkim przesunięciem |
| **Środek (pestil)** | 1 z 6 form | *Kropka, gwiazda, koło z otoczką, mandala, punkt z aurą, drobne kreski* |

### Założenie
40 palet × 8 kształtów × 4 tekstury × 6 środków × wariacje ciągłe = **dziesiątki tysięcy rozróżnialnych "tożsamości"**. Kolizji wizualnych praktycznie nie ma.

> **Zasada:** dwa kwiatki różnych użytkowników muszą być rozpoznawalnie różne nawet przy identycznych odpowiedziach z kwestionariusza.

---

## 3. Mapowanie danych dnia → wizualizacja (warstwa B)

Każda zmienna ma **dedykowany element wizualny**. To jest kontrakt data-viz produktu.

### Pełny mapping

| # | Zmienna | Typ | Element wizualny | Zachowanie |
|---|---|---|---|---|
| 1 | **Dzień** (ocena ogólna) | 1–5 | **Globalny rozmiar kwiatka** | 1 = mały, zwinięty; 5 = pełny rozkwit |
| 2 | **Emocje** | 1–5 | **Saturacja palety** | 1 = przygaszone, monochromatyczne; 5 = pełna nasycenie |
| 3 | **Energia** | 1–5 | **Długość płatka "Energia"** | Liniowo 0.3 → 1.0 promienia bazowego |
| 4 | **Ciało** | 1–5 | **Długość płatka "Ciało"** | jw. |
| 5 | **Zachwyt** (glimmers) | 1–5 | **Długość płatka "Zachwyt"** | jw. |
| 6 | **Sens** | 1–5 | **Długość płatka "Sens"** | jw. |
| 7 | **Coś dobrego** | tak/nie | **Delikatny złoty kontur / aura** wokół kwiatka | Tak = subtelny glow; Nie = brak |
| 8 | **Coś trudnego** | tak/nie | **Cień / pęknięcie / ciemny ślad** na jednym płatku | Tak = wyrazisty ślad; Nie = brak |

### Dodatkowe meta-zmienne (automatyczne)

| Zmienna | Element wizualny |
|---|---|
| **Długość notatki** | Liczba/intensywność drobnych kropek-ornamentów wokół środka |
| **Godzina wypełnienia** | Lekki "kierunek światła" w gradientach (rano = ciepłe góra-lewo, wieczór = chłodne dół-prawo) |
| **Dzień tygodnia** | Mikro-akcent na obwodzie (subtelna kreska w jednym z 7 miejsc) |
| **Pora roku** | Bardzo delikatny dryf palety (future feature) |

### Uwaga o 6 płatkach
- Tylko 4 z 6 osi (Energia, Ciało, Relacje, Sens) sterują **długością płatków** indywidualnie.
- Osie **Dzień** i **Emocje** są "globalne" — modyfikują cały kwiatek (rozmiar i saturację). To celowy zabieg, żeby pokazać, że ocena ogólna i nastrój przenikają wszystko.
- **Kwiatek ma mimo to 6 płatków** — każdy odpowiada jednej osi w legendzie. Płatki "Dzień" i "Emocje" mają długość = średnia z pozostałych 4 (więc nie są martwe, tylko zbalansowane).

> **Alternatywa do dyskusji:** wszystkie 6 osi sterują długością płatków indywidualnie, a "Dzień" i "Emocje" są dodatkowymi globalnymi modyfikatorami zakodowanymi inaczej (np. tło, otoczka). Do uzgodnienia w fazie designu.

---

## 4. Legenda — "Jak czytać swój kwiatek"

Osobny ekran w aplikacji, dostępny z home i ze statystyk. Pokazuje:

- Schemat kwiatka z opisem każdego elementu.
- "Twoje DNA" — paleta, kształt, tekstura przypisane do użytkownika.
- Mini-galeria: "ten sam dzień z różnymi odpowiedziami" — żeby pokazać, jak dane zmieniają wizualizację.

Bez tej legendy produkt traci swój sens — Federica zawsze daje klucz do odczytu.

---

## 5. Render — warstwy graficzne

Kolejność rysowania (od dołu do góry):

1. **Tło** — kremowy papier + globalny noise overlay.
2. **Aura "coś dobrego"** (jeśli tak) — miękki, świetlisty halo poza kwiatkiem.
3. **Płatki** — 6 sztuk, ułożone wg `rytmu rotacji` z DNA:
   - Bazowy kształt z archetypu DNA.
   - Skalowanie wg długości (dane dnia).
   - Wypełnienie: gradient z palety DNA, saturacja modulowana przez **Emocje**.
   - Tekstura DNA jako overlay.
4. **Ślad "coś trudnego"** (jeśli tak) — ciemna smuga / mikro-pęknięcie na losowo wybranym płatku (deterministycznie z daty — żeby się nie zmieniał między rerenderami tego samego dnia).
5. **Środek (pestil)** — forma z DNA.
6. **Ornamenty** — kropki wokół środka, ilość ∝ długość notatki.
7. **Mikro-akcent dnia tygodnia** — na obwodzie.

### Technologia
- **iOS:** `@shopify/react-native-skia` — gradient mesh, ImageFilter (blur, noise), maski.
- **Web:** Skia CanvasKit fallback lub czysty SVG + `feTurbulence` dla noise.

---

## 6. Pseudokod (high-level)

```ts
function renderFlower(userId: string, dayData: DayData): Canvas {
  const dna = deriveDNA(userId);              // warstwa A — stała
  const ctx = createCanvas();

  drawBackground(ctx, dna.texture);
  if (dayData.somethingGood) drawAura(ctx, dna.palette);

  const globalSize = mapScale(dayData.day);          // 1–5 → rozmiar
  const saturation = mapScale(dayData.emotions);     // 1–5 → saturacja

  for (const axis of ['energy', 'body', 'delight', 'meaning']) {
    drawPetal(ctx, {
      shape: dna.petalArchetype,
      curvature: dna.curvature,
      rotation: axisAngle(axis, dna.rotationRhythm),
      length: mapScale(dayData[axis]) * globalSize,
      color: dna.palette[axis],
      saturation,
      texture: dna.texture,
    });
  }
  drawPetal(ctx, axis='day', length=avg(...) );        // płatki globalne
  drawPetal(ctx, axis='emotions', length=avg(...) );

  if (dayData.somethingHard) drawCrack(ctx, deterministicPetalIndex(dayData.date));

  drawPestil(ctx, dna.pestilForm);
  drawOrnaments(ctx, count = noteLength(dayData.note));
  drawWeekdayMark(ctx, dayData.date.getDay());

  return ctx;
}
```

---

## 7. Statystyki: kwiatek tygodniowy / miesięczny

- "Super-kwiatek" = ten sam pipeline, ale `dayData` jest **uśrednione** z okresu.
- **Saturacja** w super-kwiatku = wariancja emocji w tygodniu (stabilny tydzień = nasycony, chaotyczny = blakły) — alternatywne kodowanie do dyskusji.
- Wokół super-kwiatka **mini-procenty per oś** (jak w referencji "kwiatka sałatkowego"), pokazujące średni udział danej osi w samopoczuciu.

---

## 8. Otwarte pytania do designu

1. **Mapping 6 osi na płatki** — czy 4+2 (jak wyżej), czy wszystkie 6 osi to indywidualne płatki? Trzeba zdecydować w fazie prototypu.
2. **Liczba palet** — 40 wystarczy? Czy lepiej generować ciągłe palety algorytmicznie (więcej różnorodności, mniej kontroli artystycznej)?
3. **Tagi tak/nie** — czy złoty kontur / pęknięcie są wystarczająco czytelne, czy potrzebujemy ikon w legendzie?
4. **Animacja kwitnięcia** — od pąka, czy od środka? Czas trwania (~2s)?
5. **Czy kwiatek może być asymetryczny "dramatycznie"** (np. jeden płatek na 5, pozostałe na 1) bez wyglądania na "zepsuty"? Trzeba przetestować skrajne przypadki.

---

## 9. Następne kroki

1. **Prototyp w Figmie** — 5–6 wariantów DNA × 3 warianty dnia (skrajne odpowiedzi).
2. **Eksperyment z Skia** — proof of concept renderowania jednego kwiatka z gradientem i noise.
3. **Decyzja: 4+2 czy 6 niezależnych płatków**.
4. **Projekt palet** (~40 sztuk) — wspólnie z designem / na podstawie referencji Federici i akwarel.
