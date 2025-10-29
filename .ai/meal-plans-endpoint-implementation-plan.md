# API Endpoint Implementation Plan: Meal Plans

## 1. Przegląd punktów końcowych

Implementacja dwóch endpointów REST API do zarządzania planami posiłków:

1. **POST /api/meal-plans** - Generuje nowy plan posiłków AI dla zalogowanego użytkownika, wykorzystując LLM (Large Language Model) przez Openrouter.ai. Plan jest personalizowany na podstawie preferencji użytkownika i nadpisuje istniejący plan (relacja 1:1 user-plan).

2. **GET /api/meal-plans/current** - Pobiera aktualny (najnowszy) plan posiłków zalogowanego użytkownika.

Oba endpointy wymagają autentykacji JWT i operują wyłącznie na danych zalogowanego użytkownika.

---

## 2. Szczegóły żądań

### 2.1. POST /api/meal-plans

#### Metoda HTTP

`POST`

#### Struktura URL

```
/api/meal-plans
```

#### Parametry

- **Wymagane**:
  - `user_id` (z JWT token w Authorization header)
- **Opcjonalne**:
  - Brak

#### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body

```json
{
  "regeneration": false
}
```

**Schema**:

- `regeneration` (boolean, optional, default: `false`) - Wskazuje czy to regeneracja istniejącego planu (używane do analytics tracking)

---

### 2.2. GET /api/meal-plans/current

#### Metoda HTTP

`GET`

#### Struktura URL

```
/api/meal-plans/current
```

#### Parametry

- **Wymagane**:
  - `user_id` (z JWT token w Authorization header)
- **Opcjonalne**:
  - Brak

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### Request Body

Brak (GET request)

---

## 3. Wykorzystywane typy

### 3.1. DTOs (Data Transfer Objects)

Wszystkie typy są zdefiniowane w `src/types.ts`:

```typescript
// Request DTO dla POST /api/meal-plans
export interface GenerateMealPlanDTO {
  regeneration?: boolean;
}

// Response DTO dla obu endpointów
export type MealPlanDTO = Omit<Tables<"meal_plans">, "meals" | "status"> & {
  meals: [Meal, Meal, Meal];
  status: MealPlanStatus;
};

// Struktura pojedynczego posiłku
export interface Meal {
  name: string;
  ingredients: Ingredient[];
  steps: string[];
  time: number;
}

// Struktura składnika
export interface Ingredient {
  name: string;
  amount: string;
}

// Status planu posiłków
export type MealPlanStatus = Enums<"status_enum">; // "pending" | "generated" | "error"
```

### 3.2. Database Types

Z `src/db/database.types.ts`:

- `Tables<"meal_plans">` - typ wiersza z tabeli meal_plans
- `TablesInsert<"meal_plans">` - typ dla INSERT operations
- `Enums<"status_enum">` - enum statusu planu

### 3.3. Zod Schemas

Utworzyć nowy plik `src/lib/schemas/meal-plans.schema.ts`:

```typescript
import { z } from "zod";

// Schema dla request body POST /api/meal-plans
export const generateMealPlanSchema = z.object({
  regeneration: z.boolean().optional().default(false),
});

// Schema dla walidacji struktury Meal z LLM response
export const ingredientSchema = z.object({
  name: z.string().min(1),
  amount: z.string().min(1),
});

export const mealSchema = z.object({
  name: z.string().min(1),
  ingredients: z.array(ingredientSchema),
  steps: z.array(z.string()),
  time: z.number().int().positive(),
});

export const mealsArraySchema = z.tuple([mealSchema, mealSchema, mealSchema]);
```

---

## 4. Szczegóły odpowiedzi

### 4.1. POST /api/meal-plans

#### Success Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "meals": [
    {
      "name": "Śniadanie: Owsianka z owocami",
      "ingredients": [
        { "name": "Płatki owsiane", "amount": "50g" },
        { "name": "Mleko roślinne", "amount": "200ml" },
        { "name": "Banan", "amount": "1 szt." }
      ],
      "steps": [
        "Zagotuj mleko roślinne w garnku",
        "Dodaj płatki owsiane i gotuj 5 minut na małym ogniu",
        "Przełóż do miski i udekoruj pokrojonym bananem"
      ],
      "time": 10
    },
    {
      "name": "Obiad: Makaron z warzywami",
      "ingredients": [{ "name": "Makaron pełnoziarnisty", "amount": "100g" }],
      "steps": ["Ugotuj makaron według instrukcji na opakowaniu"],
      "time": 25
    },
    {
      "name": "Kolacja: Sałatka grecka",
      "ingredients": [],
      "steps": [],
      "time": 15
    }
  ],
  "generated_at": "2025-10-27T14:30:00Z",
  "status": "generated",
  "created_at": "2025-10-27T14:30:00Z"
}
```

#### Error Responses

**400 Bad Request** - Brak preferencji użytkownika lub nieprawidłowe dane wejściowe:

```json
{
  "error": "Bad request",
  "message": "Najpierw wypełnij swoje preferencje żywieniowe"
}
```

**401 Unauthorized** - Brak lub nieprawidłowy JWT token:

```json
{
  "error": "Unauthorized",
  "message": "Wymagane uwierzytelnienie"
}
```

**500 Internal Server Error** - Błąd generowania po wyczerpaniu retry:

```json
{
  "error": "Generation failed",
  "message": "Nie udało się wygenerować planu. Spróbuj ponownie.",
  "retry_count": 3
}
```

**503 Service Unavailable** - Serwis AI niedostępny:

```json
{
  "error": "Service unavailable",
  "message": "Serwis AI jest chwilowo niedostępny. Spróbuj za chwilę."
}
```

**504 Gateway Timeout** - Przekroczono timeout (30s):

```json
{
  "error": "Timeout",
  "message": "Generowanie planu trwa zbyt długo. Spróbuj ponownie."
}
```

---

### 4.2. GET /api/meal-plans/current

#### Success Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "meals": [
    {
      "name": "Śniadanie: Owsianka z owocami",
      "ingredients": [...],
      "steps": [...],
      "time": 10
    },
    {
      "name": "Obiad: Makaron z warzywami",
      "ingredients": [...],
      "steps": [...],
      "time": 25
    },
    {
      "name": "Kolacja: Sałatka grecka",
      "ingredients": [...],
      "steps": [...],
      "time": 15
    }
  ],
  "generated_at": "2025-10-27T14:30:00Z",
  "status": "generated",
  "created_at": "2025-10-27T14:30:00Z"
}
```

#### Error Responses

**401 Unauthorized** - Brak lub nieprawidłowy JWT token:

```json
{
  "error": "Unauthorized",
  "message": "Wymagane uwierzytelnienie"
}
```

**404 Not Found** - Użytkownik nie ma jeszcze planu:

```json
{
  "error": "Not found",
  "message": "Nie masz jeszcze wygenerowanego planu. Kliknij 'Wygeneruj plan'."
}
```

**500 Internal Server Error** - Błąd bazy danych:

```json
{
  "error": "Internal server error",
  "message": "Wystąpił błąd podczas pobierania planu"
}
```

---

## 5. Przepływ danych

### 5.1. POST /api/meal-plans - Generowanie planu

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/meal-plans
       │ { regeneration: false }
       │ Authorization: Bearer <token>
       ▼
┌─────────────────────────────────┐
│  Astro API Route Handler        │
│  /src/pages/api/meal-plans.ts   │
└──────┬──────────────────────────┘
       │
       │ 1. Walidacja JWT (middleware)
       ▼
┌─────────────────────────────────┐
│  Extract user_id from JWT       │
└──────┬──────────────────────────┘
       │
       │ 2. Walidacja request body (Zod)
       ▼
┌─────────────────────────────────┐
│  Validate with Zod Schema       │
└──────┬──────────────────────────┘
       │
       │ 3. Sprawdzenie user preferences
       ▼
┌─────────────────────────────────┐
│  Query user_preferences table   │
│  (via Supabase client)          │
└──────┬──────────────────────────┘
       │
       │ if no preferences → 400 Bad Request
       │
       │ 4. Wywołanie serwisu generowania
       ▼
┌─────────────────────────────────┐
│  MealPlansService               │
│  .generateMealPlan(userId,      │
│   preferences, regeneration)    │
└──────┬──────────────────────────┘
       │
       │ 5. Utwórz rekord w bazie (status: "pending")
       ▼
┌─────────────────────────────────┐
│  INSERT/UPDATE meal_plans       │
│  status = "pending"             │
└──────┬──────────────────────────┘
       │
       │ 6. Wywołanie LLM z retry logic
       ▼
┌─────────────────────────────────┐
│  OpenRouterService              │
│  .generateMealPlan()            │
│  - Timeout: 30s                 │
│  - Retry: 3x (1s, 2s, 4s)       │
└──────┬──────────────────────────┘
       │
       │ API call to Openrouter.ai
       ▼
┌─────────────────────────────────┐
│  Openrouter.ai API              │
│  (LLM generation)               │
└──────┬──────────────────────────┘
       │
       │ 7. Walidacja odpowiedzi LLM
       ▼
┌─────────────────────────────────┐
│  Validate LLM response          │
│  (3 meals, structure check)     │
└──────┬──────────────────────────┘
       │
       │ if invalid → retry or 500
       │
       │ 8. Zapisanie planu w bazie
       ▼
┌─────────────────────────────────┐
│  UPDATE meal_plans              │
│  meals = <generated_meals>      │
│  status = "generated"           │
│  generated_at = NOW()           │
└──────┬──────────────────────────┘
       │
       │ 9. Log analytics event
       ▼
┌─────────────────────────────────┐
│  AnalyticsService               │
│  .logEvent("meal_plan_          │
│   generated/regenerated")       │
└──────┬──────────────────────────┘
       │
       │ 10. Zwróć odpowiedź
       ▼
┌─────────────────────────────────┐
│  Response 201 Created           │
│  { id, user_id, meals, ... }    │
└─────────────────────────────────┘
```

### 5.2. GET /api/meal-plans/current - Pobieranie planu

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ GET /api/meal-plans/current
       │ Authorization: Bearer <token>
       ▼
┌─────────────────────────────────┐
│  Astro API Route Handler        │
│  /src/pages/api/meal-plans/     │
│  current.ts                     │
└──────┬──────────────────────────┘
       │
       │ 1. Walidacja JWT (middleware)
       ▼
┌─────────────────────────────────┐
│  Extract user_id from JWT       │
└──────┬──────────────────────────┘
       │
       │ 2. Wywołanie serwisu
       ▼
┌─────────────────────────────────┐
│  MealPlansService               │
│  .getCurrentMealPlan(userId)    │
└──────┬──────────────────────────┘
       │
       │ 3. Query bazy danych
       ▼
┌─────────────────────────────────┐
│  SELECT * FROM meal_plans       │
│  WHERE user_id = $1             │
│  ORDER BY created_at DESC       │
│  LIMIT 1                        │
└──────┬──────────────────────────┘
       │
       │ if no result → 404 Not Found
       │
       │ 4. Zwróć wynik
       ▼
┌─────────────────────────────────┐
│  Response 200 OK                │
│  { id, user_id, meals, ... }    │
└─────────────────────────────────┘
```

---

## 6. Względy bezpieczeństwa

### 6.1. Uwierzytelnianie (Authentication)

- **JWT Token Validation**: Oba endpointy wymagają ważnego JWT tokena w headerze `Authorization: Bearer <token>`
- **Middleware**: Wykorzystać middleware Astro (`src/middleware/index.ts`) do walidacji JWT przed wykonaniem logiki endpointu
- **Token Source**: Token pochodzi z Supabase Auth i jest weryfikowany przez `supabase.auth.getUser()`

### 6.2. Autoryzacja (Authorization)

- **User Isolation**: Każdy użytkownik może operować tylko na swoich danych
- **User ID from JWT**: `user_id` jest zawsze wyciągany z JWT (nie z request body/params)
- **Database Constraints**: Tabela `meal_plans` ma FOREIGN KEY constraint do `users.id` oraz UNIQUE constraint na `user_id`

### 6.3. Walidacja danych wejściowych

- **Zod Schemas**: Wszystkie dane wejściowe walidowane przez Zod schemas
- **Request Body**: Walidacja typu i wartości pola `regeneration`
- **LLM Response**: Walidacja struktury odpowiedzi z LLM przed zapisem do bazy
- **SQL Injection**: Używamy Supabase client z parametryzowanymi queries (brak raw SQL)

### 6.4. Ochrona API keys

- **Environment Variables**: Klucz Openrouter.ai przechowywany w `import.meta.env.OPENROUTER_API_KEY`
- **Server-side Only**: Klucz API nigdy nie jest wysyłany do frontendu
- **Git Ignore**: Plik `.env` w `.gitignore`

### 6.5. Rate Limiting (Przyszłość)

- **Cost Management**: Rozważyć dodanie rate limiting dla generowania planów (kosztowne wywołania LLM)
- **Per-User Limits**: Np. max 10 generacji dziennie na użytkownika
- **IP-based**: Dodatkowa ochrona przed abuse

### 6.6. Error Messages

- **No Sensitive Data**: Komunikaty błędów nie ujawniają szczegółów technicznych (np. struktur bazy, kluczy API)
- **User-Friendly**: Komunikaty w języku polskim, zrozumiałe dla użytkownika końcowego
- **Logging**: Szczegóły techniczne logowane server-side (console.error)

---

## 7. Obsługa błędów

### 7.1. POST /api/meal-plans - Scenariusze błędów

| Kod | Scenariusz                   | Warunek                                     | Komunikat                                                 | Akcja                                           |
| --- | ---------------------------- | ------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------- |
| 400 | Brak preferencji             | `user_preferences` nie istnieje dla user_id | "Najpierw wypełnij swoje preferencje żywieniowe"          | Zwróć 400, użytkownik musi wypełnić preferencje |
| 400 | Nieprawidłowe dane wejściowe | Zod validation fails                        | Komunikat błędu Zod                                       | Zwróć 400 z szczegółami walidacji               |
| 401 | Brak autentykacji            | JWT token missing/invalid                   | "Wymagane uwierzytelnienie"                               | Zwróć 401, redirect do logowania                |
| 500 | Błąd generowania LLM         | LLM call fails po 3 retry                   | "Nie udało się wygenerować planu. Spróbuj ponownie."      | Ustaw status="error" w bazie, zwróć 500         |
| 500 | Błąd walidacji LLM response  | LLM zwraca nieprawidłową strukturę          | "Nie udało się wygenerować planu. Spróbuj ponownie."      | Retry lub ustaw status="error", zwróć 500       |
| 500 | Błąd zapisu do bazy          | Database error podczas UPDATE               | "Wystąpił błąd podczas zapisywania planu"                 | Log error, zwróć 500                            |
| 503 | Serwis AI niedostępny        | Openrouter.ai zwraca 503                    | "Serwis AI jest chwilowo niedostępny. Spróbuj za chwilę." | Zwróć 503                                       |
| 504 | Timeout                      | LLM call przekracza 30s                     | "Generowanie planu trwa zbyt długo. Spróbuj ponownie."    | Anuluj request, zwróć 504                       |

### 7.2. GET /api/meal-plans/current - Scenariusze błędów

| Kod | Scenariusz        | Warunek                       | Komunikat                                                          | Akcja                            |
| --- | ----------------- | ----------------------------- | ------------------------------------------------------------------ | -------------------------------- |
| 401 | Brak autentykacji | JWT token missing/invalid     | "Wymagane uwierzytelnienie"                                        | Zwróć 401, redirect do logowania |
| 404 | Brak planu        | Query returns null            | "Nie masz jeszcze wygenerowanego planu. Kliknij 'Wygeneruj plan'." | Zwróć 404                        |
| 500 | Błąd bazy danych  | Database error podczas SELECT | "Wystąpił błąd podczas pobierania planu"                           | Log error, zwróć 500             |

### 7.3. Retry Logic (dla POST)

```typescript
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // ms

async function generateWithRetry(attempt = 0): Promise<Meal[]> {
  try {
    return await callLLM();
  } catch (error) {
    if (attempt >= MAX_RETRIES - 1) {
      throw error; // Wyczerpano próby
    }

    await sleep(RETRY_DELAYS[attempt]);
    return generateWithRetry(attempt + 1);
  }
}
```

### 7.4. Error Logging

Wszystkie błędy logować do konsoli z kontekstem:

```typescript
console.error("[MealPlans] Generation failed:", {
  userId,
  attempt,
  error: error.message,
  stack: error.stack,
});
```

---

## 8. Rozważania dotyczące wydajności

### 8.1. Potencjalne wąskie gardła

1. **LLM Generation Time**
   - Problem: Wywołania LLM mogą trwać 5-30 sekund
   - Rozwiązanie:
     - Timeout 30s
     - Status "pending" w bazie podczas generowania
     - Rozważyć async/background job w przyszłości dla skalowania

2. **Database Upsert**
   - Problem: UNIQUE constraint na `user_id` wymaga UPSERT logic
   - Rozwiązanie:
     - Użyć Supabase `.upsert()` zamiast separate SELECT + INSERT/UPDATE
     - Indeks na `user_id` (automatyczny przez UNIQUE constraint)

3. **Concurrent Requests**
   - Problem: Użytkownik może wysłać wiele żądań generowania jednocześnie
   - Rozwiązanie:
     - Frontend: Disable button podczas generowania
     - Backend: Status "pending" blokuje kolejne generowanie (check w service)
     - Database: UNIQUE constraint na `user_id` zapobiega duplikatom

4. **LLM API Rate Limits**
   - Problem: Openrouter.ai może mieć rate limits
   - Rozwiązanie:
     - Obsługa 429 Too Many Requests
     - Exponential backoff w retry logic
     - Rozważyć queue system w przyszłości

### 8.2. Strategie optymalizacji

1. **Caching User Preferences**
   - W ramach jednego requesta przechować preferences w zmiennej (nie queryować wiele razy)

2. **Database Indexes**
   - Index na `user_id` w `meal_plans` (automatyczny przez UNIQUE)
   - Index na `created_at` dla szybkich ORDER BY queries

3. **Streaming Response** (Przyszłość)
   - Rozważyć streaming odpowiedzi z LLM dla lepszego UX
   - Wymagałoby WebSocket lub Server-Sent Events

4. **Background Jobs** (Przyszłość)
   - Dla skalowalności: przenieść generowanie do background job
   - Użytkownik otrzymuje status "pending", a plan generuje się asynchronicznie
   - Powiadomienie (polling/websocket) gdy gotowe

5. **LLM Prompt Optimization**
   - Krótki, precyzyjny prompt redukuje czas generowania i koszt
   - Cache częstych promptów (jeśli LLM provider wspiera)

### 8.3. Monitoring

- Logować czas generowania dla każdego planu
- Monitorować retry rate
- Trackować success/failure rate
- Alerty przy wysokim failure rate lub długich czasach generowania

---

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie środowiska i konfiguracji

**Pliki do utworzenia/modyfikacji:**

- `.env` (dodać zmienną `OPENROUTER_API_KEY`)
- `src/env.d.ts` (dodać typowanie dla zmiennej środowiskowej)

**Zadania:**

1. Zarejestrować konto w Openrouter.ai i pobrać API key
2. Dodać `OPENROUTER_API_KEY` do `.env`:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-...
   ```
3. Dodać typowanie w `src/env.d.ts`:
   ```typescript
   interface ImportMetaEnv {
     readonly OPENROUTER_API_KEY: string;
     // ... inne zmienne
   }
   ```

---

### Krok 2: Utworzenie Zod schemas

**Plik:** `src/lib/schemas/meal-plans.schema.ts`

**Zadania:**

1. Utworzyć plik schema
2. Zdefiniować schemas:
   - `generateMealPlanSchema` - dla request body POST
   - `ingredientSchema` - dla walidacji składnika
   - `mealSchema` - dla walidacji pojedynczego posiłku
   - `mealsArraySchema` - dla walidacji array 3 posiłków
3. Wyeksportować wszystkie schemas

**Kod:**

```typescript
import { z } from "zod";

export const generateMealPlanSchema = z.object({
  regeneration: z.boolean().optional().default(false),
});

export const ingredientSchema = z.object({
  name: z.string().min(1, "Nazwa składnika nie może być pusta"),
  amount: z.string().min(1, "Ilość nie może być pusta"),
});

export const mealSchema = z.object({
  name: z.string().min(1, "Nazwa posiłku nie może być pusta"),
  ingredients: z.array(ingredientSchema),
  steps: z.array(z.string()),
  time: z.number().int().positive("Czas musi być liczbą dodatnią"),
});

export const mealsArraySchema = z.tuple([mealSchema, mealSchema, mealSchema]);
```

---

### Krok 3: Implementacja OpenRouter Service

**Plik:** `src/lib/services/openrouter.service.ts`

**Zadania:**

1. Utworzyć service do komunikacji z Openrouter.ai. Na etapie developmentu skorzystamy z mocków zamiast wywoływania serwisu AI.
2. Implementować:
   - `generateMealPlan(preferences: UserPreferencesDTO): Promise<[Meal, Meal, Meal]>`
   - Timeout 30s
   - Retry logic (3 próby, exponential backoff)
   - Walidacja odpowiedzi LLM przez Zod
3. Obsłużyć błędy 503, 504, 500

**Kluczowe elementy:**

- Użyć `fetch()` do wywołania API
- Headers: `Authorization: Bearer ${OPENROUTER_API_KEY}`
- Model: rozważyć `google/gemini-2.0-flash-001` (szybki, tani) lub `openai/gpt-4o-mini`
- Prompt: personalizowany na podstawie preferences (health_goal, diet_type, allergies, etc.)
- Walidacja: sprawdzić czy response ma 3 posiłki przez `mealsArraySchema.parse()`

**Struktura:**

```typescript
import { mealsArraySchema } from "../schemas/meal-plans.schema";
import type { UserPreferencesDTO } from "../../types";
import type { Meal } from "../../types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];
const TIMEOUT_MS = 30000;

export class OpenRouterService {
  // ... implementacja
}

export const openRouterService = new OpenRouterService();
```

---

### Krok 4: Implementacja Meal Plans Service

**Plik:** `src/lib/services/meal-plans.service.ts`

**Zadania:**

1. Utworzyć service do zarządzania planami posiłków
2. Implementować:
   - `generateMealPlan(userId, preferences, regeneration): Promise<MealPlanDTO>`
   - `getCurrentMealPlan(userId): Promise<MealPlanDTO | null>`
   - `saveMealPlan(userId, meals): Promise<MealPlanDTO>`
3. Użyć Supabase client do operacji na bazie
4. Integracja z OpenRouterService. Na etapie developmentu skorzystamy z mocków zamiast wywoływania serwisu AI.

**Kluczowe elementy:**

- Import `SupabaseClient` z `src/db/supabase.client.ts`
- Użyć `.upsert()` do zapisywania planu (overwrite existing)
- Status management: "pending" → "generated" lub "error"
- Error handling z early returns

**Struktura:**

```typescript
import type { SupabaseClient } from "../db/supabase.client";
import type { MealPlanDTO, UserPreferencesDTO, Meal } from "../../types";
import { openRouterService } from "./openrouter.service";

export class MealPlansService {
  constructor(private supabase: SupabaseClient) {}

  async generateMealPlan(userId: string, preferences: UserPreferencesDTO, regeneration: boolean): Promise<MealPlanDTO> {
    // 1. Create pending record
    // 2. Call LLM
    // 3. Update with generated meals
    // 4. Return result
  }

  async getCurrentMealPlan(userId: string): Promise<MealPlanDTO | null> {
    // Query latest meal plan
  }
}

export function createMealPlansService(supabase: SupabaseClient) {
  return new MealPlansService(supabase);
}
```

---

### Krok 5: Implementacja POST /api/meal-plans endpoint

**Plik:** `src/pages/api/meal-plans.ts`

**Zadania:**

1. Utworzyć Astro endpoint file
2. Dodać `export const prerender = false;`
3. Implementować handler `POST`
4. Walidacja:
   - JWT authentication (z context.locals.supabase)
   - Request body przez Zod
   - Istnienie user preferences
5. Wywołać MealPlansService
6. Log analytics event
7. Zwrócić odpowiedź 201 lub error

**Struktura:**

```typescript
import type { APIRoute } from "astro";
import { generateMealPlanSchema } from "../../lib/schemas/meal-plans.schema";
import { createMealPlansService } from "../../lib/services/meal-plans.service";
import { analyticsService } from "../../lib/services/analytics.service";
import type { GenerateMealPlanDTO } from "../../types";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Auth check
  // 2. Parse & validate body
  // 3. Check user preferences
  // 4. Generate meal plan
  // 5. Log analytics
  // 6. Return response
};
```

**Error handling pattern:**

```typescript
// Guard clauses na początku
const {
  data: { user },
  error: authError,
} = await locals.supabase.auth.getUser();
if (authError || !user) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Wymagane uwierzytelnienie",
    }),
    { status: 401 }
  );
}

// ... więcej guard clauses

// Happy path na końcu
return new Response(JSON.stringify(mealPlan), {
  status: 201,
  headers: { "Content-Type": "application/json" },
});
```

---

### Krok 6: Implementacja GET /api/meal-plans/current endpoint

**Plik:** `src/pages/api/meal-plans/current.ts`

**Uwaga:** Astro wymaga pliku `current.ts` w folderze `meal-plans/` dla route `/api/meal-plans/current`

**Zadania:**

1. Utworzyć folder `src/pages/api/meal-plans/`
2. Przenieść `meal-plans.ts` do `meal-plans/index.ts` (dla POST)
3. Utworzyć `meal-plans/current.ts` (dla GET)
4. Dodać `export const prerender = false;`
5. Implementować handler `GET`
6. Walidacja JWT
7. Wywołać MealPlansService.getCurrentMealPlan()
8. Zwrócić 200 z planem lub 404 jeśli brak

**Struktura folderu:**

```
src/pages/api/meal-plans/
  ├── index.ts        # POST /api/meal-plans
  └── current.ts      # GET /api/meal-plans/current
```

**Kod `current.ts`:**

```typescript
import type { APIRoute } from "astro";
import { createMealPlansService } from "../../../lib/services/meal-plans.service";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  // 1. Auth check
  // 2. Get current meal plan
  // 3. Return 200 or 404
};
```

---

### Krok 7: Integracja z Analytics Service

**Plik:** `src/lib/services/analytics.service.ts` (istniejący)

**Zadania:**

1. Sprawdzić czy `analyticsService.logEvent()` wspiera eventy:
   - `meal_plan_generated` - pierwsza generacja
   - `meal_plan_regenerated` - regeneracja
2. Jeśli nie, dodać obsługę tych eventów
3. W POST endpoint wywołać odpowiedni event po sukcesie

**Wywołanie w POST handler:**

```typescript
const actionType = regeneration ? "meal_plan_regenerated" : "meal_plan_generated";
await analyticsService.logEvent(locals.supabase, user.id, {
  action_type: actionType,
  context: { meal_plan_id: mealPlan.id },
});
```

---

### Krok 8: Testowanie manualne

**Zadania:**

1. **Test POST - Happy path:**
   - Zalogować się jako użytkownik z wypełnionymi preferencjami
   - Wywołać `POST /api/meal-plans` z `{ "regeneration": false }`
   - Sprawdzić czy zwraca 201 i poprawną strukturę
   - Sprawdzić w bazie czy plan został zapisany

2. **Test POST - Brak preferencji:**
   - Zalogować się jako użytkownik bez preferencji
   - Wywołać POST
   - Sprawdzić czy zwraca 400 z odpowiednim komunikatem

3. **Test POST - Unauthorized:**
   - Wywołać POST bez JWT tokena
   - Sprawdzić czy zwraca 401

4. **Test POST - Regeneration:**
   - Wygenerować plan
   - Wywołać POST ponownie z `{ "regeneration": true }`
   - Sprawdzić czy nadpisuje poprzedni plan
   - Sprawdzić analytics event

5. **Test GET - Happy path:**
   - Po wygenerowaniu planu wywołać `GET /api/meal-plans/current`
   - Sprawdzić czy zwraca 200 z tym samym planem

6. **Test GET - Brak planu:**
   - Usunąć plan z bazy
   - Wywołać GET
   - Sprawdzić czy zwraca 404

7. **Test GET - Unauthorized:**
   - Wywołać GET bez JWT tokena
   - Sprawdzić czy zwraca 401

8. **Test Retry Logic:**
   - Symulować błąd LLM (np. czasowo nieprawidłowy API key)
   - Sprawdzić czy wykonuje 3 próby
   - Sprawdzić logi w konsoli

9. **Test Timeout:**
   - Symulować długi czas odpowiedzi LLM (mock/delay)
   - Sprawdzić czy timeout po 30s działa
   - Sprawdzić czy zwraca 504

---

### Krok 9: Obsługa edge cases i error scenarios

**Zadania:**

1. **Invalid LLM Response:**
   - Dodać obsługę przypadku gdy LLM zwraca nieprawidłową strukturę
   - Walidacja przez Zod powinna złapać błąd
   - Retry lub zwrócić 500

2. **Concurrent Requests:**
   - Dodać check czy już istnieje plan ze statusem "pending"
   - Jeśli tak, zwrócić 409 Conflict lub poczekać na zakończenie

3. **Database Errors:**
   - Wrap wszystkie operacje DB w try-catch
   - Logować szczegóły błędu
   - Zwracać ogólny komunikat użytkownikowi

4. **Empty Preferences:**
   - Sprawdzić czy wszystkie wymagane pola w preferences są wypełnione
   - Jeśli nie, zwrócić 400 z informacją co brakuje

---

### Krok 10: Dokumentacja i cleanup

**Zadania:**

1. Dodać JSDoc comments do wszystkich funkcji w services
2. Dodać README w folderze services wyjaśniający architekturę
3. Usunąć console.log używane do debugowania (zostawić tylko error logs)
4. Sprawdzić czy wszystkie typy są poprawne (no `any`)
5. Uruchomić linter i naprawić wszystkie błędy:
   ```bash
   npm run lint
   ```

---

### Krok 11: Weryfikacja zgodności z requirements

**Checklist:**

- [ ] POST /api/meal-plans zwraca 201 przy sukcesie
- [ ] POST wymaga autentykacji JWT
- [ ] POST sprawdza user preferences przed generowaniem
- [ ] POST implementuje retry logic (3 próby, 1s/2s/4s)
- [ ] POST implementuje timeout 30s
- [ ] POST nadpisuje istniejący plan użytkownika (UNIQUE user_id)
- [ ] POST trackuje regeneration flag dla analytics
- [ ] POST loguje analytics events
- [ ] POST zwraca odpowiednie error codes (400, 401, 500, 503, 504)
- [ ] GET /api/meal-plans/current zwraca 200 przy sukcesie
- [ ] GET wymaga autentykacji JWT
- [ ] GET zwraca 404 jeśli użytkownik nie ma planu
- [ ] Wszystkie responses mają poprawną strukturę zgodną z MealPlanDTO
- [ ] Meals array zawsze ma 3 elementy (breakfast, lunch, dinner)
- [ ] Wszystkie błędy mają user-friendly komunikaty po polsku
- [ ] Kod używa early returns i guard clauses
- [ ] Logika wyciągnięta do services (nie w route handlers)
- [ ] Używa Supabase z context.locals (nie import)
- [ ] Wszystkie dane walidowane przez Zod
- [ ] API key w environment variables

---

### Krok 12: Przygotowanie do deployment

**Zadania:**

1. Dodać zmienną `OPENROUTER_API_KEY` do production environment (np. DigitalOcean secrets)
2. Sprawdzić czy migrations są applied na production database
3. Zweryfikować czy Supabase RLS policies pozwalają na operacje (jeśli są włączone)
4. Dodać monitoring dla:
   - LLM generation time
   - Success/failure rate
   - Retry frequency
5. Rozważyć dodanie rate limiting na production

---

## 10. Potencjalne przyszłe usprawnienia

Po wdrożeniu MVP, rozważyć następujące usprawnienia:

1. **Background Jobs**: Przeniesienie generowania do async jobs dla lepszej skalowalności
2. **WebSocket/SSE**: Real-time updates dla użytkownika podczas generowania
3. **Caching**: Cache częstych kombinacji preferences → meal plan
4. **A/B Testing**: Testowanie różnych modeli LLM i promptów
5. **Meal Plan History**: Zapisywanie historii planów zamiast nadpisywania
6. **Sharing**: Możliwość udostępniania planów innym użytkownikom
7. **PDF Export**: Generowanie PDF z planem posiłków
8. **Shopping List**: Automatyczne generowanie listy zakupów z ingredients
9. **Nutritional Info**: Dodanie informacji o wartościach odżywczych
10. **Meal Variations**: Pozwolić użytkownikowi wybrać warianty dla poszczególnych posiłków

---

## Podsumowanie

Ten plan implementacji zapewnia szczegółowe wskazówki dla zespołu programistów do wdrożenia endpointów API zarządzania planami posiłków. Kluczowe aspekty:

- **Bezpieczeństwo**: JWT authentication, input validation, API key protection
- **Niezawodność**: Retry logic, timeout handling, proper error responses
- **Wydajność**: Efficient database operations, monitoring
- **Maintainability**: Service layer, Zod validation, TypeScript types
- **User Experience**: Polish error messages, proper status codes

Implementacja powinna być wykonywana krok po kroku zgodnie z sekcją "Etapy wdrożenia", z testowaniem po każdym kroku.
