# Plan implementacji widoku Rejestracji

## 1. Przegląd

Widok rejestracji (`/register`) umożliwia nowym użytkownikom założenie konta w aplikacji AI Meal Planner. Jest to pierwszy krok w procesie onboardingu użytkownika. Po pomyślnej rejestracji użytkownik jest automatycznie logowany i przekierowywany do formularza preferencji (`/onboarding`).

**Główne cele:**
- Umożliwienie nowym użytkownikom założenia konta
- Walidacja danych w czasie rzeczywistym (na zdarzeniu blur)
- Zapewnienie dostępności i bezpieczeństwa
- Płynne przejście do procesu onboardingu

## 2. Routing widoku

**Ścieżka:** `/register`

**Typ widoku:** Publiczny (dostępny tylko dla niezalogowanych użytkowników)

**Przekierowania:**
- Po sukcesie rejestracji → `/onboarding`
- Link do logowania → `/login`
- Jeśli użytkownik jest już zalogowany → `/dashboard`

**Implementacja:** 
- Plik Astro: `src/pages/register.astro`
- Główny komponent React: `src/components/auth/RegisterForm.tsx`

## 3. Struktura komponentów

```
RegisterPage (Astro - src/pages/register.astro)
└── Layout
    └── RegisterForm (React - src/components/auth/RegisterForm.tsx)
        ├── Heading
        ├── Form
        │   ├── EmailField
        │   │   ├── Label
        │   │   ├── Input (shadcn/ui)
        │   │   └── ErrorMessage
        │   ├── PasswordField
        │   │   ├── Label
        │   │   ├── Input (shadcn/ui) + Toggle visibility button
        │   │   ├── HelperText ("Minimum 8 znaków")
        │   │   └── ErrorMessage
        │   └── PasswordConfirmationField
        │       ├── Label
        │       ├── Input (shadcn/ui)
        │       └── ErrorMessage
        ├── Button (shadcn/ui) - Submit
        ├── GeneralErrorMessage (Toast lub Alert)
        └── LoginLink
```

## 4. Szczegóły komponentów

### RegisterPage (Astro)

**Opis komponentu:**
Strona Astro służąca jako wrapper dla komponentu RegisterForm. Odpowiada za layout, SEO meta tags i sprawdzenie czy użytkownik nie jest już zalogowany.

**Główne elementy:**
- `<Layout>` - główny layout aplikacji
- `<RegisterForm client:load>` - komponent React z dyrektywą client:load dla interaktywności
- Meta tags (title, description)
- Middleware sprawdzający sesję użytkownika

**Obsługiwane zdarzenia:**
- Brak (logika jest w komponencie React)

**Warunki walidacji:**
- Brak (walidacja w komponencie React)

**Typy:**
- Brak specyficznych typów

**Propsy:**
- Brak (strona Astro)

---

### RegisterForm (React)

**Opis komponentu:**
Główny komponent formularza rejestracji zawierający całą logikę walidacji, komunikacji z Supabase Auth oraz zarządzanie stanem formularza. Komponent jest w pełni kontrolowany (controlled component) i obsługuje walidację na zdarzeniu blur.

**Główne elementy:**
- `<form>` - główny element formularza z obsługą onSubmit
- `<h1>` lub `<h2>` - nagłówek "Zarejestruj się"
- Trzy pola formularza (email, hasło, potwierdzenie hasła)
- Przycisk submit z loading state
- Link do strony logowania
- Toast notification dla błędów globalnych

**Obsługiwane zdarzenia:**
- `onSubmit` - obsługa wysyłki formularza
- `onChange` - aktualizacja stanu pól formularza
- `onBlur` - walidacja pola po utracie focusa
- `onPasswordToggle` - przełączanie widoczności hasła

**Warunki walidacji:**
1. **Email:**
   - Pole wymagane (nie może być puste)
   - Poprawny format email (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
   
2. **Hasło:**
   - Pole wymagane (nie może być puste)
   - Minimum 8 znaków długości
   
3. **Potwierdzenie hasła:**
   - Pole wymagane (nie może być puste)
   - Musi być identyczne z polem "Hasło"

**Typy:**
- `RegisterFormData` - dane formularza
- `ValidationErrors` - błędy walidacji
- `RegisterFormState` - stan komponentu

**Propsy:**
- Brak (root component)

---

### EmailField (część RegisterForm)

**Opis komponentu:**
Pole do wprowadzania adresu email z etykietą, inputem i komunikatem błędu.

**Główne elementy:**
- `<Label htmlFor="email">` - etykieta "Email"
- `<Input type="email" id="email" name="email">` - pole input z shadcn/ui
- `<p className="error-message">` - komunikat błędu (warunkowo renderowany)

**Obsługiwane zdarzenia:**
- `onChange` - aktualizacja wartości email w stanie
- `onBlur` - walidacja formatu email

**Warunki walidacji:**
- Walidacja uruchamiana na blur
- Sprawdzenie czy pole nie jest puste
- Sprawdzenie czy email ma poprawny format
- Komunikaty błędów:
  - Puste pole: "Email jest wymagany"
  - Niepoprawny format: "Podaj prawidłowy adres email"

**Typy:**
- `value: string`
- `error: string | undefined`

**Propsy:**
- `value: string` - wartość pola
- `onChange: (value: string) => void` - handler zmiany wartości
- `onBlur: () => void` - handler utraty focusa
- `error?: string` - komunikat błędu do wyświetlenia
- `autoFocus?: boolean` - czy pole ma mieć autofocus

---

### PasswordField (część RegisterForm)

**Opis komponentu:**
Pole do wprowadzania hasła z możliwością przełączania widoczności, helper textem informującym o wymaganiach oraz komunikatem błędu.

**Główne elementy:**
- `<Label htmlFor="password">` - etykieta "Hasło"
- `<div className="input-wrapper">` - wrapper dla inputa i przycisku toggle
  - `<Input type={showPassword ? "text" : "password"} id="password">` - pole input
  - `<Button variant="ghost" onClick={togglePassword}>` - przycisk z ikoną oka
- `<p className="helper-text">` - tekst pomocniczy "Minimum 8 znaków"
- `<p className="error-message">` - komunikat błędu (warunkowo)

**Obsługiwane zdarzenia:**
- `onChange` - aktualizacja wartości hasła w stanie
- `onBlur` - walidacja długości hasła
- `onClick` (toggle button) - przełączanie widoczności hasła

**Warunki walidacji:**
- Walidacja uruchamiana na blur
- Sprawdzenie czy pole nie jest puste
- Sprawdzenie czy hasło ma minimum 8 znaków
- Komunikaty błędów:
  - Puste pole: "Hasło jest wymagane"
  - Za krótkie: "Hasło musi mieć minimum 8 znaków"

**Typy:**
- `value: string`
- `error: string | undefined`
- `showPassword: boolean`

**Propsy:**
- `value: string` - wartość pola
- `onChange: (value: string) => void` - handler zmiany wartości
- `onBlur: () => void` - handler utraty focusa
- `error?: string` - komunikat błędu
- `showPassword: boolean` - czy hasło jest widoczne
- `onTogglePassword: () => void` - handler przełączania widoczności

---

### PasswordConfirmationField (część RegisterForm)

**Opis komponentu:**
Pole do potwierdzenia hasła z etykietą, inputem i komunikatem błędu.

**Główne elementy:**
- `<Label htmlFor="passwordConfirmation">` - etykieta "Powtórz hasło"
- `<Input type="password" id="passwordConfirmation">` - pole input
- `<p className="error-message">` - komunikat błędu (warunkowo)

**Obsługiwane zdarzenia:**
- `onChange` - aktualizacja wartości w stanie
- `onBlur` - walidacja zgodności z hasłem

**Warunki walidacji:**
- Walidacja uruchamiana na blur
- Sprawdzenie czy pole nie jest puste
- Sprawdzenie czy wartość jest identyczna z polem hasła
- Komunikaty błędów:
  - Puste pole: "Potwierdzenie hasła jest wymagane"
  - Niezgodność: "Hasła muszą być identyczne"

**Typy:**
- `value: string`
- `error: string | undefined`

**Propsy:**
- `value: string` - wartość pola
- `onChange: (value: string) => void` - handler zmiany wartości
- `onBlur: () => void` - handler utraty focusa
- `error?: string` - komunikat błędu

---

### SubmitButton (shadcn/ui Button)

**Opis komponentu:**
Przycisk submit formularza z loading state (spinner) podczas wysyłki danych.

**Główne elementy:**
- `<Button type="submit" disabled={isLoading || hasErrors}>` - przycisk z shadcn/ui
- Loading spinner (warunkowo renderowany)
- Tekst "Zarejestruj się" lub "Rejestracja..." podczas ładowania

**Obsługiwane zdarzenia:**
- `onClick` - domyślna obsługa submit formularza

**Warunki walidacji:**
- Przycisk disabled gdy:
  - `isLoading === true` (trwa rejestracja)
  - Istnieją błędy walidacji w formularzu
  - Nie wszystkie wymagane pola są wypełnione

**Typy:**
- `isLoading: boolean`
- `disabled: boolean`

**Propsy:**
- `isLoading: boolean` - czy trwa proces rejestracji
- `disabled: boolean` - czy przycisk ma być wyłączony

---

### LoginLink

**Opis komponentu:**
Link do strony logowania dla użytkowników, którzy już mają konto.

**Główne elementy:**
- `<p>` - tekst "Masz już konto?"
- `<a href="/login">` - link "Zaloguj się"

**Obsługiwane zdarzenia:**
- `onClick` - nawigacja do `/login`

**Warunki walidacji:**
- Brak

**Typy:**
- Brak specyficznych typów

**Propsy:**
- Brak

## 5. Typy

### RegisterFormData

Interfejs reprezentujący dane formularza rejestracji.

```typescript
interface RegisterFormData {
  /** Adres email użytkownika */
  email: string;
  /** Hasło użytkownika (minimum 8 znaków) */
  password: string;
  /** Potwierdzenie hasła (musi być identyczne z password) */
  passwordConfirmation: string;
}
```

---

### ValidationErrors

Interfejs reprezentujący błędy walidacji dla każdego pola formularza oraz błędy globalne.

```typescript
interface ValidationErrors {
  /** Błąd walidacji pola email */
  email?: string;
  /** Błąd walidacji pola hasło */
  password?: string;
  /** Błąd walidacji pola potwierdzenie hasła */
  passwordConfirmation?: string;
  /** Błąd globalny (np. błąd API) */
  general?: string;
}
```

---

### RegisterFormState

Interfejs reprezentujący pełny stan komponentu RegisterForm.

```typescript
interface RegisterFormState {
  /** Dane formularza */
  formData: RegisterFormData;
  /** Błędy walidacji */
  errors: ValidationErrors;
  /** Czy trwa proces rejestracji */
  isLoading: boolean;
  /** Czy hasło jest widoczne */
  showPassword: boolean;
  /** Czy potwierdzenie hasła jest widoczne */
  showPasswordConfirmation: boolean;
  /** Czy formularz został dotknięty (touched fields) */
  touched: {
    email: boolean;
    password: boolean;
    passwordConfirmation: boolean;
  };
}
```

---

### AuthError (z Supabase)

Typ błędu zwracanego przez Supabase Auth.

```typescript
import type { AuthError } from '@supabase/supabase-js';

// Używane do obsługi błędów z Supabase Auth API
```

## 6. Zarządzanie stanem

### Stan lokalny komponentu RegisterForm

Komponent RegisterForm wykorzystuje React hooks do zarządzania stanem:

**useState hooks:**

1. **formData** - przechowuje wartości wszystkich pól formularza
   ```typescript
   const [formData, setFormData] = useState<RegisterFormData>({
     email: '',
     password: '',
     passwordConfirmation: ''
   });
   ```

2. **errors** - przechowuje błędy walidacji dla każdego pola
   ```typescript
   const [errors, setErrors] = useState<ValidationErrors>({});
   ```

3. **isLoading** - śledzi czy trwa proces rejestracji
   ```typescript
   const [isLoading, setIsLoading] = useState<boolean>(false);
   ```

4. **showPassword** - kontroluje widoczność hasła
   ```typescript
   const [showPassword, setShowPassword] = useState<boolean>(false);
   ```

5. **showPasswordConfirmation** - kontroluje widoczność potwierdzenia hasła
   ```typescript
   const [showPasswordConfirmation, setShowPasswordConfirmation] = useState<boolean>(false);
   ```

6. **touched** - śledzi które pola zostały dotknięte przez użytkownika (dla warunkowego pokazywania błędów)
   ```typescript
   const [touched, setTouched] = useState({
     email: false,
     password: false,
     passwordConfirmation: false
   });
   ```

### Funkcje pomocnicze w komponencie

**handleInputChange** - aktualizuje wartość pola w formData
```typescript
const handleInputChange = (field: keyof RegisterFormData, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

**handleBlur** - oznacza pole jako touched i uruchamia walidację
```typescript
const handleBlur = (field: keyof RegisterFormData) => {
  setTouched(prev => ({ ...prev, [field]: true }));
  validateField(field, formData[field]);
};
```

**validateField** - waliduje pojedyncze pole
```typescript
const validateField = (field: keyof RegisterFormData, value: string): string | undefined => {
  // Logika walidacji per pole
};
```

**validateForm** - waliduje cały formularz przed submitem
```typescript
const validateForm = (): boolean => {
  // Walidacja wszystkich pól
  // Zwraca true jeśli formularz jest poprawny
};
```

**togglePasswordVisibility** - przełącza widoczność hasła
```typescript
const togglePasswordVisibility = (field: 'password' | 'passwordConfirmation') => {
  if (field === 'password') {
    setShowPassword(prev => !prev);
  } else {
    setShowPasswordConfirmation(prev => !prev);
  }
};
```

### Custom Hook (opcjonalnie dla przyszłości)

W MVP nie jest wymagany custom hook, ale dla lepszej organizacji kodu można stworzyć:

**useRegister** (src/hooks/useRegister.ts)
- Enkapsuluje logikę rejestracji
- Zwraca: { register, isLoading, error }
- Upraszcza komponent RegisterForm

## 7. Integracja API

### Endpoint: Supabase Auth - signUp

Rejestracja użytkownika jest obsługiwana przez Supabase Auth API, które dostarcza gotową metodę `signUp`.

**Metoda:** `supabase.auth.signUp()`

**Typ żądania:**
```typescript
{
  email: string;
  password: string;
}
```

**Typ odpowiedzi (sukces):**
```typescript
{
  data: {
    user: User | null;
    session: Session | null;
  };
  error: null;
}
```

**Typ odpowiedzi (błąd):**
```typescript
{
  data: {
    user: null;
    session: null;
  };
  error: AuthError;
}
```

### Implementacja wywołania API

**Lokalizacja:** `src/components/auth/RegisterForm.tsx`

**Kod:**
```typescript
import { supabase } from '@/db/supabase.client';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Walidacja formularza
  if (!validateForm()) {
    return;
  }
  
  setIsLoading(true);
  setErrors({}); // Wyczyść poprzednie błędy
  
  try {
    // Wywołanie Supabase Auth API
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });
    
    if (error) {
      // Obsługa błędów Supabase
      handleAuthError(error);
      return;
    }
    
    // Sukces - użytkownik jest automatycznie zalogowany przez Supabase
    // Przekierowanie do onboardingu
    window.location.href = '/onboarding';
    
  } catch (error) {
    // Obsługa błędów sieciowych
    setErrors({
      general: 'Wystąpił błąd. Spróbuj ponownie za chwilę.'
    });
  } finally {
    setIsLoading(false);
  }
};
```

### Obsługa błędów API

**Funkcja handleAuthError:**
```typescript
const handleAuthError = (error: AuthError) => {
  let errorMessage = 'Wystąpił błąd. Spróbuj ponownie.';
  
  // Mapowanie błędów Supabase na komunikaty użytkownika
  if (error.message.includes('already registered')) {
    errorMessage = 'Ten adres email jest już zajęty';
  } else if (error.message.includes('network')) {
    errorMessage = 'Sprawdź połączenie internetowe i spróbuj ponownie';
  } else if (error.status === 500) {
    errorMessage = 'Wystąpił błąd serwera. Spróbuj ponownie za chwilę';
  }
  
  setErrors({ general: errorMessage });
  
  // Wyświetl toast notification
  toast.error(errorMessage);
};
```

## 8. Interakcje użytkownika

### 1. Wypełnianie pola Email

**Akcja użytkownika:** Kliknięcie w pole email i wpisanie adresu

**Reakcja systemu:**
- `onChange` - aktualizacja `formData.email`
- Brak walidacji podczas wpisywania (nie irytujemy użytkownika)

**Po utracie focusa (onBlur):**
- Pole oznaczane jako `touched.email = true`
- Walidacja formatu email
- Jeśli błąd: wyświetlenie komunikatu pod polem
- Jeśli poprawne: usunięcie błędu (jeśli był)

---

### 2. Wypełnianie pola Hasło

**Akcja użytkownika:** Kliknięcie w pole hasło i wpisanie hasła

**Reakcja systemu:**
- `onChange` - aktualizacja `formData.password`
- Wyświetlanie znaków jako kropki (type="password")

**Po utracie focusa (onBlur):**
- Pole oznaczane jako `touched.password = true`
- Walidacja długości hasła (minimum 8 znaków)
- Jeśli błąd: wyświetlenie komunikatu pod polem
- Jeśli poprawne: usunięcie błędu

---

### 3. Przełączanie widoczności hasła

**Akcja użytkownika:** Kliknięcie ikony oka obok pola hasła

**Reakcja systemu:**
- Toggle `showPassword` state
- Zmiana type inputa z "password" na "text" (lub odwrotnie)
- Zmiana ikony oka (eye → eye-off)
- Hasło staje się widoczne/ukryte

---

### 4. Wypełnianie pola Potwierdzenie hasła

**Akcja użytkownika:** Kliknięcie w pole potwierdzenia i wpisanie hasła

**Reakcja systemu:**
- `onChange` - aktualizacja `formData.passwordConfirmation`

**Po utracie focusa (onBlur):**
- Pole oznaczane jako `touched.passwordConfirmation = true`
- Walidacja zgodności z polem hasło
- Jeśli błąd: wyświetlenie komunikatu "Hasła muszą być identyczne"
- Jeśli poprawne: usunięcie błędu

---

### 5. Wysłanie formularza

**Akcja użytkownika:** Kliknięcie przycisku "Zarejestruj się" lub naciśnięcie Enter

**Reakcja systemu:**

**Przed wysłaniem:**
1. Sprawdzenie czy wszystkie pola są wypełnione
2. Uruchomienie pełnej walidacji formularza
3. Jeśli błędy: wyświetlenie wszystkich komunikatów, brak wysyłki

**Podczas wysyłki:**
1. Ustawienie `isLoading = true`
2. Wyłączenie przycisku submit
3. Wyświetlenie spinnera i tekstu "Rejestracja..."
4. Wywołanie `supabase.auth.signUp()`

**Po sukcesie:**
1. Użytkownik automatycznie zalogowany (Supabase)
2. Przekierowanie na `/onboarding`
3. Opcjonalnie: toast "Witaj w AI Meal Planner!"

**Po błędzie:**
1. Ustawienie `isLoading = false`
2. Włączenie przycisku submit
3. Wyświetlenie komunikatu błędu:
   - Email już istnieje → "Ten adres email jest już zajęty"
   - Błąd sieci → "Sprawdź połączenie internetowe..."
   - Błąd serwera → "Wystąpił błąd. Spróbuj ponownie..."
4. Toast notification z błędem

---

### 6. Kliknięcie linku "Zaloguj się"

**Akcja użytkownika:** Kliknięcie linku "Masz już konto? Zaloguj się"

**Reakcja systemu:**
- Nawigacja do `/login`
- Dane formularza nie są zapisywane (użytkownik jednak ma już konto)

## 9. Warunki i walidacja

### Walidacja pola Email

**Komponent:** EmailField (w RegisterForm)

**Kiedy uruchamiana:** 
- onBlur (po utracie focusa)
- onSubmit (przed wysłaniem formularza)

**Warunki:**
1. **Pole wymagane:**
   - Warunek: `email.trim() === ''`
   - Komunikat: "Email jest wymagany"
   - Wpływ na UI: Czerwona ramka wokół inputa, komunikat błędu pod polem

2. **Poprawny format:**
   - Warunek: `!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)`
   - Komunikat: "Podaj prawidłowy adres email"
   - Wpływ na UI: Czerwona ramka, komunikat błędu

**Implementacja:**
```typescript
const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) {
    return 'Email jest wymagany';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Podaj prawidłowy adres email';
  }
  
  return undefined;
};
```

---

### Walidacja pola Hasło

**Komponent:** PasswordField (w RegisterForm)

**Kiedy uruchamiana:**
- onBlur
- onSubmit

**Warunki:**
1. **Pole wymagane:**
   - Warunek: `password.trim() === ''`
   - Komunikat: "Hasło jest wymagane"
   - Wpływ na UI: Czerwona ramka, komunikat błędu

2. **Minimalna długość:**
   - Warunek: `password.length < 8`
   - Komunikat: "Hasło musi mieć minimum 8 znaków"
   - Wpływ na UI: Czerwona ramka, komunikat błędu
   - Helper text zawsze widoczny: "Minimum 8 znaków"

**Implementacja:**
```typescript
const validatePassword = (password: string): string | undefined => {
  if (!password.trim()) {
    return 'Hasło jest wymagane';
  }
  
  if (password.length < 8) {
    return 'Hasło musi mieć minimum 8 znaków';
  }
  
  return undefined;
};
```

---

### Walidacja pola Potwierdzenie hasła

**Komponent:** PasswordConfirmationField (w RegisterForm)

**Kiedy uruchamiana:**
- onBlur
- onSubmit
- Kiedy zmienia się wartość pola hasło (rewalidacja)

**Warunki:**
1. **Pole wymagane:**
   - Warunek: `passwordConfirmation.trim() === ''`
   - Komunikat: "Potwierdzenie hasła jest wymagane"
   - Wpływ na UI: Czerwona ramka, komunikat błędu

2. **Zgodność z hasłem:**
   - Warunek: `passwordConfirmation !== password`
   - Komunikat: "Hasła muszą być identyczne"
   - Wpływ na UI: Czerwona ramka, komunikat błędu

**Implementacja:**
```typescript
const validatePasswordConfirmation = (
  password: string, 
  passwordConfirmation: string
): string | undefined => {
  if (!passwordConfirmation.trim()) {
    return 'Potwierdzenie hasła jest wymagane';
  }
  
  if (passwordConfirmation !== password) {
    return 'Hasła muszą być identyczne';
  }
  
  return undefined;
};
```

---

### Walidacja formularza (przed submitem)

**Komponent:** RegisterForm

**Kiedy uruchamiana:**
- onSubmit (przed wywołaniem API)

**Proces:**
1. Walidacja wszystkich pól jednocześnie
2. Zbieranie wszystkich błędów do obiektu `ValidationErrors`
3. Jeśli jakiekolwiek błędy: zatrzymanie submitu, wyświetlenie wszystkich błędów
4. Jeśli brak błędów: przejście do wywołania API

**Implementacja:**
```typescript
const validateForm = (): boolean => {
  const newErrors: ValidationErrors = {};
  
  const emailError = validateEmail(formData.email);
  if (emailError) newErrors.email = emailError;
  
  const passwordError = validatePassword(formData.password);
  if (passwordError) newErrors.password = passwordError;
  
  const confirmError = validatePasswordConfirmation(
    formData.password, 
    formData.passwordConfirmation
  );
  if (confirmError) newErrors.passwordConfirmation = confirmError;
  
  setErrors(newErrors);
  
  // Oznacz wszystkie pola jako touched
  setTouched({
    email: true,
    password: true,
    passwordConfirmation: true
  });
  
  return Object.keys(newErrors).length === 0;
};
```

---

### Stan przycisku Submit

**Warunek wyłączenia:**
```typescript
const isSubmitDisabled = 
  isLoading || 
  !formData.email || 
  !formData.password || 
  !formData.passwordConfirmation;
```

**Wpływ na UI:**
- Przycisk disabled (szary, niedostępny)
- Cursor: not-allowed
- Brak reakcji na kliknięcie

## 10. Obsługa błędów

### 1. Błędy walidacji

**Typ:** Client-side validation errors

**Kiedy występują:** Podczas wypełniania formularza (onBlur) lub przed submitem

**Obsługa:**
- Wyświetlenie czerwonej ramki wokół pola
- Komunikat błędu pod polem (aria-describedby dla dostępności)
- Ikona błędu obok pola (opcjonalnie)
- Fokus na pierwszym polu z błędem po próbie submitu
- Przycisk submit pozostaje aktywny (użytkownik może spróbować ponownie)

**Przykładowe komunikaty:**
- "Email jest wymagany"
- "Podaj prawidłowy adres email"
- "Hasło jest wymagane"
- "Hasło musi mieć minimum 8 znaków"
- "Hasła muszą być identyczne"

---

### 2. Email już zarejestrowany

**Typ:** API error (Supabase Auth)

**Kiedy występuje:** Po wywołaniu signUp, gdy email już istnieje w bazie

**Wykrywanie:**
```typescript
if (error?.message.includes('already registered') || 
    error?.message.includes('User already registered')) {
  // Email już istnieje
}
```

**Obsługa:**
1. Ustawienie `isLoading = false`
2. Wyświetlenie komunikatu: "Ten adres email jest już zajęty"
3. Toast notification z błędem (czerwony toast)
4. Wyczyszczenie pól hasło i potwierdzenie hasła
5. Fokus na polu email
6. Link do strony logowania: "Może chcesz się zalogować?"

---

### 3. Błąd sieci

**Typ:** Network error

**Kiedy występuje:** Brak połączenia z internetem lub timeout

**Wykrywanie:**
```typescript
if (error?.message.includes('network') || 
    error?.message.includes('fetch')) {
  // Błąd sieci
}
```

**Obsługa:**
1. Ustawienie `isLoading = false`
2. Komunikat: "Sprawdź połączenie internetowe i spróbuj ponownie"
3. Toast notification
4. Przycisk submit aktywny (możliwość ponownej próby)
5. Dane formularza zachowane (nie czyścimy)

---

### 4. Błąd serwera (500)

**Typ:** Server error

**Kiedy występuje:** Problem po stronie Supabase lub serwera

**Wykrywanie:**
```typescript
if (error?.status === 500 || error?.status >= 500) {
  // Błąd serwera
}
```

**Obsługa:**
1. Ustawienie `isLoading = false`
2. Komunikat: "Wystąpił błąd. Spróbuj ponownie za chwilę"
3. Toast notification
4. Opcjonalnie: logowanie błędu do systemu monitoringu
5. Dane formularza zachowane

---

### 5. Nieoczekiwany błąd

**Typ:** Unexpected error

**Kiedy występuje:** Jakikolwiek inny błąd nie złapany wcześniej

**Obsługa:**
1. Catch w try-catch bloku
2. Komunikat ogólny: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie"
3. Toast notification
4. Logowanie pełnego błędu do konsoli (development) lub systemu monitoringu (production)
5. Dane formularza zachowane

```typescript
try {
  // Rejestracja
} catch (error) {
  console.error('Registration error:', error);
  setErrors({
    general: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie'
  });
  toast.error('Wystąpił nieoczekiwany błąd');
}
```

---

### 6. Timeout

**Typ:** Request timeout

**Kiedy występuje:** Request do Supabase trwa zbyt długo (>30s)

**Obsługa:**
1. Implementacja timeoutu w wywołaniu API
2. Komunikat: "Żądanie trwa zbyt długo. Sprawdź połączenie i spróbuj ponownie"
3. Automatyczne anulowanie requesta
4. Możliwość ponownej próby

```typescript
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('timeout')), 30000);
});

try {
  const result = await Promise.race([
    supabase.auth.signUp({ email, password }),
    timeoutPromise
  ]);
} catch (error) {
  if (error.message === 'timeout') {
    setErrors({
      general: 'Żądanie trwa zbyt długo. Sprawdź połączenie'
    });
  }
}
```

---

### Komponenty do wyświetlania błędów

**ErrorMessage (inline pod polem):**
```typescript
interface ErrorMessageProps {
  error?: string;
  fieldId: string;
}

const ErrorMessage = ({ error, fieldId }: ErrorMessageProps) => {
  if (!error) return null;
  
  return (
    <p 
      id={`${fieldId}-error`}
      className="text-sm text-red-600 mt-1"
      role="alert"
    >
      {error}
    </p>
  );
};
```

**Toast notification (globalny błąd):**
- Użycie biblioteki toast (np. sonner, react-hot-toast)
- Automatyczne znikanie po 5 sekundach
- Możliwość ręcznego zamknięcia

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

**Akcje:**
1. Utworzenie katalogu `src/components/auth/`
2. Utworzenie pliku `src/pages/register.astro`
3. Utworzenie pliku `src/components/auth/RegisterForm.tsx`
4. Przygotowanie typów w oddzielnym pliku lub inline

**Rezultat:** Podstawowa struktura projektu gotowa

---

### Krok 2: Implementacja strony Astro (register.astro)

**Akcje:**
1. Import Layout
2. Dodanie meta tags (title, description)
3. Osadzenie komponentu RegisterForm z dyrektywą `client:load`
4. Dodanie middleware sprawdzającego czy użytkownik nie jest już zalogowany
5. Jeśli zalogowany → przekierowanie na `/dashboard`

**Kod:**
```astro
---
import Layout from '@/layouts/Layout.astro';
import RegisterForm from '@/components/auth/RegisterForm';

// Sprawdzenie czy użytkownik nie jest już zalogowany
const user = Astro.locals.user;
if (user) {
  return Astro.redirect('/dashboard');
}
---

<Layout title="Rejestracja - AI Meal Planner">
  <main class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full">
      <RegisterForm client:load />
    </div>
  </main>
</Layout>
```

**Rezultat:** Strona dostępna pod `/register`

---

### Krok 3: Stworzenie interfejsów TypeScript

**Akcje:**
1. Zdefiniowanie `RegisterFormData`
2. Zdefiniowanie `ValidationErrors`
3. Zdefiniowanie `RegisterFormState`
4. Opcjonalnie: export typów do osobnego pliku

**Lokalizacja:** Na początku pliku `RegisterForm.tsx` lub w osobnym pliku `types.ts`

**Rezultat:** Typy gotowe do użycia w komponencie

---

### Krok 4: Struktura komponentu RegisterForm - stan i funkcje pomocnicze

**Akcje:**
1. Utworzenie komponentu funkcyjnego `RegisterForm`
2. Zdefiniowanie wszystkich hooks useState:
   - `formData`
   - `errors`
   - `isLoading`
   - `showPassword`
   - `showPasswordConfirmation`
   - `touched`
3. Implementacja funkcji walidacyjnych:
   - `validateEmail`
   - `validatePassword`
   - `validatePasswordConfirmation`
   - `validateForm`
4. Implementacja handlerów:
   - `handleInputChange`
   - `handleBlur`
   - `togglePasswordVisibility`

**Rezultat:** Szkielet komponentu z logiką gotowy

---

### Krok 5: Implementacja pól formularza (Email, Password, Confirmation)

**Akcje:**
1. Dodanie pola Email:
   - Label z htmlFor
   - Input z shadcn/ui (type="email")
   - Attributy: id, name, value, onChange, onBlur, autoFocus
   - ARIA: aria-required, aria-invalid, aria-describedby
   - Warunkowo renderowany ErrorMessage

2. Dodanie pola Password:
   - Label
   - Wrapper dla input + toggle button
   - Input z type dynamicznym (password/text)
   - Button z ikoną eye/eye-off (lucide-react)
   - Helper text "Minimum 8 znaków"
   - ErrorMessage

3. Dodanie pola Password Confirmation:
   - Identyczna struktura jak Password
   - Bez helper text
   - Walidacja na zgodność

**Rezultat:** Wszystkie pola formularza renderowane z walidacją

---

### Krok 6: Implementacja przycisku Submit i linku do logowania

**Akcje:**
1. Przycisk Submit:
   - Komponent Button z shadcn/ui
   - Props: type="submit", disabled, className
   - Warunkowo: loading spinner + tekst "Rejestracja..." lub "Zarejestruj się"
   
2. Link do logowania:
   - Paragraph z tekstem "Masz już konto?"
   - Link (a href="/login") "Zaloguj się"

**Rezultat:** Formularz kompletny wizualnie

---

### Krok 7: Implementacja logiki wysyłki formularza (handleSubmit)

**Akcje:**
1. Utworzenie funkcji `handleSubmit`
2. Zapobieganie domyślnemu zachowaniu formularza (`e.preventDefault()`)
3. Walidacja formularza (`validateForm()`)
4. Jeśli błędy: return (nie wysyłamy)
5. Ustawienie `isLoading = true`
6. Wywołanie `supabase.auth.signUp()`
7. Obsługa sukcesu: przekierowanie na `/onboarding`
8. Obsługa błędów: `handleAuthError()`
9. Finally: `isLoading = false`

**Kod (szkielet):**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) return;
  
  setIsLoading(true);
  setErrors({});
  
  try {
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });
    
    if (error) {
      handleAuthError(error);
      return;
    }
    
    window.location.href = '/onboarding';
  } catch (error) {
    setErrors({ general: 'Wystąpił błąd' });
  } finally {
    setIsLoading(false);
  }
};
```

**Rezultat:** Formularz funkcjonalny, wysyła dane do Supabase

---

### Krok 8: Implementacja obsługi błędów API (handleAuthError)

**Akcje:**
1. Utworzenie funkcji `handleAuthError`
2. Mapowanie błędów Supabase na komunikaty po polsku:
   - Email already registered → "Ten adres email jest już zajęty"
   - Network error → "Sprawdź połączenie internetowe..."
   - Server error (500) → "Wystąpił błąd serwera..."
   - Default → "Wystąpił błąd. Spróbuj ponownie"
3. Ustawienie błędu w state (`setErrors`)
4. Wyświetlenie toast notification

**Rezultat:** Czytelne komunikaty błędów dla użytkownika

---

### Krok 9: Dodanie toast notifications

**Akcje:**
1. Instalacja biblioteki toast (np. sonner):
   ```bash
   npm install sonner
   ```
2. Dodanie ToastProvider w Layout.astro lub App
3. Import `toast` w RegisterForm
4. Użycie `toast.error()` przy błędach
5. Opcjonalnie: `toast.success()` po sukcesie (przed przekierowaniem)

**Rezultat:** Użytkownik widzi powiadomienia toast

---

### Krok 10: Stylowanie komponentu (Tailwind CSS)

**Akcje:**
1. Dodanie klas Tailwind do wszystkich elementów:
   - Formularz: padding, max-width, background, border-radius, shadow
   - Pola: margin, padding, borders, focus states
   - Etykiety: font-size, font-weight, color
   - Błędy: text-red-600, text-sm
   - Przycisk: pełna szerokość, padding, hover states
2. Responsywność: sprawdzenie na mobile i desktop
3. Focus states dla dostępności

**Rezultat:** Formularz wygląda profesjonalnie

---

### Krok 11: Dodanie atrybutów dostępności (ARIA)

**Akcje:**
1. Dodanie `aria-required="true"` do wymaganych pól
2. Dodanie `aria-invalid={!!errors.email}` do pól z błędami
3. Dodanie `aria-describedby` łączącego pole z komunikatem błędu
4. Dodanie `role="alert"` do komunikatów błędów
5. Sprawdzenie nawigacji klawiaturą (Tab, Enter, Esc)
6. Sprawdzenie z czytnikiem ekranu (VoiceOver, NVDA)

**Rezultat:** Formularz dostępny dla wszystkich użytkowników

---

### Krok 12: Implementacja middleware sprawdzającego sesję

**Akcje:**
1. W pliku `src/middleware/index.ts`:
   - Sprawdzenie sesji Supabase
   - Jeśli użytkownik zalogowany próbuje wejść na `/register` → redirect `/dashboard`
   - Zapisanie user w `Astro.locals`
2. Dodanie middleware do `astro.config.mjs`

**Rezultat:** Zalogowani użytkownicy nie widzą strony rejestracji

---

### Krok 13: Testowanie formularza

**Akcje:**
1. **Test pozytywny:**
   - Wypełnienie poprawnych danych
   - Sprawdzenie czy użytkownik jest tworzony w Supabase
   - Sprawdzenie przekierowania na `/onboarding`

2. **Test walidacji:**
   - Pusty email → komunikat błędu
   - Niepoprawny format email → komunikat błędu
   - Za krótkie hasło → komunikat błędu
   - Niezgodne hasła → komunikat błędu

3. **Test błędów API:**
   - Rejestracja z istniejącym emailem → komunikat "email zajęty"
   - Symulacja błędu sieci → odpowiedni komunikat

4. **Test dostępności:**
   - Nawigacja klawiaturą
   - Czytnik ekranu
   - Focus states

5. **Test responsywności:**
   - Mobile (375px, 414px)
   - Tablet (768px)
   - Desktop (1024px+)

**Rezultat:** Formularz działa poprawnie we wszystkich scenariuszach

---

### Krok 14: Optymalizacje i refaktoryzacja

**Akcje:**
1. Wydzielenie pól formularza do osobnych komponentów (jeśli kod zbyt długi)
2. Wydzielenie logiki walidacji do custom hooka `useRegister` (opcjonalnie)
3. Wydzielenie stałych (error messages) do osobnego pliku
4. Dodanie komentarzy JSDoc do funkcji
5. Code review i czyszczenie kodu

**Rezultat:** Kod czysty, łatwy w utrzymaniu

---

### Krok 15: Dokumentacja i deployment

**Akcje:**
1. Dokumentacja komponentu (README lub JSDoc)
2. Dodanie do dokumentacji projektu
3. Commit i push do repozytorium
4. Deploy na środowisko testowe
5. Final testing na produkcji
6. ✅ Widok rejestracji gotowy!

**Rezultat:** Feature w pełni zaimplementowany i wdrożony

---

## Podsumowanie kroków

1. ✅ Przygotowanie struktury plików
2. ✅ Implementacja strony Astro
3. ✅ Stworzenie interfejsów TypeScript
4. ✅ Struktura komponentu RegisterForm
5. ✅ Implementacja pól formularza
6. ✅ Przycisk Submit i link do logowania
7. ✅ Logika wysyłki formularza
8. ✅ Obsługa błędów API
9. ✅ Toast notifications
10. ✅ Stylowanie Tailwind CSS
11. ✅ Atrybuty dostępności ARIA
12. ✅ Middleware sprawdzający sesję
13. ✅ Testowanie formularza
14. ✅ Optymalizacje i refaktoryzacja
15. ✅ Dokumentacja i deployment

**Szacowany czas implementacji:** 4-6 godzin dla doświadczonego frontend developera

**Priorytet:** Wysoki (blokuje onboarding użytkowników)

**Zależności:** 
- Konfiguracja Supabase Auth
- Layout aplikacji
- Shadcn/ui components zainstalowane
- Middleware Astro skonfigurowany

