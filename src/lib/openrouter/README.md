# OpenRouter Service

Warstwa abstrakcji do komunikacji z API OpenRouter, umożliwiająca integrację różnych modeli LLM w aplikacji Astro/React.

## Funkcjonalności

- ✅ Typowane interfejsy dla requestów i odpowiedzi
- ✅ Obsługa standardowych i strumieniowych odpowiedzi
- ✅ Wsparcie dla ustrukturyzowanych odpowiedzi (JSON Schema)
- ✅ Centralizowane zarządzanie konfiguracją modeli
- ✅ Spójna obsługa błędów z hierarchią klas
- ✅ Bezpieczne zarządzanie kluczami API
- ✅ Retry logic z exponential backoff
- ✅ Timeout protection

## Instalacja

Serwis jest już zintegrowany w projekcie. Wymaga tylko konfiguracji zmiennych środowiskowych.

### Konfiguracja zmiennych środowiskowych

Dodaj do pliku `.env`:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
OPENROUTER_DEFAULT_MODEL=openai/gpt-4o-mini
OPENROUTER_SITE_NAME=Your App Name
OPENROUTER_SITE_URL=https://yourapp.com
```

## Użycie

### Podstawowe użycie

```typescript
import { OpenRouterService } from "@/lib/openrouter";

const service = new OpenRouterService({
  defaultModel: "openai/gpt-4o-mini",
});

const response = await service.complete({
  messages: [
    {
      role: "system",
      content: "You are a helpful assistant.",
    },
    {
      role: "user",
      content: "What is TypeScript?",
    },
  ],
  temperature: 0.7,
  max_tokens: 500,
});

console.log(response.choices[0].message.content);
```

### Ustrukturyzowane odpowiedzi (JSON Schema)

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

### Streamowanie odpowiedzi

```typescript
const stream = service.streamComplete({
  messages: [{ role: "user", content: "Write a short story about TypeScript." }],
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
  }
}
```

### Lista dostępnych modeli

```typescript
const models = await service.getAvailableModels();

models.forEach((model) => {
  console.log(`${model.name}: $${model.pricing.prompt} per prompt token`);
});
```

## API Endpoints

Projekt zawiera gotowe endpointy API:

### POST /api/chat

Standardowe completion bez streamingu.

**Request:**

```json
{
  "messages": [{ "role": "user", "content": "Hello!" }],
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Response:**

```json
{
  "id": "gen-...",
  "model": "anthropic/claude-3.5-sonnet",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      }
    }
  ]
}
```

### POST /api/chat-stream

Streaming completion z Server-Sent Events.

**Request:** (taki sam jak /api/chat)

**Response:** Stream SSE

```
data: {"content":"Hello"}
data: {"content":"!"}
data: [DONE]
```

## Komponenty React

### Chat

Podstawowy komponent chat bez streamingu.

```tsx
import { Chat } from "@/components/Chat";

export function MyPage() {
  return <Chat />;
}
```

### ChatStream

Zaawansowany komponent z obsługą streamingu w czasie rzeczywistym.

```tsx
import { ChatStream } from "@/components/ChatStream";

export function MyPage() {
  return <ChatStream />;
}
```

## Obsługa błędów

Serwis definiuje hierarchię błędów:

```typescript
import {
  OpenRouterError,
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterValidationError,
  OpenRouterModelError,
  OpenRouterTimeoutError,
  OpenRouterNetworkError,
} from "@/lib/openrouter";

try {
  const response = await service.complete({ messages });
} catch (error) {
  if (error instanceof OpenRouterAuthError) {
    console.error("Authentication failed");
  } else if (error instanceof OpenRouterRateLimitError) {
    console.error("Rate limit exceeded");
  } else if (error instanceof OpenRouterTimeoutError) {
    console.error("Request timeout");
  }
}
```

## Konfiguracja

### OpenRouterConfig

```typescript
interface OpenRouterConfig {
  apiKey?: string; // Klucz API (domyślnie z env)
  baseUrl?: string; // URL bazowy API
  defaultModel?: string; // Domyślny model
  timeout?: number; // Timeout w ms (domyślnie: 30000)
  maxRetries?: number; // Maksymalna liczba prób (domyślnie: 3)
  retryDelay?: number; // Opóźnienie między próbami w ms (domyślnie: 1000)
  siteName?: string; // Nazwa strony dla analytics
  siteUrl?: string; // URL strony dla analytics
}
```

## Bezpieczeństwo

⚠️ **Ważne zasady bezpieczeństwa:**

1. **Nigdy nie eksponuj klucza API w kodzie klienta**
   - Klucz API powinien być używany tylko w API endpoints (server-side)
   - Używaj zmiennych środowiskowych

2. **Waliduj dane wejściowe**
   - Wszystkie dane od użytkowników są walidowane z użyciem Zod
   - Nie pozwalaj użytkownikom ustawiać `role: "system"`

3. **Rate limiting**
   - Rozważ implementację rate limitingu po stronie aplikacji
   - OpenRouter ma własne limity, ale dodatkowa warstwa ochrony jest zalecana

4. **Logowanie**
   - Serwis loguje błędy do konsoli
   - Nie loguj wrażliwych danych (klucze API, pełne treści wiadomości)

## Demo

Strona demo dostępna pod adresem: `/chat-demo`

## Struktura plików

```
src/lib/openrouter/
├── index.ts          # Główny plik eksportu
├── types.ts          # Definicje typów TypeScript
├── errors.ts         # Hierarchia klas błędów
├── service.ts        # Główna klasa OpenRouterService
└── README.md         # Ta dokumentacja
```

## Więcej informacji

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Plan implementacji](.ai/openrouter-service-implementation-plan.md)
