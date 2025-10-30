# Plan implementacji widoku Onboarding

## 1. Przegląd

Widok onboardingu to formularz preferencji żywieniowych dla nowo zarejestrowanych użytkowników. Celem jest zebranie danych potrzebnych do generowania spersonalizowanych planów posiłków w czasie krótszym niż 5 minut (target: 2 minuty). Formularz składa się z 5 sekcji, zawiera walidację w czasie rzeczywistym, auto-zapis do localStorage oraz funkcję przywracania wersji roboczej.

## 2. Routing widoku

**Ścieżka:** `/onboarding`

**Typ:** Chroniony (wymaga zalogowania, brak istniejących preferencji)

**Redirecty:**
- Po sukcesie → `/dashboard` (automatycznie triggeruje generowanie pierwszego planu)
- Jeśli użytkownik ma już preferencje → przekierowanie do `/dashboard`

## 3. Struktura komponentów

```
src/pages/onboarding.astro (Astro page)
  └── PreferencesForm.tsx (React component)
      ├── DraftRestoreModal.tsx (conditional)
      ├── FormSection.tsx × 5
      │   ├── HealthGoalSelect.tsx
      │   ├── DietTypeSelect.tsx
      │   ├── ActivityLevelSelect.tsx
      │   ├── AllergyCheckboxGroup.tsx
      │   └── ProductCombobox.tsx
      │       └── ProductBadge.tsx (multiple)
      └── StickyFormFooter.tsx
          └── Button (from shadcn/ui)
```

**Wspólne komponenty z shadcn/ui:**
- `Button`
- `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`
- `Checkbox`
- `Label`
- `Command`, `CommandInput`, `CommandList`, `CommandItem` (dla combobox)
- `Dialog`, `DialogContent`, `DialogHeader` (dla modala)
- `Badge`

## 4. Szczegóły komponentów

### 4.1. onboarding.astro (Page)

**Opis:** Strona Astro będąca kontenerem dla komponentu React. Sprawdza middleware czy użytkownik jest zalogowany i czy nie ma już preferencji.

**Główne elementy:**
```astro
<Layout title="Poznajmy Twoje preferencje">
  <main class="container mx-auto py-8 px-4">
    <header class="mb-8 text-center">
      <h1>Poznajmy Twoje preferencje</h1>
      <p>To zajmie tylko 2 minuty...</p>
    </header>
    <PreferencesForm client:load />
  </main>
</Layout>
```

**Logika:**
- Middleware sprawdza autentykację
- GET `/api/preferences` aby sprawdzić czy użytkownik ma już preferencje
- Jeśli tak → redirect do `/dashboard`

### 4.2. PreferencesForm.tsx (Main Component)

**Opis:** Główny komponent formularza zarządzający stanem, walidacją i submisją. Używa React Hook Form z Zod schema.

**Główne elementy:**
```tsx
<form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
  {showDraftModal && <DraftRestoreModal />}
  
  <FormSection title="Jaki jest Twój główny cel zdrowotny?" required>
    <HealthGoalSelect />
  </FormSection>
  
  <FormSection title="Jakiego typu dietę preferujesz?" required>
    <DietTypeSelect />
  </FormSection>
  
  <FormSection title="Jaki jest Twój poziom aktywności fizycznej?" required>
    <ActivityLevelSelect />
  </FormSection>
  
  <FormSection title="Czy masz jakieś alergie lub nietolerancje pokarmowe?"
               subtitle="Możesz wybrać maksymalnie 10 pozycji">
    <AllergyCheckboxGroup />
  </FormSection>
  
  <FormSection title="Jakich produktów nie lubisz?"
               subtitle="Nie uwzględnimy ich w Twoim planie. Możesz dodać maksymalnie 20 produktów.">
    <ProductCombobox />
  </FormSection>
  
  <StickyFormFooter>
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? "Zapisuję..." : "Zapisz i wygeneruj plan"}
    </Button>
  </StickyFormFooter>
</form>
```

**Obsługiwane interakcje:**
- `onSubmit` - walidacja i wysłanie formularza do API
- `onChange` - aktualizacja stanu formularza + trigger auto-save
- `onFieldBlur` - walidacja pojedynczego pola

**Obsługiwana walidacja:**
- Wszystkie wymagane pola wypełnione (health_goal, diet_type, activity_level)
- activity_level w zakresie 1-5
- allergies max 10 elementów
- disliked_products max 20 elementów
- Zgodność typów enum z API

**Typy:**
- `PreferencesFormData` (ViewModel)
- `CreateUserPreferencesDTO` (request)
- `UserPreferencesDTO` (response)

**Propsy:** Brak (top-level component)

**State:**
```tsx
const [formData, setFormData] = useState<PreferencesFormData>(defaultValues);
const [errors, setErrors] = useState<Record<string, string>>({});
const [isSubmitting, setIsSubmitting] = useState(false);
const [showDraftModal, setShowDraftModal] = useState(false);
const [draftData, setDraftData] = useState<PreferencesFormData | null>(null);
```

### 4.3. FormSection.tsx (Layout Component)

**Opis:** Komponent opakowujący sekcje formularza. Zapewnia konsystentny layout i styl dla każdej sekcji.

**Główne elementy:**
```tsx
<fieldset className="space-y-4">
  <legend className="text-lg font-semibold">
    {title}
    {required && <span className="text-red-500"> *</span>}
  </legend>
  {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
  {children}
  {error && <p className="text-sm text-red-500">{error}</p>}
</fieldset>
```

**Obsługiwane interakcje:** Brak (presentational)

**Obsługiwana walidacja:** Brak (tylko wyświetla error z rodzica)

**Typy:** Propsy (patrz niżej)

**Propsy:**
```tsx
interface FormSectionProps {
  title: string;
  subtitle?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}
```

### 4.4. HealthGoalSelect.tsx (Form Field)

**Opis:** Dropdown do wyboru celu zdrowotnego. Używa komponentu `Select` z shadcn/ui.

**Główne elementy:**
```tsx
<Select value={value} onValueChange={onChange}>
  <SelectTrigger aria-required="true" aria-invalid={!!error}>
    <SelectValue placeholder="Wybierz cel..." />
  </SelectTrigger>
  <SelectContent>
    {healthGoalOptions.map(option => (
      <SelectItem key={option.value} value={option.value}>
        {option.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Opcje:**
```tsx
const healthGoalOptions: HealthGoalOption[] = [
  { value: "LOSE_WEIGHT", label: "Schudnąć" },
  { value: "GAIN_WEIGHT", label: "Przybrać na wadze" },
  { value: "MAINTAIN_WEIGHT", label: "Utrzymać wagę" },
  { value: "HEALTHY_EATING", label: "Zdrowo jeść" },
  { value: "BOOST_ENERGY", label: "Zwiększyć energię" }
];
```

**Obsługiwane interakcje:**
- `onValueChange` - zmiana wartości

**Obsługiwana walidacja:**
- Pole wymagane (walidowane w FormSchema)

**Typy:**
- `HealthGoal` (enum z types.ts)
- `HealthGoalOption` (ViewModel)

**Propsy:**
```tsx
interface HealthGoalSelectProps {
  value: HealthGoal | "";
  onChange: (value: HealthGoal) => void;
  error?: string;
}
```

### 4.5. DietTypeSelect.tsx (Form Field)

**Opis:** Dropdown do wyboru typu diety. Struktura analogiczna do HealthGoalSelect.

**Opcje:**
```tsx
const dietTypeOptions: DietTypeOption[] = [
  { value: "STANDARD", label: "Standardowa" },
  { value: "VEGETARIAN", label: "Wegetariańska" },
  { value: "VEGAN", label: "Wegańska" },
  { value: "GLUTEN_FREE", label: "Bezglutenowa" }
];
```

**Obsługiwane interakcje:** `onValueChange`

**Obsługiwana walidacja:** Pole wymagane

**Typy:**
- `DietType` (enum z types.ts)
- `DietTypeOption` (ViewModel)

**Propsy:**
```tsx
interface DietTypeSelectProps {
  value: DietType | "";
  onChange: (value: DietType) => void;
  error?: string;
}
```

### 4.6. ActivityLevelSelect.tsx (Form Field)

**Opis:** Dropdown do wyboru poziomu aktywności (1-5) z opisami.

**Główne elementy:**
```tsx
<Select value={value?.toString()} onValueChange={(v) => onChange(parseInt(v))}>
  <SelectTrigger>
    <SelectValue placeholder="Wybierz poziom aktywności..." />
  </SelectTrigger>
  <SelectContent>
    {activityLevelOptions.map(option => (
      <SelectItem key={option.value} value={option.value.toString()}>
        <div>
          <div className="font-medium">{option.value} - {option.label}</div>
          <div className="text-sm text-muted-foreground">{option.description}</div>
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Opcje:**
```tsx
const activityLevelOptions: ActivityLevelOption[] = [
  { value: 1, label: "Siedzący tryb życia", description: "brak aktywności" },
  { value: 2, label: "Lekka aktywność", description: "spacery, lekkie prace" },
  { value: 3, label: "Umiarkowana aktywność", description: "trening 3x w tygodniu" },
  { value: 4, label: "Wysoka aktywność", description: "trening 5x w tygodniu" },
  { value: 5, label: "Bardzo wysoka aktywność", description: "sport intensywny codziennie" }
];
```

**Obsługiwane interakcje:** `onValueChange`

**Obsługiwana walidacja:**
- Pole wymagane
- Wartość 1-5

**Typy:** `ActivityLevelOption` (ViewModel)

**Propsy:**
```tsx
interface ActivityLevelSelectProps {
  value: number | null;
  onChange: (value: number) => void;
  error?: string;
}
```

### 4.7. AllergyCheckboxGroup.tsx (Form Field)

**Opis:** Grupa checkboxów dla alergii z limitem 10. Po zaznaczeniu 10 elementów, niezaznaczone są disabled.

**Główne elementy:**
```tsx
<div className="space-y-3">
  <div className="text-sm text-muted-foreground">
    {selectedCount}/10 wybranych
  </div>
  
  {allergyOptions.map(option => (
    <div key={option.value} className="flex items-center space-x-2">
      <Checkbox
        id={option.value}
        checked={value.includes(option.value)}
        disabled={!value.includes(option.value) && selectedCount >= 10}
        onCheckedChange={(checked) => handleToggle(option.value, checked)}
      />
      <Label htmlFor={option.value}>{option.label}</Label>
    </div>
  ))}
  
  {value.includes("Inne") && (
    <Input
      placeholder="Wpisz inną alergię..."
      value={otherValue}
      onChange={(e) => setOtherValue(e.target.value)}
    />
  )}
  
  {selectedCount >= 10 && (
    <p className="text-sm text-amber-600">
      Osiągnięto limit 10 alergii. Aby dodać nową, usuń istniejącą.
    </p>
  )}
</div>
```

**Opcje:**
```tsx
const allergyOptions: AllergyOption[] = [
  { value: "Gluten", label: "Gluten" },
  { value: "Laktoza", label: "Laktoza" },
  { value: "Orzechy", label: "Orzechy" },
  { value: "Jajka", label: "Jajka" },
  { value: "Ryby", label: "Ryby" },
  { value: "Skorupiaki", label: "Skorupiaki" },
  { value: "Soja", label: "Soja" },
  { value: "Inne", label: "Inne", isOther: true }
];
```

**Obsługiwane interakcje:**
- `onCheckedChange` - toggle checkboxa
- `onChange` (dla pola "Inne") - wpisanie custom alergii

**Obsługiwana walidacja:**
- Max 10 elementów (enforced przez disabled state)
- Counter pokazujący "X/10"

**Typy:**
- `string[]` dla value
- `AllergyOption` (ViewModel)

**Propsy:**
```tsx
interface AllergyCheckboxGroupProps {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}
```

### 4.8. ProductCombobox.tsx (Form Field)

**Opis:** Combobox z autouzupełnianiem dla produktów nielubanych. Wybrane produkty wyświetlane jako badges. Limit 20 produktów.

**Główne elementy:**
```tsx
<div className="space-y-3">
  <div className="text-sm text-muted-foreground">
    {value.length}/20 produktów
  </div>
  
  <Command>
    <CommandInput
      placeholder="Wyszukaj produkt..."
      value={inputValue}
      onValueChange={setInputValue}
      disabled={value.length >= 20}
    />
    <CommandList>
      {filteredProducts.map(product => (
        <CommandItem
          key={product.name}
          onSelect={() => handleAddProduct(product.name)}
        >
          {product.name}
        </CommandItem>
      ))}
    </CommandList>
  </Command>
  
  <div className="flex flex-wrap gap-2">
    {value.map(product => (
      <ProductBadge
        key={product}
        product={product}
        onRemove={() => handleRemoveProduct(product)}
      />
    ))}
  </div>
  
  {value.length >= 20 && (
    <p className="text-sm text-amber-600">
      Osiągnięto limit 20 produktów. Aby dodać nowy, usuń istniejący.
    </p>
  )}
</div>
```

**Obsługiwane interakcje:**
- `onValueChange` (input) - wpisywanie i filtrowanie
- `onSelect` (item) - wybór produktu z listy
- `onRemove` (badge) - usunięcie produktu

**Obsługiwana walidacja:**
- Max 20 elementów (enforced przez disabled input)
- Min 2 znaki do pokazania sugestii
- Counter "X/20"

**Typy:**
- `string[]` dla value
- `Product[]` dla listy produktów

**Propsy:**
```tsx
interface ProductComboboxProps {
  value: string[];
  onChange: (value: string[]) => void;
  products: Product[]; // z hooka useProducts()
  error?: string;
}
```

### 4.9. ProductBadge.tsx (UI Component)

**Opis:** Badge wyświetlający wybrany produkt z przyciskiem usunięcia.

**Główne elementy:**
```tsx
<Badge variant="secondary" className="gap-1">
  {product}
  <button
    type="button"
    onClick={onRemove}
    className="ml-1 hover:text-destructive"
    aria-label={`Usuń ${product}`}
  >
    <X className="h-3 w-3" />
  </button>
</Badge>
```

**Obsługiwane interakcje:**
- `onClick` (button) - usunięcie produktu

**Obsługiwana walidacja:** Brak

**Typy:** Propsy (patrz niżej)

**Propsy:**
```tsx
interface ProductBadgeProps {
  product: string;
  onRemove: () => void;
}
```

### 4.10. StickyFormFooter.tsx (Layout Component)

**Opis:** Sticky footer na dole ekranu z przyciskiem submit.

**Główne elementy:**
```tsx
<div className="sticky bottom-0 bg-background border-t py-4 mt-8">
  <div className="container max-w-2xl mx-auto flex justify-end">
    {children}
  </div>
</div>
```

**Obsługiwane interakcje:** Brak (container)

**Obsługiwana walidacja:** Brak

**Typy:** Propsy (patrz niżej)

**Propsy:**
```tsx
interface StickyFormFooterProps {
  children: React.ReactNode;
}
```

### 4.11. DraftRestoreModal.tsx (Modal Component)

**Opis:** Modal pytający czy kontynuować wypełnianie z zapisanego draftu.

**Główne elementy:**
```tsx
<Dialog open={open} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Chcesz kontynuować wypełnianie?</DialogTitle>
      <DialogDescription>
        Znaleźliśmy zapisany formularz. Czy chcesz kontynuować od miejsca, w którym skończyłeś?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={onStartNew}>
        Zacznij od nowa
      </Button>
      <Button onClick={onContinue}>
        Kontynuuj
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Obsługiwane interakcje:**
- `onContinue` - załaduj draft do formularza
- `onStartNew` - wyczyść draft i rozpocznij od nowa

**Obsługiwana walidacja:** Brak

**Typy:**
- `PreferencesFormData` (draft data)

**Propsy:**
```tsx
interface DraftRestoreModalProps {
  open: boolean;
  draftData: PreferencesFormData;
  onContinue: () => void;
  onStartNew: () => void;
  onClose: () => void;
}
```

## 5. Typy

### 5.1. Istniejące typy (z types.ts)

```typescript
// DTO dla API request
export type CreateUserPreferencesDTO = Omit<TablesInsert<"user_preferences">, "user_id">;

// DTO dla API response
export type UserPreferencesDTO = Tables<"user_preferences">;

// Enumy
export type HealthGoal = Enums<"health_goal_enum">; 
// "LOSE_WEIGHT" | "GAIN_WEIGHT" | "MAINTAIN_WEIGHT" | "HEALTHY_EATING" | "BOOST_ENERGY"

export type DietType = Enums<"diet_type_enum">;
// "STANDARD" | "VEGETARIAN" | "VEGAN" | "GLUTEN_FREE"
```

### 5.2. Nowe ViewModels (do utworzenia)

**Plik:** `src/lib/viewmodels/preferences.viewmodel.ts`

```typescript
import type { HealthGoal, DietType } from "@/types";

/**
 * Form data structure matching API DTO
 * Używany jako typ dla formularza i localStorage draft
 */
export interface PreferencesFormData {
  health_goal: HealthGoal | "";
  diet_type: DietType | "";
  activity_level: number | null;
  allergies: string[];
  disliked_products: string[];
}

/**
 * Default/empty form values
 */
export const defaultPreferencesFormData: PreferencesFormData = {
  health_goal: "",
  diet_type: "",
  activity_level: null,
  allergies: [],
  disliked_products: []
};

/**
 * Health goal option for select dropdown
 */
export interface HealthGoalOption {
  value: HealthGoal;
  label: string;
}

export const healthGoalOptions: HealthGoalOption[] = [
  { value: "LOSE_WEIGHT", label: "Schudnąć" },
  { value: "GAIN_WEIGHT", label: "Przybrać na wadze" },
  { value: "MAINTAIN_WEIGHT", label: "Utrzymać wagę" },
  { value: "HEALTHY_EATING", label: "Zdrowo jeść" },
  { value: "BOOST_ENERGY", label: "Zwiększyć energię" }
];

/**
 * Diet type option for select dropdown
 */
export interface DietTypeOption {
  value: DietType;
  label: string;
}

export const dietTypeOptions: DietTypeOption[] = [
  { value: "STANDARD", label: "Standardowa" },
  { value: "VEGETARIAN", label: "Wegetariańska" },
  { value: "VEGAN", label: "Wegańska" },
  { value: "GLUTEN_FREE", label: "Bezglutenowa" }
];

/**
 * Activity level option with description
 */
export interface ActivityLevelOption {
  value: number;
  label: string;
  description: string;
}

export const activityLevelOptions: ActivityLevelOption[] = [
  { value: 1, label: "Siedzący tryb życia", description: "brak aktywności" },
  { value: 2, label: "Lekka aktywność", description: "spacery, lekkie prace" },
  { value: 3, label: "Umiarkowana aktywność", description: "trening 3x w tygodniu" },
  { value: 4, label: "Wysoka aktywność", description: "trening 5x w tygodniu" },
  { value: 5, label: "Bardzo wysoka aktywność", description: "sport intensywny codziennie" }
];

/**
 * Allergy checkbox option
 */
export interface AllergyOption {
  value: string;
  label: string;
  isOther?: boolean;
}

export const allergyOptions: AllergyOption[] = [
  { value: "Gluten", label: "Gluten" },
  { value: "Laktoza", label: "Laktoza" },
  { value: "Orzechy", label: "Orzechy" },
  { value: "Jajka", label: "Jajka" },
  { value: "Ryby", label: "Ryby" },
  { value: "Skorupiaki", label: "Skorupiaki" },
  { value: "Soja", label: "Soja" },
  { value: "Inne", label: "Inne", isOther: true }
];

/**
 * Product for autocomplete
 */
export interface Product {
  name: string;
}
```

### 5.3. Zod Schema (walidacja)

**Plik:** `src/lib/schemas/preferences.schema.ts` (już istnieje)

Upewnić się że zawiera:

```typescript
import { z } from "zod";

export const CreatePreferencesSchema = z.object({
  health_goal: z.enum(["LOSE_WEIGHT", "GAIN_WEIGHT", "MAINTAIN_WEIGHT", "HEALTHY_EATING", "BOOST_ENERGY"], {
    required_error: "Pole 'cel zdrowotny' jest wymagane",
    invalid_type_error: "Nieprawidłowy cel zdrowotny"
  }),
  diet_type: z.enum(["STANDARD", "VEGETARIAN", "VEGAN", "GLUTEN_FREE"], {
    required_error: "Pole 'typ diety' jest wymagane",
    invalid_type_error: "Nieprawidłowy typ diety"
  }),
  activity_level: z.number({
    required_error: "Pole 'poziom aktywności' jest wymagane",
    invalid_type_error: "Poziom aktywności musi być liczbą"
  }).int().min(1, "Poziom aktywności musi być co najmniej 1").max(5, "Poziom aktywności może być maksymalnie 5"),
  allergies: z.array(z.string()).max(10, "Możesz wybrać maksymalnie 10 alergii").default([]),
  disliked_products: z.array(z.string()).max(20, "Możesz dodać maksymalnie 20 produktów nielubanych").default([])
});

export type CreatePreferencesInput = z.infer<typeof CreatePreferencesSchema>;
```

### 5.4. Lista produktów

**Plik:** `src/data/products.json`

```json
{
  "products": [
    { "name": "Brokuły" },
    { "name": "Kalafior" },
    { "name": "Papryka" },
    { "name": "Cebula" },
    { "name": "Czosnek" },
    { "name": "Pomidory" },
    { "name": "Ogórki" },
    { "name": "Marchew" },
    { "name": "Ziemniaki" },
    { "name": "Buraki" },
    { "name": "Szpinak" },
    { "name": "Sałata" },
    { "name": "Kapusta" },
    { "name": "Pieczarki" },
    { "name": "Boczek" },
    { "name": "Kiełbasa" },
    { "name": "Kurczak" },
    { "name": "Wieprzowina" },
    { "name": "Wołowina" },
    { "name": "Ryba" },
    { "name": "Łosoś" },
    { "name": "Tuńczyk" },
    { "name": "Krewetki" },
    { "name": "Mleko" },
    { "name": "Ser" },
    { "name": "Jogurt" },
    { "name": "Masło" },
    { "name": "Jajka" },
    { "name": "Tofu" },
    { "name": "Tempeh" },
    { "name": "Ryż" },
    { "name": "Makaron" },
    { "name": "Kasza" },
    { "name": "Płatki owsiane" },
    { "name": "Quinoa" },
    { "name": "Chleb" },
    { "name": "Bułki" },
    { "name": "Orzechy włoskie" },
    { "name": "Migdały" },
    { "name": "Orzechy nerkowca" },
    { "name": "Pestki słonecznika" },
    { "name": "Pestki dyni" },
    { "name": "Fasola" },
    { "name": "Soczewica" },
    { "name": "Ciecierzyca" },
    { "name": "Groszek" },
    { "name": "Kukurydza" },
    { "name": "Awokado" },
    { "name": "Banan" },
    { "name": "Jabłko" },
    { "name": "Gruszka" },
    { "name": "Pomarańcza" },
    { "name": "Mandarynka" },
    { "name": "Truskawki" },
    { "name": "Maliny" },
    { "name": "Jagody" },
    { "name": "Borówki" },
    { "name": "Winogrona" },
    { "name": "Arbuz" },
    { "name": "Melon" },
    { "name": "Ananas" },
    { "name": "Mango" },
    { "name": "Kiwi" },
    { "name": "Limonka" },
    { "name": "Cytryna" },
    { "name": "Imbir" },
    { "name": "Kurkuma" },
    { "name": "Pieprz" },
    { "name": "Chili" },
    { "name": "Papryka ostra" },
    { "name": "Bazylia" },
    { "name": "Oregano" },
    { "name": "Tymianek" },
    { "name": "Rozmaryn" },
    { "name": "Kolendra" },
    { "name": "Pietruszka" },
    { "name": "Koperek" },
    { "name": "Szczypiorek" },
    { "name": "Mięta" },
    { "name": "Miód" },
    { "name": "Syrop klonowy" },
    { "name": "Cukier" },
    { "name": "Sól" },
    { "name": "Oliwa z oliwek" },
    { "name": "Olej kokosowy" },
    { "name": "Olej rzepakowy" },
    { "name": "Ocet" },
    { "name": "Sos sojowy" },
    { "name": "Musztarda" },
    { "name": "Ketchup" },
    { "name": "Majonez" },
    { "name": "Czekolada" },
    { "name": "Kakao" },
    { "name": "Kawa" },
    { "name": "Herbata" },
    { "name": "Sok pomarańczowy" },
    { "name": "Woda gazowana" },
    { "name": "Cola" }
  ]
}
```

## 6. Zarządzanie stanem

### 6.1. Główny stan formularza

Stan zarządzany jest w komponencie `PreferencesForm` za pomocą React Hook Form:

```typescript
const form = useForm<PreferencesFormData>({
  resolver: zodResolver(CreatePreferencesSchema),
  defaultValues: defaultPreferencesFormData,
  mode: "onBlur" // walidacja przy blur
});

const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = form;
```

### 6.2. Custom Hooks

#### useAutoSave

**Plik:** `src/hooks/useAutoSave.ts`

```typescript
import { useEffect, useRef } from "react";
import { debounce } from "lodash-es";

const DRAFT_KEY = "preferences-draft";
const AUTO_SAVE_DELAY = 2000; // 2 sekundy

export function useAutoSave<T>(data: T, enabled: boolean = true) {
  const saveToLocalStorage = useRef(
    debounce((dataToSave: T) => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(dataToSave));
        console.log("Draft auto-saved");
      } catch (error) {
        console.error("Failed to save draft:", error);
      }
    }, AUTO_SAVE_DELAY)
  ).current;

  useEffect(() => {
    if (enabled) {
      saveToLocalStorage(data);
    }
    
    return () => {
      saveToLocalStorage.cancel();
    };
  }, [data, enabled, saveToLocalStorage]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      console.error("Failed to clear draft:", error);
    }
  };

  return { clearDraft };
}
```

#### useDraftRestore

**Plik:** `src/hooks/useDraftRestore.ts`

```typescript
import { useState, useEffect } from "react";
import type { PreferencesFormData } from "@/lib/viewmodels/preferences.viewmodel";

const DRAFT_KEY = "preferences-draft";

export function useDraftRestore() {
  const [draft, setDraft] = useState<PreferencesFormData | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft) as PreferencesFormData;
        setDraft(parsed);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Failed to load draft:", error);
    }
  }, []);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setDraft(null);
      setShowModal(false);
    } catch (error) {
      console.error("Failed to clear draft:", error);
    }
  };

  const loadDraft = () => {
    setShowModal(false);
    return draft;
  };

  return { draft, showModal, loadDraft, clearDraft };
}
```

#### useProducts

**Plik:** `src/hooks/useProducts.ts`

```typescript
import { useState, useEffect, useMemo } from "react";
import Fuse from "fuse.js";
import type { Product } from "@/lib/viewmodels/preferences.viewmodel";
import productsData from "@/data/products.json";

export function useProducts() {
  const [products] = useState<Product[]>(productsData.products);

  const fuse = useMemo(() => {
    return new Fuse(products, {
      keys: ["name"],
      threshold: 0.3,
      minMatchCharLength: 2
    });
  }, [products]);

  const filterProducts = (query: string): Product[] => {
    if (!query || query.length < 2) {
      return [];
    }
    
    const results = fuse.search(query);
    return results.map(result => result.item).slice(0, 10); // max 10 wyników
  };

  return { products, filterProducts };
}
```

## 7. Integracja API

### 7.1. Endpoint

**POST** `/api/preferences`

**Request Type:** `CreateUserPreferencesDTO`

```typescript
{
  health_goal: HealthGoal;
  diet_type: DietType;
  activity_level: number; // 1-5
  allergies?: string[]; // max 10
  disliked_products?: string[]; // max 20
}
```

**Response Type:** `UserPreferencesDTO` (status 201)

```typescript
{
  user_id: string;
  health_goal: HealthGoal;
  diet_type: DietType;
  activity_level: number;
  allergies: string[];
  disliked_products: string[];
}
```

**Error Responses:**
- `400` - Błędy walidacji
- `401` - Brak autoryzacji
- `409` - Preferencje już istnieją
- `500` - Błąd serwera

### 7.2. Funkcja submit

**Plik:** `src/lib/api/preferences.api.ts`

```typescript
import type { CreateUserPreferencesDTO, UserPreferencesDTO } from "@/types";

export async function createPreferences(data: CreateUserPreferencesDTO): Promise<UserPreferencesDTO> {
  const response = await fetch("/api/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Nie udało się zapisać preferencji");
  }

  return response.json();
}
```

### 7.3. Użycie w komponencie

```typescript
const onSubmit = async (data: PreferencesFormData) => {
  try {
    // Konwersja form data do DTO (usunięcie pustych wartości)
    const dto: CreateUserPreferencesDTO = {
      health_goal: data.health_goal as HealthGoal,
      diet_type: data.diet_type as DietType,
      activity_level: data.activity_level!,
      allergies: data.allergies,
      disliked_products: data.disliked_products
    };

    // Wywołanie API
    await createPreferences(dto);

    // Sukces: clear draft, redirect
    clearDraft();
    window.location.href = "/dashboard";
  } catch (error) {
    console.error("Submit error:", error);
    toast.error(error.message || "Nie udało się zapisać preferencji. Spróbuj ponownie.");
  }
};
```

## 8. Interakcje użytkownika

### 8.1. Wypełnianie formularza

| Akcja użytkownika | Reakcja systemu |
|-------------------|-----------------|
| Wybór health goal z dropdown | Wartość zapisana w state, trigger auto-save po 2s, błąd usunięty jeśli był |
| Wybór diet type z dropdown | Jak wyżej |
| Wybór activity level z dropdown | Jak wyżej |
| Zaznaczenie checkboxa alergii | Dodanie do tablicy allergies, aktualizacja countera, trigger auto-save |
| Zaznaczenie 10. alergii | Disable pozostałych niezaznaczonych checkboxów, pokazanie komunikatu limitu |
| Odznaczenie alergii (gdy limit) | Re-enable wszystkich checkboxów, ukrycie komunikatu |
| Wpisanie 2+ znaków w input produktów | Pokazanie dropdown z filtrowanymi sugestiami (max 10) |
| Wybór produktu z dropdown | Dodanie do disliked_products, wyświetlenie badge'a, wyczyszczenie inputu |
| Dodanie 20. produktu | Disable inputu, pokazanie komunikatu limitu |
| Kliknięcie X na badge produktu | Usunięcie z tablicy, re-enable inputu jeśli był disabled |
| Blur z pola | Walidacja tego pola, pokazanie błędu jeśli niepoprawne |
| Kliknięcie "Zapisz i wygeneruj plan" | Walidacja całego formularza → jeśli OK: submit API, jeśli błąd: pokazanie błędów + scroll do pierwszego |

### 8.2. Draft restoration

| Akcja użytkownika | Reakcja systemu |
|-------------------|-----------------|
| Wejście na /onboarding z istniejącym draftem | Pokazanie modala "Chcesz kontynuować wypełnianie?" |
| Kliknięcie "Kontynuuj" | Załadowanie draftu do formularza, zamknięcie modala |
| Kliknięcie "Zacznij od nowa" | Wyczyszczenie draftu z localStorage, zamknięcie modala, pusty formularz |
| Kliknięcie X (zamknięcie modala) | Domyślnie jak "Kontynuuj" |

### 8.3. Obsługa błędów API

| Typ błędu | Reakcja systemu |
|-----------|-----------------|
| 400 Validation Error | Toast z listą błędów walidacji, formularz pozostaje wypełniony |
| 401 Unauthorized | Redirect do /login |
| 409 Conflict | Toast "Preferencje już istnieją. Przejdź do profilu aby je edytować.", link do /profile |
| 500 Server Error | Toast "Nie udało się zapisać. Spróbuj ponownie.", przycisk retry aktywny |
| Network Error | Toast "Problem z połączeniem. Sprawdź internet.", przycisk retry aktywny |

## 9. Warunki i walidacja

### 9.1. Walidacja pól wymaganych

**Komponenty:** HealthGoalSelect, DietTypeSelect, ActivityLevelSelect

**Warunki:**
- Pole nie może być puste
- Wartość musi być jedną z dozwolonych opcji

**Weryfikacja:**
- Frontend: Zod schema w React Hook Form
- Moment: onBlur + onSubmit
- Komunikat błędu: "To pole jest wymagane"
- UI: Czerwona ramka wokół pola, komunikat błędu pod polem

### 9.2. Walidacja limitu alergii

**Komponent:** AllergyCheckboxGroup

**Warunki:**
- Maksymalnie 10 zaznaczonych alergii

**Weryfikacja:**
- Frontend: Disabled state na checkboxach + Zod schema
- Moment: Realtime przy każdym zaznaczeniu
- Komunikat: "Osiągnięto limit 10 alergii. Aby dodać nową, usuń istniejącą."
- UI: Disable niezaznaczonych checkboxów, pomarańczowy komunikat pod listą, counter "X/10"

### 9.3. Walidacja limitu produktów

**Komponent:** ProductCombobox

**Warunki:**
- Maksymalnie 20 dodanych produktów

**Weryfikacja:**
- Frontend: Disabled input + Zod schema
- Moment: Realtime przy każdym dodaniu produktu
- Komunikat: "Osiągnięto limit 20 produktów. Aby dodać nowy, usuń istniejący."
- UI: Disable input, pomarańczowy komunikat, counter "X/20"

### 9.4. Walidacja całego formularza (submit)

**Komponent:** PreferencesForm

**Warunki:**
- Wszystkie pola wymagane wypełnione
- activity_level w zakresie 1-5
- allergies max 10 elementów
- disliked_products max 20 elementów

**Weryfikacja:**
- Frontend: Zod schema przez React Hook Form
- Backend: Identyczna walidacja w API endpoint
- Moment: onSubmit
- Komunikat błędu: Dla każdego pola osobno
- UI: Scroll do pierwszego błędu, focus na nim, czerwone ramki, komunikaty błędów

### 9.5. Mapowanie błędów API na pola

```typescript
const handleApiError = (error: any) => {
  if (error.details && Array.isArray(error.details)) {
    // Parsowanie błędów z API i mapowanie na pola
    error.details.forEach((detail: string) => {
      if (detail.includes("health_goal")) {
        form.setError("health_goal", { message: detail });
      } else if (detail.includes("diet_type")) {
        form.setError("diet_type", { message: detail });
      } else if (detail.includes("activity_level")) {
        form.setError("activity_level", { message: detail });
      } else if (detail.includes("alergii")) {
        form.setError("allergies", { message: detail });
      } else if (detail.includes("produktów")) {
        form.setError("disliked_products", { message: detail });
      } else {
        // Ogólny błąd
        toast.error(detail);
      }
    });
  } else {
    toast.error(error.message || "Wystąpił błąd");
  }
};
```

## 10. Obsługa błędów

### 10.1. Błędy walidacji (Frontend)

**Scenariusz:** Użytkownik próbuje wysłać formularz z pustymi polami wymaganymi

**Obsługa:**
1. React Hook Form blokuje submit
2. Wyświetlenie błędów pod polami
3. Scroll do pierwszego błędu
4. Focus na pierwszym polu z błędem
5. Komunikaty po polsku: "To pole jest wymagane"

**Implementacja:**
```typescript
const onSubmit = async (data: PreferencesFormData) => {
  // React Hook Form automatycznie waliduje przed wywołaniem
  // Jeśli są błędy, onSubmit się nie wykona
};

// W JSX
{errors.health_goal && (
  <p className="text-sm text-red-500">{errors.health_goal.message}</p>
)}
```

### 10.2. Błędy walidacji (Backend)

**Scenariusz:** API zwraca 400 z listą błędów walidacji

**Obsługa:**
1. Parse odpowiedzi JSON
2. Mapowanie błędów na konkretne pola
3. Wyświetlenie błędów pod polami
4. Toast z ogólnym komunikatem
5. Formularz pozostaje wypełniony

**Implementacja:** Patrz sekcja 9.5

### 10.3. Błąd konfliktu (409)

**Scenariusz:** Użytkownik próbuje utworzyć preferencje drugi raz

**Obsługa:**
1. Toast: "Preferencje już istnieją. Przejdź do profilu aby je edytować."
2. Przycisk w toaście: "Przejdź do profilu" → redirect do `/profile`
3. Alternatywnie: automatyczny redirect do `/dashboard`

### 10.4. Błąd autoryzacji (401)

**Scenariusz:** Użytkownik nie jest zalogowany lub sesja wygasła

**Obsługa:**
1. Zapisanie draftu (jeśli jeszcze nie zapisany)
2. Redirect do `/login` z parametrem `?redirect=/onboarding`
3. Po zalogowaniu: powrót do onboardingu z załadowanym draftem

### 10.5. Błąd serwera (500)

**Scenariusz:** Wewnętrzny błąd serwera podczas zapisywania

**Obsługa:**
1. Toast: "Nie udało się zapisać preferencji. Spróbuj ponownie."
2. Przycisk "Spróbuj ponownie" w toaście lub w formularzu
3. Formularz pozostaje wypełniony
4. Draft zachowany w localStorage

### 10.6. Błąd sieci

**Scenariusz:** Brak połączenia z internetem

**Obsługa:**
1. Catch network error
2. Toast: "Problem z połączeniem. Sprawdź internet i spróbuj ponownie."
3. Przycisk retry
4. Draft zachowany

**Implementacja:**
```typescript
try {
  await createPreferences(dto);
} catch (error) {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    toast.error("Problem z połączeniem. Sprawdź internet i spróbuj ponownie.");
  } else {
    toast.error(error.message || "Nie udało się zapisać preferencji. Spróbuj ponownie.");
  }
}
```

### 10.7. LocalStorage niedostępny

**Scenariusz:** Przeglądarka blokuje localStorage (tryb prywatny, pełna pamięć)

**Obsługa:**
1. Try-catch wokół operacji localStorage
2. Błąd logowany do konsoli, ale nie pokazywany użytkownikowi
3. Aplikacja działa normalnie, tylko bez auto-save
4. Formularz nadal funkcjonalny

### 10.8. Plik products.json nie załadował się

**Scenariusz:** Błąd podczas importu lub parsowania products.json

**Obsługa:**
1. ProductCombobox wyświetla input, ale bez sugestii
2. Użytkownik może wpisać produkty ręcznie
3. Błąd logowany do konsoli
4. Opcjonalnie: komunikat "Sugestie produktów niedostępne"

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

```
src/
├── pages/
│   └── onboarding.astro
├── components/
│   └── preferences/
│       ├── PreferencesForm.tsx
│       ├── FormSection.tsx
│       ├── HealthGoalSelect.tsx
│       ├── DietTypeSelect.tsx
│       ├── ActivityLevelSelect.tsx
│       ├── AllergyCheckboxGroup.tsx
│       ├── ProductCombobox.tsx
│       ├── ProductBadge.tsx
│       ├── StickyFormFooter.tsx
│       └── DraftRestoreModal.tsx
├── lib/
│   ├── viewmodels/
│   │   └── preferences.viewmodel.ts
│   ├── api/
│   │   └── preferences.api.ts
│   └── schemas/
│       └── preferences.schema.ts (update)
├── hooks/
│   ├── useAutoSave.ts
│   ├── useDraftRestore.ts
│   └── useProducts.ts
└── data/
    └── products.json
```

### Krok 2: Utworzenie typów i viewmodels

1. Utworzyć `src/lib/viewmodels/preferences.viewmodel.ts`
2. Zdefiniować wszystkie interfejsy: `PreferencesFormData`, `HealthGoalOption`, `DietTypeOption`, `ActivityLevelOption`, `AllergyOption`, `Product`
3. Utworzyć tablice z opcjami: `healthGoalOptions`, `dietTypeOptions`, `activityLevelOptions`, `allergyOptions`
4. Zdefiniować `defaultPreferencesFormData`

### Krok 3: Utworzenie pliku products.json

1. Utworzyć `src/data/products.json`
2. Wypełnić listą ~100 popularnych polskich produktów
3. Format: `{ "products": [{ "name": "..." }, ...] }`

### Krok 4: Zaktualizowanie Zod schema

1. Sprawdzić `src/lib/schemas/preferences.schema.ts`
2. Upewnić się, że wszystkie walidacje są zgodne z wymaganiami:
   - health_goal required, enum
   - diet_type required, enum
   - activity_level required, number 1-5
   - allergies optional, max 10
   - disliked_products optional, max 20
3. Dodać komunikaty błędów po polsku

### Krok 5: Implementacja custom hooks

**5.1. useAutoSave**
1. Utworzyć `src/hooks/useAutoSave.ts`
2. Implementować debounced save do localStorage (2s delay)
3. Eksportować funkcję `clearDraft`

**5.2. useDraftRestore**
1. Utworzyć `src/hooks/useDraftRestore.ts`
2. Na mount: odczyt z localStorage
3. Jeśli draft istnieje: ustawić `showModal = true`
4. Eksportować: `draft`, `showModal`, `loadDraft`, `clearDraft`

**5.3. useProducts**
1. Utworzyć `src/hooks/useProducts.ts`
2. Zainstalować `fuse.js`: `npm install fuse.js`
3. Importować products.json
4. Implementować fuzzy search z Fuse.js
5. Eksportować: `products`, `filterProducts`

### Krok 6: Implementacja komponentów UI

**6.1. ProductBadge**
1. Utworzyć `src/components/preferences/ProductBadge.tsx`
2. Użyć `Badge` z shadcn/ui
3. Dodać button z ikoną X (z lucide-react)
4. Props: `product`, `onRemove`

**6.2. StickyFormFooter**
1. Utworzyć `src/components/preferences/StickyFormFooter.tsx`
2. Sticky positioning z Tailwind: `sticky bottom-0`
3. Background + border-top
4. Container z max-width
5. Props: `children`

**6.3. FormSection**
1. Utworzyć `src/components/preferences/FormSection.tsx`
2. Użyć `<fieldset>` + `<legend>`
3. Obsługa: title, subtitle, required (asterisk), error message
4. Props: `title`, `subtitle?`, `required?`, `error?`, `children`

**6.4. DraftRestoreModal**
1. Utworzyć `src/components/preferences/DraftRestoreModal.tsx`
2. Użyć `Dialog` z shadcn/ui
3. Dwa przyciski: "Kontynuuj" (primary), "Zacznij od nowa" (outline)
4. Props: `open`, `draftData`, `onContinue`, `onStartNew`, `onClose`

### Krok 7: Implementacja form fields

**7.1. HealthGoalSelect**
1. Utworzyć `src/components/preferences/HealthGoalSelect.tsx`
2. Użyć `Select` z shadcn/ui
3. Mapować `healthGoalOptions`
4. Props: `value`, `onChange`, `error?`
5. ARIA: `aria-required`, `aria-invalid`

**7.2. DietTypeSelect**
1. Analogicznie do HealthGoalSelect
2. Mapować `dietTypeOptions`

**7.3. ActivityLevelSelect**
1. Analogicznie, ale z opisami
2. Mapować `activityLevelOptions`
3. W SelectItem: wyświetlić label + description (dwie linie)
4. Konwersja number ↔ string dla Select value

**7.4. AllergyCheckboxGroup**
1. Utworzyć `src/components/preferences/AllergyCheckboxGroup.tsx`
2. Użyć `Checkbox` + `Label` z shadcn/ui
3. State: `selectedCount = value.length`
4. Logika disable: `!value.includes(option.value) && selectedCount >= 10`
5. Counter: "X/10 wybranych"
6. Komunikat limitu: conditional render gdy `selectedCount >= 10`
7. Obsługa "Inne": conditional input pod checkboxem
8. Props: `value`, `onChange`, `error?`

**7.5. ProductCombobox**
1. Utworzyć `src/components/preferences/ProductCombobox.tsx`
2. Użyć `Command` z shadcn/ui (Combobox pattern)
3. Hook: `const { filterProducts } = useProducts();`
4. State: `inputValue`, `filteredProducts`
5. Logika:
   - OnInputChange: filter products jeśli ≥2 znaki
   - OnSelect: dodaj do value, clear input
   - Disable input jeśli value.length >= 20
6. Wyświetlić badges: `value.map(product => <ProductBadge />)`
7. Counter: "X/20 produktów"
8. Komunikat limitu: conditional render
9. Props: `value`, `onChange`, `error?`

### Krok 8: Implementacja głównego formularza

**8.1. PreferencesForm - Setup**
1. Utworzyć `src/components/preferences/PreferencesForm.tsx`
2. Importy: React Hook Form, Zod resolver, wszystkie subkomponenty
3. Setup form:
```typescript
const form = useForm<PreferencesFormData>({
  resolver: zodResolver(CreatePreferencesSchema),
  defaultValues: defaultPreferencesFormData,
  mode: "onBlur"
});
```

**8.2. PreferencesForm - Draft restoration**
1. Hook: `const { draft, showModal, loadDraft, clearDraft } = useDraftRestore();`
2. Efekt: jeśli user akceptuje draft, załadować do formularza:
```typescript
const handleContinue = () => {
  const draftData = loadDraft();
  if (draftData) {
    Object.entries(draftData).forEach(([key, value]) => {
      form.setValue(key, value);
    });
  }
};
```

**8.3. PreferencesForm - Auto-save**
1. Hook: `const { clearDraft: clearAutoSave } = useAutoSave(form.watch(), true);`
2. Auto-save triggerowany automatycznie przy zmianach

**8.4. PreferencesForm - Submit handler**
1. Implementować `onSubmit`:
```typescript
const onSubmit = async (data: PreferencesFormData) => {
  try {
    const dto: CreateUserPreferencesDTO = {
      health_goal: data.health_goal as HealthGoal,
      diet_type: data.diet_type as DietType,
      activity_level: data.activity_level!,
      allergies: data.allergies,
      disliked_products: data.disliked_products
    };
    
    await createPreferences(dto);
    clearAutoSave();
    window.location.href = "/dashboard";
  } catch (error) {
    handleApiError(error);
  }
};
```

**8.5. PreferencesForm - JSX**
1. Render form z wszystkimi sekcjami
2. Każda sekcja w `<FormSection>`
3. Każde pole podpięte do React Hook Form
4. Error messages z `form.formState.errors`
5. Submit button w `<StickyFormFooter>`

### Krok 9: Implementacja API client

1. Utworzyć `src/lib/api/preferences.api.ts`
2. Funkcja `createPreferences`:
   - POST `/api/preferences`
   - Content-Type: application/json
   - Body: CreateUserPreferencesDTO
   - Return: UserPreferencesDTO
   - Error handling: throw Error z message

### Krok 10: Utworzenie strony Astro

**10.1. onboarding.astro - Middleware check**
1. Utworzyć `src/pages/onboarding.astro`
2. W frontmatter:
   - Sprawdzić czy użytkownik zalogowany (middleware)
   - Jeśli nie → redirect `/login`
   - Sprawdzić czy użytkownik ma już preferencje (GET /api/preferences)
   - Jeśli tak → redirect `/dashboard`

**10.2. onboarding.astro - Layout**
1. Użyć `<Layout>` z title
2. Header z tytułem i subtitle
3. `<PreferencesForm client:load />` (hydration directive!)
4. Responsive styling

### Krok 11: Stylowanie i responsywność

1. Wszystkie komponenty z Tailwind classes
2. Mobile-first approach
3. Sprawdzić:
   - Single column na mobile
   - Sticky footer działa
   - Touch targets ≥44px
   - Form readable na małych ekranach
   - Combobox dropdown nie wychodzi poza ekran
4. Testy na rzeczywistych urządzeniach

### Krok 12: Accessibility

1. Sprawdzić wszystkie ARIA attributes:
   - `aria-required` na wymaganych polach
   - `aria-invalid` na polach z błędami
   - `aria-describedby` dla error messages
   - `aria-label` na button X w badge
2. Keyboard navigation:
   - Tab przez wszystkie pola
   - Arrow keys w Select
   - Enter/Space w Checkbox
   - Escape zamyka combobox
3. Screen reader testing (opcjonalnie)
4. Focus management:
   - Pierwszy błąd otrzymuje focus po submicie
   - Modal otrzymuje focus po otwarciu
5. Color contrast (min WCAG AA)

### Krok 13: Testy manualne

**13.1. Happy path**
1. Otworzyć `/onboarding`
2. Wypełnić wszystkie wymagane pola
3. Dodać 2 alergie
4. Dodać 5 produktów nielubanych
5. Kliknąć "Zapisz i wygeneruj plan"
6. Sprawdzić redirect do `/dashboard`
7. Sprawdzić w DevTools Network: POST request success
8. Sprawdzić localStorage: draft usunięty

**13.2. Draft restoration**
1. Zacząć wypełniać formularz
2. Odczekać 2s (auto-save)
3. Odświeżyć stronę
4. Sprawdzić czy modal się pokazał
5. Kliknąć "Kontynuuj" → dane załadowane
6. Odświeżyć ponownie, kliknąć "Zacznij od nowa" → pusty formularz

**13.3. Walidacja - pola wymagane**
1. Kliknąć "Zapisz" bez wypełniania
2. Sprawdzić błędy pod polami
3. Sprawdzić scroll do pierwszego błędu
4. Sprawdzić focus na pierwszym polu

**13.4. Walidacja - limity**
1. Zaznacz 10 alergii → sprawdzić disable
2. Spróbować zaznaczyć 11. → niemożliwe
3. Odznaczyć jedną → sprawdzić enable
4. Dodać 20 produktów → sprawdzić disable input
5. Usunąć jeden → sprawdzić enable input

**13.5. Autocomplete**
1. Wpisać 1 znak → brak sugestii
2. Wpisać 2 znaki → sugestie się pokazują
3. Wybrać z listy → badge się pojawia
4. Sprawdzić fuzzy search (np. "broku" → "Brokuły")

**13.6. Błędy API**
1. Wysłać drugi raz (jeśli możliwe) → sprawdzić 409
2. Wylogować się, spróbować wysłać → sprawdzić 401
3. Symulować network error (offline) → sprawdzić komunikat
4. Symulować 500 (modyfikacja backend) → sprawdzić toast

**13.7. Mobile**
1. Otworzyć na telefonie
2. Sprawdzić responsywność
3. Sprawdzić sticky footer
4. Sprawdzić touch targets
5. Sprawdzić combobox dropdown

### Krok 14: Optymalizacje

1. **Performance:**
   - Lazy loading dla modala (dynamic import)
   - Memoizacja filteredProducts w ProductCombobox
   - Debounce autocomplete input (100-200ms)

2. **Bundle size:**
   - Tree-shaking: importować tylko używane ikony z lucide-react
   - Sprawdzić czy fuse.js nie za duży (alternatywa: native filter)

3. **UX:**
   - Loading state na przycisku submit
   - Disabled state gdy isSubmitting
   - Toast na sukces (opcjonalnie)
   - Progress indicator (opcjonalnie)

### Krok 15: Dokumentacja i cleanup

1. Dodać JSDoc comments do komponentów
2. Dodać README w folderze components/preferences
3. Usunąć console.log (oprócz error logs)
4. Code review
5. Commit z opisem: "feat: implement onboarding preferences form"

### Krok 16: Integracja z resztą aplikacji

1. Sprawdzić flow rejestracji → onboarding
2. Sprawdzić middleware protection
3. Sprawdzić redirect do dashboard
4. Sprawdzić czy dashboard triggeruje generowanie planu (to oddzielne zadanie)
5. Dodać link do onboardingu w nawigacji (jeśli potrzebne)

---

## Podsumowanie

Plan implementacji obejmuje:
- **11 komponentów React** (od atomowych jak ProductBadge po złożone jak PreferencesForm)
- **3 custom hooki** (auto-save, draft restore, products)
- **Kompleksową walidację** (frontend + backend, real-time + on-submit)
- **Draft system** z localStorage i modal restoration
- **Autocomplete** z fuzzy search
- **Accessibility** (ARIA, keyboard, screen readers)
- **Responsywność** (mobile-first)
- **Error handling** dla wszystkich scenariuszy
- **API integration** z typowaniem TypeScript

Szacowany czas implementacji: **12-16 godzin** dla doświadczonego frontend developera.

Priorytet w implementacji: Kroki 1-10 (core functionality) → Krok 11-12 (polish) → Krok 13-16 (testing & integration).

