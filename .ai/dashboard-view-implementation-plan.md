# Plan implementacji widoku Dashboard

## 1. Przegląd

Dashboard jest głównym hubem aplikacji AI Meal Planner, gdzie zalogowani użytkownicy mogą przeglądać swój aktualny plan posiłków lub wygenerować nowy. Widok obsługuje cztery główne stany: brak planu (empty state), plan wygenerowany (wyświetlanie trzech posiłków), generowanie planu (loading state z możliwością anulowania) oraz błąd generowania (error state z retry).

Dashboard integruje się z API meal-plans i feedback, implementuje automatyczny tracking akceptacji planu oraz zapewnia pełną responsywność (mobile-first design). Komponent jest kluczowy dla spełnienia historyjek użytkownika US-008, US-009, US-010, US-011 i US-016.

## 2. Routing widoku

- **Ścieżka**: `/dashboard`
- **Plik**: `src/pages/dashboard.astro`
- **Ochrona**: Wymaga autentykacji (middleware sprawdza JWT token)
- **Prerender**: `export const prerender = false;`

## 3. Struktura komponentów

```
Dashboard.astro (Astro page, server-rendered)
└── DashboardContent.tsx (React, client:load)
    ├── EmptyState.tsx (conditional: gdy brak planu)
    │   └── Button (shadcn/ui)
    │
    ├── MealPlanView.tsx (conditional: gdy plan istnieje)
    │   ├── MealPlanHeader.tsx
    │   │   ├── Heading
    │   │   └── Button (Wygeneruj nowy plan)
    │   │
    │   ├── MealPlanGrid.tsx
    │   │   ├── MealCard.tsx (śniadanie)
    │   │   │   ├── MealCardHeader.tsx
    │   │   │   ├── IngredientList.tsx
    │   │   │   └── StepsList.tsx
    │   │   ├── MealCard.tsx (obiad)
    │   │   └── MealCard.tsx (kolacja)
    │   │
    │   └── FeedbackSection.tsx
    │       ├── Text (pytanie)
    │       └── FeedbackButtons.tsx
    │           ├── Button (thumbs up)
    │           └── Button (thumbs down)
    │
    ├── GeneratingModal.tsx (conditional: podczas generowania)
    │   ├── Dialog (shadcn/ui)
    │   ├── Spinner
    │   ├── Text (status)
    │   ├── Text (elapsed time)
    │   └── Button (Anuluj)
    │
    └── ErrorState.tsx (conditional: gdy błąd)
        ├── Alert (shadcn/ui)
        ├── Text (error message)
        └── Button (Spróbuj ponownie)
```

## 4. Szczegóły komponentów

### 4.1. Dashboard.astro

**Opis komponentu**: Główna strona Astro dla widoku Dashboard. Odpowiedzialna za server-side rendering, sprawdzenie autentykacji użytkownika i załadowanie głównego komponentu React.

**Główne elementy**:

- `<Layout>` - wrapper z layoutu aplikacji
- `<main>` - główny kontener z semantic HTML
- `<DashboardContent client:load>` - główny komponent React z hydracją

**Obsługiwane zdarzenia**: Brak (strona serwerowa)

**Obsługiwana walidacja**:

- Sprawdzenie czy użytkownik jest zalogowany (przez `context.locals.supabase.auth.getUser()`)
- Jeśli niezalogowany: redirect do `/` (strona główna z logowaniem)

**Typy**: Brak (użycie wbudowanych typów Astro)

**Propsy**: Brak

---

### 4.2. DashboardContent.tsx

**Opis komponentu**: Główny komponent React zarządzający całym stanem Dashboard. Orchestruje pobieranie planu, generowanie nowego planu, feedback oraz tracking akceptacji. Renderuje odpowiedni widok w zależności od stanu (empty, loaded, generating, error).

**Główne elementy**:

- Conditional rendering w zależności od `state.type`:
  - `'empty'` → `<EmptyState>`
  - `'loaded'` → `<MealPlanView>`
  - `'generating'` → `<GeneratingModal>`
  - `'error'` → `<ErrorState>` + poprzedni widok (jeśli istnieje plan)

**Obsługiwane zdarzenia**:

- `onGenerate()` - inicjalizacja generowania planu (pierwszy raz lub regeneracja)
- `onCancelGeneration()` - anulowanie generowania przez użytkownika
- `onFeedbackChange(rating: Rating)` - zmiana oceny planu
- `onRetry()` - ponowna próba po błędzie

**Obsługiwana walidacja**:

- Sprawdzenie czy odpowiedź API zawiera 3 posiłki (`meals.length === 3`)
- Walidacja struktury każdego posiłku (name, ingredients, steps, time są obecne)
- Sprawdzenie czy status planu to `'generated'`

**Typy**:

- `DashboardState` (union type dla różnych stanów)
- `FeedbackState` (stan feedbacku)
- `MealPlanDTO` (z types.ts)
- `GenerateMealPlanDTO` (z types.ts)
- `CreateFeedbackDTO` (z types.ts)
- `UpdateFeedbackDTO` (z types.ts)

**Propsy**: Brak (top-level component)

---

### 4.3. EmptyState.tsx

**Opis komponentu**: Wyświetla przyjazny komunikat i call-to-action gdy użytkownik nie ma jeszcze wygenerowanego planu. Komponent zachęca do pierwszego wygenerowania planu.

**Główne elementy**:

- `<div>` container z centrowanym contentem
- Ikona (np. `ChefHat` z lucide-react)
- `<h2>` - nagłówek powitalny: "Cześć! Jesteś gotowy na swój pierwszy plan posiłków?"
- `<p>` - instrukcja: "Kliknij poniżej, a AI wygeneruje dla Ciebie spersonalizowany plan na dzisiaj."
- `<Button>` - duży CTA button: "Wygeneruj mój pierwszy plan"

**Obsługiwane zdarzenia**:

- `onClick` na Button - wywołuje `onGenerate()`

**Obsługiwana walidacja**: Brak

**Typy**:

- `EmptyStateProps`

**Propsy**:

```typescript
interface EmptyStateProps {
  onGenerate: () => void;
  isFirstTime?: boolean; // opcjonalne rozróżnienie między pierwszym razem a brakiem planu po błędzie
}
```

---

### 4.4. MealPlanView.tsx

**Opis komponentu**: Główny kontener dla wyświetlania wygenerowanego planu posiłków. Zawiera header, grid z posiłkami oraz sekcję feedbacku.

**Główne elementy**:

- `<MealPlanHeader>` - nagłówek z tytułem i przyciskiem regeneracji
- `<MealPlanGrid>` - responsywny grid z 3 kartami posiłków
- `<FeedbackSection>` - sekcja z pytaniem i buttonami thumbs up/down

**Obsługiwane zdarzenia**:

- `onRegenerate()` - przekazywane do MealPlanHeader
- `onFeedbackChange(rating)` - przekazywane do FeedbackSection

**Obsługiwana walidacja**: Brak (walidacja w parent)

**Typy**:

- `MealPlanViewProps`
- `MealPlanDTO`
- `FeedbackState`

**Propsy**:

```typescript
interface MealPlanViewProps {
  plan: MealPlanDTO;
  feedbackState: FeedbackState;
  onRegenerate: () => void;
  onFeedbackChange: (rating: Rating) => void;
}
```

---

### 4.5. MealPlanHeader.tsx

**Opis komponentu**: Header sekcji planu z tytułem i przyciskiem do regeneracji.

**Główne elementy**:

- `<div>` container z flex layout (space-between)
- `<div>` lewy blok:
  - `<h1>` - tytuł: "Twój plan posiłków na dzisiaj"
  - `<p>` (opcjonalnie) - data: format "1 listopada 2025"
- `<Button variant="secondary">` - "Wygeneruj nowy plan"

**Obsługiwane zdarzenia**:

- `onClick` na Button - wywołuje `onRegenerate()`

**Obsługiwana walidacja**: Brak

**Typy**:

- `MealPlanHeaderProps`

**Propsy**:

```typescript
interface MealPlanHeaderProps {
  onRegenerate: () => void;
}
```

---

### 4.6. MealPlanGrid.tsx

**Opis komponentu**: Responsywny grid container dla trzech kart posiłków (śniadanie, obiad, kolacja).

**Główne elementy**:

- `<div className="grid">` z Tailwind classes:
  - `grid-cols-1` (mobile)
  - `md:grid-cols-2` (tablet, 768px+)
  - `lg:grid-cols-3` (desktop, 1024px+)
  - `gap-6` - odstępy między kartami
- 3x `<MealCard>` - po jednym dla każdego posiłku

**Obsługiwane zdarzenia**: Brak

**Obsługiwana walidacja**: Brak

**Typy**:

- `MealPlanGridProps`
- `Meal` (z types.ts)

**Propsy**:

```typescript
interface MealPlanGridProps {
  meals: [Meal, Meal, Meal]; // tuple 3 elementów
}
```

---

### 4.7. MealCard.tsx

**Opis komponentu**: Karta pojedynczego posiłku wyświetlająca nazwę, czas przygotowania, składniki i kroki.

**Główne elementy**:

- `<div className="card">` - kontener karty z borderami i padding
- `<MealCardHeader>` - nagłówek z nazwą i czasem
- `<IngredientList>` - lista składników
- `<StepsList>` - lista kroków przygotowania

**Obsługiwane zdarzenia**: Brak

**Obsługiwana walidacja**: Brak

**Typy**:

- `MealCardProps`
- `Meal`

**Propsy**:

```typescript
interface MealCardProps {
  meal: Meal;
  index: number; // 0=śniadanie, 1=obiad, 2=kolacja (do analytics lub ARIA labels)
}
```

---

### 4.8. MealCardHeader.tsx

**Opis komponentu**: Header karty posiłku z nazwą posiłku i szacowanym czasem przygotowania.

**Główne elementy**:

- `<div>` container
- `<h2>` - nazwa posiłku (np. "Śniadanie: Owsianka z owocami")
- `<div>` z ikoną zegara i czasem:
  - `<Clock size={16}>` (lucide-react)
  - `<span>` - czas: "{time} minut" lub "{time} min"

**Obsługiwane zdarzenia**: Brak

**Obsługiwana walidacja**: Brak

**Typy**:

- `MealCardHeaderProps`

**Propsy**:

```typescript
interface MealCardHeaderProps {
  name: string;
  time: number; // w minutach
}
```

---

### 4.9. IngredientList.tsx

**Opis komponentu**: Lista składników z nazwami i ilościami.

**Główne elementy**:

- `<div>` container
- `<h3>` - podtytuł: "Składniki"
- `<ul>` - lista:
  - `<li>` dla każdego składnika: "{amount} {name}" (np. "50g Płatki owsiane")

**Obsługiwane zdarzenia**: Brak

**Obsługiwana walidacja**: Brak

**Typy**:

- `IngredientListProps`
- `Ingredient`

**Propsy**:

```typescript
interface IngredientListProps {
  ingredients: Ingredient[];
}
```

---

### 4.10. StepsList.tsx

**Opis komponentu**: Numerowana lista kroków przygotowania posiłku.

**Główne elementy**:

- `<div>` container
- `<h3>` - podtytuł: "Przygotowanie"
- `<ol>` - lista numerowana:
  - `<li>` dla każdego kroku z tekstem instrukcji

**Obsługiwane zdarzenia**: Brak

**Obsługiwana walidacja**: Brak

**Typy**:

- `StepsListProps`

**Propsy**:

```typescript
interface StepsListProps {
  steps: string[];
}
```

---

### 4.11. FeedbackSection.tsx

**Opis komponentu**: Sekcja z pytaniem o opinię i buttonami do oceny planu.

**Główne elementy**:

- `<div>` container (border-top, padding-top dla wizualnego oddzielenia)
- `<p>` - pytanie: "Czy podoba Ci się ten plan?"
- `<FeedbackButtons>` - komponenty thumbs up/down

**Obsługiwane zdarzenia**:

- `onFeedbackChange(rating)` - przekazywane do FeedbackButtons

**Obsługiwana walidacja**: Brak

**Typy**:

- `FeedbackSectionProps`
- `FeedbackState`
- `Rating`

**Propsy**:

```typescript
interface FeedbackSectionProps {
  feedbackState: FeedbackState;
  onFeedbackChange: (rating: Rating) => void;
}
```

---

### 4.12. FeedbackButtons.tsx

**Opis komponentu**: Para buttonów thumbs up i thumbs down do oceny planu. Obsługuje stan aktywności (który jest zaznaczony) oraz submitting state.

**Główne elementy**:

- `<div>` container z flex layout
- `<Button>` thumbs up:
  - Ikona `ThumbsUp` (lucide-react)
  - `aria-label="Oceń plan pozytywnie"`
  - `aria-pressed={rating === 'THUMBS_UP'}`
  - Zmiana koloru gdy aktywny (zielony)
- `<Button>` thumbs down:
  - Ikona `ThumbsDown` (lucide-react)
  - `aria-label="Oceń plan negatywnie"`
  - `aria-pressed={rating === 'THUMBS_DOWN'}`
  - Zmiana koloru gdy aktywny (czerwony)

**Obsługiwane zdarzenia**:

- `onClick` na thumbs up - wywołuje `onChange('THUMBS_UP')`
- `onClick` na thumbs down - wywołuje `onChange('THUMBS_DOWN')`
- Możliwość zmiany oceny (klik na drugi button)

**Obsługiwana walidacja**: Brak

**Typy**:

- `FeedbackButtonsProps`
- `Rating`

**Propsy**:

```typescript
interface FeedbackButtonsProps {
  rating: Rating | null;
  isSubmitting: boolean;
  onChange: (rating: Rating) => void;
}
```

---

### 4.13. GeneratingModal.tsx

**Opis komponentu**: Fullscreen modal wyświetlany podczas generowania planu. Zawiera loader, informację o statusie i możliwość anulowania.

**Główne elementy**:

- `<Dialog>` z shadcn/ui:
  - `open={true}` - zawsze otwarty gdy renderowany
  - `modal={true}` - blokuje interakcje z tłem
- `<DialogContent>` - zawartość modalu:
  - Spinner (animowany, `animate-spin` z Tailwind)
  - `<p>` - główny tekst: "Generuję plan..."
  - `<p className="text-muted-foreground">` - subtext: "To może zająć do 30 sekund"
  - `<p>` - elapsed time: "Minęło: {elapsedTime}s" (opcjonalnie)
  - `<Button variant="outline">` - "Anuluj"

**Obsługiwane zdarzenia**:

- `onClick` na Button Anuluj - wywołuje `onCancel()`
- `onEscapeKeyDown` na Dialog - wywołuje `onCancel()`

**Obsługiwana walidacja**: Brak

**Typy**:

- `GeneratingModalProps`

**Propsy**:

```typescript
interface GeneratingModalProps {
  onCancel: () => void;
  elapsedTime: number; // w sekundach
}
```

---

### 4.14. ErrorState.tsx

**Opis komponentu**: Wyświetla komunikat błędu z możliwością retry. Może być renderowany samodzielnie (gdy nie ma planu) lub nad istniejącym planem (gdy regeneracja się nie powiodła).

**Główne elementy**:

- `<Alert variant="destructive">` (shadcn/ui)
  - Ikona błędu `AlertCircle` (lucide-react)
  - `<AlertTitle>` - "Wystąpił błąd"
  - `<AlertDescription>` - komunikat błędu z props
- `<Button>` - "Spróbuj ponownie"

**Obsługiwane zdarzenia**:

- `onClick` na Button - wywołuje `onRetry()`

**Obsługiwana walidacja**: Brak

**Typy**:

- `ErrorStateProps`

**Propsy**:

```typescript
interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  retryable?: boolean; // czy pokazać button retry (default true)
}
```

---

## 5. Typy

### 5.1. Istniejące typy (z `src/types.ts`)

Wykorzystywane bezpośrednio z pliku types.ts:

```typescript
// Request DTO
export interface GenerateMealPlanDTO {
  regeneration?: boolean;
}

// Response DTO
export type MealPlanDTO = Omit<Tables<"meal_plans">, "meals" | "status"> & {
  meals: [Meal, Meal, Meal];
  status: MealPlanStatus;
};

// Meal structure
export interface Meal {
  name: string;
  ingredients: Ingredient[];
  steps: string[];
  time: number;
}

// Ingredient structure
export interface Ingredient {
  name: string;
  amount: string;
}

// Enums
export type Rating = Enums<"rating_enum">; // "THUMBS_UP" | "THUMBS_DOWN"
export type MealPlanStatus = Enums<"status_enum">; // "pending" | "generated" | "error"

// Feedback DTOs
export type CreateFeedbackDTO = Omit<TablesInsert<"feedback">, "id" | "created_at" | "meal_plan_id">;
export type UpdateFeedbackDTO = Partial<Omit<TablesUpdate<"feedback">, "id" | "created_at" | "meal_plan_id">>;
export type FeedbackDTO = Tables<"feedback">;
```

### 5.2. Nowe typy ViewModel (do utworzenia w osobnym pliku `src/lib/viewmodels/dashboard.viewmodel.ts`)

```typescript
import type { MealPlanDTO, Rating } from "@/types";

/**
 * Stan głównego widoku Dashboard
 * Union type reprezentujący wszystkie możliwe stany interfejsu
 */
export type DashboardState =
  | { type: "empty" } // Brak planu
  | { type: "loaded"; plan: MealPlanDTO } // Plan załadowany
  | { type: "generating"; startTime: number; previousPlan?: MealPlanDTO } // Generowanie (opcjonalnie z poprzednim planem)
  | { type: "error"; message: string; retryable: boolean; previousPlan?: MealPlanDTO }; // Błąd (opcjonalnie z poprzednim planem)

/**
 * Stan systemu feedbacku
 */
export interface FeedbackState {
  /** ID istniejącego feedbacku (jeśli użytkownik już ocenił) */
  feedbackId: string | null;
  /** Aktualnie wybrana ocena */
  rating: Rating | null;
  /** Czy feedback jest w trakcie wysyłania */
  isSubmitting: boolean;
}

/**
 * Typy błędów API do rozróżnienia strategii obsługi
 */
export type ApiErrorType =
  | "UNAUTHORIZED" // 401 - redirect do logowania
  | "NOT_FOUND" // 404 - brak planu (normalne)
  | "BAD_REQUEST" // 400 - brak preferencji
  | "TIMEOUT" // 504 - timeout
  | "SERVICE_UNAVAILABLE" // 503 - serwis niedostępny
  | "INTERNAL_ERROR" // 500 - błąd serwera
  | "NETWORK_ERROR" // błąd sieci
  | "ABORT_ERROR"; // anulowane przez użytkownika

/**
 * Szczegóły błędu z typem i komunikatem
 */
export interface ApiError {
  type: ApiErrorType;
  message: string;
  retryable: boolean;
}

/**
 * Propsy komponentów
 */

export interface EmptyStateProps {
  onGenerate: () => void;
  isFirstTime?: boolean;
}

export interface MealPlanViewProps {
  plan: MealPlanDTO;
  feedbackState: FeedbackState;
  onRegenerate: () => void;
  onFeedbackChange: (rating: Rating) => void;
}

export interface MealPlanHeaderProps {
  onRegenerate: () => void;
}

export interface MealPlanGridProps {
  meals: [Meal, Meal, Meal];
}

export interface MealCardProps {
  meal: Meal;
  index: number;
}

export interface MealCardHeaderProps {
  name: string;
  time: number;
}

export interface IngredientListProps {
  ingredients: Ingredient[];
}

export interface StepsListProps {
  steps: string[];
}

export interface FeedbackSectionProps {
  feedbackState: FeedbackState;
  onFeedbackChange: (rating: Rating) => void;
}

export interface FeedbackButtonsProps {
  rating: Rating | null;
  isSubmitting: boolean;
  onChange: (rating: Rating) => void;
}

export interface GeneratingModalProps {
  onCancel: () => void;
  elapsedTime: number;
}

export interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  retryable?: boolean;
}
```

## 6. Zarządzanie stanem

### 6.1. Custom Hook: `useMealPlan`

Lokalizacja: `src/hooks/useMealPlan.ts`

Hook zarządza całym stanem Dashboard - pobieranie planu, generowanie, anulowanie i error handling.

**Stan wewnętrzny**:

```typescript
const [state, setState] = useState<DashboardState>({ type: "empty" });
const abortControllerRef = useRef<AbortController | null>(null);
```

**Efekty uboczne**:

- `useEffect` przy mount: wywołuje `fetchCurrentPlan()`

**Funkcje eksportowane**:

1. **`fetchCurrentPlan(): Promise<void>`**
   - Wywołuje GET /api/meal-plans/current
   - Sukces 200: `setState({ type: 'loaded', plan })`
   - Błąd 404: `setState({ type: 'empty' })` (normalne)
   - Błąd 401: redirect do `/`
   - Błąd 500: `setState({ type: 'error', ... })`

2. **`generatePlan(isRegeneration: boolean): Promise<void>`**
   - Tworzy nowy AbortController i zapisuje w ref
   - `setState({ type: 'generating', startTime: Date.now(), previousPlan: ... })`
   - Wywołuje POST /api/meal-plans { regeneration: isRegeneration }
   - Sukces 201: `setState({ type: 'loaded', plan })`
   - Błąd: `setState({ type: 'error', message: ..., previousPlan: ... })`
   - AbortError: powrót do poprzedniego stanu + toast

3. **`cancelGeneration(): void`**
   - Wywołuje `abortControllerRef.current?.abort()`
   - Pokazuje toast: "Generowanie przerwane"

**Return value**:

```typescript
return {
  state,
  generatePlan,
  cancelGeneration,
  refetch: fetchCurrentPlan,
};
```

---

### 6.2. Custom Hook: `useFeedback`

Lokalizacja: `src/hooks/useFeedback.ts`

Hook zarządza stanem feedbacku - wysyłanie i aktualizacja oceny.

**Stan wewnętrzny**:

```typescript
const [feedbackState, setFeedbackState] = useState<FeedbackState>({
  feedbackId: null,
  rating: null,
  isSubmitting: false,
});
```

**Funkcje eksportowane**:

1. **`submitFeedback(mealPlanId: string, rating: Rating): Promise<void>`**
   - `setFeedbackState({ ...prev, isSubmitting: true })`
   - Jeśli `feedbackId === null`:
     - POST /api/feedback { rating, meal_plan_id: mealPlanId }
     - Zapisuje feedbackId z response
   - Jeśli `feedbackId !== null`:
     - PUT /api/feedback/{feedbackId} { rating }
   - Sukces: aktualizuje stan + toast "Dziękujemy za opinię"
   - Błąd: toast błędu + rollback stanu
   - `setFeedbackState({ ...prev, isSubmitting: false })`

**Return value**:

```typescript
return {
  feedbackState,
  submitFeedback,
};
```

---

### 6.3. Custom Hook: `usePlanAcceptanceTracking`

Lokalizacja: `src/hooks/usePlanAcceptanceTracking.ts`

Hook automatycznie trackuje akceptację planu (gdy użytkownik nie regeneruje w ciągu 2 minut i spędza min 30s na stronie).

**Parametry**:

```typescript
function usePlanAcceptanceTracking(planId: string | null, isGenerating: boolean): void;
```

**Logika**:

- `useEffect` z dependencies: `[planId, isGenerating]`
- Timer startuje gdy `planId !== null` i `!isGenerating`
- Po 30 sekundach: zapisuje timestamp "seen"
- Po 2 minutach (bez regeneracji): wywołuje POST /api/analytics/events
  - Body: `{ action_type: 'plan_accepted', context: { plan_id: planId, time_on_page } }`
- Cleanup przy unmount lub zmianie dependencies: clearTimeout

---

### 6.4. Custom Hook: `useElapsedTime`

Lokalizacja: `src/hooks/useElapsedTime.ts`

Hook do śledzenia upływającego czasu (do wyświetlenia w GeneratingModal).

**Parametry**:

```typescript
function useElapsedTime(isActive: boolean): number;
```

**Logika**:

- `useState` dla elapsed seconds
- `useEffect` z `setInterval` (aktualizacja co 1s)
- Reset gdy `isActive` zmienia się na `false`

**Return value**: liczba sekund (number)

---

## 7. Integracja API

### 7.1. GET /api/meal-plans/current

**Kiedy wywoływane**:

- Przy pierwszym renderze DashboardContent (useEffect w useMealPlan)
- Po ręcznym refetch (opcjonalnie)

**Request**:

```typescript
const response = await fetch("/api/meal-plans/current", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
});
```

**Response type**: `MealPlanDTO`

**Obsługa odpowiedzi**:

- **200 OK**: Plan istnieje

  ```typescript
  const plan: MealPlanDTO = await response.json();
  setState({ type: "loaded", plan });
  ```

- **404 Not Found**: Brak planu (normalne dla nowego użytkownika)

  ```typescript
  setState({ type: "empty" });
  ```

- **401 Unauthorized**: Użytkownik niezalogowany

  ```typescript
  window.location.href = "/"; // redirect do strony głównej z logowaniem
  ```

- **500 Internal Server Error**: Błąd serwera
  ```typescript
  const error = await response.json();
  setState({
    type: "error",
    message: "Wystąpił błąd podczas pobierania planu",
    retryable: true,
  });
  ```

---

### 7.2. POST /api/meal-plans

**Kiedy wywoływane**:

- Klik "Wygeneruj mój pierwszy plan" (regeneration: false)
- Klik "Wygeneruj nowy plan" (regeneration: true)

**Request**:

```typescript
const controller = new AbortController();
const response = await fetch("/api/meal-plans", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    regeneration: isRegeneration,
  } as GenerateMealPlanDTO),
  signal: controller.signal,
});
```

**Response type**: `MealPlanDTO`

**Obsługa odpowiedzi**:

- **201 Created**: Plan wygenerowany

  ```typescript
  const plan: MealPlanDTO = await response.json();
  setState({ type: "loaded", plan });
  // Wywołanie analytics tracking (w tle)
  ```

- **400 Bad Request**: Brak preferencji użytkownika

  ```typescript
  const error = await response.json();
  setState({
    type: "error",
    message: error.message, // "Najpierw wypełnij swoje preferencje żywieniowe"
    retryable: false,
  });
  // Opcjonalnie: link do /onboarding
  ```

- **401 Unauthorized**: Token wygasł

  ```typescript
  window.location.href = "/";
  ```

- **500 Internal Server Error**: Błąd generowania

  ```typescript
  const error = await response.json();
  setState({
    type: "error",
    message: error.message, // "Nie udało się wygenerować planu. Spróbuj ponownie."
    retryable: true,
    previousPlan: state.type === "loaded" ? state.plan : undefined,
  });
  ```

- **503 Service Unavailable**: AI serwis niedostępny

  ```typescript
  setState({
    type: "error",
    message: "Serwis AI jest chwilowo niedostępny. Spróbuj za chwilę.",
    retryable: true,
    previousPlan: ...
  });
  ```

- **504 Gateway Timeout**: Przekroczono timeout

  ```typescript
  setState({
    type: "error",
    message: "Generowanie planu trwa zbyt długo. Spróbuj ponownie.",
    retryable: true,
    previousPlan: ...
  });
  ```

- **AbortError** (anulowanie):
  ```typescript
  // W catch block:
  if (error.name === "AbortError") {
    // Powrót do poprzedniego stanu
    // Toast: "Generowanie przerwane"
    return;
  }
  ```

---

### 7.3. POST /api/feedback

**Kiedy wywoływane**:

- Pierwsza ocena planu (klik thumbs up/down gdy feedbackId === null)

**Request**:

```typescript
const response = await fetch("/api/feedback", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    rating: rating, // "THUMBS_UP" | "THUMBS_DOWN"
    meal_plan_id: mealPlanId,
  } as CreateFeedbackDTO & { meal_plan_id: string }),
});
```

**Response type**: `FeedbackDTO`

**Obsługa odpowiedzi**:

- **201 Created**: Feedback zapisany

  ```typescript
  const feedback: FeedbackDTO = await response.json();
  setFeedbackState({
    feedbackId: feedback.id,
    rating: feedback.rating,
    isSubmitting: false,
  });
  // Toast: "Dziękujemy za opinię"
  ```

- **Błędy**: Toast z komunikatem błędu, rollback stanu

---

### 7.4. PUT /api/feedback/:id

**Kiedy wywoływane**:

- Zmiana oceny (klik thumbs up/down gdy feedbackId !== null)

**Request**:

```typescript
const response = await fetch(`/api/feedback/${feedbackId}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    rating: rating,
  } as UpdateFeedbackDTO),
});
```

**Response type**: `FeedbackDTO`

**Obsługa odpowiedzi**: Identyczna jak POST

---

### 7.5. POST /api/analytics/events (automatyczny)

**Kiedy wywoływane**:

- Automatycznie przez `usePlanAcceptanceTracking` po 2 minutach

**Request**:

```typescript
await fetch("/api/analytics/events", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    action_type: "plan_accepted",
    context: {
      plan_id: planId,
      time_on_page: timeOnPage, // w sekundach
    },
  }),
});
```

**Obsługa**: Fire-and-forget (błędy nie wpływają na UX)

---

## 8. Interakcje użytkownika

### 8.1. Klik "Wygeneruj mój pierwszy plan" (EmptyState)

**Trigger**: `onClick` na Button w EmptyState

**Przepływ**:

1. Wywołanie `generatePlan(false)` z useMealPlan
2. Utworzenie AbortController
3. Zmiana stanu na `{ type: 'generating', startTime: Date.now() }`
4. Renderowanie GeneratingModal
5. POST /api/meal-plans { regeneration: false }
6. **Sukces**:
   - Zamknięcie modalu (automatyczne przy zmianie stanu)
   - Renderowanie MealPlanView z planem
   - Analytics tracking w tle
7. **Błąd**:
   - Zamknięcie modalu
   - Renderowanie ErrorState
   - Możliwość retry

**Efekty wizualne**:

- Fullscreen modal z loaderem
- Spinner animation
- Timer elapsed time (aktualizowany co sekundę)
- Button "Anuluj" dostępny

**Accessibility**:

- Focus trap w modalu
- Focus na button "Anuluj"
- ESC zamyka modal (wywołuje onCancel)
- `aria-busy="true"` na kontenerze
- `role="status"` dla tekstu statusu

---

### 8.2. Klik "Wygeneruj nowy plan" (MealPlanHeader)

**Trigger**: `onClick` na Button w MealPlanHeader

**Przepływ**: Identyczny jak 8.1, ale:

- `generatePlan(true)` - regeneration flag
- Stan: `{ type: 'generating', startTime: Date.now(), previousPlan: currentPlan }`
- Jeśli błąd: ErrorState renderowany NAD istniejącym planem (użytkownik może zamknąć i wrócić do planu)

**Analytics**: Event `plan_regenerated` zamiast `plan_generated`

---

### 8.3. Klik "Anuluj" w GeneratingModal

**Trigger**: `onClick` na Button Anuluj lub `onEscapeKeyDown` w Dialog

**Przepływ**:

1. Wywołanie `cancelGeneration()` z useMealPlan
2. `abortController.abort()`
3. Fetch rzuca AbortError
4. W catch: sprawdzenie `error.name === 'AbortError'`
5. Powrót do poprzedniego stanu:
   - Jeśli był previousPlan: `setState({ type: 'loaded', plan: previousPlan })`
   - Jeśli nie było: `setState({ type: 'empty' })`
6. Toast: "Generowanie przerwane"

**Efekty wizualne**:

- Natychmiastowe zamknięcie modalu
- Wyświetlenie poprzedniego widoku
- Toast notification (2-3 sekundy)

---

### 8.4. Klik Thumbs Up (FeedbackButtons)

**Trigger**: `onClick` na Button thumbs up

**Przepływ**:

1. Wywołanie `onChange('THUMBS_UP')` z FeedbackButtons
2. Propagacja do `onFeedbackChange` w MealPlanView
3. Wywołanie `submitFeedback(planId, 'THUMBS_UP')` z useFeedback
4. Optimistic update: `setFeedbackState({ ...prev, rating: 'THUMBS_UP', isSubmitting: true })`
5. **Jeśli feedbackId === null** (pierwsza ocena):
   - POST /api/feedback { rating: 'THUMBS_UP', meal_plan_id }
   - Zapisanie feedbackId z response
6. **Jeśli feedbackId !== null** (zmiana oceny):
   - PUT /api/feedback/:id { rating: 'THUMBS_UP' }
7. **Sukces**:
   - Toast: "Dziękujemy za opinię"
   - `setFeedbackState({ feedbackId, rating: 'THUMBS_UP', isSubmitting: false })`
8. **Błąd**:
   - Rollback: przywrócenie poprzedniego rating
   - Toast: komunikat błędu
   - `setFeedbackState({ ...prev, isSubmitting: false })`

**Efekty wizualne**:

- Zmiana koloru buttona thumbs up na zielony
- Thumbs down wraca do neutralnego koloru (jeśli był aktywny)
- `aria-pressed="true"` na thumbs up
- Disable obu buttonów podczas isSubmitting

---

### 8.5. Klik Thumbs Down (FeedbackButtons)

**Trigger**: `onClick` na Button thumbs down

**Przepływ**: Identyczny jak 8.4, ale z `'THUMBS_DOWN'` i kolorem czerwonym

---

### 8.6. Klik "Spróbuj ponownie" (ErrorState)

**Trigger**: `onClick` na Button w ErrorState

**Przepływ**:

1. Wywołanie `onRetry()` przekazanego do ErrorState
2. W DashboardContent: wywołanie `generatePlan(isRegeneration)`
3. Przepływ identyczny jak 8.1 lub 8.2 (w zależności czy był poprzedni plan)

---

### 8.7. Plan Acceptance Tracking (automatyczny)

**Trigger**: Automatyczny w usePlanAcceptanceTracking

**Warunki**:

- Plan został załadowany (`planId !== null`)
- Nie jest w trakcie generowania (`!isGenerating`)
- Użytkownik pozostał na stronie minimum 30 sekund
- Użytkownik NIE kliknął "Wygeneruj nowy plan" w ciągu 2 minut

**Przepływ**:

1. useEffect startuje timer przy załadowaniu planu
2. Po 30 sekundach: zapisuje timestamp (użytkownik "zobaczył" plan)
3. Po 2 minutach: sprawdza czy plan się nie zmienił (brak regeneracji)
4. Jeśli warunki spełnione:
   - POST /api/analytics/events (fire-and-forget)
   - Body: `{ action_type: 'plan_accepted', context: { plan_id, time_on_page: 120 } }`
5. Cleanup: clearTimeout przy unmount lub zmianie planId

**Efekty**: Brak efektów wizualnych (działa w tle)

---

## 9. Warunki i walidacja

### 9.1. Warunki autentykacji (Dashboard.astro)

**Gdzie**: Server-side w pliku Dashboard.astro

**Warunek**:

```typescript
const {
  data: { user },
  error,
} = await context.locals.supabase.auth.getUser();

if (error || !user) {
  return context.redirect("/");
}
```

**Wpływ na UI**:

- Jeśli niezalogowany: redirect do strony głównej (nie renderuje Dashboard)
- Jeśli zalogowany: renderuje DashboardContent

---

### 9.2. Walidacja struktury planu (useMealPlan)

**Gdzie**: Hook useMealPlan, po otrzymaniu odpowiedzi z API

**Warunki**:

```typescript
// Sprawdzenie czy response zawiera 3 posiłki
if (!plan.meals || plan.meals.length !== 3) {
  throw new Error("Invalid meal plan structure");
}

// Sprawdzenie struktury każdego posiłku
plan.meals.forEach((meal, index) => {
  if (!meal.name || !meal.ingredients || !meal.steps || typeof meal.time !== "number") {
    throw new Error(`Invalid meal structure at index ${index}`);
  }
});

// Sprawdzenie statusu
if (plan.status !== "generated") {
  throw new Error("Plan status is not 'generated'");
}
```

**Wpływ na UI**:

- Jeśli walidacja się nie powiedzie: traktowane jak błąd API
- Renderowanie ErrorState z komunikatem błędu

---

### 9.3. Walidacja stanu feedbacku (FeedbackButtons)

**Gdzie**: Komponent FeedbackButtons

**Warunki**:

```typescript
// Disable buttonów podczas submitting
disabled={isSubmitting}

// Zmiana koloru w zależności od rating
className={cn(
  "...",
  rating === 'THUMBS_UP' && "bg-green-500 text-white",
  rating === 'THUMBS_DOWN' && "bg-red-500 text-white"
)}

// Aria pressed
aria-pressed={rating === 'THUMBS_UP'} // lub 'THUMBS_DOWN'
```

**Wpływ na UI**:

- Buttony disabled podczas wysyłania feedbacku
- Aktywny button ma zmieniony kolor
- Screen readery informują o stanie "pressed"

---

### 9.4. Warunki wyświetlania komponentów (DashboardContent)

**Gdzie**: Komponent DashboardContent

**Conditional rendering**:

```typescript
{state.type === 'empty' && (
  <EmptyState onGenerate={() => generatePlan(false)} />
)}

{state.type === 'loaded' && (
  <MealPlanView
    plan={state.plan}
    feedbackState={feedbackState}
    onRegenerate={() => generatePlan(true)}
    onFeedbackChange={submitFeedback}
  />
)}

{state.type === 'generating' && (
  <GeneratingModal
    onCancel={cancelGeneration}
    elapsedTime={elapsedTime}
  />
)}

{state.type === 'error' && (
  <>
    <ErrorState
      message={state.message}
      onRetry={() => generatePlan(state.previousPlan ? true : false)}
      retryable={state.retryable}
    />
    {state.previousPlan && (
      <MealPlanView
        plan={state.previousPlan}
        // ... (wyświetlenie poprzedniego planu pod błędem)
      />
    )}
  </>
)}
```

**Wpływ na UI**: Tylko jeden główny widok renderowany w danym momencie

---

### 9.5. Walidacja timeout (GeneratingModal)

**Gdzie**: useElapsedTime hook i GeneratingModal

**Warunki**:

```typescript
// Jeśli elapsed time > 30 sekund - zmiana komunikatu
{elapsedTime > 30 && (
  <p className="text-orange-500">
    Generowanie trwa dłużej niż zwykle...
  </p>
)}
```

**Wpływ na UI**: Dodatkowy komunikat po przekroczeniu oczekiwanego czasu

---

## 10. Obsługa błędów

### 10.1. Błędy autentykacji (401 Unauthorized)

**Scenariusz**: Token JWT wygasł lub jest nieprawidłowy

**Obsługa**:

```typescript
if (response.status === 401) {
  window.location.href = "/";
  return;
}
```

**Efekt**: Automatyczny redirect do strony głównej z formularzem logowania

---

### 10.2. Brak preferencji (400 Bad Request)

**Scenariusz**: Użytkownik próbuje wygenerować plan bez wypełnienia preferencji

**Obsługa**:

```typescript
const error = await response.json();
setState({
  type: "error",
  message: error.message, // "Najpierw wypełnij swoje preferencje żywieniowe"
  retryable: false,
});
```

**Efekt wizualny**:

- ErrorState z komunikatem
- Opcjonalnie: link/button do `/onboarding`
- Brak przycisku "Spróbuj ponownie" (retryable: false)

---

### 10.3. Brak planu (404 Not Found)

**Scenariusz**: Nowy użytkownik nie ma jeszcze wygenerowanego planu

**Obsługa**:

```typescript
if (response.status === 404) {
  setState({ type: "empty" });
  return;
}
```

**Efekt wizualny**: EmptyState z CTA "Wygeneruj mój pierwszy plan"

**Uwaga**: To NIE jest błąd - normalna sytuacja dla nowego użytkownika

---

### 10.4. Błędy generowania (500, 503, 504)

**Scenariusze**:

- **500 Internal Server Error**: Błąd w logice generowania lub LLM
- **503 Service Unavailable**: OpenRouter API niedostępny
- **504 Gateway Timeout**: Generowanie trwało dłużej niż 30s

**Obsługa**:

```typescript
const error = await response.json();
const errorMessages = {
  500: "Nie udało się wygenerować planu. Spróbuj ponownie.",
  503: "Serwis AI jest chwilowo niedostępny. Spróbuj za chwilę.",
  504: "Generowanie planu trwa zbyt długo. Spróbuj ponownie.",
};

setState({
  type: "error",
  message: errorMessages[response.status] || error.message,
  retryable: true,
  previousPlan: state.type === "loaded" ? state.plan : undefined,
});
```

**Efekt wizualny**:

- ErrorState z odpowiednim komunikatem
- Przycisk "Spróbuj ponownie"
- Jeśli był previousPlan: wyświetlenie go pod błędem (użytkownik może go nadal używać)

---

### 10.5. Błędy sieci (Network Error)

**Scenariusz**: Brak połączenia internetowego, CORS, itp.

**Obsługa**:

```typescript
try {
  const response = await fetch(...);
} catch (error) {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    setState({
      type: "error",
      message: "Błąd połączenia. Sprawdź swoje połączenie internetowe.",
      retryable: true,
      previousPlan: ...,
    });
  }
}
```

**Efekt wizualny**: ErrorState z komunikatem o problemie z siecią

---

### 10.6. Anulowanie generowania (AbortError)

**Scenariusz**: Użytkownik kliknął "Anuluj" podczas generowania

**Obsługa**:

```typescript
catch (error) {
  if (error.name === "AbortError") {
    // Powrót do poprzedniego stanu
    if (state.type === "generating" && state.previousPlan) {
      setState({ type: "loaded", plan: state.previousPlan });
    } else {
      setState({ type: "empty" });
    }

    // Toast informacyjny
    toast({
      title: "Generowanie przerwane",
      description: "Generowanie planu zostało anulowane",
    });

    return; // Nie traktujemy jako błędu
  }

  // Obsługa innych błędów...
}
```

**Efekt wizualny**:

- Zamknięcie modalu
- Powrót do poprzedniego widoku
- Toast informacyjny

---

### 10.7. Błędy feedbacku

**Scenariusz**: Niepowodzenie wysłania oceny planu

**Obsługa**:

```typescript
try {
  const response = await fetch(...);
  if (!response.ok) throw new Error("Failed to submit feedback");

  // Sukces...
} catch (error) {
  // Rollback optimistic update
  setFeedbackState(previousState);

  toast({
    title: "Błąd",
    description: "Nie udało się zapisać Twojej opinii. Spróbuj ponownie.",
    variant: "destructive",
  });
}
```

**Efekt wizualny**:

- Przywrócenie poprzedniego stanu buttonów
- Toast z komunikatem błędu
- Użytkownik może spróbować ponownie

---

### 10.8. Błędy walidacji (nieprawidłowa struktura planu)

**Scenariusz**: API zwróciło plan z nieprawidłową strukturą (nie 3 posiłki, brakujące pola)

**Obsługa**:

```typescript
// W useMealPlan po otrzymaniu odpowiedzi
const plan: MealPlanDTO = await response.json();

// Walidacja
if (plan.meals.length !== 3) {
  throw new Error("Plan must contain exactly 3 meals");
}

// Dodatkowe sprawdzenia...
plan.meals.forEach((meal, index) => {
  if (!meal.name || !Array.isArray(meal.ingredients) || !Array.isArray(meal.steps)) {
    throw new Error(`Invalid meal structure at position ${index + 1}`);
  }
});
```

**Efekt wizualny**:

- ErrorState z komunikatem: "Otrzymano nieprawidłowe dane. Spróbuj ponownie."
- Przycisk retry
- Log błędu w konsoli (dla developera)

---

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury projektu

**Zadania**:

1. Utworzenie folderów:

   ```
   src/components/dashboard/
   src/hooks/
   src/lib/viewmodels/
   ```

2. Utworzenie pliku typów ViewModel:
   - `src/lib/viewmodels/dashboard.viewmodel.ts`
   - Skopiowanie typów z sekcji 5.2 tego dokumentu

3. Weryfikacja istniejących typów w `src/types.ts`

**Czas**: ~15 minut

---

### Krok 2: Implementacja custom hooków

**Zadania**:

1. **Hook `useElapsedTime`** (`src/hooks/useElapsedTime.ts`):

   ```typescript
   export function useElapsedTime(isActive: boolean): number {
     const [elapsed, setElapsed] = useState(0);

     useEffect(() => {
       if (!isActive) {
         setElapsed(0);
         return;
       }

       const interval = setInterval(() => {
         setElapsed((prev) => prev + 1);
       }, 1000);

       return () => clearInterval(interval);
     }, [isActive]);

     return elapsed;
   }
   ```

2. **Hook `useMealPlan`** (`src/hooks/useMealPlan.ts`):
   - Stan: `DashboardState`
   - AbortController ref
   - Funkcja `fetchCurrentPlan()`
   - Funkcja `generatePlan(isRegeneration)`
   - Funkcja `cancelGeneration()`
   - useEffect do initial fetch

3. **Hook `useFeedback`** (`src/hooks/useFeedback.ts`):
   - Stan: `FeedbackState`
   - Funkcja `submitFeedback(planId, rating)`
   - Obsługa POST i PUT /api/feedback

4. **Hook `usePlanAcceptanceTracking`** (`src/hooks/usePlanAcceptanceTracking.ts`):
   - Timer logic (30s seen, 2 min acceptance)
   - POST /api/analytics/events

**Czas**: ~2-3 godziny

---

### Krok 3: Implementacja komponentów atomowych

Kolejność: od najmniejszych do największych

**Zadania**:

1. **IngredientList.tsx** (`src/components/dashboard/IngredientList.tsx`):
   - Props: `{ ingredients: Ingredient[] }`
   - Renderowanie `<ul>` z `<li>` dla każdego składnika
   - Format: "{amount} {name}"

2. **StepsList.tsx** (`src/components/dashboard/StepsList.tsx`):
   - Props: `{ steps: string[] }`
   - Renderowanie `<ol>` z `<li>` dla każdego kroku

3. **MealCardHeader.tsx** (`src/components/dashboard/MealCardHeader.tsx`):
   - Props: `{ name: string, time: number }`
   - Ikona Clock z lucide-react
   - Stylowanie z Tailwind

4. **FeedbackButtons.tsx** (`src/components/dashboard/FeedbackButtons.tsx`):
   - Props: `{ rating: Rating | null, isSubmitting: boolean, onChange: (rating: Rating) => void }`
   - Buttony z ikonami ThumbsUp/ThumbsDown
   - Zmiana kolorów w zależności od rating
   - ARIA attributes

5. **EmptyState.tsx** (`src/components/dashboard/EmptyState.tsx`):
   - Props: `{ onGenerate: () => void, isFirstTime?: boolean }`
   - Centrowany layout
   - Ikona + tekst + CTA button

6. **ErrorState.tsx** (`src/components/dashboard/ErrorState.tsx`):
   - Props: `{ message: string, onRetry: () => void, retryable?: boolean }`
   - Alert z shadcn/ui
   - Ikona AlertCircle
   - Conditional rendering przycisku retry

**Czas**: ~3-4 godziny

**Testowanie**: Testy komponentów ręcznie

---

### Krok 4: Implementacja komponentów molekularnych

**Zadania**:

1. **MealCard.tsx** (`src/components/dashboard/MealCard.tsx`):
   - Props: `{ meal: Meal, index: number }`
   - Składa się z: MealCardHeader, IngredientList, StepsList
   - Card z Tailwind (border, padding, rounded)

2. **MealPlanGrid.tsx** (`src/components/dashboard/MealPlanGrid.tsx`):
   - Props: `{ meals: [Meal, Meal, Meal] }`
   - Grid z Tailwind: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
   - Renderuje 3x MealCard

3. **FeedbackSection.tsx** (`src/components/dashboard/FeedbackSection.tsx`):
   - Props: `{ feedbackState: FeedbackState, onFeedbackChange: (rating: Rating) => void }`
   - Pytanie + FeedbackButtons
   - Border-top dla wizualnego oddzielenia

4. **MealPlanHeader.tsx** (`src/components/dashboard/MealPlanHeader.tsx`):
   - Props: `{ onRegenerate: () => void }`
   - Flex layout (space-between)
   - Tytuł + opcjonalna data + button

5. **GeneratingModal.tsx** (`src/components/dashboard/GeneratingModal.tsx`):
   - Props: `{ onCancel: () => void, elapsedTime: number }`
   - Dialog z shadcn/ui
   - Spinner + tekst + elapsed time + button Anuluj
   - Focus trap, ESC handling

**Czas**: ~4-5 godzin

---

### Krok 5: Implementacja komponentów kontenerowych

**Zadania**:

1. **MealPlanView.tsx** (`src/components/dashboard/MealPlanView.tsx`):
   - Props: `{ plan: MealPlanDTO, feedbackState: FeedbackState, onRegenerate: () => void, onFeedbackChange: (rating: Rating) => void }`
   - Składa się z: MealPlanHeader, MealPlanGrid, FeedbackSection
   - Main container layout

2. **DashboardContent.tsx** (`src/components/dashboard/DashboardContent.tsx`):
   - Brak props (top-level component)
   - Używa hooków: useMealPlan, useFeedback, usePlanAcceptanceTracking, useElapsedTime
   - Conditional rendering w zależności od state.type
   - Orchestration całej logiki

**Czas**: ~3-4 godziny

---

### Krok 6: Implementacja strony Dashboard

**Zadania**:

1. **Dashboard.astro** (`src/pages/dashboard.astro`):

   ```astro
   ---
   import Layout from "@/layouts/Layout.astro";
   import DashboardContent from "@/components/dashboard/DashboardContent";

   export const prerender = false;

   // Check authentication
   const {
     data: { user },
     error,
   } = await Astro.locals.supabase.auth.getUser();

   if (error || !user) {
     return Astro.redirect("/");
   }
   ---

   <Layout title="Dashboard - AI Meal Planner">
     <main class="container mx-auto py-8 px-4">
       <DashboardContent client:load />
     </main>
   </Layout>
   ```

**Czas**: ~30 minut

---

### Krok 7: Stylowanie i responsywność

**Zadania**:

1. Weryfikacja responsywności na wszystkich breakpointach:
   - Mobile (<768px): 1 kolumna
   - Tablet (768-1023px): 2 kolumny
   - Desktop (≥1024px): 3 kolumny

2. Dopracowanie spacing, colors, typography zgodnie z design system

3. Dark mode (jeśli wspierany w projekcie)

4. Hover states, focus states, transitions

**Czas**: ~2-3 godziny

---

### Krok 8: Accessibility

**Zadania**:

1. **Semantic HTML**:
   - `<main>` dla głównej zawartości
   - `<h1>`, `<h2>`, `<h3>` hierarchia
   - `<nav>` dla nawigacji

2. **ARIA attributes**:
   - `aria-label` dla buttonów z tylko ikonami
   - `aria-pressed` dla FeedbackButtons
   - `aria-busy` podczas generowania
   - `role="status"` dla komunikatów statusu

3. **Focus management**:
   - Focus trap w GeneratingModal
   - Focus na button "Anuluj" przy otwarciu modalu
   - Przywrócenie focus po zamknięciu

4. **Keyboard navigation**:
   - ESC zamyka modal
   - Space/Enter aktywują buttony
   - Tab navigation działa poprawnie

5. **Screen reader testing**:
   - Test z VoiceOver (macOS)
   - Test z NVDA (Windows)

**Czas**: ~2-3 godziny

---

### Krok 9: Testowanie manualne

**Zadania**:

1. **Happy paths**:
   - ✅ Nowy użytkownik → EmptyState → generowanie → wyświetlenie planu
   - ✅ Powrót do dashboard → wyświetlenie istniejącego planu
   - ✅ Regeneracja planu
   - ✅ Feedback thumbs up
   - ✅ Zmiana feedbacku na thumbs down

2. **Error paths**:
   - ✅ Generowanie bez preferencji → komunikat 400
   - ✅ Symulacja błędu 500 → ErrorState + retry
   - ✅ Symulacja timeout 504 → komunikat
   - ✅ Anulowanie generowania → powrót do poprzedniego stanu

3. **Edge cases**:
   - ✅ Zamknięcie karty podczas generowania → przy powrocie wyświetla ostatni plan
   - ✅ Szybkie wielokrotne kliknięcia "Wygeneruj plan" → zabezpieczenie przed duplikatami
   - ✅ Bardzo długie nazwy posiłków/składników → text overflow

4. **Responsywność**:
   - ✅ iPhone SE (375px)
   - ✅ iPad (768px)
   - ✅ Desktop 1920px

5. **Browsers**:
   - ✅ Chrome
   - ✅ Firefox
   - ✅ Safari
   - ✅ Edge

**Czas**: ~3-4 godziny

---

### Krok 10: Optymalizacja i cleanup

**Zadania**:

1. **Performance**:
   - Sprawdzenie czy nie ma zbędnych re-renderów (React DevTools)
   - useMemo/useCallback gdzie potrzebne
   - Lazy loading komponentów (jeśli potrzebne)

2. **Code quality**:
   - Usunięcie console.log
   - Usunięcie nieużywanych importów
   - ESLint: `npm run lint`
   - Prettier formatting

3. **Documentation**:
   - JSDoc comments dla funkcji publicznych
   - README dla komponentów Dashboard
   - Komentarze dla skomplikowanej logiki

4. **Cleanup testowego dashboard-test.astro**:
   - Usunięcie pliku `src/pages/dashboard-test.astro` (nie jest już potrzebny)

**Czas**: ~1-2 godziny

---

### Krok 11: Code review i finalizacja

**Zadania**:

1. Self code review:
   - Zgodność z PRD i user stories
   - Zgodność z coding guidelines projektu
   - Sprawdzenie edge cases

2. Pull request:
   - Descriptive title i description
   - Screenshots/GIFy dla zmian UI
   - Link do PRD i user stories

3. Address feedback z code review

**Czas**: ~1-2 godziny

---

## Podsumowanie czasowe

| Krok      | Opis                       | Szacowany czas     |
| --------- | -------------------------- | ------------------ |
| 1         | Przygotowanie struktury    | 15 min             |
| 2         | Implementacja hooków       | 2-3h               |
| 3         | Komponenty atomowe         | 3-4h               |
| 4         | Komponenty molekularne     | 4-5h               |
| 5         | Komponenty kontenerowe     | 3-4h               |
| 6         | Strona Dashboard.astro     | 30 min             |
| 7         | Stylowanie i responsywność | 2-3h               |
| 8         | Accessibility              | 2-3h               |
| 9         | Testowanie manualne        | 3-4h               |
| 10        | Optymalizacja i cleanup    | 1-2h               |
| 11        | Code review                | 1-2h               |
| **TOTAL** |                            | **~24-32 godziny** |

---

## Checklist końcowy

Przed uznaniem implementacji za ukończoną, sprawdź:

- [ ] Wszystkie 4 stany Dashboard działają poprawnie (empty, loaded, generating, error)
- [ ] Responsywność na wszystkich breakpointach
- [ ] Integracja z wszystkimi API endpoints (GET current, POST generate, POST/PUT feedback)
- [ ] Feedback system działa (pierwsza ocena, zmiana oceny, optimistic updates)
- [ ] Plan acceptance tracking działa automatycznie
- [ ] AbortController anuluje generowanie
- [ ] Wszystkie error cases obsłużone z odpowiednimi komunikatami
- [ ] Toast notifications działają
- [ ] Accessibility: ARIA, focus management, keyboard navigation
- [ ] Semantic HTML i proper headings hierarchy
- [ ] Dark mode (jeśli wspierany)
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Mobile compatibility (iPhone, Android)
- [ ] ESLint i Prettier bez błędów
- [ ] Brak console.log w kodzie produkcyjnym
- [ ] JSDoc comments dla funkcji publicznych
- [ ] Usunięty plik dashboard-test.astro
- [ ] User stories US-008, US-009, US-010, US-011, US-016 spełnione

---

**Koniec dokumentu**
