# Plan implementacji widoku Mój Profil

## 1. Przegląd

Widok "Mój Profil" umożliwia zalogowanym użytkownikom przeglądanie i edycję swoich preferencji żywieniowych. Jest to chroniony widok dostępny z głównego menu nawigacyjnego. Formularz jest identyczny jak w onboardingu, ale w trybie edycji - pre-wypełniony obecnymi wartościami użytkownika z możliwością ich modyfikacji. Po zapisaniu zmian użytkownik jest przekierowywany na dashboard z komunikatem potwierdzającym aktualizację profilu.

## 2. Routing widoku

- **Ścieżka**: `/profile`
- **Typ**: Chroniony (wymaga zalogowania)
- **Redirect przy braku uwierzytelnienia**: `/login`
- **Redirect przy braku preferencji (404)**: `/onboarding`

## 3. Struktura komponentów

```
src/pages/profile.astro (Astro Page)
└── src/components/preferences/ProfileView.tsx (React Container)
    ├── PageHeader (Header + Subtitle)
    ├── PreferencesForm (React Component - reused from onboarding)
    │   ├── HealthGoalSection
    │   │   └── Select (Shadcn/ui)
    │   ├── DietTypeSection
    │   │   └── Select (Shadcn/ui)
    │   ├── ActivityLevelSection
    │   │   └── Select (Shadcn/ui)
    │   ├── AllergiesSection
    │   │   └── CheckboxGroup (max 10 items)
    │   └── DislikedProductsSection
    │       └── ProductInput (autocomplete + tags, max 20 items)
    └── ActionButtons
        ├── Button: "Zapisz zmiany" (primary)
        └── Button: "Anuluj" (secondary)
```

## 4. Szczegóły komponentów

### ProfileView (Container Component)

**Opis komponentu**: Główny kontener zarządzający stanem widoku profilu. Odpowiedzialny za pobieranie danych użytkownika, koordynację formularza edycji oraz obsługę zapisywania zmian.

**Główne elementy**:

- `<div>` - główny kontener z paddingiem i max-width
- `<PageHeader>` - nagłówek strony
- `<PreferencesForm>` - formularz edycji (reused z onboarding)
- `<LoadingState>` - skeleton loader podczas ładowania danych
- `<ErrorState>` - komunikat błędu przy niepowodzeniu pobrania danych

**Obsługiwane zdarzenia**:

- `onMount` - inicjalizacja: fetch preferencji użytkownika (GET /api/preferences)
- `onSubmit` - zapis zmian: walidacja + PUT /api/preferences
- `onCancel` - anulowanie edycji: sprawdzenie dirty state + redirect
- `beforeunload` - ostrzeżenie przy próbie opuszczenia strony z niezapisanymi zmianami

**Warunki walidacji**: Brak - delegowane do PreferencesForm

**Typy**:

- Props: `ProfileViewProps` (pusty interfejs)
- State: `ProfileViewState`
- API Response: `UserPreferencesDTO`
- API Request: `UpdateUserPreferencesDTO`

**Propsy**: Brak (top-level component)

---

### PreferencesForm (Form Component - Reused)

**Opis komponentu**: Wielosekcyjny formularz preferencji żywieniowych. Komponent jest reużywalny - działa zarówno w trybie tworzenia (onboarding) jak i edycji (profile). Tryb pracy określa prop `mode`.

**Główne elementy**:

- `<form>` - główny element formularza
- `<HealthGoalSection>` - sekcja wyboru celu zdrowotnego
- `<DietTypeSection>` - sekcja wyboru typu diety
- `<ActivityLevelSection>` - sekcja wyboru poziomu aktywności
- `<AllergiesSection>` - sekcja wyboru alergii
- `<DislikedProductsSection>` - sekcja produktów nielubanych
- `<ActionButtons>` - przyciski akcji (zmieniane w zależności od mode)

**Obsługiwane zdarzenia**:

- `onChange` - aktualizacja pól formularza z walidacją
- `onSubmit` - submit formularza (preventDefault + wywołanie callback)
- `onBlur` - walidacja pola po opuszczeniu

**Warunki walidacji**:

- `health_goal`: wymagane, musi być jedną z wartości enum `HealthGoal`
- `diet_type`: wymagane, musi być jedną z wartości enum `DietType`
- `activity_level`: wymagane, integer 1-5
- `allergies`: opcjonalne, array, max 10 elementów, każdy element niepusty string
- `disliked_products`: opcjonalne, array, max 20 elementów, każdy element niepusty string

**Typy**:

- `PreferencesFormProps`
- `PreferencesFormData`
- `PreferencesFormErrors`

**Propsy**:

```typescript
interface PreferencesFormProps {
  mode: "create" | "edit";
  initialData?: PreferencesFormData;
  onSubmit: (data: PreferencesFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting: boolean;
}
```

---

### HealthGoalSection

**Opis komponentu**: Sekcja formularza do wyboru celu zdrowotnego użytkownika.

**Główne elementy**:

- `<FormField>` (Shadcn/ui) - wrapper pola
- `<Label>` - etykieta "Cel zdrowotny \*"
- `<Select>` (Shadcn/ui) - dropdown z opcjami
- `<FormMessage>` - komunikat błędu walidacji

**Obsługiwane zdarzenia**:

- `onValueChange` - zmiana wartości selecta

**Warunki walidacji**:

- Pole wymagane
- Musi być jedną z wartości: `LOSE_WEIGHT`, `GAIN_WEIGHT`, `MAINTAIN_WEIGHT`, `HEALTHY_EATING`, `BOOST_ENERGY`

**Typy**:

- `HealthGoal` (enum z types.ts)

**Propsy**:

```typescript
interface HealthGoalSectionProps {
  value: HealthGoal;
  onChange: (value: HealthGoal) => void;
  error?: string;
}
```

---

### DietTypeSection

**Opis komponentu**: Sekcja formularza do wyboru typu diety użytkownika.

**Główne elementy**:

- `<FormField>` - wrapper pola
- `<Label>` - etykieta "Typ diety \*"
- `<Select>` - dropdown z opcjami
- `<FormMessage>` - komunikat błędu walidacji

**Obsługiwane zdarzenia**:

- `onValueChange` - zmiana wartości selecta

**Warunki walidacji**:

- Pole wymagane
- Musi być jedną z wartości: `STANDARD`, `VEGETARIAN`, `VEGAN`, `GLUTEN_FREE`

**Typy**:

- `DietType` (enum z types.ts)

**Propsy**:

```typescript
interface DietTypeSectionProps {
  value: DietType;
  onChange: (value: DietType) => void;
  error?: string;
}
```

---

### ActivityLevelSection

**Opis komponentu**: Sekcja formularza do wyboru poziomu aktywności fizycznej użytkownika.

**Główne elementy**:

- `<FormField>` - wrapper pola
- `<Label>` - etykieta "Poziom aktywności \*"
- `<Select>` - dropdown z opcjami 1-5 z opisami
- `<FormMessage>` - komunikat błędu walidacji

**Obsługiwane zdarzenia**:

- `onValueChange` - zmiana wartości selecta

**Warunki walidacji**:

- Pole wymagane
- Musi być liczbą całkowitą od 1 do 5

**Typy**:

- `number` (1-5)

**Propsy**:

```typescript
interface ActivityLevelSectionProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
}
```

---

### AllergiesSection

**Opis komponentu**: Sekcja formularza do wyboru alergii i nietolerancji pokarmowych. Wyświetla grupę checkboxów z najpopularniejszymi alergenami.

**Główne elementy**:

- `<FormField>` - wrapper pola
- `<Label>` - etykieta "Alergie i nietolerancje"
- `<div>` - grid checkboxów
- Dla każdego alergenu:
  - `<Checkbox>` (Shadcn/ui)
  - `<Label>` - nazwa alergenu
- `<FormMessage>` - komunikat błędu/info (np. limit 10)

**Obsługiwane zdarzenia**:

- `onCheckedChange` - zaznaczenie/odznaczenie checkboxa
- Automatyczne disable checkboxów po osiągnięciu limitu 10

**Warunki walidacji**:

- Maksymalnie 10 zaznaczonych alergii
- Po osiągnięciu limitu pozostałe checkboxy są disabled
- Komunikat: "Możesz wybrać maksymalnie 10 alergii"

**Typy**:

- `string[]` - tablica wybranych alergii

**Propsy**:

```typescript
interface AllergiesSectionProps {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  maxItems?: number; // default: 10
}
```

---

### DislikedProductsSection

**Opis komponentu**: Sekcja formularza do dodawania produktów nielubanych. Wyświetla input z autouzupełnianiem oraz listę dodanych produktów jako tagi z możliwością usunięcia.

**Główne elementy**:

- `<FormField>` - wrapper pola
- `<Label>` - etykieta "Produkty nielubiane"
- `<ProductInput>` - custom input z autocomplete
  - `<Input>` - pole tekstowe
  - `<Popover>` - lista sugestii (z products.json)
- `<div>` - kontener tagów
- Dla każdego produktu:
  - `<Badge>` (Shadcn/ui) - tag z nazwą produktu
  - `<button>` - ikona X do usunięcia
- `<FormMessage>` - komunikat błędu/info (np. limit 20)

**Obsługiwane zdarzenia**:

- `onInputChange` - wpisywanie tekstu, filtrowanie sugestii
- `onSuggestionSelect` - wybór produktu z listy sugestii
- `onAddCustom` - dodanie custom produktu (Enter)
- `onRemove` - usunięcie produktu z listy
- Automatyczne disable inputu po osiągnięciu limitu 20

**Warunki walidacji**:

- Maksymalnie 20 produktów
- Produkty nie mogą być puste (trim)
- Po osiągnięciu limitu input jest disabled
- Komunikat: "Możesz dodać maksymalnie 20 produktów"
- Filtrowanie duplikatów (case-insensitive)

**Typy**:

- `string[]` - tablica produktów nielubanych

**Propsy**:

```typescript
interface DislikedProductsSectionProps {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  maxItems?: number; // default: 20
  suggestions: string[]; // z products.json
}
```

---

### ActionButtons

**Opis komponentu**: Kontener przycisków akcji formularza. W trybie edycji wyświetla "Zapisz zmiany" + "Anuluj", w trybie tworzenia "Zapisz i wygeneruj plan".

**Główne elementy**:

- `<div>` - flex container dla przycisków
- `<Button>` (Shadcn/ui) - przycisk główny (submit)
  - Variant: "default"
  - Ikona loading podczas isSubmitting
  - Disabled gdy: isSubmitting lub !isDirty (tylko w edit mode)
- `<Button>` (Shadcn/ui) - przycisk anuluj (tylko w edit mode)
  - Variant: "outline"
  - Disabled gdy: isSubmitting

**Obsługiwane zdarzenia**:

- `onClick` na głównym przycisku - submit formularza
- `onClick` na przycisku anuluj - wywołanie onCancel callback

**Warunki walidacji**: Brak - komponent prezentacyjny

**Typy**:

- `ActionButtonsProps`

**Propsy**:

```typescript
interface ActionButtonsProps {
  mode: "create" | "edit";
  isSubmitting: boolean;
  isDirty: boolean; // używane tylko w edit mode
  onCancel?: () => void; // tylko w edit mode
  submitLabel?: string; // custom label
}
```

## 5. Typy

### DTO Types (z types.ts)

```typescript
// Istniejące typy z src/types.ts
export type UserPreferencesDTO = Tables<"user_preferences">;
export type UpdateUserPreferencesDTO = Partial<Omit<TablesUpdate<"user_preferences">, "user_id">>;
export type HealthGoal = Enums<"health_goal_enum">;
export type DietType = Enums<"diet_type_enum">;
```

### ViewModel Types (nowe typy dla widoku)

```typescript
/**
 * Stan głównego widoku profilu
 */
interface ProfileViewState {
  /** Czy trwa ładowanie początkowe danych */
  isLoading: boolean;
  /** Czy trwa zapisywanie zmian */
  isSaving: boolean;
  /** Czy formularz został zmodyfikowany */
  isDirty: boolean;
  /** Komunikat błędu (jeśli wystąpił) */
  error: string | null;
  /** Oryginalne dane użytkownika z API */
  initialData: UserPreferencesDTO | null;
  /** Obecny stan formularza */
  formData: PreferencesFormData;
}

/**
 * Dane formularza preferencji (wspólne dla create i edit)
 */
interface PreferencesFormData {
  health_goal: HealthGoal;
  diet_type: DietType;
  activity_level: number; // 1-5
  allergies: string[];
  disliked_products: string[];
}

/**
 * Błędy walidacji formularza
 */
interface PreferencesFormErrors {
  health_goal?: string;
  diet_type?: string;
  activity_level?: string;
  allergies?: string;
  disliked_products?: string;
  _form?: string; // globalny błąd formularza
}

/**
 * Response z API przy błędzie
 */
interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: string[];
}
```

### Component Props Types

```typescript
/**
 * Props głównego kontenera ProfileView
 */
interface ProfileViewProps {
  // Brak props - top-level component
}

/**
 * Props formularza preferencji
 */
interface PreferencesFormProps {
  /** Tryb pracy formularza */
  mode: "create" | "edit";
  /** Początkowe dane (tylko w edit mode) */
  initialData?: PreferencesFormData;
  /** Callback po submit */
  onSubmit: (data: PreferencesFormData) => Promise<void>;
  /** Callback anulowania (tylko w edit mode) */
  onCancel?: () => void;
  /** Czy trwa submit */
  isSubmitting: boolean;
}

/**
 * Props sekcji celu zdrowotnego
 */
interface HealthGoalSectionProps {
  value: HealthGoal;
  onChange: (value: HealthGoal) => void;
  error?: string;
}

/**
 * Props sekcji typu diety
 */
interface DietTypeSectionProps {
  value: DietType;
  onChange: (value: DietType) => void;
  error?: string;
}

/**
 * Props sekcji poziomu aktywności
 */
interface ActivityLevelSectionProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

/**
 * Props sekcji alergii
 */
interface AllergiesSectionProps {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  maxItems?: number;
}

/**
 * Props sekcji produktów nielubanych
 */
interface DislikedProductsSectionProps {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  maxItems?: number;
  suggestions: string[];
}

/**
 * Props przycisków akcji
 */
interface ActionButtonsProps {
  mode: "create" | "edit";
  isSubmitting: boolean;
  isDirty: boolean;
  onCancel?: () => void;
  submitLabel?: string;
}
```

## 6. Zarządzanie stanem

### Stan lokalny w ProfileView

Stan widoku profilu będzie zarządzany przez kombinację lokalnego stanu React oraz custom hooków:

```typescript
const [state, setState] = useState<ProfileViewState>({
  isLoading: true,
  isSaving: false,
  isDirty: false,
  error: null,
  initialData: null,
  formData: {
    health_goal: "HEALTHY_EATING",
    diet_type: "STANDARD",
    activity_level: 3,
    allergies: [],
    disliked_products: [],
  },
});
```

### Custom Hook: useProfileData

Hook do pobierania danych preferencji użytkownika:

```typescript
/**
 * Hook do pobierania preferencji użytkownika
 * @returns Obiekt z danymi, stanem ładowania i funkcją refetch
 */
function useProfileData() {
  const [data, setData] = useState<UserPreferencesDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/preferences");

      if (!response.ok) {
        if (response.status === 404) {
          // Brak preferencji - redirect na onboarding
          window.location.href = "/onboarding";
          return;
        }
        throw new Error("Nie udało się pobrać preferencji");
      }

      const data = await response.json();
      setData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  return { data, isLoading, error, refetch: fetchPreferences };
}
```

### Custom Hook: useDirtyForm

Hook do śledzenia zmian w formularzu:

```typescript
/**
 * Hook do śledzenia czy formularz został zmodyfikowany
 * @param initialData - początkowe dane
 * @param currentData - obecne dane
 * @returns boolean - czy formularz jest "brudny"
 */
function useDirtyForm(initialData: PreferencesFormData | null, currentData: PreferencesFormData): boolean {
  return useMemo(() => {
    if (!initialData) return false;

    // Deep comparison
    return (
      initialData.health_goal !== currentData.health_goal ||
      initialData.diet_type !== currentData.diet_type ||
      initialData.activity_level !== currentData.activity_level ||
      JSON.stringify(initialData.allergies.sort()) !== JSON.stringify(currentData.allergies.sort()) ||
      JSON.stringify(initialData.disliked_products.sort()) !== JSON.stringify(currentData.disliked_products.sort())
    );
  }, [initialData, currentData]);
}
```

### Custom Hook: useUnsavedChangesWarning

Hook do ostrzegania o niezapisanych zmianach:

```typescript
/**
 * Hook do wyświetlania ostrzeżenia przy próbie opuszczenia strony z niezapisanymi zmianami
 * @param isDirty - czy formularz ma niezapisane zmiany
 * @param message - custom komunikat (opcjonalny)
 */
function useUnsavedChangesWarning(
  isDirty: boolean,
  message = "Masz niezapisane zmiany. Czy na pewno chcesz opuścić stronę?"
) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, message]);
}
```

### Stan formularza w PreferencesForm

Formularz może używać React Hook Form lub kontrolowany stan przez useState:

**Opcja A: React Hook Form (zalecane)**

```typescript
const form = useForm<PreferencesFormData>({
  defaultValues: initialData,
  mode: "onBlur",
});
```

**Opcja B: Kontrolowany stan**

```typescript
const [formData, setFormData] = useState<PreferencesFormData>(initialData);
const [errors, setErrors] = useState<PreferencesFormErrors>({});
```

## 7. Integracja API

### GET /api/preferences - Pobieranie preferencji

**Kiedy**: Przy montowaniu komponentu ProfileView

**Request**:

```typescript
const response = await fetch("/api/preferences", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
});
```

**Response Success (200)**:

```typescript
type Response = UserPreferencesDTO;

// Przykład:
{
  "user_id": "uuid-string",
  "health_goal": "LOSE_WEIGHT",
  "diet_type": "VEGETARIAN",
  "activity_level": 3,
  "allergies": ["Gluten", "Laktoza"],
  "disliked_products": ["Brokuły", "Papryka"]
}
```

**Response Error (404)**:

```typescript
{
  "error": "Not found",
  "message": "Nie znaleziono preferencji. Wypełnij formularz onboardingu."
}
// Action: Redirect na /onboarding
```

**Response Error (500)**:

```typescript
{
  "error": "Internal server error",
  "message": "Nie udało się pobrać preferencji. Spróbuj ponownie."
}
// Action: Wyświetlenie komunikatu błędu z przyciskiem "Spróbuj ponownie"
```

---

### PUT /api/preferences - Aktualizacja preferencji

**Kiedy**: Po kliknięciu "Zapisz zmiany" i przejściu walidacji

**Request**:

```typescript
type RequestBody = UpdateUserPreferencesDTO;

const response = await fetch("/api/preferences", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    health_goal: formData.health_goal,
    diet_type: formData.diet_type,
    activity_level: formData.activity_level,
    allergies: formData.allergies,
    disliked_products: formData.disliked_products,
  }),
});
```

**Uwaga**: Backend wspiera partial updates, ale w widoku profilu wysyłamy wszystkie pola dla uproszczenia.

**Response Success (200)**:

```typescript
type Response = UserPreferencesDTO;

// Przykład:
{
  "user_id": "uuid-string",
  "health_goal": "MAINTAIN_WEIGHT",
  "diet_type": "VEGAN",
  "activity_level": 4,
  "allergies": ["Orzechy"],
  "disliked_products": ["Tofu"]
}
// Action:
// 1. Toast success: "Profil zaktualizowany"
// 2. Redirect na /dashboard
```

**Response Error (400)**:

```typescript
{
  "error": "Validation error",
  "details": [
    "Pole 'health_goal' jest wymagane",
    "Maksymalnie 10 alergii",
    "Maksymalnie 20 produktów nielubanych"
  ]
}
// Action: Wyświetlenie błędów walidacji przy odpowiednich polach
```

**Response Error (404)**:

```typescript
{
  "error": "Not found",
  "message": "Nie znaleziono preferencji. Wypełnij formularz onboardingu."
}
// Action: Redirect na /onboarding (nie powinno się zdarzyć w normalnym flow)
```

**Response Error (500)**:

```typescript
{
  "error": "Internal server error",
  "message": "Nie udało się zaktualizować preferencji. Spróbuj ponownie."
}
// Action: Toast error z komunikatem
```

### Funkcja pomocnicza API

```typescript
/**
 * Aktualizuje preferencje użytkownika
 */
async function updatePreferences(data: UpdateUserPreferencesDTO): Promise<UserPreferencesDTO> {
  const response = await fetch("/api/preferences", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();
    throw new Error(error.message || "Nie udało się zaktualizować preferencji");
  }

  return response.json();
}
```

## 8. Interakcje użytkownika

### 1. Wejście na stronę profilu

**Akcja**: Użytkownik klika "Mój Profil" w nawigacji lub wpisuje URL `/profile`

**Flow**:

1. Middleware sprawdza autentykację
2. Jeśli brak autentykacji → redirect na `/login`
3. Jeśli zalogowany → renderowanie strony
4. Wyświetlenie loading state (skeleton)
5. Wywołanie GET `/api/preferences`
6. Po otrzymaniu danych → pre-wypełnienie formularza
7. Ukrycie loading state → wyświetlenie formularza

**Edge cases**:

- 404 (brak preferencji) → redirect `/onboarding`
- 500 (błąd serwera) → wyświetlenie ErrorState z przyciskiem retry

---

### 2. Edycja pola tekstowego (Select)

**Akcja**: Użytkownik klika na dropdown i wybiera nową wartość

**Flow**:

1. Użytkownik klika select (health_goal, diet_type lub activity_level)
2. Dropdown rozwija się z opcjami
3. Użytkownik wybiera wartość
4. Wartość aktualizuje się w state
5. Dirty flag zmienia się na `true`
6. Przycisk "Zapisz zmiany" staje się enabled (jeśli był disabled)

**Walidacja**: Natychmiastowa przy zmianie (onBlur)

---

### 3. Edycja alergii (Checkboxes)

**Akcja**: Użytkownik zaznacza/odznacza checkboxy alergii

**Flow**:

1. Użytkownik klika checkbox
2. Stan checkboxa zmienia się (checked/unchecked)
3. Tablica `allergies` aktualizuje się w state
4. Jeśli osiągnięto limit 10:
   - Pozostałe unchecked checkboxy stają się disabled
   - Pojawia się komunikat "Możesz wybrać maksymalnie 10 alergii"
5. Jeśli liczba < 10:
   - Wszystkie checkboxy są enabled
   - Komunikat znika
6. Dirty flag zmienia się na `true`

**Walidacja**: Natychmiastowa, limit 10 enforced przez disable

---

### 4. Edycja produktów nielubanych (Tags)

**Akcja**: Użytkownik dodaje/usuwa produkty nielubiane

**Flow dodawania**:

1. Użytkownik wpisuje tekst w input
2. Po wpisaniu 2+ znaków pojawiają się sugestie z `products.json`
3. Użytkownik wybiera z listy LUB wciska Enter (custom produkt)
4. Produkt dodaje się jako tag (Badge)
5. Input czyszczone
6. Jeśli osiągnięto limit 20:
   - Input staje się disabled
   - Pojawia się komunikat "Możesz dodać maksymalnie 20 produktów"
7. Dirty flag zmienia się na `true`

**Flow usuwania**:

1. Użytkownik klika X na tagu
2. Produkt usuwa się z tablicy
3. Jeśli było >=20 produktów:
   - Input staje się enabled
   - Komunikat znika

**Walidacja**:

- Duplikaty są ignorowane (case-insensitive)
- Puste stringi są ignorowane (trim)
- Limit 20 enforced przez disable

---

### 5. Kliknięcie "Zapisz zmiany"

**Akcja**: Użytkownik klika przycisk "Zapisz zmiany"

**Flow success**:

1. Walidacja wszystkich pól po stronie frontendu
2. Jeśli błędy → wyświetlenie przy polach, przerwanie
3. Jeśli OK:
   - Button disabled, pojawia się spinner
   - `isSaving = true`
   - Wywołanie PUT `/api/preferences`
4. Po otrzymaniu 200 OK:
   - Toast success: "Profil zaktualizowany"
   - Redirect na `/dashboard`
   - Dirty flag reset

**Flow error**:

1. Walidacja frontendowa OK
2. PUT request wysłany
3. Otrzymano 400 (validation error):
   - Parsowanie `details[]` z response
   - Wyświetlenie błędów przy odpowiednich polach
   - Button enabled, spinner znika
4. Otrzymano 500 (server error):
   - Toast error: "Nie udało się zaktualizować preferencji. Spróbuj ponownie."
   - Button enabled, spinner znika

---

### 6. Kliknięcie "Anuluj"

**Akcja**: Użytkownik klika przycisk "Anuluj"

**Flow bez zmian** (isDirty = false):

1. Natychmiastowy redirect na `/dashboard`

**Flow ze zmianami** (isDirty = true):

1. Wyświetlenie modal dialog:
   - Tytuł: "Niezapisane zmiany"
   - Treść: "Masz niezapisane zmiany. Czy na pewno chcesz opuścić stronę?"
   - Przyciski: "Zostań" | "Opuść stronę"
2. Jeśli użytkownik klika "Zostań":
   - Modal zamyka się
   - Pozostaje na stronie profilu
3. Jeśli użytkownik klika "Opuść stronę":
   - Modal zamyka się
   - Redirect na `/dashboard`
   - Zmiany są odrzucane

---

### 7. Próba opuszczenia strony (beforeunload)

**Akcja**: Użytkownik próbuje zamknąć kartę/okno lub przejść na inną stronę gdy isDirty = true

**Flow**:

1. Event `beforeunload` jest wywoływany
2. Jeśli `isDirty = true`:
   - Przeglądarka wyświetla natywny dialog ostrzeżenia
   - "Masz niezapisane zmiany. Czy na pewno chcesz opuścić stronę?"
3. Użytkownik decyduje:
   - "Zostań" → pozostaje na stronie
   - "Opuść" → zmiany tracone, strona zamknięta/opuszczona

**Uwaga**: Wiadomość może być zignorowana przez niektóre przeglądarki (używają własnych komunikatów).

---

### 8. Obsługa błędów sieciowych

**Akcja**: Network error podczas GET lub PUT

**Flow**:

1. Request fails (timeout, no connection, etc.)
2. Catch error w try/catch
3. Wyświetlenie komunikatu:
   - Dla GET: ErrorState z przyciskiem "Spróbuj ponownie"
   - Dla PUT: Toast error + button enabled
4. Użytkownik może spróbować ponownie

## 9. Warunki i walidacja

### Walidacja po stronie frontendu

Wszystkie warunki muszą być sprawdzone PRZED wysłaniem PUT request.

#### 1. health_goal (HealthGoalSection)

**Warunki**:

- ✅ Pole wymagane
- ✅ Musi być jedną z wartości enum: `LOSE_WEIGHT`, `GAIN_WEIGHT`, `MAINTAIN_WEIGHT`, `HEALTHY_EATING`, `BOOST_ENERGY`

**Komunikaty błędów**:

- Brak wartości: "Cel zdrowotny jest wymagany"
- Nieprawidłowa wartość: "Wybierz poprawny cel zdrowotny"

**Gdzie weryfikowane**:

- `HealthGoalSection` - walidacja onBlur
- `PreferencesForm` - walidacja onSubmit

**Wpływ na UI**:

- Czerwona ramka wokół selecta
- Komunikat błędu pod polem
- Submit button disabled

---

#### 2. diet_type (DietTypeSection)

**Warunki**:

- ✅ Pole wymagane
- ✅ Musi być jedną z wartości enum: `STANDARD`, `VEGETARIAN`, `VEGAN`, `GLUTEN_FREE`

**Komunikaty błędów**:

- Brak wartości: "Typ diety jest wymagany"
- Nieprawidłowa wartość: "Wybierz poprawny typ diety"

**Gdzie weryfikowane**:

- `DietTypeSection` - walidacja onBlur
- `PreferencesForm` - walidacja onSubmit

**Wpływ na UI**:

- Czerwona ramka wokół selecta
- Komunikat błędu pod polem
- Submit button disabled

---

#### 3. activity_level (ActivityLevelSection)

**Warunki**:

- ✅ Pole wymagane
- ✅ Musi być liczbą całkowitą
- ✅ Musi być w zakresie 1-5

**Komunikaty błędów**:

- Brak wartości: "Poziom aktywności jest wymagany"
- Nieprawidłowa wartość: "Wybierz poziom aktywności od 1 do 5"

**Gdzie weryfikowane**:

- `ActivityLevelSection` - walidacja onBlur
- `PreferencesForm` - walidacja onSubmit

**Wpływ na UI**:

- Czerwona ramka wokół selecta
- Komunikat błędu pod polem
- Submit button disabled

---

#### 4. allergies (AllergiesSection)

**Warunki**:

- ⚠️ Pole opcjonalne
- ✅ Maksymalnie 10 elementów
- ✅ Każdy element niepusty string

**Komunikaty błędów**:

- Przekroczono limit: "Możesz wybrać maksymalnie 10 alergii"

**Komunikaty informacyjne**:

- Counter: "Wybrano: 7/10" (opcjonalnie)

**Gdzie weryfikowane**:

- `AllergiesSection` - limit enforced przez disable checkboxów
- `PreferencesForm` - walidacja onSubmit (edge case)

**Wpływ na UI**:

- Po osiągnięciu 10: pozostałe checkboxy disabled
- Komunikat informacyjny/błąd pod sekcją
- Submit NIE jest disabled (warunek spełniony)

---

#### 5. disliked_products (DislikedProductsSection)

**Warunki**:

- ⚠️ Pole opcjonalne
- ✅ Maksymalnie 20 elementów
- ✅ Każdy element niepusty string (po trim)
- ✅ Brak duplikatów (case-insensitive)

**Komunikaty błędów**:

- Przekroczono limit: "Możesz dodać maksymalnie 20 produktów"
- Duplikat (opcjonalnie): "Ten produkt został już dodany"

**Komunikaty informacyjne**:

- Counter: "Dodano: 15/20" (opcjonalnie)

**Gdzie weryfikowane**:

- `DislikedProductsSection` - limit enforced przez disable inputu
- `DislikedProductsSection` - duplikaty przy dodawaniu
- `PreferencesForm` - walidacja onSubmit (edge case)

**Wpływ na UI**:

- Po osiągnięciu 20: input disabled
- Komunikat informacyjny/błąd pod sekcją
- Submit NIE jest disabled (warunek spełniony)
- Przy próbie dodania duplikatu: toast info (opcjonalnie)

---

### Walidacja globalna formularza

**Warunek**:

- Wszystkie pola wymagane muszą być wypełnione
- Wszystkie pola muszą spełniać swoje warunki

**Gdzie weryfikowane**:

- `PreferencesForm` - funkcja `validateForm()` przed submit

**Wpływ na UI**:

- Submit button pozostaje disabled dopóki są błędy
- Przy próbie submitu z błędami: scroll do pierwszego błędu

---

### Dirty state detection

**Warunek**:

- Formularz został zmodyfikowany względem initialData

**Gdzie weryfikowane**:

- `useDirtyForm` hook - deep comparison

**Wpływ na UI**:

- Submit button disabled jeśli isDirty = false (opcjonalnie w MVP)
- Beforeunload warning jeśli isDirty = true
- Modal potwierdzenia przy Anuluj jeśli isDirty = true

## 10. Obsługa błędów

### 1. Błąd pobierania preferencji (GET)

**Scenariusz**: Request GET `/api/preferences` fails

**Typy błędów**:

**a) 404 Not Found** - brak preferencji

```typescript
// Response
{
  "error": "Not found",
  "message": "Nie znaleziono preferencji. Wypełnij formularz onboardingu."
}
```

**Obsługa**:

- Natychmiastowy redirect na `/onboarding`
- Brak wyświetlania komunikatu (redirect wyjaśnia sytuację)

**b) 500 Internal Server Error**

```typescript
// Response
{
  "error": "Internal server error",
  "message": "Nie udało się pobrać preferencji. Spróbuj ponownie."
}
```

**Obsługa**:

- Wyświetlenie ErrorState component:
  - Ikona błędu
  - Komunikat z response.message
  - Przycisk "Spróbuj ponownie" → refetch
- Logowanie błędu do console

**c) Network Error** (timeout, no connection)
**Obsługa**:

- Wyświetlenie ErrorState component:
  - Ikona błędu
  - Komunikat: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe."
  - Przycisk "Spróbuj ponownie" → refetch
- Logowanie błędu do console

---

### 2. Błąd zapisu preferencji (PUT)

**Scenariusz**: Request PUT `/api/preferences` fails

**Typy błędów**:

**a) 400 Bad Request** - błędy walidacji

```typescript
// Response
{
  "error": "Validation error",
  "details": [
    "Pole 'health_goal' jest wymagane",
    "Maksymalnie 10 alergii"
  ]
}
```

**Obsługa**:

- Parsowanie `details` array
- Mapowanie błędów na odpowiednie pola formularza
- Wyświetlenie komunikatów przy polach
- Button enabled (user może poprawić)
- Scroll do pierwszego błędu (opcjonalnie)

**b) 404 Not Found** - brak preferencji (edge case)

```typescript
// Response
{
  "error": "Not found",
  "message": "Nie znaleziono preferencji. Wypełnij formularz onboardingu."
}
```

**Obsługa**:

- Redirect na `/onboarding`
- Toast info: "Przekierowanie do formularza preferencji"

**c) 500 Internal Server Error**

```typescript
// Response
{
  "error": "Internal server error",
  "message": "Nie udało się zaktualizować preferencji. Spróbuj ponownie."
}
```

**Obsługa**:

- Toast error z komunikatem z response
- Button enabled (user może spróbować ponownie)
- Logowanie błędu do console

**d) Network Error**
**Obsługa**:

- Toast error: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe."
- Button enabled
- Logowanie błędu do console

---

### 3. Błędy walidacji frontendowej

**Scenariusz**: Użytkownik próbuje zapisać formularz z niepoprawnymi danymi

**Obsługa**:

- Walidacja przed wysłaniem requestu
- Wyświetlenie błędów przy odpowiednich polach
- PreventDefault na submit
- Focus na pierwszym błędnym polu
- Submit button pozostaje enabled (user może poprawić)

---

### 4. Przypadki brzegowe

**a) Brak formularza (initial data is null)**
**Obsługa**:

- Loading state podczas fetchowania
- Po timeout (10s) bez danych → ErrorState
- Użytkownik może spróbować ponownie

**b) Concurrent edits** (rzadkie w MVP z jednym użytkownikiem)
**Obsługa**:

- Ostatni zapis wygrywa (acceptable dla MVP)
- Brak lockingu/conflict resolution
- W przyszłości: optimistic locking z `updated_at` timestamp

**c) Form submission podczas zapisywania**
**Obsługa**:

- Submit button disabled podczas `isSaving = true`
- Dodatkowa walidacja: `if (isSaving) return;`
- Spinner na buttonie

**d) Navigation podczas zapisywania**
**Obsługa**:

- Beforeunload warning jeśli `isSaving = true`
- Alternatywnie: blokowanie nawigacji do zakończenia

---

### 5. Funkcje pomocnicze do obsługi błędów

```typescript
/**
 * Mapuje błędy API na błędy formularza
 */
function mapApiErrorsToFormErrors(details: string[]): PreferencesFormErrors {
  const errors: PreferencesFormErrors = {};

  details.forEach((detail) => {
    if (detail.includes("health_goal")) {
      errors.health_goal = detail;
    } else if (detail.includes("diet_type")) {
      errors.diet_type = detail;
    } else if (detail.includes("activity_level")) {
      errors.activity_level = detail;
    } else if (detail.includes("alerg")) {
      errors.allergies = detail;
    } else if (detail.includes("produkt")) {
      errors.disliked_products = detail;
    } else {
      errors._form = detail; // globalny błąd
    }
  });

  return errors;
}

/**
 * Wyświetla toast z błędem
 */
function showErrorToast(message: string) {
  // Implementacja zależna od biblioteki (np. sonner, react-toastify)
  toast.error(message);
}

/**
 * Loguje błąd do console i analytics (opcjonalnie)
 */
function logError(context: string, error: unknown) {
  console.error(`[${context}]`, error);
  // Opcjonalnie: wysyłka do analytics
}
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie infrastruktury

1.1. Utworzenie struktury katalogów:

```
src/components/preferences/
├── ProfileView.tsx          # Nowy komponent
├── PreferencesForm.tsx      # Istniejący (dostosowanie do mode)
├── HealthGoalSection.tsx    # Istniejący
├── DietTypeSection.tsx      # Istniejący
├── ActivityLevelSection.tsx # Istniejący
├── AllergiesSection.tsx     # Istniejący
├── DislikedProductsSection.tsx # Istniejący
└── ActionButtons.tsx        # Nowy komponent

src/hooks/
├── useProfileData.ts        # Nowy hook
├── useDirtyForm.ts          # Nowy hook
└── useUnsavedChangesWarning.ts # Nowy hook

src/pages/
└── profile.astro            # Nowa strona
```

1.2. Dodanie typów do `src/types.ts` lub oddzielny plik `src/components/preferences/types.ts`:

- `ProfileViewState`
- `PreferencesFormData`
- `PreferencesFormErrors`
- `ApiErrorResponse`
- Props interfaces dla komponentów

  1.3. Weryfikacja istniejących typów w `src/types.ts`:

- `UserPreferencesDTO` ✓
- `UpdateUserPreferencesDTO` ✓
- `HealthGoal` ✓
- `DietType` ✓

---

### Krok 2: Implementacja custom hooks

2.1. **Hook: useProfileData** (`src/hooks/useProfileData.ts`):

- Implementacja funkcji `fetchPreferences()`
- Obsługa stanów: loading, error, data
- Obsługa przypadków: 200, 404, 500, network error
- Redirect na `/onboarding` przy 404
- Return: `{ data, isLoading, error, refetch }`

  2.2. **Hook: useDirtyForm** (`src/hooks/useDirtyForm.ts`):

- Deep comparison `initialData` vs `currentData`
- Porównanie arrays (sort + JSON.stringify)
- Memoization dla wydajności
- Return: `boolean`

  2.3. **Hook: useUnsavedChangesWarning** (`src/hooks/useUnsavedChangesWarning.ts`):

- Event listener na `beforeunload`
- Conditional warning jeśli `isDirty = true`
- Cleanup w useEffect return
- Custom message jako parameter

---

### Krok 3: Aktualizacja istniejących komponentów

3.1. **PreferencesForm** - dodanie obsługi mode:

- Dodanie prop `mode: 'create' | 'edit'`
- Dodanie prop `initialData?: PreferencesFormData`
- Dodanie prop `onCancel?: () => void`
- Conditional rendering ActionButtons w zależności od mode
- Pre-wypełnienie formularza `initialData` w edit mode

  3.2. **ActionButtons** - utworzenie nowego komponentu:

- Props: `mode`, `isSubmitting`, `isDirty`, `onCancel`, `submitLabel`
- Conditional rendering:
  - Create mode: "Zapisz i wygeneruj plan"
  - Edit mode: "Zapisz zmiany" + "Anuluj"
- Disabled logic:
  - Always disabled podczas `isSubmitting`
  - Opcjonalnie disabled w edit mode gdy `!isDirty`
- Loading spinner na submit button

---

### Krok 4: Implementacja ProfileView

4.1. **Struktura komponentu**:

```typescript
export function ProfileView() {
  // State
  const [formData, setFormData] = useState<PreferencesFormData>(...);
  const [isSaving, setIsSaving] = useState(false);

  // Custom hooks
  const { data, isLoading, error, refetch } = useProfileData();
  const isDirty = useDirtyForm(data, formData);
  useUnsavedChangesWarning(isDirty);

  // Effects
  useEffect(() => {
    // Pre-fill form gdy data arrives
  }, [data]);

  // Handlers
  const handleSubmit = async (data: PreferencesFormData) => {
    // PUT logic
  };

  const handleCancel = () => {
    // Cancel logic
  };

  // Render
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div>
      <PageHeader />
      <PreferencesForm
        mode="edit"
        initialData={data}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSaving}
      />
    </div>
  );
}
```

4.2. **Handler: handleSubmit**:

- Walidacja frontendowa
- Set `isSaving = true`
- Call `updatePreferences(formData)`
- Success:
  - Toast: "Profil zaktualizowany"
  - Redirect: `/dashboard`
- Error:
  - Parsowanie błędów
  - Wyświetlenie toasta lub błędów przy polach
  - Set `isSaving = false`

    4.3. **Handler: handleCancel**:

- Check `isDirty`
- Jeśli dirty → wyświetl confirmation dialog
- Jeśli !dirty lub confirmed → redirect `/dashboard`

---

### Krok 5: Utworzenie strony Astro

5.1. **Plik: profile.astro**:

```astro
---
import Layout from "@/layouts/Layout.astro";
import { ProfileView } from "@/components/preferences/ProfileView";

// Middleware już obsługuje auth, ale można dodać dodatkową walidację
const user = Astro.locals.user;
if (!user) {
  return Astro.redirect("/login");
}
---

<Layout title="Mój Profil - AI Meal Planner">
  <ProfileView client:load />
</Layout>
```

5.2. Dodanie meta tags (SEO):

- Title: "Mój Profil - AI Meal Planner"
- Description: "Zaktualizuj swoje preferencje żywieniowe"
- Robots: noindex (chroniona strona)

---

### Krok 6: Integracja z nawigacją

6.1. **Aktualizacja Navigation component**:

- Dodanie linku "Mój Profil" w menu
- Active state dla `/profile` route
- Pozycja: między "Dashboard" a "Wyloguj"

  6.2. **Przykład**:

```tsx
<nav>
  <Link href="/dashboard">Dashboard</Link>
  <Link href="/profile" active={pathname === "/profile"}>
    Mój Profil
  </Link>
  <button onClick={handleLogout}>Wyloguj</button>
</nav>
```

---

### Krok 7: Implementacja stanów UI

7.1. **LoadingState component**:

- Skeleton loader dla formularza
- Skeleton dla selectów, checkboxów, inputów
- Loading message: "Ładowanie profilu..."

  7.2. **ErrorState component**:

- Ikona błędu (AlertCircle z lucide-react)
- Komunikat błędu (props)
- Przycisk "Spróbuj ponownie" (props: onRetry)
- Stylowanie z Tailwind

  7.3. **ConfirmationDialog** (dla Cancel z niezapisanymi zmianami):

- Dialog z Shadcn/ui
- Tytuł: "Niezapisane zmiany"
- Content: "Masz niezapisane zmiany. Czy na pewno chcesz opuścić stronę?"
- Buttons: "Zostań" | "Opuść stronę"

---

### Krok 8: Obsługa toastów

8.1. **Instalacja biblioteki** (jeśli nie istnieje):

- Opcja A: `sonner` (zalecane dla Shadcn/ui)
- Opcja B: `react-toastify`
- Opcja C: custom toast component

  8.2. **Dodanie ToastProvider** do Layout

  8.3. **Funkcje pomocnicze**:

```typescript
// src/lib/toast.ts
export function showSuccessToast(message: string) {
  toast.success(message);
}

export function showErrorToast(message: string) {
  toast.error(message);
}
```

8.4. **Użycie w ProfileView**:

- Success: `showSuccessToast("Profil zaktualizowany")`
- Error: `showErrorToast(error.message)`

---

### Krok 9: Testowanie

9.1. **Testy manualne - Happy path**:

- [ ] Przejście na `/profile` jako zalogowany user
- [ ] Poprawne wyświetlenie pre-wypełnionego formularza
- [ ] Zmiana każdego pola
- [ ] Dirty state detection działa
- [ ] Zapis zmian (PUT) działa
- [ ] Toast success wyświetla się
- [ ] Redirect na `/dashboard` działa
- [ ] Kolejne wejście na `/profile` pokazuje nowe wartości

  9.2. **Testy manualne - Edge cases**:

- [ ] Wejście na `/profile` bez logowania → redirect `/login`
- [ ] GET 404 → redirect `/onboarding`
- [ ] GET 500 → ErrorState + retry działa
- [ ] PUT 400 → błędy walidacji wyświetlają się
- [ ] PUT 500 → toast error wyświetla się
- [ ] Cancel bez zmian → natychmiastowy redirect
- [ ] Cancel ze zmianami → confirmation dialog
- [ ] Beforeunload ze zmianami → ostrzeżenie przeglądarki
- [ ] Limit 10 alergii → checkboxy disabled
- [ ] Limit 20 produktów → input disabled
- [ ] Duplikaty produktów → ignorowane

  9.3. **Testy responsywności**:

- [ ] Mobile view (< 640px)
- [ ] Tablet view (640px - 1024px)
- [ ] Desktop view (> 1024px)
- [ ] Formularz czytelny na wszystkich rozdzielczościach

  9.4. **Testy accessibility**:

- [ ] Nawigacja klawiaturą (Tab, Enter, Escape)
- [ ] Screen reader labels
- [ ] Focus states widoczne
- [ ] Error messages announce

---

### Krok 10: Dokumentacja i finalizacja

10.1. **Dokumentacja kodu**:

- JSDoc comments dla funkcji i komponentów
- Inline comments dla złożonej logiki
- README update z nowym route

  10.2. **Update plików dokumentacji**:

- `.ai/ui-plan.md` - mark `/profile` as implemented
- `.ai/prd.md` - mark US-006, US-007 as done

  10.3. **Code review checklist**:

- [ ] TypeScript errors: 0
- [ ] ESLint warnings: 0
- [ ] Formatowanie (Prettier)
- [ ] Brak console.log (poza error handling)
- [ ] Brak hardcoded strings (używać stałych)
- [ ] Walidacja zgodna z backend schema
- [ ] Error handling complete
- [ ] Loading states implemented
- [ ] Accessibility requirements met

  10.4. **Performance check**:

- [ ] Bundle size impact < 50KB
- [ ] Initial load time < 2s
- [ ] Form interaction < 100ms response

---

### Krok 11: Deploy i monitoring

11.1. **Pre-deploy checklist**:

- [ ] All tests pass
- [ ] Build succeeds (`npm run build`)
- [ ] Preview deployment działa
- [ ] Feature flag enabled (jeśli używane)

  11.2. **Post-deploy verification**:

- [ ] Link "Mój Profil" widoczny w nawigacji
- [ ] Route `/profile` dostępny
- [ ] GET i PUT endpoints działają
- [ ] Redirects działają poprawnie
- [ ] Toasty wyświetlają się

  11.3. **Monitoring** (opcjonalne dla MVP):

- Analytics event: `profile_updated`
- Error tracking: błędy API
- Performance: czas ładowania strony

---

## Podsumowanie kroków

1. ✅ Przygotowanie infrastruktury (katalogi, typy)
2. ✅ Implementacja custom hooks (useProfileData, useDirtyForm, useUnsavedChangesWarning)
3. ✅ Aktualizacja istniejących komponentów (PreferencesForm, ActionButtons)
4. ✅ Implementacja ProfileView (główny kontener)
5. ✅ Utworzenie strony Astro (profile.astro)
6. ✅ Integracja z nawigacją
7. ✅ Implementacja stanów UI (Loading, Error, Confirmation)
8. ✅ Obsługa toastów (success, error)
9. ✅ Testowanie (happy path, edge cases, responsive, a11y)
10. ✅ Dokumentacja i finalizacja
11. ✅ Deploy i monitoring

**Szacowany czas implementacji**: 6-8 godzin dla doświadczonego frontend developera

**Priorytet**: High (core feature - User Stories US-006, US-007)

**Zależności**:

- Istniejący PreferencesForm z onboarding
- Działający endpoint PUT /api/preferences
- System autentykacji i middleware
