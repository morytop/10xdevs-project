# API Endpoint Implementation Plan: User Preferences (`/api/preferences`)

## 1. Przegląd punktu końcowego

Endpoint **User Preferences** (`/api/preferences`) obsługuje pełny cykl zarządzania preferencjami dietetycznymi użytkownika za pośrednictwem trzech metod HTTP:

- **POST** — Utworzenie preferencji (punkt wejścia do onboardingu). Implementuje walidację danych, sprawdzenie unikalności preferencji (relacja 1:1) oraz logowanie zdarzenia `profile_created` do tabeli `analytics_events`.
- **GET** — Pobranie istniejących preferencji użytkownika. Umożliwia wznowienie onboardingu lub wstępne wypełnienie formularza.
- **PUT** — Częściowa lub pełna aktualizacja preferencji. Waliduje zmiany względem schematu `user_preferences`, zachowując spójność z RLS i logując zdarzenie `profile_updated`.

**Cel ogólny**: Zapewnić autoryzowanemu użytkownikowi możliwość utworzenia, odczytania i aktualizacji swojego profilu preferencji dietetycznych wymaganych do generowania spersonalizowanych planów posiłków.

Wszystkie metody:

- Wymagają autentykacji JWT (`Authorization: Bearer <token>`)
- Korzystają z Supabase (`context.locals`) i serwisów `preferences.service` oraz `analytics.service`
- Zachowują jednolite logowanie zdarzeń, obsługę błędów i zasady bezpieczeństwa (RLS, Zod validation)
- Mapują wyjątki na odpowiednie kody HTTP (400, 401, 404, 409, 500)

---

## 2. Szczegóły żądania

### POST /api/preferences — Utworzenie preferencji

**Metoda HTTP**: `POST`
**Ścieżka**: `/api/preferences`
**Autentykacja**: Wymagana (JWT token w headerze `Authorization`)

#### Parametry wymagane:

- `health_goal` (string enum): Cel zdrowotny użytkownika
  - Wartości: `LOSE_WEIGHT`, `GAIN_WEIGHT`, `MAINTAIN_WEIGHT`, `HEALTHY_EATING`, `BOOST_ENERGY`
- `diet_type` (string enum): Typ diety użytkownika
  - Wartości: `STANDARD`, `VEGETARIAN`, `VEGAN`, `GLUTEN_FREE`
- `activity_level` (integer): Poziom aktywności fizycznej
  - Zakres: od 1 do 5 (1 = siedzący tryb życia, 5 = bardzo aktywny)
  - Musi być liczbą całkowitą

#### Parametry opcjonalne:

- `allergies` (array of strings): Lista alergii użytkownika
  - Maksymalnie 10 pozycji, każdy element to niepusta string
  - Przykład: `["Gluten", "Laktoza", "Orzeszki arachidowe"]`
- `disliked_products` (array of strings): Lista produktów, których użytkownik nie lubi
  - Maksymalnie 20 pozycji, każdy element to niepusta string
  - Przykład: `["Brokuły", "Papryka", "Cebula"]`

#### Request Body — Przykład pełny:

```json
{
  "health_goal": "LOSE_WEIGHT",
  "diet_type": "VEGETARIAN",
  "activity_level": 3,
  "allergies": ["Gluten", "Laktoza"],
  "disliked_products": ["Brokuły", "Papryka", "Cebula"]
}
```

#### Request Body — Minimalny:

```json
{
  "health_goal": "HEALTHY_EATING",
  "diet_type": "STANDARD",
  "activity_level": 2
}
```

---

### GET /api/preferences — Pobranie preferencji

**Metoda HTTP**: `GET`
**Ścieżka**: `/api/preferences`
**Autentykacja**: Wymagana (JWT token w headerze `Authorization`)
**Body**: Brak (ignorowany)

Autoryzowany request bez parametrów w URL. Walidacja obejmuje kontrolę obecności `context.locals.supabase` i potwierdzenie użytkownika przez `supabase.auth.getUser()`.

```
GET /api/preferences
Authorization: Bearer <jwt-token>
```

---

### PUT /api/preferences — Aktualizacja preferencji

**Metoda HTTP**: `PUT`
**Ścieżka**: `/api/preferences`
**Autentykacja**: Wymagana (JWT token w headerze `Authorization`)
**Content-Type**: `application/json`

#### Parametry (wszystkie opcjonalne, ale wymaga się co najmniej jednego):

- `health_goal` (string enum, opcjonalnie): Nowy cel zdrowotny
- `diet_type` (string enum, opcjonalnie): Nowy typ diety
- `activity_level` (integer 1–5, opcjonalnie): Nowy poziom aktywności
- `allergies` (array of strings lub null, opcjonalnie): Nowa lista alergii (null wyczyści)
- `disliked_products` (array of strings lub null, opcjonalnie): Nowa lista nielubanych produktów (null wyczyści)

Wszystkie pola są walidowane względem enumerów i zakresów. Stringi w tablicach są automatycznie trimowane.

#### Request Body — Przykład:

```json
{
  "health_goal": "MAINTAIN_WEIGHT",
  "diet_type": "VEGAN",
  "activity_level": 4,
  "allergies": ["Orzechy", "Soja"],
  "disliked_products": ["Tofu"]
}
```

---

## 3. Wykorzystywane typy

### DTOs z `src/types.ts`

1. **CreateUserPreferencesDTO**

   ```typescript
   type CreateUserPreferencesDTO = Omit<TablesInsert<"user_preferences">, "user_id">;
   ```

   - Używana do walidacji request body dla POST
   - `user_id` automatycznie uzupełniany z JWT tokenu
   - Wszystkie pola odpowiadają tabelce `user_preferences`

2. **UpdateUserPreferencesDTO**

   ```typescript
   type UpdateUserPreferencesDTO = Partial<Omit<TablesInsert<"user_preferences">, "user_id">>;
   ```

   - Używana dla walidacji PUT (częściowa aktualizacja)
   - Wymaga co najmniej jedno pole do zmiany

3. **UserPreferencesDTO**

   ```typescript
   type UserPreferencesDTO = Tables<"user_preferences">;
   ```

   - Używana do zwracania pełnego obiektu preferencji w odpowiedziach GET, PUT, POST

4. **Typy enum**

   ```typescript
   type HealthGoal = Enums<"health_goal_enum">;
   type DietType = Enums<"diet_type_enum">;
   ```

   - Re-exporty enumów z bazy danych
   - Dostępne w `Constants` z `src/db/database.types.ts`

### Zod Validation Schemas

Plik `src/lib/schemas/preferences.schema.ts`:

```typescript
import { z } from "zod";
import { Constants } from "@/db/database.types";

export const CreatePreferencesSchema = z.object({
  health_goal: z.enum(Constants.public.Enums.health_goal_enum, {
    errorMap: () => ({ message: "Pole 'cel zdrowotny' jest wymagane" }),
  }),
  diet_type: z.enum(Constants.public.Enums.diet_type_enum, {
    errorMap: () => ({ message: "Pole 'typ diety' jest wymagane" }),
  }),
  activity_level: z
    .number()
    .int("Poziom aktywności musi być liczbą całkowitą")
    .min(1, "Poziom aktywności musi być od 1 do 5")
    .max(5, "Poziom aktywności musi być od 1 do 5"),
  allergies: z.array(z.string().trim().min(1)).max(10, "Możesz wybrać maksymalnie 10 alergii").optional().nullable(),
  disliked_products: z
    .array(z.string().trim().min(1))
    .max(20, "Możesz dodać maksymalnie 20 produktów nielubanych")
    .optional()
    .nullable(),
});

export const UpdatePreferencesSchema = z
  .object({
    health_goal: z
      .enum(Constants.public.Enums.health_goal_enum, {
        errorMap: () => ({ message: "Nieprawidłowa wartość celu zdrowotnego" }),
      })
      .optional(),
    diet_type: z
      .enum(Constants.public.Enums.diet_type_enum, {
        errorMap: () => ({ message: "Nieprawidłowa wartość typu diety" }),
      })
      .optional(),
    activity_level: z
      .number()
      .int("Poziom aktywności musi być liczbą całkowitą")
      .min(1, "Poziom aktywności musi być od 1 do 5")
      .max(5, "Poziom aktywności musi być od 1 do 5")
      .optional(),
    allergies: z.array(z.string().trim().min(1)).max(10, "Możesz wybrać maksymalnie 10 alergii").optional().nullable(),
    disliked_products: z
      .array(z.string().trim().min(1))
      .max(20, "Możesz dodać maksymalnie 20 produktów nielubanych")
      .optional()
      .nullable(),
  })
  .refine((data) => Object.keys(data).some((key) => data[key] !== undefined), {
    message: "Wymagane co najmniej jedno pole do aktualizacji",
  });

export type CreatePreferencesInput = z.infer<typeof CreatePreferencesSchema>;
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;
```

### Klasy błędów

```typescript
// src/lib/services/preferences.service.ts

export class PreferencesServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PreferencesServiceError";
  }
}

export class ConflictError extends PreferencesServiceError {
  constructor(message: string = "Konflikt przy operacji") {
    super(message);
    this.name = "ConflictError";
  }
}

export class PreferencesNotFoundError extends PreferencesServiceError {
  constructor(message: string = "Nie znaleziono preferencji") {
    super(message);
    this.name = "PreferencesNotFoundError";
  }
}
```

---

## 4. Szczegóły odpowiedzi

### POST /api/preferences

#### Success Response (201 Created)

```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "health_goal": "LOSE_WEIGHT",
  "diet_type": "VEGETARIAN",
  "activity_level": 3,
  "allergies": ["Gluten", "Laktoza"],
  "disliked_products": ["Brokuły", "Papryka", "Cebula"]
}
```

**Kod statusu**: `201 Created`
**Content-Type**: `application/json`

#### Error Responses

| Kod | Scenariusz                                          | Response                                                                                                         |
| --- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 400 | Błęd walidacji (brakuje pola, niepoprawne wartości) | `{ "error": "Validation error", "details": [...] }`                                                              |
| 401 | Brak JWT tokenu lub token niepoprawny               | `{ "error": "Unauthorized", "message": "Musisz być zalogowany, aby wykonać tę akcję" }`                          |
| 409 | Preferencje dla użytkownika już istnieją            | `{ "error": "Conflict", "message": "Preferencje dla tego użytkownika już istnieją. Użyj PUT do aktualizacji." }` |
| 500 | Błąd bazy danych lub nieoczekiwany wyjątek          | `{ "error": "Internal server error", "message": "Nie udało się zapisać preferencji. Spróbuj ponownie." }`        |

---

### GET /api/preferences

#### Success Response (200 OK)

```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "health_goal": "LOSE_WEIGHT",
  "diet_type": "VEGETARIAN",
  "activity_level": 3,
  "allergies": ["Gluten", "Laktoza"],
  "disliked_products": ["Brokuły", "Papryka", "Cebula"]
}
```

**Kod statusu**: `200 OK`
**Content-Type**: `application/json`

#### Error Responses

| Kod | Scenariusz               | Response                                                                                                 |
| --- | ------------------------ | -------------------------------------------------------------------------------------------------------- |
| 401 | Brak autentykacji        | `{ "error": "Unauthorized", "message": "Musisz być zalogowany, aby wykonać tę akcję" }`                  |
| 404 | Preferencje nie istnieją | `{ "error": "Not found", "message": "Nie znaleziono preferencji. Wypełnij formularz onboardingu." }`     |
| 500 | Błąd bazy danych         | `{ "error": "Internal server error", "message": "Nie udało się pobrać preferencji. Spróbuj ponownie." }` |

---

### PUT /api/preferences

#### Success Response (200 OK)

Zwraca zaktualizowany `UserPreferencesDTO` z analogiczną strukturą jak POST. Pola nieobecne w payloadzie pozostają bez zmian.

```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "health_goal": "MAINTAIN_WEIGHT",
  "diet_type": "VEGAN",
  "activity_level": 4,
  "allergies": ["Orzechy", "Soja"],
  "disliked_products": ["Tofu"]
}
```

**Kod statusu**: `200 OK`
**Content-Type**: `application/json`

#### Error Responses

| Kod | Scenariusz                                                    | Response                                                                                                        |
| --- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 400 | Błąd walidacji (brak pól, niepoprawne zakresy, puste stringi) | `{ "error": "Validation error", "details": [...] }`                                                             |
| 401 | Brak autentykacji                                             | `{ "error": "Unauthorized", "message": "Musisz być zalogowany, aby wykonać tę akcję" }`                         |
| 404 | Preferencje nie istnieją                                      | `{ "error": "Not found", "message": "Nie znaleziono preferencji. Wypełnij formularz onboardingu." }`            |
| 500 | Błąd bazy danych lub inne błędy serwera                       | `{ "error": "Internal server error", "message": "Nie udało się zaktualizować preferencji. Spróbuj ponownie." }` |

---

## 5. Przepływ danych

### POST /api/preferences — Szczegółowy przepływ

```
┌─────────────────────────────────────────────────────────────────┐
│                       CLIENT (Frontend)                          │
│                    Astro + React Components                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ POST /api/preferences
                       │ + JWT token (Authorization header)
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│              API Endpoint Handler (POST)                          │
│         src/pages/api/preferences.ts                             │
│                                                                  │
│  1. Verify authentication (extract JWT from context.locals)     │
│  2. Parse request body (JSON)                                   │
│  3. Validate using CreatePreferencesSchema (Zod)                │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       │ Valid data + user_id from JWT
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│         Service Layer (Business Logic)                           │
│      src/lib/services/preferences.service.ts                     │
│                                                                  │
│  createPreferences(userId, data):                               │
│  1. Check if preferences already exist (select user_id)         │
│     - If exists: throw ConflictError (→ 409)                    │
│  2. Insert new preferences                                      │
│  3. Return created preferences object                           │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       │ Preferences created successfully
                       │
                       ├─────────────────────────────────────────┐
                       │                                         │
                       ▼                                         ▼
         ┌──────────────────────────────┐     ┌─────────────────────────────┐
         │  Return 201 Created Response │     │  Log Analytics Event (async) │
         │                              │     │                             │
         │  - Status: 201              │     │  Action: profile_created    │
         │  - Body: UserPreferencesDTO │     │  User ID: from JWT          │
         │  - Content-Type: JSON       │     │  Timestamp: now()           │
         └──────────────────────────────┘     │  Metadata: null             │
                       │                       │                             │
                       │                       │  (Non-blocking,             │
                       │                       │   errors ignored)           │
                       │                       │                             │
                       │                       └─────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    CLIENT (Frontend)                             │
│              Receives 201 with preferences data                  │
│                 User is redirected to next step                  │
└──────────────────────────────────────────────────────────────────┘
```

### GET /api/preferences — Przepływ

1. **Middleware** zapewnia Supabase w `context.locals`
2. **Handler** pobiera użytkownika (`supabase.auth.getUser()`)
3. **Service** wykonuje `select('*').eq('user_id', userId).maybeSingle()`
4. **Brak rekordu** → zwraca `PreferencesNotFoundError` → odpowiedź 404
5. **Rekord istnieje** → zwraca dane → odpowiedź 200

### PUT /api/preferences — Przepływ

1. **Handler** waliduje body przez `UpdatePreferencesSchema`
2. **Potwierdzenie** użytkownika
3. **Service** sprawdza istnienie rekordu, wykonuje `.update(...).eq('user_id', userId).select().single()`
4. **Sukces** → zwraca zaktualizowany rekord → `queueMicrotask` z `logAnalyticsEvent("profile_updated", ...)`
5. **Błędy** (poza walidacją) → logują `api_error` w tle

### Interakcje z bazą danych

#### 1. Sprawdzenie istnienia preferencji (POST, PUT)

```sql
SELECT user_id FROM public.user_preferences
WHERE user_id = $1 LIMIT 1
```

- Realizacja: `supabase.from('user_preferences').select('user_id').eq('user_id', userId).maybeSingle()`
- RLS Policy: `auth.uid() = user_id`

#### 2. Wstawienie nowych preferencji (POST)

```sql
INSERT INTO public.user_preferences
(user_id, health_goal, diet_type, activity_level, allergies, disliked_products)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *
```

- Realizacja: `supabase.from('user_preferences').insert({...}).select().single()`
- RLS Policy: `auth.uid() = user_id`

#### 3. Pobrane istniejących preferencji (GET)

```sql
SELECT * FROM public.user_preferences
WHERE user_id = $1
```

- Realizacja: `supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle()`
- RLS Policy: `auth.uid() = user_id`

#### 4. Aktualizacja preferencji (PUT)

```sql
UPDATE public.user_preferences
SET health_goal = $1, diet_type = $2, activity_level = $3, ...
WHERE user_id = $4
RETURNING *
```

- Realizacja: `supabase.from('user_preferences').update({...}).eq('user_id', userId).select().single()`
- RLS Policy: `auth.uid() = user_id`

#### 5. Logowanie zdarzenia analitycznego (POST, PUT — non-blocking)

```sql
INSERT INTO public.analytics_events
(user_id, action_type, timestamp, metadata)
VALUES ($1, $2, $3, $4)
```

- Realizacja: `supabase.from('analytics_events').insert({...})`
- Brak oczekiwania na odpowiedź (Promise.catch(), nie throw)

### Bezpieczeństwo danych

- **Nie przesyłaj user_id w request body** — jest ekstraktowany z JWT tokenu
- **RLS Policies** automatycznie filtrują dostęp do danych (na poziomie bazy danych)
- **Walidacja danych** — wszystkie pola walidowane przed zapisem
- **Logs** — wrażliwe dane (np. alergie) nie są logowane publicznie

---

## 6. Względy bezpieczeństwa

### 1. Autentykacja

- **Wymagany JWT token** w headerze `Authorization: Bearer <token>`
- Token wygenerowany przez Supabase Auth
- Weryfikacja w endpoint handler:

  ```typescript
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Musisz być zalogowany, aby wykonać tę akcję",
      }),
      { status: 401 }
    );
  }
  ```

### 2. Autoryzacja

- **Row Level Security (RLS)** na tabeli `user_preferences`:

  ```sql
  ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can only access their own preferences"
    ON user_preferences
    FOR ALL
    USING (auth.uid() = user_id);
  ```

- Użytkownik może:
  - Czytać (`SELECT`) swoje preferencje
  - Tworzyć (`INSERT`) preferencje dla siebie
  - Aktualizować (`UPDATE`) własne preferencje
- Próba dostępu do cudzych danych zwraca błąd (obsługiwane przez RLS)

### 3. Walidacja i Sanityzacja

- **Walidacja struktury** — Zod schema sprawdza typ i format każdego pola
- **Enum validation** — wartości enum są sprawdzane przed zapisem
- **Range validation** — `activity_level` musi być między 1–5
- **Array length validation** — `allergies` max 10, `disliked_products` max 20
- **String trimming** — automatyczne usunięcie białych znaków
- **Null/undefined handling** — pola opcjonalne mogą być nullami

### 4. SQL Injection Prevention

- **Supabase SDK** — automatycznie parametryzuje zapytania
- **Prepared Statements** — wszystkie zmienne są bindowane
- **Type Safety** — TypeScript zapewnia poprawność typów na etapie kompilacji
- Nigdy nie używamy `raw()` z niezwalidowanymi danymi

### 5. Szczególne zagrożenia i mitygacja

| Zagrożenie               | Mitygacja                                               |
| ------------------------ | ------------------------------------------------------- |
| Brute force ataku na API | RLS + Supabase Auth (rate limiting po stronie Supabase) |
| Token hijacking          | HTTPS, secure cookies, token expiration                 |
| CORS misconfiguration    | Astro domyślnie zabezpiecza cross-origin                |
| User enumeration         | Nie ujawniamy czy email istnieje, generyczne błędy      |
| Preference disclosure    | RLS ensures proper filtering                            |
| Invalid enum values      | Zod schema i DB CHECK constraints                       |

### 6. Dane wrażliwe

- **Alergie** — mogą wskazywać na problemy zdrowotne, przetwarzane bezpiecznie
- **Preferencje dietetyczne** — mogą wskazywać na religię/ideologię, chronione RLS
- **User ID** — UUID, chroniony RLS

---

## 7. Obsługa błędów

### Scenariusze błędów dla POST, GET, PUT

#### A. Błędy walidacji (400 Bad Request) — POST i PUT

| Scenariusz                       | Error Message                                     | Przyczyna          |
| -------------------------------- | ------------------------------------------------- | ------------------ |
| Brakuje wymaganego pola (POST)   | "Pole 'cel zdrowotny' jest wymagane"              | Pole wymagane      |
| Niepoprawna wartość enum         | "Nieprawidłowa wartość celu zdrowotnego"          | Wartość nie z enum |
| `activity_level` < 1 lub > 5     | "Poziom aktywności musi być od 1 do 5"            | Poza zakresem      |
| `activity_level` nie jest liczbą | "Poziom aktywności musi być liczbą całkowitą"     | Typ niepoprawny    |
| Więcej niż 10 alergii            | "Możesz wybrać maksymalnie 10 alergii"            | Array length       |
| Więcej niż 20 produktów          | "Możesz dodać maksymalnie 20 produktów"           | Array length       |
| Pusta alergię lub produkt        | "Pole nie może być puste"                         | String validation  |
| PUT — brak żadnego pola          | "Wymagane co najmniej jedno pole do aktualizacji" | Refine validation  |
| Niepoprawny JSON                 | "Invalid JSON"                                    | Parse error        |

**Obsługa walidacji**:

```typescript
try {
  const validated =
    method === "POST" ? CreatePreferencesSchema.parse(requestBody) : UpdatePreferencesSchema.parse(requestBody);
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        error: "Validation error",
        details: error.errors.map((e) => e.message),
      }),
      { status: 400 }
    );
  }
}
```

---

#### B. Błędy autentykacji (401 Unauthorized) — POST, GET, PUT

| Scenariusz        | Error Message                                 |
| ----------------- | --------------------------------------------- |
| Brak JWT tokenu   | "Musisz być zalogowany, aby wykonać tę akcję" |
| Token wygasł      | "Sesja wygasła, zaloguj się ponownie"         |
| Token niepoprawny | "Token jest nieważny"                         |

**Obsługa**:

```typescript
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Musisz być zalogowany, aby wykonać tę akcję",
    }),
    { status: 401 }
  );
}
```

---

#### C. Błędy konfliktu (409 Conflict) — POST tylko

| Scenariusz               | Error Message                                                              |
| ------------------------ | -------------------------------------------------------------------------- |
| Preferencje już istnieją | "Preferencje dla tego użytkownika już istnieją. Użyj PUT do aktualizacji." |

**Obsługa**:

```typescript
const existing = await supabase.from("user_preferences").select("user_id").eq("user_id", userId).maybeSingle();

if (existing.data) {
  return new Response(
    JSON.stringify({
      error: "Conflict",
      message: "Preferencje dla tego użytkownika już istnieją. Użyj PUT do aktualizacji.",
    }),
    { status: 409 }
  );
}
```

---

#### D. Błędy nie znalezienia rekordu (404 Not Found) — GET, PUT

| Scenariusz               | Error Message                                                 |
| ------------------------ | ------------------------------------------------------------- |
| Preferencje nie istnieją | "Nie znaleziono preferencji. Wypełnij formularz onboardingu." |

**Obsługa** — wyrzucanie `PreferencesNotFoundError`:

```typescript
if (!preferences) {
  throw new PreferencesNotFoundError("Nie znaleziono preferencji. Wypełnij formularz onboardingu.");
}
```

---

#### E. Błędy autoryzacji (403 Forbidden) — POST, GET, PUT

| Scenariusz           | Error Message                        |
| -------------------- | ------------------------------------ |
| RLS policy violation | "Nie masz uprawnień do tej operacji" |

**Obsługa**: RLS obsługuje automatycznie na poziomie Supabase, ale handler powinno catch-ować:

```typescript
if (error.code === "PGRST100") {
  return new Response(
    JSON.stringify({
      error: "Forbidden",
      message: "Nie masz uprawnień do tej operacji",
    }),
    { status: 403 }
  );
}
```

---

#### F. Błędy bazy danych (500 Internal Server Error) — POST, GET, PUT

| Scenariusz              | Error Message                                          |
| ----------------------- | ------------------------------------------------------ |
| Baza danych niedostępna | "Serwer jest chwilowo niedostępny. Spróbuj za chwilę." |
| Łamanie constraint'u    | "Nie udało się zapisać preferencji. Spróbuj ponownie." |
| Nieoczekiwany błąd      | "Wewnętrzny błąd serwera. Skontaktuj się z supportem." |

**Obsługa**:

```typescript
catch (error) {
  console.error(`Preferences ${method} error:`, error);
  const message = method === "POST"
    ? "Nie udało się zapisać preferencji. Spróbuj ponownie."
    : method === "GET"
    ? "Nie udało się pobrać preferencji. Spróbuj ponownie."
    : "Nie udało się zaktualizować preferencji. Spróbuj ponownie.";

  return new Response(
    JSON.stringify({
      error: "Internal server error",
      message,
    }),
    { status: 500 }
  );
}
```

---

### Strategie obsługi błędów

1. **Guard Clauses** — sprawdzanie warunków na początku funkcji

   ```typescript
   function createPreferences(userId: string, data: unknown) {
     if (!userId) throw new Error("User ID required");
     if (!data) throw new Error("Data required");
     // ... happy path
   }
   ```

2. **Early Returns** — wychodzenie z funkcji przy błędzie

   ```typescript
   const user = await getUser();
   if (!user) return response(401);

   const existing = await checkExisting(user.id);
   if (existing) return response(409);

   // Success path
   ```

3. **Centralized Error Handling** — utility funkcja

   ```typescript
   function apiError(status: number, error: string, message: string, details?: string[]) {
     return new Response(
       JSON.stringify({
         error,
         message,
         ...(details && { details }),
       }),
       { status }
     );
   }
   ```

4. **Non-blocking Error Logging** — analytics event logging

   ```typescript
   // Success response is sent first
   return new Response(...);

   // Analytics logging happens after, errors are ignored
   queueMicrotask(() => {
     logAnalyticsEvent(userId, "profile_created").catch((e) =>
       console.error("Analytics logging failed:", e)
     );
   });
   ```

---

## 8. Rozważania dotyczące wydajności

### Optimalizacja zapytań

#### 1. Index Strategy

Tabela `user_preferences`:

```sql
-- PRIMARY KEY automatycznie tworzy index
ALTER TABLE user_preferences ADD CONSTRAINT
  user_preferences_pkey PRIMARY KEY (user_id);

-- Dodatkowe indexy jeśli będą zapytania filtrujące
CREATE INDEX idx_user_preferences_health_goal
  ON user_preferences(health_goal);
```

#### 2. Query Optimization

**Sprawdzenie istnienia** — używać `.select('user_id').maybeSingle()` zamiast pełnego wiersza:

```typescript
// ❌ Nieoptymalne — pobiera wszystkie kolumny
const { data } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single();

// ✅ Optymalne — pobiera tylko user_id
const { data } = await supabase.from("user_preferences").select("user_id").eq("user_id", userId).maybeSingle();
```

**Select z RETURNING** — zwracaj wszystkie kolumny na `insert()` i `update()`:

```typescript
// ✅ Optymalne — Supabase domyślnie zwraca wszystko
const { data } = await supabase.from("user_preferences").insert(preferences).select().single();
```

### Caching Strategy

Preferencje użytkownika mogą być cached na kliencie:

- **Cache duration**: 1 godzina (rzadko się zmieniają)
- **Invalidation**: Na PUT /api/preferences
- **Implementation**:

  ```typescript
  // Client-side caching (React component)
  const [preferences, setPreferences] = useState(null);
  const [cacheTime, setCacheTime] = useState(null);

  useEffect(() => {
    const now = Date.now();
    if (preferences && cacheTime && now - cacheTime < 3600000) {
      return; // Use cached value
    }

    fetchPreferences().then((data) => {
      setPreferences(data);
      setCacheTime(now);
    });
  }, []);
  ```

### Rate Limiting (Future)

Na MVP etapie brak rate limitingu, ale można dodać:

- **Per-user**: 10 requests/minute per endpoint
- **Per-IP**: 100 requests/minute
- Implementation: Middleware w Astro lub Supabase Edge Functions

### Database Connection Pooling

Supabase automatycznie obsługuje connection pooling:

- Nie trzeba nic konfigurować
- Maksymalnie 10 concurrent connections (standard plan)

### Load Testing Metrics

Docelowe metryki (MVP):

- **Latency**: < 200ms (p95)
- **Throughput**: > 100 requests/second
- **Success rate**: > 99.5%

### Bottlenecks i mitygacja

| Bottleneck           | Przyczyna            | Mitygacja                        |
| -------------------- | -------------------- | -------------------------------- |
| Network latency      | Supabase w Europie   | CDN dla statycznych assets       |
| Database query       | Full table scan      | Indexy na user_id (automatyczne) |
| JSON serialization   | Duże payload         | Pola opcjonalne mogą być null    |
| Array validation     | Validacja max length | Zod parsuje szybko               |
| Authentication check | JWT verification     | Supabase obsługuje szybko        |

---

## 9. Kroki implementacji

### Faza 1: Przygotowanie infrastruktury (30 min)

**Krok 1.1**: Stworzyć/Rozbudować Zod schemata

- **Plik**: `src/lib/schemas/preferences.schema.ts`
- **Co**:
  - Zdefiniować `CreatePreferencesSchema` (już istnieje lub wymaga update)
  - Dodać `UpdatePreferencesSchema` z walidacją "co najmniej jedno pole"
- **Reference**: Użyć `Constants` z `src/db/database.types.ts`
- **Test**: Sprawdzić, że schemata parsują poprawne i niepoprawne dane

**Krok 1.2**: Rozbudować service layer

- **Plik**: `src/lib/services/preferences.service.ts`
- **Co**: Implementować trzy funkcje:
  1. `createPreferences(userId, data)` — dla POST
  2. `getPreferences(userId)` — dla GET
  3. `updatePreferences(userId, data)` — dla PUT
- **Klasy błędów**: Dodać `PreferencesNotFoundError` (obok istniejącego `ConflictError`)
- **Error handling**: Guard clauses, throw meaningful errors, mapowanie kodów Supabase

**Krok 1.3**: Rozbudować analytics service

- **Plik**: `src/lib/services/analytics.service.ts`
- **Co**: Implementować `logEvent(supabase, userId, actionType, metadata?)`
- **Obsługa**: Insert do `analytics_events`, catch errors without throwing (non-blocking)

---

### Faza 2: Implementacja API endpointu (60 min)

**Krok 2.1**: Stworzyć/Rozbudować API route handler

- **Plik**: `src/pages/api/preferences.ts`
- **Metody**: `POST`, `GET`, `PUT`
- **POST**:
  1. Verify authentication
  2. Parse request body
  3. Validate with CreatePreferencesSchema
  4. Call `createPreferences(userId, data)`
  5. Return 201 with created preferences
  6. Async log `profile_created` event (fire and forget)
- **GET**:
  1. Verify authentication
  2. Call `getPreferences(userId)`
  3. Return 200 with preferences or 404 if not found
- **PUT**:
  1. Verify authentication
  2. Parse request body
  3. Validate with UpdatePreferencesSchema
  4. Call `updatePreferences(userId, data)`
  5. Return 200 with updated preferences
  6. Async log `profile_updated` event with metadata (fire and forget)

**Krok 2.2**: Implementować error handling

- Wrap w try-catch
- Map error types do HTTP status codes:
  - `ConflictError` → 409 (POST only)
  - `PreferencesNotFoundError` → 404 (GET, PUT)
  - `ZodError` → 400 (POST, PUT)
  - `AuthError` (brak user) → 401 (POST, GET, PUT)
  - Other errors → 500 (POST, GET, PUT)
- Return proper error JSON z odpowiednią wiadomością

---

### Faza 3: Testowanie (30 min)

**Krok 3.1**: Unit tests dla service layer

- **Tool**: Vitest (jeśli jest skonfigurowany)
- **Test cases** dla `createPreferences`:
  - ✅ Valid input → Returns created preferences
  - ❌ Missing required field → Throws validation error
  - ❌ Activity level out of range → Throws validation error
  - ❌ Too many allergies → Throws validation error
  - ❌ Preferences already exist → Throws ConflictError
- **Test cases** dla `getPreferences`:
  - ✅ Valid user with preferences → Returns UserPreferencesDTO
  - ❌ Valid user without preferences → Throws PreferencesNotFoundError
- **Test cases** dla `updatePreferences`:
  - ✅ Valid partial update → Returns updated preferences
  - ❌ Update without any fields → Throws validation error
  - ❌ Preferences don't exist → Throws PreferencesNotFoundError

**Krok 3.2**: Integration tests dla API endpoint

- **Tool**: Postman, custom script, lub Vitest z mock'ami Supabase
- **Test cases** dla POST:
  - ✅ Valid request → 201 Created
  - ❌ Missing JWT → 401 Unauthorized
  - ❌ Invalid JSON → 400 Bad Request
  - ❌ Duplicate preferences → 409 Conflict
- **Test cases** dla GET:
  - ✅ Valid request → 200 OK
  - ❌ Missing JWT → 401 Unauthorized
  - ❌ Preferences not found → 404 Not Found
- **Test cases** dla PUT:
  - ✅ Valid update → 200 OK
  - ❌ Missing JWT → 401 Unauthorized
  - ❌ No fields provided → 400 Bad Request
  - ❌ Preferences not found → 404 Not Found

**Krok 3.3**: Manual testing

Użyj Postman/Insomnia do testów:

```bash
# POST - Create preferences
POST http://localhost:3000/api/preferences
Authorization: Bearer <valid-jwt>
Content-Type: application/json

{
  "health_goal": "LOSE_WEIGHT",
  "diet_type": "VEGETARIAN",
  "activity_level": 3,
  "allergies": ["Gluten"],
  "disliked_products": ["Brokuły"]
}

# GET - Fetch preferences
GET http://localhost:3000/api/preferences
Authorization: Bearer <valid-jwt>

# PUT - Update preferences
PUT http://localhost:3000/api/preferences
Authorization: Bearer <valid-jwt>
Content-Type: application/json

{
  "activity_level": 4,
  "allergies": null
}
```

Sprawdzić:

- Status codes są poprawne
- Response body zawiera oczekiwane pola
- Dane zapisane/pobrane z bazy (SELECT from preferences)
- Analytics events zalogowane (`profile_created`, `profile_updated`)

---

### Faza 4: Refinement (15 min)

**Krok 4.1**: Code review

- Sprawdzić error messages (czy są w języku polskim)
- Sprawdzić early returns pattern (guard clauses)
- Sprawdzić type safety (TypeScript)
- Sprawdzić logging (brak logowania wrażliwych danych)
- Upewnić się, że wszystkie 3 metody mają spójną obsługę błędów

**Krok 4.2**: Dokumentacja

- Dodać JSDoc comments do service functions
- Dodać comments do endpoint handler (POST, GET, PUT)
- Update API documentation (jeśli istnieje)
- Zaktualizować informacje w tym planie (status implementacji)

**Krok 4.3**: Monitoring

- Setup error tracking (Sentry lub Supabase logging)
- Setup metrics dla latency (response time)
- Setup alerts dla error rates > 1%

---

## Appendix: Code Structure Summary

```
src/
├── lib/
│   ├── schemas/
│   │   └── preferences.schema.ts
│   │       ├── CreatePreferencesSchema (existing)
│   │       ├── UpdatePreferencesSchema (new)
│   │       └── Types: CreatePreferencesInput, UpdatePreferencesInput
│   ├── services/
│   │   ├── preferences.service.ts
│   │   │   ├── createPreferences(userId, data)
│   │   │   ├── getPreferences(userId)
│   │   │   ├── updatePreferences(userId, data)
│   │   │   ├── PreferencesServiceError
│   │   │   ├── ConflictError
│   │   │   └── PreferencesNotFoundError (new)
│   │   └── analytics.service.ts
│   │       └── logEvent(supabase, userId, actionType, metadata?)
│   └── utils.ts (existing)
├── pages/
│   ├── api/
│   │   └── preferences.ts
│   │       ├── export const POST = async (context: APIContext)
│   │       ├── export const GET = async (context: APIContext)
│   │       └── export const PUT = async (context: APIContext)
│   └── ...
├── db/
│   ├── database.types.ts (existing)
│   └── supabase.client.ts (existing)
└── types.ts
    ├── CreateUserPreferencesDTO (existing)
    ├── UpdateUserPreferencesDTO (new)
    └── UserPreferencesDTO (existing)
```

---

## Status implementacji

**Plan**: Kompletny i uspójniony dla POST, GET, PUT
**Szacunkowy czas**: 2–2.5 godzin (Fazy 1–4)
**Dependencje**: Zod (już w projekcie), Supabase SDK (już w projekcie)
**Następne kroki**: Rozpocząć Fazę 1 — Przygotowanie infrastruktury

---
