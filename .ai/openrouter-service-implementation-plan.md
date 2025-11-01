# Plan Wdrożenia Usługi OpenRouter

## 1. Opis Usługi

Usługa OpenRouter jest warstwą abstrakcji do komunikacji z API OpenRouter, umożliwiającą integrację różnych modeli LLM (Large Language Models) w aplikacji Astro/React. Usługa zapewnia:

- Typowane interfejsy dla requestów i odpowiedzi
- Obsługę standardowych i strumieniowych odpowiedzi
- Wsparcie dla ustrukturyzowanych odpowiedzi (JSON Schema)
- Centralizowane zarządzanie konfiguracją modeli
- Spójną obsługę błędów
- Bezpieczne zarządzanie kluczami API

## 2. Opis Konstruktora

### Sygnatura

```typescript
constructor(config?: OpenRouterConfig)
```

### Parametry Konfiguracyjne

```typescript
interface OpenRouterConfig {
  apiKey?: string; // Klucz API (domyślnie z process.env.OPENROUTER_API_KEY)
  baseUrl?: string; // URL bazowy API (domyślnie: https://openrouter.ai/api/v1)
  defaultModel?: string; // Domyślny model do użycia
  timeout?: number; // Timeout dla requestów w ms (domyślnie: 30000)
  maxRetries?: number; // Maksymalna liczba ponownych prób (domyślnie: 3)
  retryDelay?: number; // Opóźnienie między próbami w ms (domyślnie: 1000)
  siteName?: string; // Nazwa strony dla OpenRouter analytics
  siteUrl?: string; // URL strony dla OpenRouter analytics
}
```

### Logika Konstruktora

1. Inicjalizacja klucza API (z parametru lub zmiennej środowiskowej)
2. Walidacja obecności klucza API - rzut błędem jeśli brak
3. Ustawienie domyślnych wartości dla opcjonalnych parametrów
4. Przygotowanie nagłówków HTTP (Authorization, HTTP-Referer, X-Title)
5. Inicjalizacja wewnętrznych pól (retry counter, timeout handler)

## 3. Publiczne Metody i Pola

### 3.1 Metoda `complete()`

Główna metoda do wykonywania zapytań do modeli LLM.

```typescript
async complete(request: CompletionRequest): Promise<CompletionResponse>
```

#### Parametry

```typescript
interface CompletionRequest {
  messages: Message[]; // Tablica wiadomości (system, user, assistant)
  model?: string; // Nazwa modelu (opcjonalnie, użyje defaultModel)
  temperature?: number; // 0.0 - 2.0, domyślnie: 1.0
  max_tokens?: number; // Maksymalna liczba tokenów odpowiedzi
  top_p?: number; // Nucleus sampling, 0.0 - 1.0
  frequency_penalty?: number; // -2.0 - 2.0, penalty za powtórzenia
  presence_penalty?: number; // -2.0 - 2.0, penalty za obecność tokenów
  response_format?: ResponseFormat; // Format odpowiedzi (JSON Schema)
  stop?: string | string[]; // Sekwencje stop
  stream?: boolean; // Czy streamować odpowiedź
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string; // Nazwa schematu (snake_case)
    strict: true; // Zawsze true dla OpenRouter
    schema: JSONSchema; // Schemat JSON zgodny z JSON Schema spec
  };
}

interface JSONSchema {
  type: "object";
  properties: Record<string, JSONSchemaProperty>;
  required: string[];
  additionalProperties: false; // Zawsze false dla strict mode
}
```

#### Zwracana Wartość

```typescript
interface CompletionResponse {
  id: string; // ID odpowiedzi
  model: string; // Użyty model
  created: number; // Timestamp utworzenia
  choices: Choice[]; // Tablica wyborów (zwykle 1 element)
  usage?: Usage; // Statystyki użycia tokenów
}

interface Choice {
  index: number;
  message: {
    role: "assistant";
    content: string; // Treść odpowiedzi (może być JSON string)
  };
  finish_reason: "stop" | "length" | "content_filter" | "tool_calls";
}

interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}
```

#### Przykład Użycia

```typescript
const service = new OpenRouterService({
  defaultModel: "openai/gpt-4o-mini",
});

// Proste zapytanie
const response = await service.complete({
  messages: [
    {
      role: "system",
      content: "You are a helpful TypeScript expert.",
    },
    {
      role: "user",
      content: "What is the difference between type and interface?",
    },
  ],
  temperature: 0.7,
  max_tokens: 500,
});

console.log(response.choices[0].message.content);
```

### 3.2 Metoda `completeWithSchema()`

Wygodna metoda do zapytań z ustrukturyzowanymi odpowiedziami.

```typescript
async completeWithSchema<T>(
  messages: Message[],
  schema: ResponseFormat['json_schema'],
  options?: Omit<CompletionRequest, 'messages' | 'response_format'>
): Promise<T>
```

#### Przykład Użycia

```typescript
interface UserProfile {
  name: string;
  age: number;
  occupation: string;
  skills: string[];
}

const profile = await service.completeWithSchema<UserProfile>(
  [
    {
      role: "system",
      content: "Extract user profile information from the text.",
    },
    {
      role: "user",
      content: "John is a 30-year-old software engineer who specializes in TypeScript and React.",
    },
  ],
  {
    name: "user_profile_extraction",
    strict: true,
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        occupation: { type: "string" },
        skills: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["name", "age", "occupation", "skills"],
      additionalProperties: false,
    },
  },
  { temperature: 0.3 }
);

console.log(profile.name); // "John"
console.log(profile.age); // 30
```

### 3.3 Metoda `streamComplete()`

Metoda do streamowania odpowiedzi w czasie rzeczywistym.

```typescript
async *streamComplete(request: CompletionRequest): AsyncGenerator<StreamChunk>
```

#### Parametry

Takie same jak `complete()`, ale `stream` jest automatycznie ustawiane na `true`.

#### Zwracana Wartość

```typescript
interface StreamChunk {
  id: string;
  model: string;
  created: number;
  choices: StreamChoice[];
}

interface StreamChoice {
  index: number;
  delta: {
    role?: "assistant";
    content?: string;
  };
  finish_reason?: "stop" | "length" | "content_filter";
}
```

#### Przykład Użycia

```typescript
const stream = service.streamComplete({
  messages: [{ role: "user", content: "Write a short story about TypeScript." }],
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content); // Wyświetlaj na bieżąco
  }
}
```

### 3.4 Metoda `getAvailableModels()`

Pobiera listę dostępnych modeli z OpenRouter.

```typescript
async getAvailableModels(): Promise<Model[]>
```

#### Zwracana Wartość

```typescript
interface Model {
  id: string; // Identyfikator modelu
  name: string; // Nazwa wyświetlana
  description?: string; // Opis modelu
  pricing: {
    prompt: string; // Cena za token promptu
    completion: string; // Cena za token odpowiedzi
  };
  context_length: number; // Maksymalna długość kontekstu
  architecture?: {
    modality: string; // np. "text", "text+image"
    tokenizer: string; // Typ tokenizera
  };
}
```

## 4. Prywatne Metody i Pola

### 4.1 Pola Prywatne

```typescript
private apiKey: string;
private baseUrl: string;
private defaultModel: string;
private timeout: number;
private maxRetries: number;
private retryDelay: number;
private headers: Record<string, string>;
```

### 4.2 Metoda `executeRequest()`

Prywatna metoda do wykonywania HTTP requestów z retry logic.

```typescript
private async executeRequest<T>(
  endpoint: string,
  body: unknown,
  options?: { stream?: boolean }
): Promise<T>
```

#### Funkcjonalność

1. Przygotowanie pełnego URL (baseUrl + endpoint)
2. Serializacja body do JSON
3. Wykonanie fetch z odpowiednimi nagłówkami
4. Obsługa timeout
5. Retry logic z exponential backoff
6. Parsowanie odpowiedzi
7. Walidacja statusu odpowiedzi

### 4.3 Metoda `handleRetry()`

Zarządzanie logiką ponownych prób.

```typescript
private async handleRetry(
  attempt: number,
  error: Error
): Promise<boolean>
```

#### Logika

1. Sprawdzenie czy błąd jest retriable (5xx, timeout, network error)
2. Sprawdzenie czy nie przekroczono maxRetries
3. Obliczenie opóźnienia (exponential backoff: retryDelay \* 2^attempt)
4. Wykonanie delay
5. Zwrócenie true (retry) lub false (throw error)

### 4.4 Metoda `validateRequest()`

Walidacja requestu przed wysłaniem.

```typescript
private validateRequest(request: CompletionRequest): void
```

#### Walidacje

1. Sprawdzenie czy messages jest niepustą tablicą
2. Sprawdzenie czy każda wiadomość ma role i content
3. Walidacja temperature (0.0 - 2.0)
4. Walidacja top_p (0.0 - 1.0)
5. Walidacja penalties (-2.0 - 2.0)
6. Walidacja max_tokens (> 0)
7. Walidacja response_format (jeśli obecny)

### 4.5 Metoda `parseStreamResponse()`

Parsowanie Server-Sent Events (SSE) dla streamowania.

```typescript
private async *parseStreamResponse(
  response: Response
): AsyncGenerator<StreamChunk>
```

#### Funkcjonalność

1. Odczyt response body jako stream
2. Parsowanie linii SSE (data: {...})
3. Ignorowanie linii pustych i komentarzy
4. Parsowanie JSON z każdej linii
5. Yield każdego chunka
6. Obsługa [DONE] signal

## 5. Obsługa Błędów

### 5.1 Hierarchia Błędów

```typescript
class OpenRouterError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

class OpenRouterAuthError extends OpenRouterError {
  constructor(message = "Authentication failed. Check your API key.") {
    super(message, 401);
    this.name = "OpenRouterAuthError";
  }
}

class OpenRouterRateLimitError extends OpenRouterError {
  constructor(
    message = "Rate limit exceeded.",
    public retryAfter?: number
  ) {
    super(message, 429);
    this.name = "OpenRouterRateLimitError";
  }
}

class OpenRouterValidationError extends OpenRouterError {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message, 400);
    this.name = "OpenRouterValidationError";
  }
}

class OpenRouterModelError extends OpenRouterError {
  constructor(message: string) {
    super(message, 500);
    this.name = "OpenRouterModelError";
  }
}

class OpenRouterTimeoutError extends OpenRouterError {
  constructor(message = "Request timeout.") {
    super(message);
    this.name = "OpenRouterTimeoutError";
  }
}

class OpenRouterNetworkError extends OpenRouterError {
  constructor(message = "Network error occurred.") {
    super(message);
    this.name = "OpenRouterNetworkError";
  }
}
```

### 5.2 Mapowanie Błędów API

```typescript
private mapApiError(statusCode: number, body: unknown): OpenRouterError {
  // Typowanie body
  const errorBody = body as { error?: { message?: string; type?: string } };
  const message = errorBody?.error?.message || 'Unknown error occurred';

  switch (statusCode) {
    case 401:
    case 403:
      return new OpenRouterAuthError(message);

    case 429:
      // Sprawdź header Retry-After
      return new OpenRouterRateLimitError(message);

    case 400:
      return new OpenRouterValidationError(message);

    case 404:
      return new OpenRouterModelError('Model not found or unavailable');

    case 500:
    case 502:
    case 503:
    case 504:
      return new OpenRouterModelError(message);

    default:
      return new OpenRouterError(message, statusCode);
  }
}
```

### 5.3 Scenariusze Błędów

#### Scenariusz 1: Brak klucza API

```typescript
// W konstruktorze
if (!this.apiKey) {
  throw new OpenRouterAuthError(
    "API key is required. Set OPENROUTER_API_KEY environment variable or pass it in config."
  );
}
```

#### Scenariusz 2: Nieprawidłowy request

```typescript
// W validateRequest()
if (!request.messages || request.messages.length === 0) {
  throw new OpenRouterValidationError("Messages array cannot be empty", "messages");
}

if (request.temperature && (request.temperature < 0 || request.temperature > 2)) {
  throw new OpenRouterValidationError("Temperature must be between 0 and 2", "temperature");
}
```

#### Scenariusz 3: Rate limiting

```typescript
// W executeRequest()
if (response.status === 429) {
  const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
  throw new OpenRouterRateLimitError(`Rate limit exceeded. Retry after ${retryAfter} seconds.`, retryAfter);
}
```

#### Scenariusz 4: Timeout

```typescript
// W executeRequest()
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), this.timeout);

try {
  const response = await fetch(url, {
    signal: controller.signal,
    // ... other options
  });
  clearTimeout(timeoutId);
  return response;
} catch (error) {
  clearTimeout(timeoutId);
  if (error.name === "AbortError") {
    throw new OpenRouterTimeoutError(`Request timeout after ${this.timeout}ms`);
  }
  throw error;
}
```

#### Scenariusz 5: Błąd parsowania odpowiedzi

```typescript
// Po otrzymaniu odpowiedzi
try {
  const data = await response.json();
  return data;
} catch (error) {
  throw new OpenRouterError("Failed to parse response from OpenRouter", response.status, error);
}
```

#### Scenariusz 6: Błąd sieciowy

```typescript
// W executeRequest() - catch block
catch (error) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    throw new OpenRouterNetworkError('Failed to connect to OpenRouter API');
  }
  throw error;
}
```

## 6. Kwestie Bezpieczeństwa

### 6.1 Zarządzanie Kluczem API

**Problem:** Klucz API nie może być eksponowany w kodzie klienta.

**Rozwiązania:**

1. **Zmienne środowiskowe:**

   ```typescript
   // .env
   OPENROUTER_API_KEY=sk-or-v1-...

   // W kodzie
   const apiKey = import.meta.env.OPENROUTER_API_KEY;
   ```

2. **API endpoint w Astro:**

   ```typescript
   // src/pages/api/chat.ts
   import type { APIRoute } from "astro";
   import { OpenRouterService } from "../../lib/openrouter";

   export const POST: APIRoute = async ({ request }) => {
     // Klucz API tylko na serwerze
     const service = new OpenRouterService();
     // ... handle request
   };
   ```

3. **Nigdy nie przekazuj klucza z klienta:**

   ```typescript
   // ❌ ZŁE - klucz w kodzie klienta
   const service = new OpenRouterService({ apiKey: "sk-or-..." });

   // ✅ DOBRE - klucz tylko na serwerze
   // W API endpoint
   const service = new OpenRouterService(); // Używa process.env
   ```

### 6.2 Walidacja Danych Wejściowych

**Problem:** Dane od użytkownika mogą być złośliwe lub nieprawidłowe.

**Rozwiązania:**

1. **Sanityzacja treści wiadomości:**

   ```typescript
   private sanitizeMessage(content: string): string {
     // Usuń nadmiarowe białe znaki
     content = content.trim().replace(/\s+/g, ' ');

     // Ogranicz długość
     const MAX_LENGTH = 10000;
     if (content.length > MAX_LENGTH) {
       content = content.substring(0, MAX_LENGTH);
     }

     return content;
   }
   ```

2. **Walidacja z biblioteką (np. Zod):**

   ```typescript
   import { z } from 'zod';

   const MessageSchema = z.object({
     role: z.enum(['system', 'user', 'assistant']),
     content: z.string().min(1).max(10000)
   });

   const CompletionRequestSchema = z.object({
     messages: z.array(MessageSchema).min(1),
     model: z.string().optional(),
     temperature: z.number().min(0).max(2).optional(),
     // ...
   });

   private validateRequest(request: CompletionRequest): void {
     CompletionRequestSchema.parse(request);
   }
   ```

### 6.3 Rate Limiting po Stronie Aplikacji

**Problem:** Użytkownicy mogą nadużywać API i generować koszty.

**Rozwiązania:**

1. **Implementacja rate limitera:**

   ```typescript
   class RateLimiter {
     private requests: Map<string, number[]> = new Map();

     canMakeRequest(userId: string, limit: number, windowMs: number): boolean {
       const now = Date.now();
       const userRequests = this.requests.get(userId) || [];

       // Usuń stare requesty spoza okna
       const validRequests = userRequests.filter((time) => now - time < windowMs);

       if (validRequests.length >= limit) {
         return false;
       }

       validRequests.push(now);
       this.requests.set(userId, validRequests);
       return true;
     }
   }
   ```

2. **Integracja z usługą:**

   ```typescript
   const rateLimiter = new RateLimiter();

   // W API endpoint
   if (!rateLimiter.canMakeRequest(userId, 10, 60000)) {
     return new Response("Too many requests", { status: 429 });
   }
   ```

### 6.4 Logowanie i Monitoring

**Problem:** Należy monitorować użycie bez eksponowania wrażliwych danych.

**Rozwiązania:**

1. **Bezpieczne logowanie:**

   ```typescript
   private log(level: 'info' | 'error', message: string, meta?: unknown): void {
     const sanitizedMeta = this.sanitizeLogMeta(meta);
     console[level](`[OpenRouter] ${message}`, sanitizedMeta);
   }

   private sanitizeLogMeta(meta: unknown): unknown {
     if (typeof meta !== 'object' || meta === null) return meta;

     const sanitized = { ...meta as Record<string, unknown> };

     // Usuń wrażliwe dane
     delete sanitized.apiKey;
     delete sanitized.authorization;

     // Skróć długie treści
     if (typeof sanitized.content === 'string' && sanitized.content.length > 100) {
       sanitized.content = sanitized.content.substring(0, 100) + '...';
     }

     return sanitized;
   }
   ```

### 6.5 Zabezpieczenie przed Injection Attacks

**Problem:** Treści od użytkowników mogą próbować manipulować systemem.

**Rozwiązania:**

1. **Separator między system a user messages:**

   ```typescript
   // Zawsze używaj osobnych wiadomości dla system i user
   const messages = [
     {
       role: "system",
       content: systemPrompt, // Kontrolowany przez nas
     },
     {
       role: "user",
       content: userInput, // Od użytkownika - nie może nadpisać system
     },
   ];
   ```

2. **Walidacja role:**

   ```typescript
   // W API endpoint - nie pozwól użytkownikowi ustawić role: 'system'
   export const POST: APIRoute = async ({ request }) => {
     const { message } = await request.json();

     const messages = [
       { role: "system", content: OUR_SYSTEM_PROMPT },
       { role: "user", content: message }, // Tylko user role od klienta
     ];

     // ...
   };
   ```

## 7. Plan Wdrożenia Krok po Kroku

### Krok 1: Przygotowanie Środowiska

#### 1.1 Instalacja Zależności

```bash
# Żadne dodatkowe zależności nie są wymagane - używamy natywnego fetch
# Opcjonalnie dla walidacji:
npm install zod
```

#### 1.2 Konfiguracja Zmiennych Środowiskowych

```bash
# .env
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
OPENROUTER_DEFAULT_MODEL=openai/gpt-4o-mini
OPENROUTER_SITE_NAME=Your App Name
OPENROUTER_SITE_URL=https://yourapp.com
```

#### 1.3 Konfiguracja TypeScript

Upewnij się, że `tsconfig.json` zawiera:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true
  }
}
```

### Krok 2: Tworzenie Struktury Typów

#### 2.1 Utworzenie pliku `src/lib/openrouter/types.ts`

```typescript
// Message types
export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

// Response format types
export interface JSONSchemaProperty {
  type: "string" | "number" | "boolean" | "object" | "array" | "null";
  description?: string;
  enum?: unknown[];
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface JSONSchema {
  type: "object";
  properties: Record<string, JSONSchemaProperty>;
  required: string[];
  additionalProperties: false;
}

export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: JSONSchema;
  };
}

// Request types
export interface CompletionRequest {
  messages: Message[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: ResponseFormat;
  stop?: string | string[];
  stream?: boolean;
}

// Response types
export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface Choice {
  index: number;
  message: {
    role: "assistant";
    content: string;
  };
  finish_reason: "stop" | "length" | "content_filter" | "tool_calls";
}

export interface CompletionResponse {
  id: string;
  model: string;
  created: number;
  choices: Choice[];
  usage?: Usage;
}

// Stream types
export interface StreamChoice {
  index: number;
  delta: {
    role?: "assistant";
    content?: string;
  };
  finish_reason?: "stop" | "length" | "content_filter";
}

export interface StreamChunk {
  id: string;
  model: string;
  created: number;
  choices: StreamChoice[];
}

// Model types
export interface Model {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  architecture?: {
    modality: string;
    tokenizer: string;
  };
}

// Config types
export interface OpenRouterConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  siteName?: string;
  siteUrl?: string;
}
```

### Krok 3: Tworzenie Klas Błędów

#### 3.1 Utworzenie pliku `src/lib/openrouter/errors.ts`

```typescript
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
    Object.setPrototypeOf(this, OpenRouterError.prototype);
  }
}

export class OpenRouterAuthError extends OpenRouterError {
  constructor(message = "Authentication failed. Check your API key.") {
    super(message, 401);
    this.name = "OpenRouterAuthError";
    Object.setPrototypeOf(this, OpenRouterAuthError.prototype);
  }
}

export class OpenRouterRateLimitError extends OpenRouterError {
  constructor(
    message = "Rate limit exceeded.",
    public retryAfter?: number
  ) {
    super(message, 429);
    this.name = "OpenRouterRateLimitError";
    Object.setPrototypeOf(this, OpenRouterRateLimitError.prototype);
  }
}

export class OpenRouterValidationError extends OpenRouterError {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message, 400);
    this.name = "OpenRouterValidationError";
    Object.setPrototypeOf(this, OpenRouterValidationError.prototype);
  }
}

export class OpenRouterModelError extends OpenRouterError {
  constructor(message: string) {
    super(message, 500);
    this.name = "OpenRouterModelError";
    Object.setPrototypeOf(this, OpenRouterModelError.prototype);
  }
}

export class OpenRouterTimeoutError extends OpenRouterError {
  constructor(message = "Request timeout.") {
    super(message);
    this.name = "OpenRouterTimeoutError";
    Object.setPrototypeOf(this, OpenRouterTimeoutError.prototype);
  }
}

export class OpenRouterNetworkError extends OpenRouterError {
  constructor(message = "Network error occurred.") {
    super(message);
    this.name = "OpenRouterNetworkError";
    Object.setPrototypeOf(this, OpenRouterNetworkError.prototype);
  }
}
```

### Krok 4: Implementacja Głównej Klasy Usługi

#### 4.1 Utworzenie pliku `src/lib/openrouter/service.ts`

```typescript
import type {
  OpenRouterConfig,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  Model,
  Message,
  ResponseFormat,
} from "./types";

import {
  OpenRouterError,
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterValidationError,
  OpenRouterModelError,
  OpenRouterTimeoutError,
  OpenRouterNetworkError,
} from "./errors";

export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private headers: Record<string, string>;

  constructor(config: OpenRouterConfig = {}) {
    // Pobierz klucz API
    this.apiKey = config.apiKey || import.meta.env.OPENROUTER_API_KEY || "";

    if (!this.apiKey) {
      throw new OpenRouterAuthError(
        "API key is required. Set OPENROUTER_API_KEY environment variable or pass it in config."
      );
    }

    // Ustaw konfigurację
    this.baseUrl = config.baseUrl || "https://openrouter.ai/api/v1";
    this.defaultModel =
      config.defaultModel || import.meta.env.OPENROUTER_DEFAULT_MODEL || "anthropic/claude-3.5-sonnet";
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;

    // Przygotuj nagłówki
    this.headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    // Dodaj opcjonalne nagłówki dla analytics
    if (config.siteName || import.meta.env.OPENROUTER_SITE_NAME) {
      this.headers["X-Title"] = config.siteName || import.meta.env.OPENROUTER_SITE_NAME;
    }

    if (config.siteUrl || import.meta.env.OPENROUTER_SITE_URL) {
      this.headers["HTTP-Referer"] = config.siteUrl || import.meta.env.OPENROUTER_SITE_URL;
    }
  }

  /**
   * Wykonuje zapytanie completion do OpenRouter API
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    this.validateRequest(request);

    const body = {
      ...request,
      model: request.model || this.defaultModel,
      stream: false,
    };

    return this.executeRequest<CompletionResponse>("/chat/completions", body);
  }

  /**
   * Wygodna metoda do zapytań z ustrukturyzowanymi odpowiedziami
   */
  async completeWithSchema<T>(
    messages: Message[],
    schema: ResponseFormat["json_schema"],
    options: Omit<CompletionRequest, "messages" | "response_format"> = {}
  ): Promise<T> {
    const response = await this.complete({
      ...options,
      messages,
      response_format: {
        type: "json_schema",
        json_schema: schema,
      },
    });

    try {
      return JSON.parse(response.choices[0].message.content) as T;
    } catch (error) {
      throw new OpenRouterError("Failed to parse structured response", undefined, error);
    }
  }

  /**
   * Streamuje odpowiedź z OpenRouter API
   */
  async *streamComplete(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    this.validateRequest(request);

    const body = {
      ...request,
      model: request.model || this.defaultModel,
      stream: true,
    };

    const response = await this.executeRequest<Response>("/chat/completions", body, { stream: true });

    yield* this.parseStreamResponse(response);
  }

  /**
   * Pobiera listę dostępnych modeli
   */
  async getAvailableModels(): Promise<Model[]> {
    interface ModelsResponse {
      data: Model[];
    }

    const response = await this.executeRequest<ModelsResponse>("/models", {});
    return response.data;
  }

  /**
   * Wykonuje HTTP request z retry logic
   */
  private async executeRequest<T>(endpoint: string, body: unknown, options: { stream?: boolean } = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Dla streamingu zwróć cały response
        if (options.stream) {
          if (!response.ok) {
            const errorBody = await response.json();
            throw this.mapApiError(response.status, errorBody);
          }
          return response as T;
        }

        // Dla normalnych requestów parsuj JSON
        const data = await response.json();

        if (!response.ok) {
          throw this.mapApiError(response.status, data);
        }

        return data as T;
      } catch (error) {
        clearTimeout(timeoutId!);
        lastError = error as Error;

        // Sprawdź czy błąd jest retriable
        const shouldRetry = await this.handleRetry(attempt, lastError);

        if (!shouldRetry) {
          throw lastError;
        }

        // Czekaj przed następną próbą
        await this.delay(this.retryDelay * Math.pow(2, attempt));
      }
    }

    throw lastError;
  }

  /**
   * Określa czy request powinien być ponowiony
   */
  private async handleRetry(attempt: number, error: Error): Promise<boolean> {
    // Nie retry jeśli osiągnięto max
    if (attempt >= this.maxRetries) {
      return false;
    }

    // Retry dla błędów sieciowych
    if (error instanceof OpenRouterNetworkError) {
      return true;
    }

    // Retry dla timeout
    if (error instanceof OpenRouterTimeoutError) {
      return true;
    }

    // Retry dla błędów serwera (5xx)
    if (error instanceof OpenRouterModelError) {
      return true;
    }

    // Nie retry dla innych błędów
    return false;
  }

  /**
   * Waliduje request przed wysłaniem
   */
  private validateRequest(request: CompletionRequest): void {
    if (!request.messages || request.messages.length === 0) {
      throw new OpenRouterValidationError("Messages array cannot be empty", "messages");
    }

    for (const message of request.messages) {
      if (!message.role || !message.content) {
        throw new OpenRouterValidationError("Each message must have role and content", "messages");
      }

      if (!["system", "user", "assistant"].includes(message.role)) {
        throw new OpenRouterValidationError(`Invalid message role: ${message.role}`, "messages");
      }
    }

    if (request.temperature !== undefined) {
      if (request.temperature < 0 || request.temperature > 2) {
        throw new OpenRouterValidationError("Temperature must be between 0 and 2", "temperature");
      }
    }

    if (request.top_p !== undefined) {
      if (request.top_p < 0 || request.top_p > 1) {
        throw new OpenRouterValidationError("top_p must be between 0 and 1", "top_p");
      }
    }

    if (request.frequency_penalty !== undefined) {
      if (request.frequency_penalty < -2 || request.frequency_penalty > 2) {
        throw new OpenRouterValidationError("frequency_penalty must be between -2 and 2", "frequency_penalty");
      }
    }

    if (request.presence_penalty !== undefined) {
      if (request.presence_penalty < -2 || request.presence_penalty > 2) {
        throw new OpenRouterValidationError("presence_penalty must be between -2 and 2", "presence_penalty");
      }
    }

    if (request.max_tokens !== undefined && request.max_tokens <= 0) {
      throw new OpenRouterValidationError("max_tokens must be greater than 0", "max_tokens");
    }

    if (request.response_format) {
      this.validateResponseFormat(request.response_format);
    }
  }

  /**
   * Waliduje response_format
   */
  private validateResponseFormat(format: ResponseFormat): void {
    if (format.type !== "json_schema") {
      throw new OpenRouterValidationError('response_format type must be "json_schema"', "response_format");
    }

    if (!format.json_schema) {
      throw new OpenRouterValidationError("json_schema is required in response_format", "response_format");
    }

    if (format.json_schema.strict !== true) {
      throw new OpenRouterValidationError("json_schema.strict must be true", "response_format");
    }

    if (!format.json_schema.name) {
      throw new OpenRouterValidationError("json_schema.name is required", "response_format");
    }

    if (!format.json_schema.schema) {
      throw new OpenRouterValidationError("json_schema.schema is required", "response_format");
    }

    if (format.json_schema.schema.type !== "object") {
      throw new OpenRouterValidationError('json_schema.schema.type must be "object"', "response_format");
    }

    if (format.json_schema.schema.additionalProperties !== false) {
      throw new OpenRouterValidationError(
        "json_schema.schema.additionalProperties must be false for strict mode",
        "response_format"
      );
    }
  }

  /**
   * Mapuje błędy API na odpowiednie klasy błędów
   */
  private mapApiError(statusCode: number, body: unknown): OpenRouterError {
    const errorBody = body as { error?: { message?: string; type?: string } };
    const message = errorBody?.error?.message || "Unknown error occurred";

    switch (statusCode) {
      case 401:
      case 403:
        return new OpenRouterAuthError(message);

      case 429:
        return new OpenRouterRateLimitError(message);

      case 400:
        return new OpenRouterValidationError(message);

      case 404:
        return new OpenRouterModelError("Model not found or unavailable");

      case 500:
      case 502:
      case 503:
      case 504:
        return new OpenRouterModelError(message);

      default:
        return new OpenRouterError(message, statusCode);
    }
  }

  /**
   * Parsuje Server-Sent Events stream
   */
  private async *parseStreamResponse(response: Response): AsyncGenerator<StreamChunk> {
    if (!response.body) {
      throw new OpenRouterError("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Zachowaj ostatnią niepełną linię w buforze
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();

          // Ignoruj puste linie i komentarze
          if (!trimmed || trimmed.startsWith(":")) {
            continue;
          }

          // Sprawdź czy to linia z danymi
          if (trimmed.startsWith("data: ")) {
            const data = trimmed.slice(6);

            // Sprawdź czy to koniec streamu
            if (data === "[DONE]") {
              return;
            }

            try {
              const chunk = JSON.parse(data) as StreamChunk;
              yield chunk;
            } catch (error) {
              console.error("Failed to parse stream chunk:", data, error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Helper do czekania
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### Krok 5: Utworzenie Index File

#### 5.1 Utworzenie pliku `src/lib/openrouter/index.ts`

```typescript
export { OpenRouterService } from "./service";
export type {
  OpenRouterConfig,
  CompletionRequest,
  CompletionResponse,
  Message,
  ResponseFormat,
  JSONSchema,
  StreamChunk,
  Model,
  Usage,
  Choice,
} from "./types";
export {
  OpenRouterError,
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterValidationError,
  OpenRouterModelError,
  OpenRouterTimeoutError,
  OpenRouterNetworkError,
} from "./errors";
```

### Krok 6: Utworzenie API Endpoint

#### 6.1 Utworzenie pliku `src/pages/api/chat.ts`

```typescript
import type { APIRoute } from "astro";
import { OpenRouterService } from "../../lib/openrouter";
import type { Message } from "../../lib/openrouter";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parsuj request body
    const { messages } = (await request.json()) as { messages: Message[] };

    // Walidacja podstawowa
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Utwórz instancję serwisu (klucz API z env)
    const service = new OpenRouterService();

    // Wykonaj completion
    const response = await service.complete({
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Zwróć odpowiedź
    return new Response(JSON.stringify(response), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Chat API error:", error);

    // Obsłuż znane błędy
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

#### 6.2 Utworzenie endpoint dla streamingu `src/pages/api/chat-stream.ts`

```typescript
import type { APIRoute } from "astro";
import { OpenRouterService } from "../../lib/openrouter";
import type { Message } from "../../lib/openrouter";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { messages } = (await request.json()) as { messages: Message[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), { status: 400 });
    }

    const service = new OpenRouterService();

    // Utwórz ReadableStream dla SSE
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const encoder = new TextEncoder();

          for await (const chunk of service.streamComplete({ messages })) {
            const content = chunk.choices[0]?.delta?.content;

            if (content) {
              // Wyślij chunk jako SSE
              const data = `data: ${JSON.stringify({ content })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }

            // Sprawdź czy to koniec
            if (chunk.choices[0]?.finish_reason) {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat stream API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
```

### Krok 7: Utworzenie Komponentu React dla Chatu

#### 7.1 Utworzenie pliku `src/components/Chat.tsx`

```tsx
import { useState } from "react";
import type { Message } from "../lib/openrouter";

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.choices[0].message.content,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              message.role === "user" ? "bg-blue-100 ml-auto max-w-[80%]" : "bg-gray-100 mr-auto max-w-[80%]"
            }`}
          >
            <div className="font-semibold mb-1">{message.role === "user" ? "You" : "Assistant"}</div>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        ))}
        {loading && (
          <div className="bg-gray-100 p-4 rounded-lg mr-auto max-w-[80%]">
            <div className="font-semibold mb-1">Assistant</div>
            <div>Typing...</div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && !loading && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-lg"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
```

### Krok 8: Weryfikacja i Testowanie

#### 8.1 Checklist Weryfikacji

- [ ] Wszystkie pliki zostały utworzone w odpowiednich lokalizacjach
- [ ] Zmienne środowiskowe są poprawnie skonfigurowane
- [ ] TypeScript kompiluje się bez błędów (`npm run build`)
- [ ] Linter nie zgłasza błędów (`npm run lint`)
- [ ] API endpoint odpowiada poprawnie
- [ ] Komponent React renderuje się poprawnie
- [ ] Obsługa błędów działa zgodnie z oczekiwaniami
- [ ] Streamowanie działa poprawnie (jeśli zaimplementowane)

#### 8.2 Testowanie Manualne

1. **Test podstawowego completion:**

   ```bash
   curl -X POST http://localhost:4321/api/chat \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"Hello!"}]}'
   ```

2. **Test w przeglądarce:**
   - Uruchom `npm run dev`
   - Otwórz stronę z komponentem Chat
   - Wyślij kilka wiadomości
   - Sprawdź czy odpowiedzi są poprawne

3. **Test obsługi błędów:**
   - Usuń klucz API z .env
   - Spróbuj wykonać request
   - Sprawdź czy błąd jest obsłużony poprawnie

## Podsumowanie

Plan wdrożenia został podzielony na 10 kroków:

1. **Przygotowanie środowiska** - konfiguracja zmiennych i zależności
2. **Struktura typów** - definicje TypeScript dla całego API
3. **Klasy błędów** - hierarchia błędów dla różnych scenariuszy
4. **Główna klasa usługi** - pełna implementacja OpenRouterService
5. **Index file** - eksport publicznych interfejsów
6. **API endpoints** - endpointy dla Astro (standardowe i streaming)
7. **Komponent React** - przykładowy interfejs użytkownika
8. **Weryfikacja** - checklist i testy manualne

Każdy krok jest szczegółowo opisany z pełnymi przykładami kodu, które można bezpośrednio użyć w projekcie. Implementacja uwzględnia wszystkie wymagania:

- ✅ Komunikaty systemowe i użytkownika
- ✅ Ustrukturyzowane odpowiedzi przez response_format
- ✅ Konfiguracja modeli i parametrów
- ✅ Obsługa błędów
- ✅ Bezpieczeństwo (klucze API, walidacja)
- ✅ Retry logic i timeouty
- ✅ Streamowanie odpowiedzi
- ✅ TypeScript strict mode
- ✅ Zgodność z tech stackiem (Astro 5, TypeScript 5, React 19)
