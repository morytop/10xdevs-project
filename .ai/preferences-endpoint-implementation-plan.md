# API Endpoint Implementation Plan: Create User Preferences (POST /api/preferences)

## 1. Przegląd punktu końcowego

Endpoint **Create User Preferences** jest punktem wejścia do onboardingu użytkownika. Pozwala na utworzenie profilu preferencji dietetycznych, który jest wymagany do generowania spersonalizowanych planów posiłków. Endpoint implementuje walidację danych, sprawdzenie unikalności preferencji użytkownika (relacja 1:1) oraz logowanie zdarzenia do tabeli `analytics_events`.

**Cel**: Zapisać preferencje dietetyczne użytkownika w bazie danych oraz zainicjować proces zbierania danych o jego potrzebach żywieniowych.

---

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Ścieżka**: `/api/preferences`
- **Autentykacja**: Wymagana (JWT token w headerze `Authorization`)

### Struktura URL

```
POST /api/preferences
Authorization: Bearer <jwt-token>
```

### Parametry

#### Wymagane:

- `health_goal` (string): Cel zdrowotny użytkownika
  - Wartości: `LOSE_WEIGHT`, `GAIN_WEIGHT`, `MAINTAIN_WEIGHT`, `HEALTHY_EATING`, `BOOST_ENERGY`
  - Typ enum z tabeli `health_goal_enum`
- `diet_type` (string): Typ diety użytkownika
  - Wartości: `STANDARD`, `VEGETARIAN`, `VEGAN`, `GLUTEN_FREE`
  - Typ enum z tabeli `diet_type_enum`
- `activity_level` (integer): Poziom aktywności fizycznej
  - Zakres: od 1 do 5 (1 = siedzący tryb życia, 5 = bardzo aktywny)
  - Musi być liczbą całkowitą

#### Opcjonalne:

- `allergies` (array of strings): Lista alergii użytkownika
  - Maksymalnie 10 pozycji
  - Każdy element to niepusta string
  - Przykład: `["Gluten", "Laktoza", "Orzeszki arachidowe"]`
- `disliked_products` (array of strings): Lista produktów, których użytkownik nie lubi
  - Maksymalnie 20 pozycji
  - Każdy element to niepusta string
  - Przykład: `["Brokuły", "Papryka", "Cebula"]`

### Request Body - Przykład

```json
{
  "health_goal": "LOSE_WEIGHT",
  "diet_type": "VEGETARIAN",
  "activity_level": 3,
  "allergies": ["Gluten", "Laktoza"],
  "disliked_products": ["Brokuły", "Papryka", "Cebula"]
}
```

### Request Body - Minimalny

```json
{
  "health_goal": "HEALTHY_EATING",
  "diet_type": "STANDARD",
  "activity_level": 2
}
```

---

## 3. Wykorzystywane typy

### DTOs z `src/types.ts`

1. **CreateUserPreferencesDTO**

   ```typescript
   type CreateUserPreferencesDTO = Omit<TablesInsert<"user_preferences">, "user_id">;
   ```

   - Używana do walidacji request body
   - `user_id` automatycznie uzupełniany z JWT tokenu
   - Wszystkie pola odpowiadają tabelce `user_preferences`

2. **UserPreferencesDTO**

   ```typescript
   type UserPreferencesDTO = Tables<"user_preferences">;
   ```

   - Używana do zwracania pełnego obiektu preferencji w odpowiedzi

3. **Typy enum**

   ```typescript
   type HealthGoal = Enums<"health_goal_enum">;
   type DietType = Enums<"diet_type_enum">;
   ```

   - Re-exporty enumów z bazy danych
   - Dostępne w `Constants` z `src/db/database.types.ts`

### Zod Validation Schema

Nowy plik `src/lib/schemas/preferences.schema.ts`:

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

export type CreatePreferencesInput = z.infer<typeof CreatePreferencesSchema>;
```

---

## 4. Szczegóły odpowiedzi

### Success Response (201 Created)

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

---

### Error Responses

#### 1. Validation Error (400 Bad Request)

Gdy dane wejściowe nie spełniają wymagań walidacji.

```json
{
  "error": "Validation error",
  "details": [
    "Pole 'cel zdrowotny' jest wymagane",
    "Poziom aktywności musi być od 1 do 5",
    "Możesz wybrać maksymalnie 10 alergii"
  ]
}
```

**Kod statusu**: `400 Bad Request`

---

#### 2. Unauthorized (401 Unauthorized)

Gdy brakuje JWT tokenu lub token jest nieważny.

```json
{
  "error": "Unauthorized",
  "message": "Musisz być zalogowany, aby wykonać tę akcję"
}
```

**Kod statusu**: `401 Unauthorized`

---

#### 3. Conflict (409 Conflict)

Gdy użytkownik już posiada preferencje (relacja 1:1).

```json
{
  "error": "Conflict",
  "message": "Preferencje dla tego użytkownika już istnieją. Użyj PUT do aktualizacji."
}
```

**Kod statusu**: `409 Conflict`

---

#### 4. Internal Server Error (500 Internal Server Error)

Gdy występuje błąd bazy danych lub nieoczekiwany wyjątek.

```json
{
  "error": "Internal server error",
  "message": "Nie udało się zapisać preferencji. Spróbuj ponownie."
}
```

**Kod statusu**: `500 Internal Server Error`

---

## 5. Przepływ danych

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
│              API Endpoint Handler                                │
│         src/pages/api/preferences.ts (POST method)               │
│                                                                  │
│  1. Verify authentication (extract JWT from context.locals)     │
│  2. Parse request body (JSON)                                   │
│  3. Validate using Zod schema                                   │
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
│  1. Check if preferences already exist for user                 │
│     - Query: SELECT * FROM user_preferences WHERE user_id = ?   │
│     - If exists: throw ConflictError (→ 409)                    │
│  2. Insert new preferences                                      │
│     - Query: INSERT INTO user_preferences (...)                 │
│       VALUES (user_id, health_goal, diet_type, ...)             │
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

### Interakcje z bazą danych

1. **Sprawdzenie istnienia preferencji** (Check Operation)

   ```sql
   SELECT user_id FROM public.user_preferences
   WHERE user_id = $1 LIMIT 1
   ```

   - Realizacja: `supabase.from('user_preferences').select('user_id').eq('user_id', userId).single()`
   - RLS Policy: `auth.uid() = user_id` - użytkownik może sprawdzić tylko swoje dane

2. **Wstawienie nowych preferencji** (Insert Operation)

   ```sql
   INSERT INTO public.user_preferences
   (user_id, health_goal, diet_type, activity_level, allergies, disliked_products)
   VALUES ($1, $2, $3, $4, $5, $6)
   RETURNING *
   ```

   - Realizacja: `supabase.from('user_preferences').insert({...}).single()`
   - RLS Policy: `auth.uid() = user_id` - działa transparentnie w kontekście JWT

3. **Logowanie zdarzenia analitycznego** (Non-blocking Insert)

   ```sql
   INSERT INTO public.analytics_events
   (user_id, action_type, timestamp, metadata)
   VALUES ($1, 'profile_created', $2, $3)
   ```

   - Realizacja: `supabase.from('analytics_events').insert({...})`
   - Brak oczekiwania na odpowiedź (Promise.catch(), nie throw)

### Bezpieczeństwo danych

- **Nie przesyłaj user_id w request body** - jest ekstraktowany z JWT tokenu
- **RLS Policies** automatycznie filtrują dostęp do danych (na poziomie bazy danych)
- **Walidacja danych** - wszystkie pola walidowane przed zapisem
- **Logs** - wrażliwe dane (np. alergie) nie są logowane publicznie

---

## 6. Względy bezpieczeństwa

### 1. Autentykacja

- **Wymagany JWT token** w headerze `Authorization: Bearer <token>`
- Token wygenerowany przez Supabase Auth
- Weryfikacja na poziomie middleware (Astro):
  ```typescript
  // src/middleware/index.ts
  const user = await context.locals.auth.getUser();
  if (!user) {
    return context.redirect("/login");
  }
  ```
- Dla API - weryfikacja w endpoint handler:
  ```typescript
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  ```

### 2. Autoryzacja

- **Row Level Security (RLS)** na tabeli `user_preferences`:
  ```sql
  ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can only access their own preferences"
    ON user_preferences
    USING (auth.uid() = user_id);
  ```
- Użytkownik może tylko:
  - Czytać (`SELECT`) swoje preferencje
  - Tworzyć (`INSERT`) preferencje dla siebie
  - Aktualizować (`UPDATE`) własne preferencje
- Próba dostępu do cudzych danych zwraca błąd 403 Forbidden

### 3. Walidacja i Sanityzacja

- **Walidacja struktury** - Zod schema sprawdza typ i format każdego pola
- **Enum validation** - wartości enum są sprawdzane przed zapisem
- **Range validation** - `activity_level` musi być między 1-5
- **Array length validation** - `allergies` max 10, `disliked_products` max 20
- **String trimming** - automatyczne usunięcie białych znaków
- **Null/undefined handling** - pola opcjonalne mogą być nullami, ale nie undefined

### 4. SQL Injection Prevention

- **Supabase SDK** - automatycznie parametryzuje zapytania
- **Prepared Statements** - wszystkie zmienne są bindowane
- **Type Safety** - TypeScript zapewnia, że typy są poprawne na etapie kompilacji
- Nigdy nie używamy `raw()` z niezwalidowanymi danymi

### 5. Szczególne zagrożenia

| Zagrożenie                   | Mitygacja                                               |
| ---------------------------- | ------------------------------------------------------- |
| **Brute force ataku na API** | RLS + Supabase Auth (rate limiting po stronie Supabase) |
| **Token hijacking**          | HTTPS, secure cookies, token exp                        |
| **CORS misconfiguration**    | Astro domyślnie zabezpiecza cross-origin                |
| **User enumeration**         | Nie ujawniamy czy email istnieje, generyczne błędy      |
| **Preference disclosure**    | RLS ensures proper filtering                            |
| **Invalid enum values**      | Zod schema i DB CHECK constraints                       |

### 6. Dane wrażliwe

- **Alergie** - mogą wskazywać na problemy zdrowotne, przetwarzane bezpiecznie
- **Preferencje dietetyczne** - mogą wskazywać na religię/ideologię, chronione RLS
- **User ID** - UUID, nie ma znaczenia treściowego, ale chroniony RLS

---

## 7. Obsługa błędów

### Scenariusze błędów

#### A. Błędy walidacji (400 Bad Request)

| Scenariusz                        | Error Message                                 | Przyczyna          |
| --------------------------------- | --------------------------------------------- | ------------------ |
| Brakuje `health_goal`             | "Pole 'cel zdrowotny' jest wymagane"          | Pole wymagane      |
| Niepoprawna wartość `health_goal` | "Nieprawidłowa wartość celu zdrowotnego"      | Wartość nie z enum |
| `activity_level` < 1 lub > 5      | "Poziom aktywności musi być od 1 do 5"        | Poza zakresem      |
| `activity_level` nie jest liczbą  | "Poziom aktywności musi być liczbą całkowitą" | Typ niepoprawn     |
| Więcej niż 10 alergii             | "Możesz wybrać maksymalnie 10 alergii"        | Array length       |
| Więcej niż 20 produktów           | "Możesz dodać maksymalnie 20 produktów"       | Array length       |
| Pusta alergię lub produkt         | "Pole nie może być puste"                     | String validation  |
| Brakuje `diet_type`               | "Pole 'typ diety' jest wymagane"              | Pole wymagane      |
| Niepoprawny JSON                  | "Invalid JSON"                                | Parse error        |

**Obsługa**:

```typescript
try {
  const validated = CreatePreferencesSchema.parse(requestBody);
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

#### B. Błędy autentykacji (401 Unauthorized)

| Scenariusz        | Error Message                                 |
| ----------------- | --------------------------------------------- |
| Brak JWT tokenu   | "Musisz być zalogowany, aby wykonać tę akcję" |
| Token wygasły     | "Sesja wygasła, zaloguj się ponownie"         |
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

#### C. Błędy konfliktu (409 Conflict)

| Scenariusz               | Error Message                                                              |
| ------------------------ | -------------------------------------------------------------------------- |
| Preferencje już istnieją | "Preferencje dla tego użytkownika już istnieją. Użyj PUT do aktualizacji." |

**Obsługa**:

```typescript
const existing = await supabase.from("user_preferences").select("user_id").eq("user_id", user.id).single();

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

#### D. Błędy autoryzacji (403 Forbidden)

| Scenariusz                      | Error Message                             |
| ------------------------------- | ----------------------------------------- |
| RLS policy violation            | "Nie masz uprawnień do tej operacji"      |
| Próba dostępu do cudzych danych | "Nie możesz edytować cudzych preferencji" |

**Obsługa**: RLS obsługuje automatycznie, ale API powinno catch-ować:

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

#### E. Błędy bazy danych (500 Internal Server Error)

| Scenariusz              | Error Message                                          |
| ----------------------- | ------------------------------------------------------ |
| Baza danych niedostępna | "Serwer jest chwilowo niedostępny. Spróbuj za chwilę." |
| Łamanie constraint'u    | "Nie udało się zapisać preferencji. Spróbuj ponownie." |
| Nieoczekiwany błąd      | "Wewnętrzny błąd serwera. Skontaktuj się z supportem." |

**Obsługa**:

```typescript
catch (error) {
  console.error('Preferences creation error:', error);
  return new Response(JSON.stringify({
    error: "Internal server error",
    message: "Nie udało się zapisać preferencji. Spróbuj ponownie."
  }), { status: 500 });
}
```

---

### Strategie obsługi błędów

1. **Guard Clauses** - sprawdzanie warunków na początku funkcji

   ```typescript
   function createPreferences(userId, data) {
     if (!userId) throw new Error("User ID required");
     if (!data) throw new Error("Data required");
     // ... happy path
   }
   ```

2. **Early Returns** - wychodzenie z funkcji przy błędzie

   ```typescript
   const user = await getUser();
   if (!user) return response(401);

   const existing = await checkExisting(user.id);
   if (existing) return response(409);

   // Success path
   ```

3. **Centralized Error Handling** - utility funkcja

   ```typescript
   function apiError(status, error, message, details = null) {
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

4. **Non-blocking Error Logging** - analytics event logging

   ```typescript
   // Success response is sent first
   return new Response(...);

   // Analytics logging happens after, errors are ignored
   logAnalyticsEvent('profile_created', userId).catch(e =>
     console.error('Analytics logging failed:', e)
   );
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

**Sprawdzenie istnienia** - używać `.select('user_id').single()` zamiast pełnego wiersza:

```typescript
// ❌ Nieoptymalne - pobiera wszystkie kolumny
const { data } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single();

// ✅ Optymalne - pobiera tylko user_id
const { data } = await supabase.from("user_preferences").select("user_id").eq("user_id", userId).single();
```

**Insert z RETURNING** - zwracaj tylko potrzebne kolumny:

```typescript
// ✅ Optymalne - Supabase domyślnie zwraca wszystko, ale backend optymalizuje
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

- **Latency**: < 200ms (p95) dla lokalnych instancji
- **Throughput**: > 100 requests/second
- **Success rate**: > 99.5%

### Bottlenecks

| Bottleneck           | Przyczyna            | Mitygacja                        |
| -------------------- | -------------------- | -------------------------------- |
| Network latency      | Supabase w Europie   | CDN dla statycznych asssetów     |
| Database query       | Full table scan      | Indexy na user_id (automatyczne) |
| JSON serialization   | Duże payload         | Pola opcjonalne mogą być null    |
| Array validation     | Validacja max length | Zod parsuje szybko               |
| Authentication check | JWT verification     | Supabase obsługuje szybko        |

---

## 9. Kroki implementacji

### Faza 1: Przygotowanie infrastruktury (30 min)

**Krok 1.1**: Stworzyć Zod schema

- **Plik**: `src/lib/schemas/preferences.schema.ts`
- **Co**: Zdefiniować `CreatePreferencesSchema` z walidacją enums
- **Reference**: Użyć `Constants` z `src/db/database.types.ts`
- **Test**: Sprawdzić, że schema parse'uje poprawne i niepoprawne dane

**Krok 1.2**: Stworzyć service layer

- **Plik**: `src/lib/services/preferences.service.ts`
- **Co**: Implementować `createPreferences(userId, data)`
- **Logika**:
  1. Check if preferences exist (`.select('user_id').eq('user_id', userId).maybeSingle()`)
  2. If exists, throw `ConflictError`
  3. Insert preferences (`.insert({user_id, ...data}).select().single()`)
  4. Return created preferences
- **Error handling**: Guard clauses, throw meaningful errors

**Krok 1.3**: Stworzyć utility function do logowania analytics

- **Plik**: `src/lib/services/analytics.service.ts`
- **Co**: Implementować `logEvent(userId, actionType, metadata?)`
- **Logika**:
  1. Insert event to `analytics_events`
  2. Catch errors and log, don't throw (non-blocking)
- **Format**:
  ```typescript
  async function logEvent(userId: string, actionType: string, metadata?: any) {
    try {
      await supabase.from("analytics_events").insert({
        user_id: userId,
        action_type: actionType,
        timestamp: new Date().toISOString(),
        metadata,
      });
    } catch (error) {
      console.error("Analytics logging failed:", error);
    }
  }
  ```

---

### Faza 2: Implementacja API endpointu (45 min)

**Krok 2.1**: Stworzyć API route handler

- **Plik**: `src/pages/api/preferences.ts`
- **Metoda**: `export const POST = async (context: APIContext)`
- **Co**:
  1. Extract user from context.locals
  2. Guard: Check authentication
  3. Parse request body
  4. Guard: Validate with Zod schema
  5. Call service layer
  6. Return 201 with created preferences
  7. Async log analytics event (fire and forget)

**Krok 2.2**: Implementować error handling

- Wrap w try-catch
- Map error types do HTTP status codes:
  - `ConflictError` → 409
  - `ZodError` → 400
  - `AuthError` → 401
  - Other errors → 500
- Return proper error JSON

**Krok 2.3**: Implementować GET method (bonus - dla fetch preferencji)

- **Metoda**: `export const GET = async (context: APIContext)`
- **Logika**: Fetch preferences dla user
- **Responses**: 200 OK, 401 Unauthorized, 404 Not Found

---

### Faza 3: Testowanie (30 min)

**Krok 3.1**: Unit tests dla service layer

- **Tool**: Vitest (jeśli jest skonfigurowany w projekcie)
- **Test cases**:
  - ✅ Valid input → Returns created preferences
  - ❌ Missing required field → Throws validation error
  - ❌ Activity level out of range → Throws validation error
  - ❌ Too many allergies → Throws validation error
  - ❌ Preferences already exist → Throws ConflictError

**Krok 3.2**: Integration tests dla API endpoint

- **Tool**: Postman lub custom script
- **Test cases**:
  - ✅ Valid request → 201 Created
  - ❌ Missing JWT → 401 Unauthorized
  - ❌ Invalid JSON → 400 Bad Request
  - ❌ Duplicate preferences → 409 Conflict
  - ❌ Server error → 500 Internal Server Error

**Krok 3.3**: Manual testing

- Użyj Postman/Insomnia do testu:

  ```bash
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
  ```

- Sprawdzić:
  - Status 201
  - Response body zawiera user_id
  - Dane zapisane w bazie (SELECT from preferences)
  - Analytics event zalogowany

---

### Faza 4: Refinement (15 min)

**Krok 4.1**: Code review

- Sprawdzić error messages (czy są w języku polskim)
- Sprawdzić early returns pattern (guard clauses)
- Sprawdzić type safety (TypeScript)
- Sprawdzić logging (brak logowania wrażliwych danych)

**Krok 4.2**: Dokumentacja

- Dodać JSDoc comments do service functions
- Dodać comments do endpoint handler
- Update API documentation (jeśli istnieje)

**Krok 4.3**: Monitoring

- Setup error tracking (Sentry lub Supabase logging)
- Setup metrics dla latency (response time)
- Setup alerts dla error rates

---

## Appendix: Code Structure Summary

```
src/
├── lib/
│   ├── schemas/
│   │   └── preferences.schema.ts (NEW)
│   ├── services/
│   │   ├── preferences.service.ts (NEW)
│   │   └── analytics.service.ts (NEW)
│   └── utils.ts (existing)
├── pages/
│   ├── api/
│   │   └── preferences.ts (NEW - POST/GET methods)
│   └── ...
├── db/
│   ├── database.types.ts (existing)
│   └── supabase.client.ts (existing)
└── types.ts (existing DTOs)
```

---

**Implementation Status**: Ready for development
**Estimated Duration**: 2 hours (Fazy 1-4)
**Dependencies**: Zod (already in project), Supabase SDK (already in project)
**Next Steps**: Begin Phase 1 implementation
