# API Endpoint Implementation Plan: Log Analytics Event

## 1. Przegląd punktu końcowego

Endpoint `/api/analytics/events` służy do logowania zdarzeń analitycznych inicjowanych przez frontend. Jest to wspomagające narzędzie metryczne, które pozwala frontendowi rejestrować specyficzne zdarzenia użytkownika (np. `plan_accepted`), podczas gdy większość zdarzeń jest logowana automatycznie przez backend.

**Kluczowe charakterystyki**:

- **Non-blocking**: Błędy logowania nie mogą przerwać akcji użytkownika
- **Fail gracefully**: Endpoint zawsze zwraca sukces dla użytkownika, nawet jeśli logowanie do bazy się nie powiodło
- **Server-side metadata**: `user_id` i `timestamp` są zawsze generowane po stronie serwera dla bezpieczeństwa

## 2. Szczegóły żądania

### 2.1 Podstawowe informacje

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/analytics/events`
- **Content-Type**: `application/json`
- **Authentication**: Required (JWT Bearer token w nagłówku `Authorization`)

### 2.2 Parametry

#### Headers

- `Authorization` (string, required): Bearer token z JWT od Supabase Auth
  - Format: `Bearer <jwt-token>`

#### Request Body (JSON)

```json
{
  "action_type": "plan_accepted",
  "metadata": {
    "time_on_page": 45,
    "plan_id": "uuid-string"
  }
}
```

#### Parametry Body

- **`action_type`** (string, required): Typ zdarzenia analitycznego
  - Dozwolone wartości:
    - `user_registered`
    - `profile_created`
    - `profile_updated`
    - `plan_generated`
    - `plan_regenerated`
    - `plan_accepted`
    - `feedback_given`
    - `api_error`
  - Walidacja: Musi być jedną z wartości enuma `action_type_enum`
  - Komunikat błędu: "Nieprawidłowy typ akcji"

- **`metadata`** (object, optional): Dodatkowy kontekst zdarzenia
  - Typ: Dowolny obiekt JSON (będzie zapisany jako JSONB)
  - Przykłady metadanych:
    - `plan_accepted`: `{ "time_on_page": number, "plan_id": string }`
    - `api_error`: `{ "error_message": string, "endpoint": string }`
  - Domyślnie: `null` jeśli nie podano
  - Walidacja: Musi być obiektem JSON lub undefined
  - Komunikat błędu: "Nieprawidłowy format metadanych"

## 3. Wykorzystywane typy

### 3.1 DTOs (z `src/types.ts`)

```typescript
// DTO dla żądania logowania zdarzenia
export type LogAnalyticsEventDTO = Omit<
  TablesInsert<"analytics_events">,
  "id" | "created_at" | "user_id" | "timestamp"
>;

// Typ enum dla action_type
export type ActionType = Enums<"action_type_enum">;
```

**Pola pomijane w DTO** (generowane przez serwer):

- `id`: Auto-generowane przez bazę (UUID)
- `created_at`: Auto-generowane przez bazę (DEFAULT now())
- `user_id`: Pobierany z JWT tokenu (auth.uid())
- `timestamp`: Generowany po stronie serwera (new Date().toISOString())

### 3.2 Zod Schema (do stworzenia w `src/lib/schemas/analytics.schema.ts`)

```typescript
import { z } from "zod";
import { Constants } from "@/types";

// Schema dla walidacji LogAnalyticsEventDTO
export const logAnalyticsEventSchema = z.object({
  action_type: z.enum(
    [
      Constants.action_type_enum.user_registered,
      Constants.action_type_enum.profile_created,
      Constants.action_type_enum.profile_updated,
      Constants.action_type_enum.plan_generated,
      Constants.action_type_enum.plan_regenerated,
      Constants.action_type_enum.plan_accepted,
      Constants.action_type_enum.feedback_given,
      Constants.action_type_enum.api_error,
    ],
    {
      errorMap: () => ({ message: "Nieprawidłowy typ akcji" }),
    }
  ),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export type LogAnalyticsEventInput = z.infer<typeof logAnalyticsEventSchema>;
```

### 3.3 Database Types (z `src/db/database.types.ts`)

```typescript
// Struktura tabeli analytics_events
type AnalyticsEventsTable = {
  id: string; // uuid
  user_id: string; // uuid (FK -> users.id)
  action_type: ActionType; // action_type_enum
  timestamp: string; // timestamptz
  metadata: object | null; // jsonb
  created_at: string; // timestamptz
};
```

## 4. Szczegóły odpowiedzi

### 4.1 Success Response

**Status Code**: `204 No Content`

**Response Body**: Brak (empty body)

**Headers**:

- `Content-Length: 0`

**Kiedy zwracana**:

- Zdarzenie zostało pomyślnie zapisane w bazie danych
- **RÓWNIEŻ**: Gdy wystąpił błąd podczas zapisu do bazy, ale request był poprawny (non-blocking behavior)

### 4.2 Error Responses

#### 400 Bad Request - Błąd walidacji

**Kiedy**: Nieprawidłowy format danych w request body

```json
{
  "error": "Validation error",
  "message": "Nieprawidłowy typ akcji"
}
```

**Przykłady**:

- `action_type` nie jest jedną z dozwolonych wartości enum
- `metadata` nie jest obiektem JSON (np. jest stringiem)

#### 401 Unauthorized - Brak autoryzacji

**Kiedy**: Brak lub nieprawidłowy JWT token

```json
{
  "error": "Unauthorized",
  "message": "Musisz być zalogowany, aby wykonać tę akcję"
}
```

**Przykłady**:

- Brak nagłówka `Authorization`
- JWT token wygasły
- JWT token nieprawidłowy/zmanipulowany

## 5. Przepływ danych

### 5.1 Diagram przepływu

```
┌──────────┐          ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│ Frontend │          │ API Endpoint │          │   Service    │          │  Supabase DB │
│  (React) │          │              │          │  (analytics) │          │ (PostgreSQL) │
└────┬─────┘          └──────┬───────┘          └──────┬───────┘          └──────┬───────┘
     │                       │                         │                         │
     │  POST /api/analytics/ │                         │                         │
     │  events + JWT         │                         │                         │
     ├──────────────────────>│                         │                         │
     │                       │                         │                         │
     │                       │ 1. Extract user_id      │                         │
     │                       │    from JWT (locals)    │                         │
     │                       │                         │                         │
     │                       │ 2. Validate request     │                         │
     │                       │    body with Zod        │                         │
     │                       │                         │                         │
     │                       │ 3. Call service         │                         │
     │                       ├────────────────────────>│                         │
     │                       │                         │                         │
     │                       │                         │ 4. Add timestamp        │
     │                       │                         │                         │
     │                       │                         │ 5. Insert into DB       │
     │                       │                         ├────────────────────────>│
     │                       │                         │                         │
     │                       │                         │ 6. Success/Error        │
     │                       │                         │<────────────────────────┤
     │                       │                         │                         │
     │                       │ 7. Return (catch errors)│                         │
     │                       │<────────────────────────┤                         │
     │                       │                         │                         │
     │  204 No Content       │                         │                         │
     │<──────────────────────┤                         │                         │
     │                       │                         │                         │
```

### 5.2 Szczegółowy przepływ krok po kroku

1. **Request Arrival**: Frontend wysyła POST request z JWT w Authorization header
2. **Authentication Check**: Astro middleware weryfikuje JWT i dodaje `supabase` do `context.locals`
3. **User Extraction**: Endpoint pobiera `user_id` z `context.locals.supabase.auth.getUser()`
4. **Request Validation**: Zod schema waliduje `action_type` i `metadata`
5. **Service Call**: Wywołanie `logAnalyticsEvent()` z `analytics.service.ts`
6. **Timestamp Generation**: Service dodaje aktualny timestamp server-side
7. **Database Insert**: Service wykonuje INSERT do tabeli `analytics_events`
8. **Error Handling**: Service złapuje wszystkie błędy (non-blocking)
9. **Response**: Endpoint zawsze zwraca 204 No Content (jeśli walidacja przeszła)

### 5.3 Interakcje z zewnętrznymi systemami

#### Supabase Database

- **Tabela**: `analytics_events`
- **Operacja**: INSERT
- **Kolumny zapisywane**:
  - `id`: Auto-generated (uuid)
  - `user_id`: Z JWT tokenu
  - `action_type`: Z request body
  - `timestamp`: Server-side (now)
  - `metadata`: Z request body (nullable)
  - `created_at`: Auto-generated (DEFAULT now())
- **RLS (Row Level Security)**: Nie ma RLS na analytics_events (zgodnie z db-plan.md)
- **Constraints**:
  - `user_id` FOREIGN KEY → `users.id` ON DELETE CASCADE
  - `action_type` NOT NULL (enum constraint)
  - `timestamp` NOT NULL

#### Supabase Auth

- **Operacja**: Weryfikacja JWT tokenu
- **Używane przez**: Astro middleware
- **Dane pobierane**: `user.id` dla pola `user_id`

### 5.4 Service Layer - Istniejąca implementacja

**Plik**: `src/lib/services/analytics.service.ts`

**Funkcja**: `logAnalyticsEvent()`

```typescript
async function logAnalyticsEvent(
  supabase: SupabaseClient,
  userId: string,
  actionType: ActionType,
  metadata?: AnalyticsMetadata
): Promise<void>;
```

**Kluczowe cechy**:

- ✅ Już zaimplementowana
- ✅ Non-blocking: Catch i loguje błędy, nie throw
- ✅ Sanitizacja metadata (usuwa undefined values, puste obiekty)
- ✅ Server-side timestamp
- ✅ Nie wymaga modyfikacji

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie (Authentication)

**Mechanizm**: Supabase Auth z JWT Bearer tokens

**Implementacja**:

1. Frontend otrzymuje JWT po zalogowaniu przez Supabase Auth SDK
2. Frontend dołącza token do nagłówka: `Authorization: Bearer <token>`
3. Astro middleware weryfikuje token i dodaje authenticated `supabase` client do `context.locals`
4. Endpoint używa `context.locals.supabase` zamiast publicznego klienta

**Scenariusze błędów**:

- Brak tokenu: 401 Unauthorized
- Token wygasły: 401 Unauthorized
- Token nieprawidłowy: 401 Unauthorized

### 6.2 Autoryzacja (Authorization)

**User Identification**:

- `user_id` jest ZAWSZE pobierany z JWT tokenu (server-side)
- `user_id` NIE jest akceptowany z request body
- Uniemożliwia logowanie zdarzeń w imieniu innych użytkowników

**Row Level Security (RLS)**:

- Tabela `analytics_events` NIE MA RLS (zgodnie z db-plan.md)
- Powód: Dane analityczne mogą być dostępne dla adminów
- Bezpieczeństwo: Egzekwowane przez API (user_id z JWT)

### 6.3 Walidacja danych wejściowych

**Action Type**:

- ✅ Enum validation przez Zod
- ✅ Tylko 8 predefiniowanych wartości
- ✅ Zapobiega SQL injection
- ✅ Zapobiega data corruption

**Metadata**:

- ⚠️ Minimal validation (dowolny JSON object)
- ✅ PostgreSQL JSONB jest bezpieczny (nie ma SQL injection)
- ⚠️ Brak limitu rozmiaru w MVP (potencjalny DoS)
- ✅ Sanitizacja: Usuwanie undefined values przez service

### 6.4 Timestamp Integrity

**Security Measure**: Timestamp jest zawsze generowany server-side

**Powód**:

- Zapobiega manipulacji czasem zdarzenia przez klienta
- Zapewnia precyzyjną chronologię zdarzeń
- Uniemożliwia backdating lub future-dating zdarzeń

### 6.5 Rate Limiting

**MVP Status**: ❌ Brak rate limiting

**Potencjalne zagrożenie**:

- Użytkownik może spamować endpoint
- Możliwy DoS przez nadmierne logowanie

**Mitigacja w MVP**:

- Non-blocking behavior minimalizuje wpływ na UX
- Async insert nie blokuje API
- Monitorowanie przez analytics (regeneration counts)

**Future Enhancement**:

- Rate limit: 100 requests/minute per user
- Implementacja przez middleware lub Supabase Edge Functions

### 6.6 Data Privacy

**JSONB Metadata**:

- ⚠️ Może zawierać PII (Personally Identifiable Information)
- ✅ ON DELETE CASCADE: Dane usuwane z analytics gdy user jest usunięty
- ⚠️ Brak automatycznej anonimizacji

**Best Practices** (dla frontend devs):

- Nie logować wrażliwych danych (email, hasła, tokeny)
- Logować tylko identyfikatory (UUID, nie nazwy użytkowników)
- Używać ogólnych opisów (nie konkretnych wartości formularzy)

## 7. Obsługa błędów

### 7.1 Tabela scenariuszy błędów

| Scenariusz                    | Status Code | Response Body                                                                 | Działanie                                           |
| ----------------------------- | ----------- | ----------------------------------------------------------------------------- | --------------------------------------------------- |
| Brak JWT tokenu               | 401         | `{"error": "Unauthorized", "message": "Musisz być zalogowany..."}`            | Frontend przekierowuje na login                     |
| JWT wygasły                   | 401         | `{"error": "Unauthorized", "message": "Musisz być zalogowany..."}`            | Frontend odświeża token lub wymusza relogin         |
| Nieprawidłowy action_type     | 400         | `{"error": "Validation error", "message": "Nieprawidłowy typ akcji"}`         | Frontend pokazuje error (nie powinno się zdarzyć)   |
| Metadata nie jest obiektem    | 400         | `{"error": "Validation error", "message": "Nieprawidłowy format metadanych"}` | Frontend pokazuje error                             |
| Database connection error     | 204         | Empty                                                                         | Błąd logowany w console, użytkownik nie widzi błędu |
| Database constraint violation | 204         | Empty                                                                         | Błąd logowany w console, użytkownik nie widzi błędu |
| Supabase timeout              | 204         | Empty                                                                         | Błąd logowany w console, użytkownik nie widzi błędu |

### 7.2 Szczegółowa obsługa błędów

#### 400 Bad Request - Validation Error

**Trigger**: Nieprawidłowe dane w request body

**Przykładowy request**:

```json
{
  "action_type": "invalid_action",
  "metadata": "not an object"
}
```

**Response**:

```json
{
  "error": "Validation error",
  "message": "Nieprawidłowy typ akcji"
}
```

**Implementacja w endpointcie**:

```typescript
const validationResult = logAnalyticsEventSchema.safeParse(body);
if (!validationResult.success) {
  return new Response(
    JSON.stringify({
      error: "Validation error",
      message: validationResult.error.errors[0].message,
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}
```

**Frontend handling**:

- Logować błąd do console (nie powinno się zdarzyć)
- Nie pokazywać użytkownikowi (to internal error)
- Opcjonalnie: Wysłać error report do Sentry

#### 401 Unauthorized

**Trigger**: Brak lub nieprawidłowy JWT

**Response**:

```json
{
  "error": "Unauthorized",
  "message": "Musisz być zalogowany, aby wykonać tę akcję"
}
```

**Implementacja w endpointcie**:

```typescript
const {
  data: { user },
  error,
} = await supabase.auth.getUser();
if (error || !user) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Musisz być zalogowany, aby wykonać tę akcję",
    }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

**Frontend handling**:

- Odświeżyć token przez Supabase SDK
- Jeśli odświeżenie nie działa → przekierować na `/login`
- Nie retry request (auth error jest permanent)

#### 204 No Content - Success (z ukrytym błędem DB)

**Trigger**: Database error podczas INSERT

**Service behavior**:

```typescript
try {
  await supabase.from("analytics_events").insert({...});
} catch (error) {
  console.error("Analytics logging failed:", error); // ← Logowanie do console
  // NO THROW - funkcja kończy się bez błędu
}
```

**Response**: 204 No Content (użytkownik nie wie o błędzie)

**Monitoring**:

- Błędy widoczne w server logs
- Opcjonalnie: Agregacja błędów przez monitoring tool (DataDog, Sentry)
- Tracking: Porównanie ilości `plan_accepted` events z ilością viewed plans

### 7.3 Error Logging Strategy

**Console Errors** (przez service):

```typescript
console.error("Analytics logging failed:", error);
```

**Log Format** (do rozważenia w przyszłości):

```json
{
  "timestamp": "2025-10-30T10:30:00Z",
  "level": "error",
  "service": "analytics",
  "function": "logAnalyticsEvent",
  "user_id": "uuid",
  "action_type": "plan_accepted",
  "error_message": "Connection timeout",
  "error_stack": "..."
}
```

### 7.4 Graceful Degradation

**Principle**: Analytics nie może blokować user experience

**Implementation Strategy**:

1. ✅ Service nie throw errors
2. ✅ Endpoint zwraca 204 nawet przy błędzie DB
3. ✅ Frontend nie czeka na response (fire-and-forget pattern)
4. ✅ Brak retry logic (analytics nie jest krytyczne)

**Frontend Best Practice**:

```typescript
// Fire-and-forget analytics call
fetch('/api/analytics/events', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ action_type: 'plan_accepted', metadata: {...} })
}).catch(() => {
  // Ignore errors - analytics should not block UX
  console.debug('Analytics logging failed (non-critical)');
});
```

## 8. Rozważania dotyczące wydajności

### 8.1 Database Performance

#### Indexes

**Existing** (zgodnie z db-plan.md):

- PRIMARY KEY na `id` (automatic, B-tree)
- INDEX na `(user_id, timestamp DESC)` - ✅ Optymalizuje zapytania analityczne
- GIN INDEX na `metadata` (jsonb_ops) - ✅ Umożliwia szybkie wyszukiwanie w JSONB

**Impact on INSERT**:

- Index na `user_id, timestamp` - minimalny overhead (timestamp jest mostly sequential)
- GIN index na metadata - większy overhead, ale akceptowalny dla analytics
- **Estimated INSERT time**: < 10ms w 95% przypadków

#### Table Size Growth

**Założenia**:

- 100 active users/day
- 10 events per user/day
- **Total**: ~1000 events/day = ~30,000 events/month = ~365,000 events/year

**Storage**:

- Avg row size: ~200 bytes (id + user_id + action_type + timestamp + small metadata)
- Annual storage: ~73 MB/year
- **Conclusion**: Brak problemu ze storage w MVP

**Future Scaling**:

- Partitioning by month (zgodnie z db-plan.md - przygotowane)
- Data retention: 90 dni (automatyczne usuwanie starszych rekordów)

### 8.2 API Response Time

**Target**: < 100ms dla 95% requestów

**Breakdown**:

1. Authentication: ~5ms (JWT verification)
2. Validation: ~1ms (Zod parsing)
3. Database INSERT: ~10ms (with indexes)
4. Network overhead: ~20ms
   **Total**: ~36ms (well under target)

**Optimizations**:

- ✅ Async insert (non-blocking)
- ✅ No complex queries (simple INSERT)
- ✅ Sanitization is O(n) where n = metadata size (usually small)
- ✅ No external API calls

### 8.3 Concurrency

**Scenario**: Multiple analytics events from single user in quick succession

**Example**: User clicks through multiple pages quickly

- Event 1: `plan_accepted`
- Event 2: `profile_updated`
- Event 3: `plan_regenerated`

**Database Handling**:

- PostgreSQL supports concurrent INSERTs naturally
- No locking issues (each INSERT is independent row)
- ✅ No race conditions

**Connection Pooling**:

- Supabase handles connection pooling automatically
- Default pool size: 15 connections (adequate for MVP)
- Each INSERT releases connection immediately

### 8.4 Caching Strategy

**Question**: Should we cache anything?

**Answer**: ❌ No caching needed for this endpoint

**Reasons**:

- POST endpoint (not idempotent)
- Each request creates new row (no duplicate data)
- No read operations to cache
- Non-blocking behavior already provides good UX

### 8.5 Rate Limiting Impact

**Current**: No rate limiting in MVP

**Performance Considerations**:

- Potential abuse: User could spam endpoint
- Impact: Increased DB load, storage growth
- Mitigation: Track in analytics (spot anomalies manually)

**Future Implementation**:

- Rate limit: 100 requests/minute per user
- Algorithm: Token bucket or sliding window
- Storage: Redis or in-memory store
- Performance cost: ~5ms per request (token check)

### 8.6 Metadata Size Optimization

**Current**: No size limit on metadata

**Potential Issues**:

- Large metadata objects (e.g., > 1MB) slow down INSERT
- GIN index performance degrades with very large JSONB

**Recommendations**:

- Frontend: Keep metadata < 1KB (best practice)
- Future: Add size validation (e.g., max 10KB)
- Future: Compress large metadata before storing

**Sanitization Impact**:

- Current: O(n) where n = number of keys in metadata
- Typical n: 2-5 keys
- Performance: < 1ms for typical use cases

### 8.7 Monitoring and Metrics

**Key Metrics to Track**:

1. **Request volume**: Events/minute, events/hour
2. **Error rate**: % of failed DB inserts (from logs)
3. **Response time**: p50, p95, p99 latencies
4. **Action type distribution**: Which events are most common
5. **Metadata size**: avg/max size per event

**Alerting Thresholds**:

- Error rate > 5%: Investigation needed
- Response time p95 > 200ms: Database performance issue
- Request volume spike > 10x normal: Potential abuse

## 9. Etapy wdrożenia

### Krok 1: Utworzenie Zod Schema dla walidacji

**Plik**: `src/lib/schemas/analytics.schema.ts`

**Zadania**:

1. Zaimportować Zod i typy z `src/types.ts`
2. Zdefiniować enum dla `action_type` używając `Constants.action_type_enum`
3. Utworzyć schema `logAnalyticsEventSchema` z:
   - `action_type`: z.enum() z custom error message "Nieprawidłowy typ akcji"
   - `metadata`: z.record(z.unknown()).optional().nullable()
4. Wyeksportować schema i typ inferowany

**Przykładowy kod**:

```typescript
import { z } from "zod";
import { Constants } from "@/types";

export const logAnalyticsEventSchema = z.object({
  action_type: z.enum(
    [
      Constants.action_type_enum.user_registered,
      Constants.action_type_enum.profile_created,
      Constants.action_type_enum.profile_updated,
      Constants.action_type_enum.plan_generated,
      Constants.action_type_enum.plan_regenerated,
      Constants.action_type_enum.plan_accepted,
      Constants.action_type_enum.feedback_given,
      Constants.action_type_enum.api_error,
    ],
    {
      errorMap: () => ({ message: "Nieprawidłowy typ akcji" }),
    }
  ),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export type LogAnalyticsEventInput = z.infer<typeof logAnalyticsEventSchema>;
```

**Walidacja**:

- Sprawdzić czy plik kompiluje się bez błędów TypeScript
- Przetestować schema ręcznie z przykładowymi danymi

---

### Krok 2: Utworzenie endpointa API

**Plik**: `src/pages/api/analytics/events.ts`

**Zadania**:

1. Zaimportować potrzebne typy i funkcje:
   - `APIRoute` z Astro
   - `logAnalyticsEventSchema` z schemas
   - `logAnalyticsEvent` z services
2. Dodać `export const prerender = false` (wymagane dla API routes)
3. Zaimplementować handler `POST`:
   - Pobrać `supabase` z `context.locals`
   - Zweryfikować autentykację przez `supabase.auth.getUser()`
   - Sparsować request body
   - Zwalidować body przez Zod schema
   - Wywołać `logAnalyticsEvent()` service
   - Zwrócić 204 No Content
4. Obsłużyć błędy:
   - 401 dla braku użytkownika
   - 400 dla błędów walidacji

**Struktura pliku**:

```typescript
import type { APIRoute } from "astro";
import { logAnalyticsEventSchema } from "@/lib/schemas/analytics.schema";
import { logAnalyticsEvent } from "@/lib/services/analytics.service";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Get authenticated Supabase client
  const supabase = locals.supabase;

  // 2. Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Musisz być zalogowany, aby wykonać tę akcję",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: "Validation error",
        message: "Nieprawidłowy format JSON",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Validate request body
  const validationResult = logAnalyticsEventSchema.safeParse(body);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Validation error",
        message: validationResult.error.errors[0].message,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 5. Call service to log event
  const { action_type, metadata } = validationResult.data;
  await logAnalyticsEvent(supabase, user.id, action_type, metadata);

  // 6. Return success (even if logging failed - non-blocking)
  return new Response(null, { status: 204 });
};
```

**Walidacja**:

- Sprawdzić czy plik kompiluje się bez błędów TypeScript
- Uruchomić dev server i sprawdzić czy endpoint jest dostępny

---

### Krok 3: Testowanie lokalne z cURL lub Postman

**Zadania**:

1. Uruchomić aplikację lokalnie (`npm run dev`)
2. Uzyskać JWT token (zalogować się przez frontend lub Supabase Dashboard)
3. Wysłać test request z prawidłowymi danymi
4. Wysłać test request z błędnymi danymi (walidacja)
5. Sprawdzić w bazie danych czy zdarzenia są zapisywane
6. Sprawdzić server logs czy nie ma błędów

**Przykładowy test cURL**:

```bash
# Test 1: Prawidłowe żądanie (powodzenie)
curl -X POST http://localhost:4321/api/analytics/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action_type": "plan_accepted",
    "metadata": {
      "time_on_page": 45,
      "plan_id": "123e4567-e89b-12d3-a456-426614174000"
    }
  }'

# Expected: 204 No Content (empty response)

# Test 2: Nieprawidłowy action_type (błąd walidacji)
curl -X POST http://localhost:4321/api/analytics/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action_type": "invalid_action",
    "metadata": {}
  }'

# Expected: 400 Bad Request
# {"error": "Validation error", "message": "Nieprawidłowy typ akcji"}

# Test 3: Brak JWT tokenu (błąd autoryzacji)
curl -X POST http://localhost:4321/api/analytics/events \
  -H "Content-Type: application/json" \
  -d '{
    "action_type": "plan_accepted",
    "metadata": {}
  }'

# Expected: 401 Unauthorized
# {"error": "Unauthorized", "message": "Musisz być zalogowany..."}

# Test 4: Metadata opcjonalne (powodzenie bez metadata)
curl -X POST http://localhost:4321/api/analytics/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action_type": "plan_accepted"
  }'

# Expected: 204 No Content
```

**Weryfikacja w bazie danych**:

```sql
-- Sprawdź ostatnie zdarzenia dla zalogowanego użytkownika
SELECT * FROM analytics_events
WHERE user_id = 'YOUR_USER_ID'
ORDER BY timestamp DESC
LIMIT 5;
```

---

### Krok 4: Weryfikacja z linterem

**Zadania**:

1. Uruchomić TypeScript type checker: `npm run typecheck` (lub `tsc --noEmit`)
2. Uruchomić ESLint: `npm run lint`
3. Uruchomić Prettier (jeśli używany): `npm run format:check`
4. Naprawić wszystkie błędy linterów i type errors

**Sprawdzenie**:

- ✅ Brak błędów TypeScript
- ✅ Brak błędów ESLint
- ✅ Kod zgodny z Prettier formatting
- ✅ Imports są poprawnie uporządkowane

**Typowe problemy i rozwiązania**:

| Problem                                    | Przyczyna                                   | Rozwiązanie                                            |
| ------------------------------------------ | ------------------------------------------- | ------------------------------------------------------ |
| Type error na `Constants.action_type_enum` | Brak eksportu w `database.types.ts`         | Sprawdzić czy `Constants` jest eksportowany w types.ts |
| `locals.supabase` undefined                | Middleware nie dodaje supabase do locals    | Sprawdzić `src/middleware/index.ts`                    |
| Unused variable warnings                   | Destrukturyzacja z niewykorzystanymi polami | Dodać `_` prefix lub usunąć zmienną                    |

---

### Krok 5: Testowanie integracyjne (opcjonalne ale zalecane)

**Plik**: `src/pages/api/analytics/events.test.ts` (lub w osobnym folderze testów)

**Zadania**:

1. Utworzyć test suite dla endpointa
2. Zaimplementować testy:
   - Test autentykacji (brak tokenu → 401)
   - Test walidacji (nieprawidłowy action_type → 400)
   - Test sukcesu (prawidłowe dane → 204)
   - Test metadata opcjonalnego (brak metadata → 204)
3. Użyć mocking dla Supabase client (nie hit real database)

**Framework**: Vitest lub Jest (zależnie od projektu)

**Przykładowa struktura testu** (Vitest):

```typescript
import { describe, it, expect, vi } from "vitest";
import { POST } from "./events";

describe("POST /api/analytics/events", () => {
  it("should return 401 when user is not authenticated", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("Not authenticated") }),
      },
    };

    const request = new Request("http://localhost/api/analytics/events", {
      method: "POST",
      body: JSON.stringify({ action_type: "plan_accepted" }),
    });

    const locals = { supabase: mockSupabase };

    const response = await POST({ request, locals });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("should return 400 when action_type is invalid", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
    };

    const request = new Request("http://localhost/api/analytics/events", {
      method: "POST",
      body: JSON.stringify({ action_type: "invalid_action" }),
    });

    const locals = { supabase: mockSupabase };

    const response = await POST({ request, locals });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation error");
  });

  it("should return 204 when request is valid", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      }),
    };

    const request = new Request("http://localhost/api/analytics/events", {
      method: "POST",
      body: JSON.stringify({
        action_type: "plan_accepted",
        metadata: { plan_id: "plan-123" },
      }),
    });

    const locals = { supabase: mockSupabase };

    const response = await POST({ request, locals });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
  });
});
```

**Uruchomienie testów**:

```bash
npm run test
# lub
npm run test -- src/pages/api/analytics/events.test.ts
```

---

### Krok 6: Dokumentacja i komentarze w kodzie

**Zadania**:

1. Dodać JSDoc komentarze do handlera POST
2. Udokumentować niestandardowe zachowanie (non-blocking)
3. Dodać przykłady użycia w komentarzach
4. Zaktualizować README jeśli potrzeba

**Przykład JSDoc**:

```typescript
/**
 * Logs an analytics event for the authenticated user.
 *
 * This endpoint is non-blocking - it always returns 204 No Content
 * even if database logging fails. This ensures analytics never
 * interrupts user experience.
 *
 * @route POST /api/analytics/events
 * @auth Required (JWT Bearer token)
 *
 * @example
 * // Frontend usage (fire-and-forget)
 * fetch('/api/analytics/events', {
 *   method: 'POST',
 *   headers: {
 *     'Authorization': `Bearer ${token}`,
 *     'Content-Type': 'application/json'
 *   },
 *   body: JSON.stringify({
 *     action_type: 'plan_accepted',
 *     metadata: { time_on_page: 45, plan_id: 'uuid' }
 *   })
 * }).catch(() => {
 *   // Ignore errors - non-critical
 * });
 *
 * @returns 204 No Content on success (or hidden failure)
 * @returns 400 Bad Request on validation error
 * @returns 401 Unauthorized on authentication error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // ...
};
```

---

### Krok 7: Testowanie w środowisku staging (jeśli dostępne)

**Zadania**:

1. Deploy do środowiska staging
2. Przetestować endpoint z real Supabase database
3. Zweryfikować logowanie w production-like environment
4. Sprawdzić performance metrics (response time)
5. Monitorować error logs

**Checklist testów**:

- [ ] Endpoint odpowiada poprawnie z JWT
- [ ] 401 jest zwracany bez JWT
- [ ] 400 jest zwracany z nieprawidłowymi danymi
- [ ] Database inserts są widoczne w Supabase Dashboard
- [ ] Server logs nie pokazują unexpected errors
- [ ] Response time jest < 100ms dla 95% requestów

---

### Krok 8: Wdrożenie na produkcję i monitoring

**Przed deploym**:

1. ✅ Wszystkie testy przechodzą
2. ✅ Code review completed
3. ✅ Linters i type checks passed
4. ✅ Dokumentacja zaktualizowana
5. ✅ Staging tests passed

**Deployment**:

1. Merge PR do main branch
2. GitHub Actions uruchamia CI/CD pipeline
3. Deploy na DigitalOcean (Docker image)
4. Smoke test na production

**Post-deployment Monitoring** (pierwsze 24h):

1. Sprawdzić error rate w logs
2. Monitorować request volume
3. Sprawdzić database performance (query time)
4. Zweryfikować czy analytics events są zapisywane
5. Sprawdzić response time metrics

**Key Metrics do śledzenia**:

- Request volume: Expected ~50-100 requests/day dla MVP
- Error rate: Target < 1%
- Response time p95: Target < 100ms
- Database insert rate: Should match request volume

**Alerting** (opcjonalne dla MVP):

- Email alert gdy error rate > 5%
- Slack notification gdy response time p95 > 200ms

---

### Krok 9: Dokumentacja dla zespołu frontend

**Zadania**:

1. Zaktualizować API docs dla frontend devs
2. Dodać przykłady użycia w JavaScript/TypeScript
3. Dokumentować best practices
4. Utworzyć TypeScript types dla frontend (jeśli shared types nie są używane)

**Przykładowa dokumentacja dla frontend**:

````markdown
# Analytics Events API

## Endpoint

POST /api/analytics/events

## Authentication

Required. Include JWT token in Authorization header.

## Usage

### Basic Example

```typescript
async function logAnalyticsEvent(actionType: string, metadata?: Record<string, unknown>) {
  try {
    await fetch("/api/analytics/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabase.auth.session().access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action_type: actionType, metadata }),
    });
  } catch (error) {
    // Ignore - analytics should not block UX
    console.debug("Analytics logging failed (non-critical)");
  }
}
```
````

### Logging Plan Acceptance

```typescript
// Track when user accepts a meal plan
useEffect(() => {
  const timer = setTimeout(() => {
    logAnalyticsEvent("plan_accepted", {
      time_on_page: 45,
      plan_id: mealPlan.id,
    });
  }, 30000); // 30 seconds

  return () => clearTimeout(timer);
}, [mealPlan.id]);
```

## Available Action Types

- `plan_accepted` - User accepts meal plan (frontend-triggered)
- Other action types are logged automatically by backend

## Best Practices

1. Use fire-and-forget pattern (don't await or block on response)
2. Keep metadata small (< 1KB recommended)
3. Don't log sensitive data (PII, passwords, tokens)
4. Use descriptive but generic keys in metadata

```

---

## 10. Podsumowanie implementacji

### Nowe pliki do utworzenia:
1. ✅ `src/lib/schemas/analytics.schema.ts` - Zod schema dla walidacji
2. ✅ `src/pages/api/analytics/events.ts` - API endpoint handler

### Istniejące pliki do modyfikacji:
❌ Brak - wszystkie potrzebne komponenty już istnieją

### Zależności:
- ✅ `analytics.service.ts` - już istnieje, nie wymaga zmian
- ✅ `types.ts` - już zawiera `LogAnalyticsEventDTO` i `ActionType`
- ✅ `database.types.ts` - już zawiera enums i typy

### Kluczowe punkty do zapamiętania:
1. **Non-blocking behavior**: Endpoint zawsze zwraca 204 (jeśli walidacja OK), nawet gdy DB insert fails
2. **Server-side security**: `user_id` i `timestamp` są zawsze generowane server-side
3. **Graceful degradation**: Analytics errors nie mogą wpływać na UX
4. **Minimal validation**: Metadata ma minimalną walidację (any JSON object)
5. **No rate limiting**: W MVP brak rate limiting (do dodania w przyszłości)

### Estymacja czasu implementacji:
- Krok 1 (Schema): 15 min
- Krok 2 (Endpoint): 30 min
- Krok 3 (Manual testing): 20 min
- Krok 4 (Linting): 10 min
- Krok 5 (Integration tests): 45 min (opcjonalne)
- Krok 6 (Documentation): 15 min
- **Total**: ~2 godz. (bez testów integracyjnych) lub ~2.5 godz. (z testami)

---

**Plan created**: 2025-10-30
**API Version**: v1
**Status**: Ready for implementation

```
