# API Endpoint Implementation Plan: Feedback

## 1. Przegląd punktów końcowych

Feedback API składa się z dwóch endpointów służących do zarządzania opiniami użytkowników o wygenerowanych planach posiłków:

### POST /api/feedback

Tworzy nową opinię dla aktualnego planu posiłków użytkownika. Użytkownik musi mieć wygenerowany plan, aby móc go ocenić. Dozwolone jest wielokrotne ocenianie tego samego planu (użytkownik może zmienić zdanie).

### PUT /api/feedback/:id

Aktualizuje istniejącą opinię. Użytkownik może edytować tylko swoje własne opinie. Weryfikacja własności odbywa się przez relację `feedback.meal_plan_id → meal_plans.user_id`.

**Główne funkcjonalności**:

- Zbieranie feedbacku użytkowników (thumbs up/down + opcjonalny komentarz)
- Śledzenie satysfakcji użytkowników z generowanych planów
- Integracja z systemem analytics
- Zabezpieczenie przed edycją cudzych opinii (IDOR protection)

---

## 2. Szczegóły żądania

### POST /api/feedback

**Metoda HTTP**: `POST`

**Struktura URL**: `/api/feedback`

**Authentication**: Required (JWT token w nagłówku `Authorization: Bearer <token>`)

**Parametry**:

- **Wymagane**:
  - `rating` (string, body): Ocena planu - enum `THUMBS_UP` lub `THUMBS_DOWN`
- **Opcjonalne**:
  - `comment` (string, body): Opcjonalny komentarz użytkownika, maksymalnie 500 znaków

**Request Body** (JSON):

```json
{
  "rating": "THUMBS_UP",
  "comment": "Świetne propozycje, wszystko było pyszne!"
}
```

**Content-Type**: `application/json`

---

### PUT /api/feedback/:id

**Metoda HTTP**: `PUT`

**Struktura URL**: `/api/feedback/:id`

**Authentication**: Required (JWT token w nagłówku `Authorization: Bearer <token>`)

**Parametry URL**:

- **Wymagane**:
  - `id` (string, URL param): UUID opinii do zaktualizowania

**Parametry Body**:

- **Opcjonalne** (co najmniej jedno pole jest wymagane):
  - `rating` (string): Nowa ocena - enum `THUMBS_UP` lub `THUMBS_DOWN`
  - `comment` (string): Nowy komentarz, maksymalnie 500 znaków

**Request Body** (JSON):

```json
{
  "rating": "THUMBS_DOWN",
  "comment": "Jednak nie spodobało mi się śniadanie"
}
```

**Content-Type**: `application/json`

---

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

Z pliku `src/types.ts`:

```typescript
/**
 * DTO dla tworzenia feedbacku (POST /api/feedback)
 * Omits: id, created_at (auto-generated), meal_plan_id (z kontekstu)
 */
export type CreateFeedbackDTO = {
  rating: Rating;
  comment?: string;
};

/**
 * DTO dla aktualizacji feedbacku (PUT /api/feedback/:id)
 * Wszystkie pola opcjonalne - partial update
 */
export type UpdateFeedbackDTO = {
  rating?: Rating;
  comment?: string;
};

/**
 * DTO dla odpowiedzi (GET/POST/PUT responses)
 */
export type FeedbackDTO = {
  id: string;
  meal_plan_id: string;
  rating: Rating;
  comment: string | null;
  created_at: string;
};

/**
 * Enum typu oceny
 */
export type Rating = "THUMBS_UP" | "THUMBS_DOWN";
```

### Schemat Walidacji (Zod)

Nowy plik: `src/lib/schemas/feedback.schema.ts`

```typescript
import { z } from "zod";

/**
 * Schema dla tworzenia feedbacku
 */
export const createFeedbackSchema = z.object({
  rating: z.enum(["THUMBS_UP", "THUMBS_DOWN"], {
    errorMap: () => ({ message: "Ocena jest wymagana i musi być THUMBS_UP lub THUMBS_DOWN" }),
  }),
  comment: z
    .string()
    .max(500, { message: "Komentarz może mieć maksymalnie 500 znaków" })
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
});

/**
 * Schema dla aktualizacji feedbacku
 * Co najmniej jedno pole musi być podane
 */
export const updateFeedbackSchema = z
  .object({
    rating: z.enum(["THUMBS_UP", "THUMBS_DOWN"]).optional(),
    comment: z
      .string()
      .max(500, { message: "Komentarz może mieć maksymalnie 500 znaków" })
      .optional()
      .or(z.literal(""))
      .transform((val) => (val === "" ? undefined : val)),
  })
  .refine((data) => data.rating !== undefined || data.comment !== undefined, {
    message: "Co najmniej jedno pole (rating lub comment) musi być podane",
  });

/**
 * Schema dla UUID w URL params
 */
export const feedbackIdSchema = z.string().uuid({
  message: "Nieprawidłowy format ID opinii",
});
```

### Service Types

Nowy plik: `src/lib/services/feedback.service.ts`

```typescript
/**
 * Błąd dla sytuacji gdy feedback nie został znaleziony
 */
export class FeedbackNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeedbackNotFoundError";
  }
}

/**
 * Błąd dla sytuacji gdy użytkownik próbuje edytować cudzą opinię
 */
export class FeedbackForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeedbackForbiddenError";
  }
}

/**
 * Ogólny błąd serwisu feedback
 */
export class FeedbackServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeedbackServiceError";
  }
}
```

---

## 4. Szczegóły odpowiedzi

### POST /api/feedback

**Success Response** (201 Created):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "meal_plan_id": "123e4567-e89b-12d3-a456-426614174000",
  "rating": "THUMBS_UP",
  "comment": "Świetne propozycje, wszystko było pyszne!",
  "created_at": "2025-10-27T15:00:00.000Z"
}
```

**Error Responses**:

- **400 Bad Request** (walidacja)

```json
{
  "error": "Validation error",
  "details": ["Ocena jest wymagana", "Komentarz może mieć maksymalnie 500 znaków"]
}
```

- **401 Unauthorized**

```json
{
  "error": "Unauthorized",
  "message": "Musisz być zalogowany, aby wykonać tę akcję"
}
```

- **404 Not Found** (brak meal plan)

```json
{
  "error": "Not found",
  "message": "Nie znaleziono planu posiłków do oceny"
}
```

- **500 Internal Server Error**

```json
{
  "error": "Internal server error",
  "message": "Wystąpił błąd podczas zapisywania opinii"
}
```

---

### PUT /api/feedback/:id

**Success Response** (200 OK):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "meal_plan_id": "123e4567-e89b-12d3-a456-426614174000",
  "rating": "THUMBS_DOWN",
  "comment": "Jednak nie spodobało mi się śniadanie",
  "created_at": "2025-10-27T15:00:00.000Z"
}
```

**Error Responses**:

- **400 Bad Request** (walidacja)

```json
{
  "error": "Validation error",
  "details": ["Nieprawidłowy format ID opinii", "Komentarz może mieć maksymalnie 500 znaków"]
}
```

- **401 Unauthorized**

```json
{
  "error": "Unauthorized",
  "message": "Musisz być zalogowany, aby wykonać tę akcję"
}
```

- **403 Forbidden** (próba edycji cudzej opinii)

```json
{
  "error": "Forbidden",
  "message": "Nie możesz edytować cudzej opinii"
}
```

- **404 Not Found** (feedback nie istnieje)

```json
{
  "error": "Not found",
  "message": "Nie znaleziono opinii o podanym ID"
}
```

- **500 Internal Server Error**

```json
{
  "error": "Internal server error",
  "message": "Wystąpił błąd podczas aktualizacji opinii"
}
```

---

## 5. Przepływ danych

### POST /api/feedback - Tworzenie opinii

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/feedback
       │ { rating, comment }
       │ Authorization: Bearer <token>
       ▼
┌─────────────────────────────────────────────────────┐
│ 1. Middleware (src/middleware/index.ts)             │
│    - Weryfikacja JWT token                          │
│    - Utworzenie authenticated Supabase client       │
│    - Przekazanie user context w context.locals      │
└─────────────┬───────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────────────┐
│ 2. API Endpoint (src/pages/api/feedback.ts)        │
│    - Walidacja request body (Zod schema)            │
│    - Wyciągnięcie user_id z JWT                     │
└─────────────┬───────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────────────┐
│ 3. FeedbackService.createFeedback()                 │
│    ├─ a) Wywołanie MealPlansService                 │
│    │      .getCurrentMealPlan(userId)                │
│    │      → Pobiera meal_plan_id                     │
│    │      → Rzuca MealPlanNotFoundError jeśli brak   │
│    │                                                  │
│    ├─ b) INSERT do tabeli feedback                  │
│    │      (meal_plan_id, rating, comment)            │
│    │      → RLS automatycznie weryfikuje dostęp      │
│    │                                                  │
│    └─ c) Return FeedbackDTO                         │
└─────────────┬───────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────────────┐
│ 4. Analytics Logging (non-blocking)                 │
│    - AnalyticsService.logEvent()                    │
│    - Event: "feedback_given"                        │
│    - Metadata: { feedback_id, rating, plan_id }     │
│    - Błędy są logowane ale nie przerywają flow      │
└─────────────┬───────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────────────┐
│ 5. Response                                         │
│    - 201 Created + FeedbackDTO                      │
│    - Lub odpowiedni error (400/401/404/500)         │
└─────────────┬───────────────────────────────────────┘
              ▼
       ┌──────────────┐
       │    Client    │
       └──────────────┘
```

### PUT /api/feedback/:id - Aktualizacja opinii

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ PUT /api/feedback/:id
       │ { rating?, comment? }
       │ Authorization: Bearer <token>
       ▼
┌─────────────────────────────────────────────────────┐
│ 1. Middleware (src/middleware/index.ts)             │
│    - Weryfikacja JWT token                          │
│    - Utworzenie authenticated Supabase client       │
└─────────────┬───────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────────────┐
│ 2. API Endpoint (src/pages/api/feedback/[id].ts)   │
│    - Walidacja URL param :id (UUID format)          │
│    - Walidacja request body (Zod schema)            │
│    - Wyciągnięcie user_id z JWT                     │
└─────────────┬───────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────────────┐
│ 3. FeedbackService.updateFeedback()                 │
│    ├─ a) Pobranie istniejącego feedback             │
│    │      SELECT * FROM feedback                     │
│    │      WHERE id = :id                             │
│    │      → JOIN meal_plans ON meal_plan_id          │
│    │      → Sprawdzenie user_id ownership            │
│    │      → 404 jeśli nie istnieje                   │
│    │      → 403 jeśli inny użytkownik                │
│    │                                                  │
│    ├─ b) UPDATE tabeli feedback                     │
│    │      SET rating = ..., comment = ...            │
│    │      WHERE id = :id                             │
│    │      → RLS automatycznie weryfikuje dostęp      │
│    │                                                  │
│    └─ c) Return FeedbackDTO                         │
└─────────────┬───────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────────────────┐
│ 4. Response                                         │
│    - 200 OK + FeedbackDTO                           │
│    - Lub odpowiedni error (400/401/403/404/500)     │
└─────────────┬───────────────────────────────────────┘
              ▼
       ┌──────────────┐
       │    Client    │
       └──────────────┘
```

### Interakcje z bazą danych

**Struktura tabeli feedback**:

```sql
CREATE TABLE feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id uuid NOT NULL
    REFERENCES meal_plans(id) ON DELETE CASCADE,
  rating rating_enum NOT NULL,
  comment text CHECK (length(comment) <= 500),
  created_at timestamptz DEFAULT now()
);

-- Index dla wydajności
CREATE INDEX idx_feedback_meal_plan_id ON feedback(meal_plan_id);
```

**Row Level Security Policy**:

```sql
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access feedback for their meal plans"
ON feedback
USING (
  auth.uid() = (
    SELECT user_id
    FROM meal_plans
    WHERE id = meal_plan_id
  )
);
```

---

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie (Authentication)

**Mechanizm**: Supabase Auth z JWT tokens

**Implementacja**:

- Middleware sprawdza obecność i ważność tokena JWT w nagłówku `Authorization`
- Token zawiera `user_id` w payload (dostępne jako `auth.uid()` w RLS)
- Brak tokena lub nieprawidłowy token → 401 Unauthorized

**Kod w middleware**:

```typescript
// src/middleware/index.ts
const authHeader = context.request.headers.get("authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Musisz być zalogowany, aby wykonać tę akcję",
    }),
    { status: 401 }
  );
}
```

### 6.2 Autoryzacja (Authorization)

**Zabezpieczenie przed IDOR (Insecure Direct Object Reference)**:

Problem: Użytkownik mógłby próbować edytować opinię innego użytkownika podając jej ID w PUT request.

**Rozwiązanie - wielowarstwowe zabezpieczenie**:

1. **Row Level Security (warstwa bazy danych)**:

   ```sql
   -- Automatyczne filtrowanie przez Supabase
   -- Użytkownik może dostać tylko feedback związany z jego meal_plans
   CREATE POLICY ... USING (
     auth.uid() = (SELECT user_id FROM meal_plans WHERE id = meal_plan_id)
   )
   ```

2. **Weryfikacja w service layer**:

   ```typescript
   // Jawna weryfikacja własności przed update
   const feedback = await this.getFeedbackWithOwnership(feedbackId, userId);
   if (!feedback) throw new FeedbackNotFoundError(...);
   if (feedback.meal_plan.user_id !== userId) {
     throw new FeedbackForbiddenError("Nie możesz edytować cudzej opinii");
   }
   ```

3. **Wykorzystanie authenticated Supabase client**:
   - Client utworzony w middleware zawiera JWT użytkownika
   - RLS policies są automatycznie egzekwowane dla wszystkich zapytań
   - Nie ma potrzeby ręcznego filtrowania po `user_id` w kodzie aplikacji

### 6.3 Walidacja danych wejściowych

**Zod schemas** zapewniają:

- Type safety
- Runtime validation
- Clear error messages w języku polskim

**Chronią przed**:

- Invalid enum values dla `rating`
- Komentarze dłuższe niż 500 znaków (zapobiega DB errors)
- Invalid UUID format w URL params
- Empty updates (wymuszenie co najmniej jednego pola w PUT)

### 6.4 Zabezpieczenia dodatkowe

**SQL Injection**:

- Supabase Client SDK używa prepared statements
- Nie ma konkatenacji stringów w queries

**XSS (Cross-Site Scripting)**:

- Backend nie sanitize'uje HTML (to zadanie frontendu)
- Przy wyświetlaniu komentarzy frontend musi escape'ować HTML
- React domyślnie escape'uje text content

**Rate Limiting**:

- Brak w MVP
- Można dodać w przyszłości przez middleware lub Supabase Edge Functions
- Warto rozważyć limit opinii na godzinę/dzień per user

**Spam Protection**:

- Obecnie brak dedykowanych mechanizmów
- Analytics będą śledzić częstotliwość feedback
- Możliwość dodania soft delete zamiast CASCADE

---

## 7. Obsługa błędów

### 7.1 Hierarchia błędów

```typescript
// Custom errors z feedback.service.ts
FeedbackNotFoundError; // 404 - feedback nie istnieje
FeedbackForbiddenError; // 403 - próba edycji cudzej opinii
FeedbackServiceError; // 500 - błędy bazy danych

// Re-used errors z meal-plans.service.ts
MealPlanNotFoundError; // 404 - user nie ma planu (POST only)
MealPlanServiceError; // 500 - błąd pobierania planu
```

### 7.2 Szczegółowe scenariusze błędów

#### POST /api/feedback

| Kod | Scenariusz               | Message                                                    | Handling                |
| --- | ------------------------ | ---------------------------------------------------------- | ----------------------- |
| 400 | Brak `rating` w body     | "Ocena jest wymagana"                                      | Zod validation          |
| 400 | Invalid `rating` value   | "Ocena jest wymagana i musi być THUMBS_UP lub THUMBS_DOWN" | Zod enum validation     |
| 400 | `comment` > 500 chars    | "Komentarz może mieć maksymalnie 500 znaków"               | Zod string validation   |
| 401 | Brak JWT token           | "Musisz być zalogowany, aby wykonać tę akcję"              | Middleware check        |
| 401 | Expired/invalid JWT      | "Musisz być zalogowany, aby wykonać tę akcję"              | Supabase auth error     |
| 404 | User nie ma meal plan    | "Nie znaleziono planu posiłków do oceny"                   | `MealPlanNotFoundError` |
| 500 | Database connection fail | "Wystąpił błąd podczas zapisywania opinii"                 | Catch all DB errors     |
| 500 | RLS policy violation     | "Wystąpił błąd podczas zapisywania opinii"                 | Supabase error          |

#### PUT /api/feedback/:id

| Kod | Scenariusz                      | Message                                                       | Handling                 |
| --- | ------------------------------- | ------------------------------------------------------------- | ------------------------ |
| 400 | Invalid UUID format             | "Nieprawidłowy format ID opinii"                              | Zod UUID validation      |
| 400 | Empty body / no fields          | "Co najmniej jedno pole (rating lub comment) musi być podane" | Zod refine               |
| 400 | Invalid `rating` value          | "Ocena musi być THUMBS_UP lub THUMBS_DOWN"                    | Zod enum validation      |
| 400 | `comment` > 500 chars           | "Komentarz może mieć maksymalnie 500 znaków"                  | Zod string validation    |
| 401 | Brak JWT token                  | "Musisz być zalogowany, aby wykonać tę akcję"                 | Middleware check         |
| 403 | Feedback należy do innego usera | "Nie możesz edytować cudzej opinii"                           | `FeedbackForbiddenError` |
| 404 | Feedback ID nie istnieje        | "Nie znaleziono opinii o podanym ID"                          | `FeedbackNotFoundError`  |
| 500 | Database connection fail        | "Wystąpił błąd podczas aktualizacji opinii"                   | Catch all DB errors      |

### 7.3 Error Response Format

**Validation Errors (400)**:

```json
{
  "error": "Validation error",
  "details": ["Ocena jest wymagana", "Komentarz może mieć maksymalnie 500 znaków"]
}
```

**Single Error (401/403/404/500)**:

```json
{
  "error": "Not found",
  "message": "Nie znaleziono planu posiłków do oceny"
}
```

### 7.4 Error Handling Strategy w kodzie

```typescript
// W API endpoint
try {
  const feedback = await feedbackService.createFeedback(userId, data);
  return new Response(JSON.stringify(feedback), { status: 201 });
} catch (error) {
  // MealPlanNotFoundError → 404
  if (error instanceof MealPlanNotFoundError) {
    return new Response(JSON.stringify({ error: "Not found", message: error.message }), { status: 404 });
  }

  // FeedbackNotFoundError → 404
  if (error instanceof FeedbackNotFoundError) {
    return new Response(JSON.stringify({ error: "Not found", message: error.message }), { status: 404 });
  }

  // FeedbackForbiddenError → 403
  if (error instanceof FeedbackForbiddenError) {
    return new Response(JSON.stringify({ error: "Forbidden", message: error.message }), { status: 403 });
  }

  // Inne błędy → 500
  console.error("[API /feedback] Unexpected error:", error);
  return new Response(
    JSON.stringify({
      error: "Internal server error",
      message: "Wystąpił błąd podczas zapisywania opinii",
    }),
    { status: 500 }
  );
}
```

### 7.5 Logging Strategy

**Production Logging** (nie w MVP ale good practice):

```typescript
console.error("[FeedbackService] Operation failed", {
  operation: "createFeedback",
  userId: userId,
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString(),
});
```

**Analytics Logging** (non-blocking):

- Błędy nie powinny być logowane do `analytics_events` w przypadku feedback
- Tylko success case loguje `feedback_given`
- Jeśli analytics logging failuje, nie przerywamy procesu tworzenia feedback

---

## 8. Rozważania dotyczące wydajności

### 8.1 Database Performance

**Indeksy**:

```sql
-- Niezbędne dla wydajności
CREATE INDEX idx_feedback_meal_plan_id ON feedback(meal_plan_id);

-- meal_plans już ma index na user_id (UNIQUE constraint)
-- Wykorzystywany w JOIN dla weryfikacji ownership
```

**Query Optimization**:

- POST: Single query do meal_plans (getCurrentMealPlan) + single INSERT
- PUT: Single SELECT z JOIN + single UPDATE
- Brak N+1 queries
- RLS policies wykorzystują existing indexes

### 8.2 Caching Strategy

**Feedback nie jest cache'owany**:

- Dane zmieniają się często (user może edytować opinię)
- Nie ma sensu cache'ować pojedynczych feedbacks
- Lista feedbacks dla meal plan może być cache'owana na frontendzie (short TTL)

**Meal Plan jest już cache'owany**:

- `MealPlansService.getCurrentMealPlan()` może wykorzystywać cache
- Zwiększa performance POST /api/feedback

### 8.3 Payload Size

**Request**:

- Bardzo małe payloads (< 1KB zazwyczaj)
- `rating` to enum (kilka bajtów)
- `comment` max 500 chars = ~500 bytes UTF-8

**Response**:

- FeedbackDTO to ~200-600 bytes
- Brak potrzeby paginacji (single record response)

### 8.4 Connection Pooling

**Supabase client**:

- Używa connection pooling out-of-the-box
- Nie ma potrzeby manual management
- Authenticated client z middleware jest reused w ramach request

### 8.5 Rate Limiting Considerations

**Nie zaimplementowane w MVP**, ale warto rozważyć:

- Limit: 10 feedback submissions per user per hour
- Zapobiega spamowi i abuse
- Można zaimplementować przez:
  - Middleware counting recent feedback
  - Supabase Edge Functions
  - Redis cache (overkill dla MVP)

### 8.6 Potential Bottlenecks

**1. RLS Policy z JOIN**:

```sql
-- Ta policy wykonuje subquery dla każdego row
auth.uid() = (SELECT user_id FROM meal_plans WHERE id = meal_plan_id)
```

- Performance: Dobra dzięki index na `meal_plans.id` (PK)
- Optymalizacja: Index już istnieje, brak akcji

**2. Analytics Logging**:

- Wykonywany synchronicznie po utworzeniu feedback
- Potencjalnie spowalnia response time
- **Rozwiązanie**: Fire-and-forget pattern (log errors, don't throw)

```typescript
// Non-blocking analytics
try {
  await analyticsService.logEvent(userId, "feedback_given", metadata);
} catch (error) {
  // Log error but don't fail the request
  console.error("[FeedbackService] Analytics logging failed:", error);
}
```

**3. Multiple Feedback per Plan**:

- User może dodać wiele opinii dla tego samego planu
- Może prowadzić do "spam" scenarios
- Monitoring przez analytics wystarczy w MVP

---

## 9. Etapy wdrożenia

### Krok 1: Utworzenie Zod schemas dla walidacji

**Plik**: `src/lib/schemas/feedback.schema.ts`

**Zadania**:

1. Zaimportować `z` z `zod`
2. Utworzyć `createFeedbackSchema`:
   - `rating`: required enum (THUMBS_UP, THUMBS_DOWN)
   - `comment`: optional string, max 500 chars
   - Custom error messages w języku polskim
3. Utworzyć `updateFeedbackSchema`:
   - Wszystkie pola optional
   - Walidacja że co najmniej jedno pole jest podane (`.refine()`)
4. Utworzyć `feedbackIdSchema` dla UUID validation
5. Dodać type exports: `CreateFeedbackInput`, `UpdateFeedbackInput`

**Testy ręczne**:

```typescript
// Valid
createFeedbackSchema.parse({ rating: "THUMBS_UP", comment: "Great!" });

// Invalid - missing rating
createFeedbackSchema.parse({ comment: "Great!" }); // Should throw

// Invalid - comment too long
createFeedbackSchema.parse({
  rating: "THUMBS_UP",
  comment: "x".repeat(501),
}); // Should throw
```

---

### Krok 2: Utworzenie FeedbackService

**Plik**: `src/lib/services/feedback.service.ts`

**Zadania**:

1. **Zdefiniować custom errors**:

   ```typescript
   export class FeedbackNotFoundError extends Error
   export class FeedbackForbiddenError extends Error
   export class FeedbackServiceError extends Error
   ```

2. **Utworzyć klasę FeedbackService**:

   ```typescript
   export class FeedbackService {
     constructor(
       private supabase: SupabaseClient,
       private mealPlansService: MealPlansService,
       private analyticsService: AnalyticsService
     ) {}
   }
   ```

3. **Zaimplementować metodę `createFeedback()`**:
   - Input: `userId: string`, `data: CreateFeedbackDTO`
   - Logika:
     - a) Wywołać `mealPlansService.getCurrentMealPlan(userId)`
     - b) Jeśli brak planu → throw `MealPlanNotFoundError`
     - c) INSERT do tabeli `feedback` z `meal_plan_id`
     - d) Wywołać `analyticsService.logEvent()` (non-blocking)
     - e) Return `FeedbackDTO`
   - Error handling dla DB errors

4. **Zaimplementować metodę `updateFeedback()`**:
   - Input: `userId: string`, `feedbackId: string`, `data: UpdateFeedbackDTO`
   - Logika:
     - a) SELECT feedback JOIN meal_plans dla ownership check
     - b) Jeśli nie istnieje → throw `FeedbackNotFoundError`
     - c) Jeśli `meal_plan.user_id !== userId` → throw `FeedbackForbiddenError`
     - d) UPDATE feedback
     - e) Return updated `FeedbackDTO`
   - Error handling dla DB errors

5. **Pomocnicza metoda `getFeedbackWithOwnership()`**:

   ```typescript
   private async getFeedbackWithOwnership(feedbackId: string, userId: string) {
     const { data, error } = await this.supabase
       .from("feedback")
       .select(`
         *,
         meal_plan:meal_plans!inner(user_id)
       `)
       .eq("id", feedbackId)
       .single();
     // ...
   }
   ```

6. **Factory function**:
   ```typescript
   export function createFeedbackService(
     supabase: SupabaseClient,
     mealPlansService: MealPlansService,
     analyticsService: AnalyticsService
   ): FeedbackService {
     return new FeedbackService(supabase, mealPlansService, analyticsService);
   }
   ```

**Przykładowe użycie**:

```typescript
const feedbackService = createFeedbackService(supabase, mealPlansService, analyticsService);
const feedback = await feedbackService.createFeedback(userId, {
  rating: "THUMBS_UP",
  comment: "Great meals!",
});
```

---

### Krok 3: Utworzenie POST endpoint `/api/feedback`

**Plik**: `src/pages/api/feedback.ts`

**Zadania**:

1. **Importy**:

   ```typescript
   import type { APIRoute } from "astro";
   import { createFeedbackSchema } from "@/lib/schemas/feedback.schema";
   import { createFeedbackService } from "@/lib/services/feedback.service";
   import { createMealPlansService } from "@/lib/services/meal-plans.service";
   import { createAnalyticsService } from "@/lib/services/analytics.service";
   import { MealPlanNotFoundError } from "@/lib/services/meal-plans.service";
   // ... inne errors
   ```

2. **Konfiguracja**:

   ```typescript
   export const prerender = false;
   ```

3. **Handler POST**:

   ```typescript
   export const POST: APIRoute = async (context) => {
     // 1. Check authentication (user available from middleware)
     const supabase = context.locals.supabase;
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

     // 2. Parse and validate request body
     let requestData;
     try {
       const body = await context.request.json();
       requestData = createFeedbackSchema.parse(body);
     } catch (error) {
       // Zod validation errors
       if (error instanceof z.ZodError) {
         return new Response(
           JSON.stringify({
             error: "Validation error",
             details: error.errors.map((e) => e.message),
           }),
           { status: 400 }
         );
       }
       // JSON parse errors
       return new Response(
         JSON.stringify({
           error: "Bad request",
           message: "Nieprawidłowy format danych",
         }),
         { status: 400 }
       );
     }

     // 3. Create services
     const mealPlansService = createMealPlansService(supabase);
     const analyticsService = createAnalyticsService(supabase);
     const feedbackService = createFeedbackService(supabase, mealPlansService, analyticsService);

     // 4. Create feedback
     try {
       const feedback = await feedbackService.createFeedback(user.id, requestData);

       return new Response(JSON.stringify(feedback), {
         status: 201,
         headers: { "Content-Type": "application/json" },
       });
     } catch (error) {
       // Handle known errors
       if (error instanceof MealPlanNotFoundError) {
         return new Response(
           JSON.stringify({
             error: "Not found",
             message: error.message,
           }),
           { status: 404 }
         );
       }

       // Handle unexpected errors
       console.error("[API /feedback POST] Error:", error);
       return new Response(
         JSON.stringify({
           error: "Internal server error",
           message: "Wystąpił błąd podczas zapisywania opinii",
         }),
         { status: 500 }
       );
     }
   };
   ```

4. **Dodać handler dla innych metod (opcjonalnie)**:
   ```typescript
   export const ALL: APIRoute = async () => {
     return new Response(
       JSON.stringify({
         error: "Method not allowed",
       }),
       { status: 405 }
     );
   };
   ```

---

### Krok 4: Utworzenie PUT endpoint `/api/feedback/[id].ts`

**Plik**: `src/pages/api/feedback/[id].ts`

**Zadania**:

1. **Struktura podobna do POST**, ale z dodatkowymi krokami:

2. **Handler PUT**:

   ```typescript
   export const PUT: APIRoute = async (context) => {
     // 1. Check authentication
     const supabase = context.locals.supabase;
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

     // 2. Validate feedback ID from URL params
     const feedbackId = context.params.id;
     try {
       feedbackIdSchema.parse(feedbackId);
     } catch (error) {
       return new Response(
         JSON.stringify({
           error: "Bad request",
           message: "Nieprawidłowy format ID opinii",
         }),
         { status: 400 }
       );
     }

     // 3. Parse and validate request body
     let requestData;
     try {
       const body = await context.request.json();
       requestData = updateFeedbackSchema.parse(body);
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
       return new Response(
         JSON.stringify({
           error: "Bad request",
           message: "Nieprawidłowy format danych",
         }),
         { status: 400 }
       );
     }

     // 4. Create services
     const mealPlansService = createMealPlansService(supabase);
     const analyticsService = createAnalyticsService(supabase);
     const feedbackService = createFeedbackService(supabase, mealPlansService, analyticsService);

     // 5. Update feedback
     try {
       const feedback = await feedbackService.updateFeedback(user.id, feedbackId, requestData);

       return new Response(JSON.stringify(feedback), {
         status: 200,
         headers: { "Content-Type": "application/json" },
       });
     } catch (error) {
       // Handle FeedbackNotFoundError → 404
       if (error instanceof FeedbackNotFoundError) {
         return new Response(
           JSON.stringify({
             error: "Not found",
             message: error.message,
           }),
           { status: 404 }
         );
       }

       // Handle FeedbackForbiddenError → 403
       if (error instanceof FeedbackForbiddenError) {
         return new Response(
           JSON.stringify({
             error: "Forbidden",
             message: error.message,
           }),
           { status: 403 }
         );
       }

       // Handle unexpected errors
       console.error("[API /feedback/[id] PUT] Error:", error);
       return new Response(
         JSON.stringify({
           error: "Internal server error",
           message: "Wystąpił błąd podczas aktualizacji opinii",
         }),
         { status: 500 }
       );
     }
   };
   ```

---

### Krok 5: Weryfikacja middleware dla autentykacji

**Plik**: `src/middleware/index.ts` (existing)

**Zadania**:

1. Sprawdzić czy middleware poprawnie weryfikuje JWT token
2. Sprawdzić czy `context.locals.supabase` zawiera authenticated client
3. Sprawdzić czy endpointy API mają dostęp do `user.id`

**Nie powinno wymagać zmian** - feedback endpoints używają tego samego mechanizmu co istniejące endpointy (preferences, meal-plans).

---

### Krok 6: Integracja z AnalyticsService

**Plik**: `src/lib/services/analytics.service.ts` (existing)

**Zadania**:

1. Sprawdzić czy istnieje metoda `logEvent(userId, actionType, metadata?)`
2. Upewnić się że `actionType` enum zawiera `"feedback_given"`
3. W `FeedbackService.createFeedback()` wywołać:
   ```typescript
   // Non-blocking analytics logging
   try {
     await this.analyticsService.logEvent(userId, "feedback_given", {
       feedback_id: feedback.id,
       meal_plan_id: feedback.meal_plan_id,
       rating: feedback.rating,
     });
   } catch (error) {
     console.error("[FeedbackService] Analytics logging failed:", error);
     // Don't throw - this shouldn't fail the feedback creation
   }
   ```

---

### Krok 7: Testowanie endpointów

**Narzędzia**: Postman, curl, lub automated tests

**Test Cases dla POST /api/feedback**:

1. **Happy path** (201):

   ```bash
   curl -X POST http://localhost:4321/api/feedback \
     -H "Authorization: Bearer <valid-jwt>" \
     -H "Content-Type: application/json" \
     -d '{
       "rating": "THUMBS_UP",
       "comment": "Świetne posiłki!"
     }'
   ```

   Expected: 201 Created + FeedbackDTO

2. **Missing rating** (400):

   ```bash
   curl -X POST http://localhost:4321/api/feedback \
     -H "Authorization: Bearer <valid-jwt>" \
     -H "Content-Type: application/json" \
     -d '{ "comment": "Test" }'
   ```

   Expected: 400 + validation error

3. **Comment too long** (400):

   ```bash
   curl -X POST http://localhost:4321/api/feedback \
     -H "Authorization: Bearer <valid-jwt>" \
     -H "Content-Type: application/json" \
     -d '{
       "rating": "THUMBS_UP",
       "comment": "'$(python3 -c 'print("x" * 501)')'"
     }'
   ```

   Expected: 400 + "max 500 znaków"

4. **No JWT token** (401):

   ```bash
   curl -X POST http://localhost:4321/api/feedback \
     -H "Content-Type: application/json" \
     -d '{ "rating": "THUMBS_UP" }'
   ```

   Expected: 401 Unauthorized

5. **No meal plan** (404):
   ```bash
   # User without meal plan
   curl -X POST http://localhost:4321/api/feedback \
     -H "Authorization: Bearer <valid-jwt-no-plan>" \
     -H "Content-Type: application/json" \
     -d '{ "rating": "THUMBS_UP" }'
   ```
   Expected: 404 + "Nie znaleziono planu"

**Test Cases dla PUT /api/feedback/:id**:

1. **Happy path** (200):

   ```bash
   curl -X PUT http://localhost:4321/api/feedback/<feedback-id> \
     -H "Authorization: Bearer <valid-jwt>" \
     -H "Content-Type: application/json" \
     -d '{
       "rating": "THUMBS_DOWN",
       "comment": "Zmieniam zdanie"
     }'
   ```

   Expected: 200 OK + updated FeedbackDTO

2. **Invalid UUID** (400):

   ```bash
   curl -X PUT http://localhost:4321/api/feedback/invalid-uuid \
     -H "Authorization: Bearer <valid-jwt>" \
     -H "Content-Type: application/json" \
     -d '{ "rating": "THUMBS_DOWN" }'
   ```

   Expected: 400 + "Nieprawidłowy format ID"

3. **Empty body** (400):

   ```bash
   curl -X PUT http://localhost:4321/api/feedback/<feedback-id> \
     -H "Authorization: Bearer <valid-jwt>" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

   Expected: 400 + "Co najmniej jedno pole"

4. **Editing other user's feedback** (403):

   ```bash
   # User A trying to edit User B's feedback
   curl -X PUT http://localhost:4321/api/feedback/<user-b-feedback-id> \
     -H "Authorization: Bearer <user-a-jwt>" \
     -H "Content-Type: application/json" \
     -d '{ "rating": "THUMBS_UP" }'
   ```

   Expected: 403 Forbidden

5. **Non-existent feedback** (404):
   ```bash
   curl -X PUT http://localhost:4321/api/feedback/00000000-0000-0000-0000-000000000000 \
     -H "Authorization: Bearer <valid-jwt>" \
     -H "Content-Type: application/json" \
     -d '{ "rating": "THUMBS_UP" }'
   ```
   Expected: 404 Not Found

---

### Krok 8: Weryfikacja RLS policies w Supabase

**Lokalizacja**: Supabase Dashboard → Database → Tables → feedback

**Zadania**:

1. **Sprawdzić czy RLS jest włączone**:

   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE tablename = 'feedback';
   ```

   Expected: `rowsecurity = true`

2. **Sprawdzić istniejącą policy**:

   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'feedback';
   ```

   Expected: Policy z warunkiem `auth.uid() = (SELECT user_id FROM meal_plans WHERE id = meal_plan_id)`

3. **Jeśli policy nie istnieje, utworzyć**:

   ```sql
   ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can only access feedback for their meal plans"
   ON feedback
   FOR ALL
   USING (
     auth.uid() = (
       SELECT user_id
       FROM meal_plans
       WHERE id = meal_plan_id
     )
   );
   ```

4. **Test RLS policy**:
   - Utworzyć feedback dla User A
   - Spróbować pobrać go jako User B przez raw SQL
   - Powinien zwrócić 0 rows

---

### Krok 9: Dokumentacja i aktualizacja types

**Zadania**:

1. **Sprawdzić `src/types.ts`**:
   - Verify `CreateFeedbackDTO` is correctly defined
   - Verify `UpdateFeedbackDTO` is correctly defined
   - Verify `FeedbackDTO` is correctly defined
   - Verify `Rating` enum is exported

2. **Dodać JSDoc comments** do nowych funkcji w service:

   ```typescript
   /**
    * Creates feedback for user's current meal plan
    *
    * @param userId - User's unique identifier from JWT
    * @param data - Feedback data (rating + optional comment)
    * @returns Promise resolving to created FeedbackDTO
    * @throws MealPlanNotFoundError if user has no meal plan
    * @throws FeedbackServiceError if database operation fails
    */
   async createFeedback(userId: string, data: CreateFeedbackDTO): Promise<FeedbackDTO>
   ```

3. **Aktualizacja `.ai/api-plan.md`** (jeśli potrzebne):
   - Verify endpoint specifications match implementation
   - Add any discovered edge cases

---

### Krok 10: Error monitoring i logging

**Zadania**:

1. **Dodać structured logging** w service:

   ```typescript
   console.error("[FeedbackService] Operation failed", {
     operation: "createFeedback",
     userId: userId,
     error: error.message,
     timestamp: new Date().toISOString(),
   });
   ```

2. **Dodać logging w API endpoints**:

   ```typescript
   console.log("[API /feedback POST] Creating feedback", {
     userId: user.id,
     hasComment: !!requestData.comment,
   });
   ```

3. **Monitoring analytics logging failures**:
   - Ensure analytics errors are logged but don't fail requests
   - Consider adding alerts if analytics fail rate is high

---

### Krok 11: Performance testing i optimization

**Zadania**:

1. **Test database query performance**:

   ```sql
   EXPLAIN ANALYZE
   SELECT f.*, mp.user_id
   FROM feedback f
   INNER JOIN meal_plans mp ON f.meal_plan_id = mp.id
   WHERE f.id = '<uuid>'
   AND mp.user_id = '<user-id>';
   ```

   - Verify index usage
   - Check query execution time (should be < 10ms)

2. **Test endpoint response times**:
   - POST /api/feedback: Should be < 200ms
   - PUT /api/feedback/:id: Should be < 150ms
   - If slower, investigate:
     - Database connection latency
     - Analytics service blocking
     - RLS policy overhead

3. **Load testing** (optional dla MVP):
   ```bash
   # Using Apache Bench
   ab -n 1000 -c 10 -H "Authorization: Bearer <jwt>" \
      -p feedback.json \
      -T application/json \
      http://localhost:4321/api/feedback
   ```

---

### Krok 12: Finalizacja i code review

**Checklist przed mergem**:

- [ ] Wszystkie pliki utworzone i zaimplementowane
- [ ] Zod schemas działają poprawnie
- [ ] FeedbackService testy ręczne przeszły
- [ ] Wszystkie endpointy zwracają poprawne status codes
- [ ] Error messages są po polsku i user-friendly
- [ ] RLS policies są włączone i działają
- [ ] Analytics events są logowane (non-blocking)
- [ ] Kod jest zgodny z coding guidelines (early returns, error handling)
- [ ] JSDoc comments dodane do public methods
- [ ] Linter errors fixed
- [ ] Struktura plików zgodna z `@shared.mdc`, `@backend.mdc`, `@astro.mdc`

**Code review focus areas**:

1. Security: IDOR protection, input validation
2. Error handling: Proper error types and messages
3. Performance: Query optimization, no N+1
4. Code style: Consistent with existing services
5. Type safety: Proper TypeScript usage

---

## 10. Pliki do utworzenia/zmodyfikowania

### Nowe pliki:

1. **`src/lib/schemas/feedback.schema.ts`** - Zod validation schemas
2. **`src/lib/services/feedback.service.ts`** - Business logic
3. **`src/pages/api/feedback.ts`** - POST endpoint
4. **`src/pages/api/feedback/[id].ts`** - PUT endpoint

### Istniejące pliki do zmodyfikowania:

1. **`src/lib/services/analytics.service.ts`** - Verify `feedback_given` event support
2. **`src/types.ts`** - Verify DTOs are correct (prawdopodobnie nie trzeba zmieniać)

### Database migrations (jeśli potrzebne):

1. Sprawdzić czy tabela `feedback` istnieje z poprawną strukturą
2. Sprawdzić czy RLS policy jest włączona

---

## 11. Referencje

### Istniejące implementacje do wzorowania się:

1. **`src/pages/api/preferences.ts`**:
   - Wzór obsługi POST/GET/PUT w jednym pliku
   - Wzór walidacji Zod
   - Wzór error handling

2. **`src/pages/api/meal-plans/index.ts`**:
   - Wzór integracji z service layer
   - Wzór async error handling
   - Wzór analytics logging

3. **`src/lib/services/meal-plans.service.ts`**:
   - Wzór struktury service class
   - Wzór custom errors
   - Wzór transformacji DB → DTO

### External documentation:

- Astro API Routes: https://docs.astro.build/en/core-concepts/endpoints/
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Zod validation: https://zod.dev/

---

_Document Version: 1.0_  
_Created: 2025-10-29_  
_Last Updated: 2025-10-29_
