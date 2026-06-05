---
name: dodaj-wpis-bloom
description: Dodaj wpis do dzienniczka Daily Bloom (6 osi 1-5 + 2 tagi) na podstawie tego co użytkowniczka opowiedziała o swoim dniu. Domyślnie wpis idzie na dziś. Opcjonalnie zapisuje notatkę. Po zapisie weryfikuje, czy wpis trafił do bazy. Wywołuj gdy użytkowniczka prosi o dodanie wpisu, podsumowanie dnia, "zapisz mi to" itp.
---

# Dodaj wpis do Daily Bloom

Skill do dodawania wpisu w dzienniczku Daily Bloom (Supabase) na podstawie rozmowy. Wymaga połączonego **Supabase MCP** (organizacja z projektem `fzlpuzuotdobqhlxtlxl`).

## Kontekst

Daily Bloom ma 6 osi mierzonych w skali **1–5** (1=najgorzej, 5=najlepiej):
- **day** — ogólnie jak dzień
- **emotions** — jak czuła się w środku
- **energy** — ile miała w sobie
- **body** — jak czuło się ciało
- **delight** — drobne momenty zachwytu
- **meaning** — czy to co robiła było ważne

Plus 2 tagi bool:
- **something_good** — spotkało ją coś dobrego
- **something_hard** — spotkało ją coś trudnego

Opcjonalnie: jedna **notatka tekstowa** do dnia.

## Kroki

### 1) Ustal datę i user_id

- Data: domyślnie **dziś** w formacie `YYYY-MM-DD` (strefa lokalna użytkowniczki). Jeśli mówi "wczoraj"/"przedwczoraj"/konkretną datę — użyj jej.
- user_id: znajdź przez Supabase MCP. Email to `kamila0212@gmail.com` (lub zapytaj, jeśli inny):

```sql
SELECT id FROM auth.users WHERE email = 'kamila0212@gmail.com' LIMIT 1;
```

Zapisz wynik jako `{{USER_ID}}`. Jeśli pusto — zatrzymaj się i powiedz że konto nie istnieje.

### 2) Zmapuj rozmowę na 6 osi

Wyciągnij z tego co powiedziała na ten dzień. Mapowanie jakościowe → liczba:

| Sygnał w wypowiedzi | Skala |
|---|---|
| "tragicznie", "padłam", "ledwo żyłam", "okropnie" | **1** |
| "kiepsko", "słabo", "ciężko" | **2** |
| "neutralnie", "tak sobie", "ok, nic specjalnego" | **3** |
| "spoko", "dobrze", "fajnie" | **4** |
| "super", "cudownie", "rewelacja", "najlepszy dzień" | **5** |

Dla każdej osi szukaj konkretnych sygnałów:
- **energy**: zmęczenie / "padłam" → 1-2; "miałam siłę", "rozkręcona" → 4-5
- **body**: ból, gorszy sen → 1-2; "ciało lekkie", "rozciągnęłam się" → 4-5
- **delight**: "wszystko szare" → 1-2; "słońce w oknie", "pies w parku", "uśmiechnęłam się" → 4-5
- **meaning**: "po co to wszystko" → 1-2; "robiłam coś ważnego dla mnie" → 4-5
- **emotions**: lęk, smutek → 1-2; spokój, radość → 4-5
- **day**: ogólny wydźwięk całości

**Jeśli czegoś nie ma w wypowiedzi** → daj **3** (neutralnie) i powiedz że zgadujesz.

**Tagi:**
- something_good: TRUE jeśli wspomniała o czymś konkretnie miłym ("spotkałam Kasię", "kupiłam sobie kwiaty")
- something_hard: TRUE jeśli wspomniała coś trudnego ("pokłóciłam się", "dostałam słabą wiadomość")

### 3) Pokaż propozycję i zapytaj o ok

Zanim cokolwiek zapiszesz, pokaż jej w czytelnej formie co zamierzasz wpisać:

```
Dla 2026-06-05:
  dzień: 4  emocje: 3  energia: 2  ciało: 3  zachwyt: 4  sens: 3
  coś dobrego: tak  coś trudnego: nie
  notatka: "Krótkie podsumowanie tego co mi powiedziała"
```

Zapytaj: **"Zapisać tak, czy coś zmienić?"** Jak da OK lub poprawi — idź dalej.

### 4) Zapisz wpis (UPSERT)

Tabela `entries` ma unique `(user_id, date)` — używaj UPSERT, żeby nadpisać jeśli istnieje.

```sql
INSERT INTO entries (user_id, date, day, emotions, energy, body, delight, meaning, something_good, something_hard)
VALUES ('{{USER_ID}}'::uuid, '{{DATE}}', {{day}}, {{emotions}}, {{energy}}, {{body}}, {{delight}}, {{meaning}}, {{good}}, {{hard}})
ON CONFLICT (user_id, date) DO UPDATE SET
  day = EXCLUDED.day,
  emotions = EXCLUDED.emotions,
  energy = EXCLUDED.energy,
  body = EXCLUDED.body,
  delight = EXCLUDED.delight,
  meaning = EXCLUDED.meaning,
  something_good = EXCLUDED.something_good,
  something_hard = EXCLUDED.something_hard;
```

### 5) (Opcjonalnie) zapisz notatkę

Jeśli zaproponowałaś notatkę i zaakceptowała:

```sql
INSERT INTO notes (user_id, date, text)
VALUES ('{{USER_ID}}'::uuid, '{{DATE}}', '{{notes_text_escaped}}');
```

Pamiętaj o **escape** apostrofów w tekście (`''`).

### 6) Zweryfikuj że wpis jest

Odczytaj z bazy i porównaj z tym co miałaś zapisać:

```sql
SELECT date, day, emotions, energy, body, delight, meaning, something_good, something_hard
FROM entries
WHERE user_id = '{{USER_ID}}'::uuid AND date = '{{DATE}}';
```

Jeśli notatka też była:

```sql
SELECT text, created_at FROM notes
WHERE user_id = '{{USER_ID}}'::uuid AND date = '{{DATE}}'
ORDER BY created_at DESC LIMIT 1;
```

Porównaj wartości z tym, co miało być zapisane. Jeśli wszystko się zgadza:
> ✓ Zapisane na {{DATE}}. Możesz zobaczyć w aplikacji.

Jeśli wartości się nie zgadzają lub query zwraca pustkę — powiedz wprost co się nie udało.

## Czego nie robić

- Nie zapisuj bez potwierdzenia z kroku 3.
- Nie wymyślaj wartości z powietrza — jeśli czegoś brak, dawaj 3 i mów o tym.
- Nie dotykaj innych użytkowników (zawsze `WHERE user_id = '{{USER_ID}}'`).
- Nie modyfikuj tabel `profiles`, `chat_messages` z tego skilla.
