# Plan implementacji widoku Logowania

## 1. Przegląd

Widok logowania umożliwia zarejestrowanym użytkownikom dostęp do konta w aplikacji AI Meal Planner. Jest to prosty, bezpieczny formularz z dwoma polami (email i hasło), który wykorzystuje Supabase Auth do autentykacji. Po pomyślnym zalogowaniu użytkownik jest przekierowywany do dashboardu. Widok zawiera również linki do resetowania hasła i rejestracji nowego konta.

## 2. Routing widoku

**Ścieżka:** `/login`

**Typ widoku:** Publiczny (dostępny tylko dla niezalogowanych użytkowników)

**Plik strony:** `src/pages/login.astro`

**Warunki dostępu:**
- Jeśli użytkownik jest już zalogowany (ma aktywną sesję) → automatyczne przekierowanie na `/dashboard`
- Jeśli użytkownik nie jest zalogowany → wyświetlenie formularza logowania

## 3. Struktura komponentów

```
login.astro (Astro Page)
│
├── Layout (Astro Layout Component)
│   └── main (HTML container)
│       └── LoginForm (React Component - client:load)
│           ├── Header Section
│           │   ├── h1 - Tytuł "Zaloguj się"
│           │   └── p - Opis widoku
│           │
│           ├── Form Section
│           │   ├── Email Field
│           │   │   ├── Label
│           │   │   ├── Input (type="email")
│           │   │   └── Error Message (conditional)
│           │   │
│           │   ├── Password Field
│           │   │   ├── Label
│           │   │   ├── Input Container (relative positioning)
│           │   │   │   ├── Input (type="password" or "text")
│           │   │   │   └── Toggle Button (Eye/EyeOff icon)
│           │   │   └── Error Message (conditional)
│           │   │
│           │   └── Submit Button
│           │
│           ├── Password Reset Link
│           │   └── a[href="/reset-password"] - "Nie pamiętam hasła"
│           │
│           └── Register Link
│               └── a[href="/register"] - "Nie masz konta? Zarejestruj się"
│
└── ToasterProvider (React Component - client:only="react")
```

## 4. Szczegóły komponentów

### 4.1. login.astro (Strona Astro)

**Opis komponentu:**
Główna strona widoku logowania. Odpowiada za sprawdzenie czy użytkownik jest już zalogowany oraz renderowanie komponentu LoginForm. Wykorzystuje Astro SSR (`prerender = false`) do sprawdzenia sesji po stronie serwera.

**Główne elementy:**
- Sprawdzenie sesji użytkownika przez `Astro.locals.supabase.auth.getSession()`
- Warunkowe przekierowanie na `/dashboard` jeśli sesja istnieje
- Layout z tytułem i meta description
- Container z ResponsiveForm (max-width, centered)
- ToasterProvider dla wyświetlania powiadomień

**Obsługiwane zdarzenia:**
- Brak (strona statyczna z logiką SSR)

**Warunki walidacji:**
- Sprawdzenie istnienia aktywnej sesji przed renderowaniem

**Typy:**
- Supabase Session (z Astro.locals)

**Propsy:**
- Brak (to strona, nie komponent)

**Dodatkowe wymagania:**
- `export const prerender = false` dla włączenia SSR
- Obsługa błędów sprawdzania sesji (try-catch)

---

### 4.2. LoginForm.tsx (Komponent React)

**Opis komponentu:**
Główny interaktywny formularz logowania. Zarządza stanem formularza, walidacją po stronie klienta, komunikacją z Supabase Auth oraz obsługą błędów. Komponent jest w pełni dostępny (accessibility) i responsywny.

**Główne elementy:**
- Nagłówek z tytułem "Zaloguj się" i opisem
- Formularz HTML z `noValidate` (własna walidacja)
- Pole email z Label, Input, komunikatem błędu
- Pole hasła z Label, Input, przyciskiem toggle visibility, komunikatem błędu
- Przycisk Submit z loading state
- Link do resetowania hasła
- Link do rejestracji

**Obsługiwane zdarzenia:**

1. **onChange (email, password):**
   - Aktualizacja `formData` state
   - Czyszczenie błędu dla zmienianego pola

2. **onBlur (email, password):**
   - Oznaczenie pola jako "touched"
   - Walidacja pola i wyświetlenie błędu jeśli niepoprawne

3. **onSubmit (form):**
   - Zapobieganie domyślnej akcji formularza
   - Walidacja całego formularza
   - Ustawienie loading state
   - Wywołanie Supabase Auth API
   - Obsługa sukcesu (toast + redirect)
   - Obsługa błędu (wyświetlenie komunikatu)

4. **onClick (toggle password visibility):**
   - Zmiana stanu `showPassword`
   - Zmiana typu input z "password" na "text" i odwrotnie

**Warunki walidacji:**

1. **Email:**
   - **Warunek:** Pole nie może być puste
   - **Komunikat:** "Email jest wymagany"
   - **Warunek:** Musi być poprawnym formatem email (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
   - **Komunikat:** "Podaj prawidłowy adres email"

2. **Hasło:**
   - **Warunek:** Pole nie może być puste
   - **Komunikat:** "Hasło jest wymagane"
   - **Uwaga:** Brak walidacji minimalnej długości przy logowaniu (tylko przy rejestracji)

3. **Przycisk Submit:**
   - **Stan disabled:** `isLoading || !formData.email || !formData.password`
   - **Warunek:** Oba pola muszą mieć wartość i formularz nie może być w trakcie wysyłania

**Typy:**
- `LoginFormData` - dane formularza
- `ValidationErrors` - błędy walidacji
- `TouchedFields` - śledzone pola
- `AuthError` (z Supabase)

**Propsy:**
- Brak (komponent nie przyjmuje props)

**Dodatkowe wymagania:**
- Autocomplete attributes dla autofill:
  - email: `autocomplete="email"`
  - password: `autocomplete="current-password"`
- ARIA attributes dla accessibility:
  - `aria-required="true"`
  - `aria-invalid` (conditional)
  - `aria-describedby` (powiązanie z błędami)
  - `role="alert"` dla komunikatów błędów
- Ikony Eye/EyeOff z lucide-react
- Toast notifications z sonner

---

### 4.3. Komponenty Shadcn/ui

**Button:**
- Używany dla przycisku Submit
- Props: `type="submit"`, `disabled`, `className="w-full"`
- Wyświetla tekst "Logowanie..." podczas loading state

**Input:**
- Używany dla pól email i password
- Props: `type`, `id`, `name`, `value`, `onChange`, `onBlur`, `autocomplete`, `aria-*`
- Warunkowe klasy CSS dla stanu błędu (czerwony border)

**Label:**
- Używany dla opisów pól formularza
- Props: `htmlFor` (powiązanie z input id)

---

## 5. Typy

### 5.1. Typy formularza (lokalne w LoginForm.tsx)

```typescript
/**
 * Interface reprezentujący dane formularza logowania
 */
interface LoginFormData {
  /** Adres email użytkownika */
  email: string;
  /** Hasło użytkownika */
  password: string;
}

/**
 * Interface reprezentujący błędy walidacji dla każdego pola
 */
interface ValidationErrors {
  /** Błąd walidacji pola email */
  email?: string;
  /** Błąd walidacji pola hasła */
  password?: string;
  /** Globalny błąd (np. błąd API lub autentykacji) */
  general?: string;
}

/**
 * Interface reprezentujący stan "touched" dla pól formularza
 * Używany do warunkowego wyświetlania błędów (tylko dla pól,
 * z którymi użytkownik już wchodził w interakcję)
 */
interface TouchedFields {
  email: boolean;
  password: boolean;
}
```

### 5.2. Typy z Supabase (importowane)

```typescript
import type { AuthError } from "@supabase/supabase-js";
```

**AuthError:**
- Typ błędu zwracanego przez Supabase Auth
- Zawiera: `message`, `status`, `name`
- Używany w funkcji `handleAuthError`

### 5.3. Typy Supabase Client (importowane)

```typescript
import { supabaseClient } from "@/db/supabase.client";
```

**supabaseClient.auth.signInWithPassword():**
- **Parametry:** `{ email: string, password: string }`
- **Zwraca:** `Promise<{ data: { user: User | null, session: Session | null }, error: AuthError | null }>`

---

## 6. Zarządzanie stanem

### 6.1. Stan lokalny w komponencie LoginForm

Cały stan jest zarządzany w komponencie `LoginForm` za pomocą React hooks (`useState`):

**Zmienne stanu:**

1. **formData: LoginFormData**
   - **Wartość początkowa:** `{ email: "", password: "" }`
   - **Cel:** Przechowywanie aktualnych wartości pól formularza
   - **Aktualizacja:** Przy każdej zmianie wartości input (onChange)

2. **errors: ValidationErrors**
   - **Wartość początkowa:** `{}`
   - **Cel:** Przechowywanie komunikatów błędów walidacji
   - **Aktualizacja:** Po walidacji (onBlur, onSubmit) lub przy błędzie API

3. **isLoading: boolean**
   - **Wartość początkowa:** `false`
   - **Cel:** Wskazanie, czy formularz jest w trakcie wysyłania
   - **Aktualizacja:** `true` przed wywołaniem API, `false` po zakończeniu (sukces lub błąd)

4. **showPassword: boolean**
   - **Wartość początkowa:** `false`
   - **Cel:** Kontrola widoczności hasła
   - **Aktualizacja:** Toggle przy kliknięciu ikony oka

5. **touched: TouchedFields**
   - **Wartość początkowa:** `{ email: false, password: false }`
   - **Cel:** Śledzenie, z którymi polami użytkownik już wchodził w interakcję
   - **Aktualizacja:** Po onBlur lub onSubmit
   - **Użycie:** Błędy są wyświetlane tylko dla touched pól

### 6.2. Przepływ danych

```
User Input (onChange)
    ↓
formData state update
    ↓
Clear field error

User Blur (onBlur)
    ↓
Mark field as touched
    ↓
Validate field
    ↓
Update errors state (if invalid)

User Submit (onSubmit)
    ↓
Mark all fields as touched
    ↓
Validate entire form
    ↓
If invalid: Display errors, stop
    ↓
If valid: Set isLoading = true
    ↓
Call Supabase Auth API
    ↓
Success:
  ↓
  Show success toast
  ↓
  Redirect to /dashboard
    
Error:
  ↓
  Set isLoading = false
  ↓
  Map error to user-friendly message
  ↓
  Update errors.general
  ↓
  Show error toast
```

### 6.3. Custom Hooks

**Brak custom hooks w MVP.**

W przyszłości można rozważyć ekstrakcję logiki do custom hooks:
- `useLoginForm()` - zarządzanie całym stanem formularza
- `useAuth()` - wspólna logika autentykacji (login, register, logout)

---

## 7. Integracja API

### 7.1. Endpoint autentykacji

**Metoda:** Supabase Auth API (client-side)

**Nie ma custom REST endpoint** - logowanie odbywa się bezpośrednio przez Supabase Client SDK.

### 7.2. Wywołanie API

**Import:**
```typescript
import { supabaseClient } from "@/db/supabase.client";
```

**Funkcja:**
```typescript
const { data, error } = await supabaseClient.auth.signInWithPassword({
  email: formData.email,
  password: formData.password,
});
```

**Typ żądania (parametry):**
```typescript
{
  email: string;    // Adres email użytkownika
  password: string; // Hasło użytkownika
}
```

**Typ odpowiedzi (sukces):**
```typescript
{
  data: {
    user: User | null;       // Obiekt użytkownika
    session: Session | null; // Sesja użytkownika (z JWT token)
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
  error: AuthError; // Obiekt błędu z message, status
}
```

### 7.3. Obsługa odpowiedzi

**Sukces:**
1. Supabase automatycznie zapisuje sesję (cookies/localStorage)
2. Wyświetlenie toast sukcesu: "Witaj ponownie!"
3. Przekierowanie na `/dashboard`: `window.location.href = "/dashboard"`

**Błąd:**
1. Sprawdzenie typu błędu
2. Mapowanie błędu Supabase na user-friendly komunikat po polsku
3. Wyświetlenie komunikatu w `errors.general`
4. Wyświetlenie toast błędu

### 7.4. Mapowanie błędów Supabase

```typescript
const handleAuthError = (error: AuthError) => {
  let errorMessage = "Wystąpił błąd. Spróbuj ponownie.";

  // Invalid credentials (email doesn't exist or wrong password)
  if (
    error.message.includes("Invalid login credentials") ||
    error.message.includes("invalid") ||
    error.status === 400
  ) {
    errorMessage = "Nieprawidłowy email lub hasło";
  }
  
  // Network errors
  else if (
    error.message.includes("network") ||
    error.message.includes("fetch")
  ) {
    errorMessage = "Sprawdź połączenie internetowe i spróbuj ponownie";
  }
  
  // Server errors
  else if (error.status === 500 || (error.status && error.status >= 500)) {
    errorMessage = "Wystąpił błąd serwera. Spróbuj ponownie za chwilę";
  }

  setErrors({ general: errorMessage });
  toast.error(errorMessage);
};
```

**Uwaga bezpieczeństwa:**
Wszystkie błędy związane z nieprawidłowymi danymi logowania (niewłaściwy email lub hasło) są mapowane na jeden generyczny komunikat: **"Nieprawidłowy email lub hasło"**. Nie ujawniamy, czy email istnieje w systemie (security best practice).

---

## 8. Interakcje użytkownika

### 8.1. Ładowanie strony

**Akcja:** Użytkownik otwiera `/login`

**Przepływ:**
1. Astro SSR sprawdza sesję użytkownika
2. **Jeśli sesja istnieje:** Automatyczne przekierowanie na `/dashboard`
3. **Jeśli brak sesji:** Renderowanie LoginForm
4. Wyświetlenie pustego formularza (email: "", password: "")

---

### 8.2. Wpisywanie w pole email

**Akcja:** Użytkownik wpisuje tekst w polu email

**Przepływ:**
1. Trigger: `onChange` event
2. Aktualizacja: `formData.email = newValue`
3. Jeśli istniał błąd dla pola email: Wyczyszczenie `errors.email = undefined`
4. Re-render komponentu

---

### 8.3. Opuszczenie pola email (blur)

**Akcja:** Użytkownik klika poza pole email

**Przepływ:**
1. Trigger: `onBlur` event
2. Oznaczenie pola: `touched.email = true`
3. Walidacja pola email:
   - Sprawdzenie czy niepuste
   - Sprawdzenie formatu email (regex)
4. **Jeśli niepoprawne:** Ustawienie `errors.email` z komunikatem błędu
5. **Jeśli poprawne:** Brak akcji
6. Re-render komponentu (błąd wyświetli się, bo touched.email = true)

---

### 8.4. Wpisywanie w pole hasła

**Akcja:** Użytkownik wpisuje tekst w polu hasła

**Przepływ:**
1. Trigger: `onChange` event
2. Aktualizacja: `formData.password = newValue`
3. Jeśli istniał błąd dla pola password: Wyczyszczenie `errors.password = undefined`
4. Re-render komponentu

---

### 8.5. Opuszczenie pola hasła (blur)

**Akcja:** Użytkownik klika poza pole hasła

**Przepływ:**
1. Trigger: `onBlur` event
2. Oznaczenie pola: `touched.password = true`
3. Walidacja pola password:
   - Sprawdzenie czy niepuste
4. **Jeśli niepoprawne:** Ustawienie `errors.password` z komunikatem błędu
5. **Jeśli poprawne:** Brak akcji
6. Re-render komponentu

---

### 8.6. Toggle widoczności hasła

**Akcja:** Użytkownik klika ikonę oka przy polu hasła

**Przepływ:**
1. Trigger: `onClick` na przycisku toggle
2. Toggle state: `showPassword = !showPassword`
3. **Jeśli showPassword = true:** Input type zmienia się na "text", ikona na EyeOff
4. **Jeśli showPassword = false:** Input type zmienia się na "password", ikona na Eye
5. Re-render komponentu

---

### 8.7. Submit formularza

**Akcja:** Użytkownik klika przycisk "Zaloguj się"

**Przepływ:**
1. Trigger: `onSubmit` event formularza
2. Zapobieganie domyślnej akcji: `e.preventDefault()`
3. Walidacja całego formularza:
   - Email: wymagane + format
   - Password: wymagane
   - Oznaczenie wszystkich pól jako touched
4. **Jeśli walidacja nie przeszła:**
   - Ustawienie `errors` dla niepoprawnych pól
   - Wyświetlenie błędów
   - **STOP** (nie wysyłamy żądania)
5. **Jeśli walidacja OK:**
   - Ustawienie `isLoading = true`
   - Wyczyszczenie poprzednich błędów `errors = {}`
   - Przycisk pokazuje "Logowanie..."
   - Wywołanie `supabaseClient.auth.signInWithPassword()`
   - **Oczekiwanie na odpowiedź...**
6. **Jeśli API zwróci sukces:**
   - Toast sukcesu: "Witaj ponownie!"
   - Przekierowanie: `window.location.href = "/dashboard"`
   - (Supabase automatycznie zapisał sesję)
7. **Jeśli API zwróci błąd:**
   - Ustawienie `isLoading = false`
   - Mapowanie błędu na user-friendly komunikat
   - Ustawienie `errors.general`
   - Toast błędu z komunikatem
   - Re-render (użytkownik widzi błąd i może spróbować ponownie)

---

### 8.9. Kliknięcie "Nie pamiętam hasła"

**Akcja:** Użytkownik klika link "Nie pamiętam hasła"

**Przepływ:**
1. Trigger: Kliknięcie `<a href="/reset-password">`
2. Nawigacja do `/reset-password`

---

### 8.10. Kliknięcie "Nie masz konta? Zarejestruj się"

**Akcja:** Użytkownik klika link do rejestracji

**Przepływ:**
1. Trigger: Kliknięcie `<a href="/register">`
2. Nawigacja do `/register`

---

## 9. Warunki i walidacja

### 9.1. Walidacja po stronie klienta

**Kiedy:** Przed wysłaniem żądania do Supabase Auth

**Cel:** Zapewnienie, że dane formularza są kompletne i poprawnie sformatowane

#### Warunek 1: Email wymagany

- **Pole:** `formData.email`
- **Warunek:** `!email.trim()`
- **Komunikat:** "Email jest wymagany"
- **Stan UI:** Czerwony border na Input, komunikat błędu pod polem
- **Gdzie sprawdzane:** `validateEmail()`, wywoływane w `onBlur` i `onSubmit`

#### Warunek 2: Email prawidłowy format

- **Pole:** `formData.email`
- **Warunek:** `!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)`
- **Komunikat:** "Podaj prawidłowy adres email"
- **Stan UI:** Czerwony border na Input, komunikat błędu pod polem
- **Gdzie sprawdzane:** `validateEmail()`, wywoływane w `onBlur` i `onSubmit`

#### Warunek 3: Hasło wymagane

- **Pole:** `formData.password`
- **Warunek:** `!password.trim()`
- **Komunikat:** "Hasło jest wymagane"
- **Stan UI:** Czerwony border na Input, komunikat błędu pod polem
- **Gdzie sprawdzane:** `validatePassword()`, wywoływane w `onBlur` i `onSubmit`

#### Warunek 4: Przycisk Submit disabled

- **Warunek:** `isLoading || !formData.email || !formData.password`
- **Stan UI:** Przycisk szary, niedostępny (disabled)
- **Gdzie sprawdzane:** Render przycisku Submit

---

### 9.2. Walidacja warunkowego wyświetlania błędów

**Warunek wyświetlenia błędu:**
```typescript
touched[fieldName] && errors[fieldName]
```

**Uzasadnienie:** Błędy są wyświetlane tylko dla pól, z którymi użytkownik już wchodził w interakcję (touched). Zapobiega to wyświetlaniu błędów na pustym formularzu przy pierwszym załadowaniu.

**Przykład:**
```tsx
{touched.email && errors.email && (
  <p className="text-sm text-red-600" role="alert">
    {errors.email}
  </p>
)}
```

---

### 9.3. Walidacja autentykacji (Supabase Auth)

**Kiedy:** Po wysłaniu żądania do API

**Warunki sukcesu:**
- Email istnieje w bazie
- Hasło jest poprawne dla tego emaila

**Warunki błędu:**
- Email nie istnieje ALBO hasło niepoprawne → **"Nieprawidłowy email lub hasło"** (generic message)
- Problem z siecią → **"Sprawdź połączenie internetowe i spróbuj ponownie"**
- Błąd serwera → **"Wystąpił błąd serwera. Spróbuj ponownie za chwilę"**
- Zbyt wiele prób (rate limit) → Generic error (obsługiwane przez Supabase)

---

### 9.4. Walidacja sesji (login.astro SSR)

**Kiedy:** Przy ładowaniu strony `/login`

**Warunek:** Sprawdzenie czy użytkownik ma aktywną sesję
```typescript
const { data: { session } } = await supabase.auth.getSession();
```

**Jeśli session istnieje:**
- **Akcja:** `return Astro.redirect("/dashboard")`
- **Uzasadnienie:** Zalogowani użytkownicy nie powinni widzieć formularza logowania

**Jeśli session nie istnieje:**
- **Akcja:** Renderowanie formularza LoginForm

---

## 10. Obsługa błędów

### 10.1. Błędy walidacji (client-side)

**Scenariusz:** Użytkownik zostawia pole puste lub wprowadza nieprawidłowy format

**Obsługa:**
1. Funkcje walidacyjne (`validateEmail`, `validatePassword`) zwracają komunikat błędu
2. Błąd zapisywany w `errors` state
3. Wyświetlenie komunikatu pod polem (jeśli touched)
4. Czerwony border na Input
5. ARIA attributes (`aria-invalid`, `aria-describedby`) dla screen readers

**Przykład błędów:**
- "Email jest wymagany"
- "Podaj prawidłowy adres email"
- "Hasło jest wymagane"

---

### 10.2. Błędy autentykacji (Supabase Auth)

#### Scenariusz 1: Nieprawidłowe dane logowania

**Przyczyna:** Email nie istnieje lub hasło nieprawidłowe

**Supabase error:** `Invalid login credentials` (status 400)

**Obsługa:**
- Mapowanie na generyczny komunikat: **"Nieprawidłowy email lub hasło"**
- Ustawienie `errors.general`
- Toast error
- Użytkownik może spróbować ponownie

**Uzasadnienie bezpieczeństwa:** Nie ujawniamy, czy email istnieje w systemie

---

#### Scenariusz 2: Błąd sieci

**Przyczyna:** Brak połączenia internetowego, timeout

**Supabase error:** Network error / Fetch failed

**Obsługa:**
- Komunikat: **"Sprawdź połączenie internetowe i spróbuj ponownie"**
- Ustawienie `errors.general`
- Toast error

---

#### Scenariusz 3: Błąd serwera

**Przyczyna:** Supabase service unavailable, internal server error

**Supabase error:** Status 500+

**Obsługa:**
- Komunikat: **"Wystąpił błąd serwera. Spróbuj ponownie za chwilę"**
- Ustawienie `errors.general`
- Toast error
- Logowanie szczegółów błędu do console (dla debugowania)

---

#### Scenariusz 4: Rate limiting

**Przyczyna:** Zbyt wiele nieudanych prób logowania

**Obsługa:**
- Supabase automatycznie obsługuje rate limiting
- Zwraca błąd, który jest mapowany na generyczny komunikat
- Użytkownik musi poczekać przed kolejną próbą

---

### 10.3. Błędy sprawdzania sesji (login.astro)

**Scenariusz:** Błąd przy sprawdzaniu sesji w SSR

**Obsługa:**
```typescript
try {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    return Astro.redirect("/dashboard");
  }
} catch (error) {
  console.error("Session check failed:", error);
  // Kontynuuj renderowanie formularza
}
```

**Uzasadnienie:** Jeśli sprawdzenie sesji się nie powiedzie, bezpieczniej jest wyświetlić formularz logowania niż blokować dostęp do aplikacji.

---

### 10.4. Przypadki brzegowe

#### Edge case 1: Email z whitespace

**Obsługa:** `email.trim()` przed walidacją i wysłaniem

---

#### Edge case 2: Użytkownik wielokrotnie klika Submit

**Obsługa:**
- Przycisk jest disabled podczas `isLoading = true`
- Kolejne kliknięcia są ignorowane

---

#### Edge case 3: Użytkownik próbuje wejść na /login będąc zalogowanym

**Obsługa:**
- SSR sprawdza sesję i przekierowuje na `/dashboard`
- Użytkownik nie widzi formularza

---

#### Edge case 4: Unexpected error (nie Supabase)

**Obsługa:**
```typescript
try {
  // ... Supabase call
} catch (error) {
  setErrors({ general: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie" });
  toast.error("Wystąpił nieoczekiwany błąd");
} finally {
  setIsLoading(false);
}
```

---

### 10.5. Logging błędów

**Supabase errors:** Logowane do console dla debugowania
```typescript
if (error) {
  console.error("Supabase Auth Error:", error);
  handleAuthError(error);
}
```

**Unexpected errors:** Również logowane
```typescript
catch (error) {
  console.error("Unexpected error during login:", error);
  // ...
}
```

---

## 11. Kroki implementacji

### Krok 1: Utworzenie komponentu LoginForm.tsx

**Lokalizacja:** `src/components/auth/LoginForm.tsx`

**Akcje:**
1. Utworzyć nowy plik
2. Zdefiniować interfejsy TypeScript:
   - `LoginFormData`
   - `ValidationErrors`
   - `TouchedFields`
3. Utworzyć szkielet komponentu z hooki useState:
   - `formData`
   - `errors`
   - `isLoading`
   - `showPassword`
   - `touched`

---

### Krok 2: Implementacja funkcji walidacyjnych

**W pliku LoginForm.tsx:**

1. Utworzyć `validateEmail(email: string)`:
   - Sprawdzenie czy niepuste
   - Sprawdzenie formatu (regex)
   - Zwrot komunikatu błędu lub undefined

2. Utworzyć `validatePassword(password: string)`:
   - Sprawdzenie czy niepuste
   - Zwrot komunikatu błędu lub undefined

3. Utworzyć `validateForm()`:
   - Wywołanie wszystkich funkcji walidacyjnych
   - Ustawienie `errors` state
   - Oznaczenie wszystkich pól jako touched
   - Zwrot boolean (czy formularz poprawny)

---

### Krok 3: Implementacja event handlers

**W pliku LoginForm.tsx:**

1. **handleInputChange:**
   - Parametry: field name, new value
   - Aktualizacja `formData`
   - Czyszczenie błędu dla tego pola

2. **handleBlur:**
   - Parametry: field name
   - Oznaczenie pola jako touched
   - Walidacja pola
   - Ustawienie błędu jeśli niepoprawne

3. **togglePasswordVisibility:**
   - Toggle `showPassword` state

4. **handleAuthError:**
   - Parametry: AuthError
   - Mapowanie błędu Supabase na user-friendly komunikat
   - Ustawienie `errors.general`
   - Toast error

5. **handleSubmit:**
   - preventDefault
   - Walidacja formularza
   - Jeśli niepoprawny: stop
   - Ustawienie loading
   - Wywołanie Supabase Auth
   - Obsługa sukcesu: toast + redirect
   - Obsługa błędu: handleAuthError
   - Finally: wyłączenie loading

---

### Krok 4: Implementacja UI formularza

**W pliku LoginForm.tsx (JSX):**

1. **Container z header:**
   - Tytuł h1: "Zaloguj się"
   - Opis p: "Wpisz swoje dane, aby uzyskać dostęp do konta"

2. **Form element:**
   - `onSubmit={handleSubmit}`
   - `noValidate` (własna walidacja)

3. **Email field:**
   - Label (htmlFor="email")
   - Input (type="email", autocomplete="email")
   - Conditional error message
   - ARIA attributes

4. **Password field:**
   - Label (htmlFor="password")
   - Container (relative positioning)
   - Input (type based on showPassword, autocomplete="current-password")
   - Toggle button (Eye/EyeOff icon)
   - Conditional error message
   - ARIA attributes

5. **Submit button:**
   - Text: "Zaloguj się" / "Logowanie..."
   - disabled={isSubmitDisabled}
   - className="w-full"

6. **Password reset link:**
   - `<a href="/reset-password">Nie pamiętam hasła</a>`
   - Umieścić pod formularzem

7. **Register link:**
   - Tekst: "Nie masz konta?"
   - `<a href="/register">Zarejestruj się</a>`
   - Umieścić na dole

---

### Krok 5: Stylowanie z Tailwind CSS

**Style do zastosowania:**

1. **Container formularza:**
   - `bg-white shadow-lg rounded-lg p-8`

2. **Header:**
   - h1: `text-3xl font-bold text-gray-900 mb-2`
   - p: `text-gray-600`

3. **Form:**
   - `space-y-6` (odstęp między polami)

4. **Field containers:**
   - `space-y-2` (odstęp między label, input, error)

5. **Labels:**
   - `text-sm font-medium text-gray-700`

6. **Inputs:**
   - Domyślnie: style z Shadcn/ui
   - Błąd: `border-red-500 focus-visible:ring-red-500`
   - Password input: `pr-10` (miejsce na ikonę)

7. **Error messages:**
   - `text-sm text-red-600 mt-1`

8. **Toggle button (password):**
   - `absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700`

9. **Links:**
   - `text-blue-600 hover:text-blue-500 font-medium`

10. **Register section:**
    - `text-center mt-6 text-sm text-gray-600`

---

### Krok 6: Utworzenie strony login.astro

**Lokalizacja:** `src/pages/login.astro`

**Akcje:**

1. Utworzyć nowy plik
2. Dodać frontmatter:
   - Import Layout
   - Import LoginForm
   - Import ToasterProvider
3. Dodać logikę SSR sprawdzania sesji:
   ```typescript
   try {
     const supabase = Astro.locals.supabase;
     const { data: { session } } = await supabase.auth.getSession();
     if (session) {
       return Astro.redirect("/dashboard");
     }
   } catch (error) {
     console.error("Session check failed:", error);
   }
   ```
4. Dodać `export const prerender = false`
5. Zaimplementować HTML template:
   - Layout z title i description
   - main container (centered, responsive)
   - LoginForm z `client:load`
   - ToasterProvider z `client:only="react"`

---

### Krok 7: Stylowanie strony login.astro

**Tailwind classes:**

```html
<main class="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
  <div class="w-full max-w-md">
    <LoginForm client:load />
  </div>
</main>
```

**Uzasadnienie:**
- `min-h-screen`: Pełna wysokość viewport
- `flex items-center justify-center`: Centrowanie w pionie i poziomie
- `bg-gray-50`: Subtelne tło
- `px-4 py-8`: Padding na mobile
- `max-w-md`: Ograniczenie szerokości formularza na desktop

---

### Krok 8: Testowanie walidacji

**Scenariusze testowe:**

1. **Puste pola:**
   - Próba submit z pustymi polami
   - Oczekiwanie: Błędy "Email jest wymagany", "Hasło jest wymagane"

2. **Nieprawidłowy email:**
   - Wpisanie "test" lub "test@"
   - Blur z pola
   - Oczekiwanie: "Podaj prawidłowy adres email"

3. **Poprawny email:**
   - Wpisanie "test@example.com"
   - Blur z pola
   - Oczekiwanie: Brak błędu

4. **Toggle password:**
   - Kliknięcie ikony oka
   - Oczekiwanie: Hasło staje się widoczne
   - Ponowne kliknięcie
   - Oczekiwanie: Hasło znów ukryte

5. **Disabled state:**
   - Puste pola
   - Oczekiwanie: Przycisk disabled
   - Wypełnienie pól
   - Oczekiwanie: Przycisk enabled

---

### Krok 9: Testowanie integracji z Supabase Auth

**Wymagania wstępne:**
- Supabase project skonfigurowany
- Testowy użytkownik utworzony w Supabase Auth

**Scenariusze testowe:**

1. **Prawidłowe logowanie:**
   - Email: istniejący użytkownik
   - Password: poprawne hasło
   - Submit
   - Oczekiwanie: Toast "Witaj ponownie!", redirect na /dashboard

2. **Nieprawidłowe hasło:**
   - Email: istniejący użytkownik
   - Password: złe hasło
   - Submit
   - Oczekiwanie: "Nieprawidłowy email lub hasło"

3. **Nieistniejący email:**
   - Email: niezarejestrowany
   - Password: dowolne
   - Submit
   - Oczekiwanie: "Nieprawidłowy email lub hasło" (ten sam komunikat)

4. **Błąd sieci:**
   - Symulacja braku internetu
   - Submit
   - Oczekiwanie: "Sprawdź połączenie internetowe..."

---

### Krok 10: Testowanie SSR redirect

**Scenariusze testowe:**

1. **Niezalogowany użytkownik:**
   - Otwarcie `/login`
   - Oczekiwanie: Wyświetlenie formularza

2. **Zalogowany użytkownik:**
   - Zalogowanie się
   - Próba otwarcia `/login` (np. ręcznie w URL)
   - Oczekiwanie: Automatyczne przekierowanie na `/dashboard`

---

### Krok 11: Testowanie accessibility

**Narzędzia:** axe DevTools, screen reader

**Sprawdzenie:**

1. **Keyboard navigation:**
   - Tab przez wszystkie pola i przyciski
   - Enter na przycisku submit
   - Wszystko powinno być dostępne bez myszy

2. **ARIA attributes:**
   - Sprawdzenie `aria-required`, `aria-invalid`, `aria-describedby`
   - Walidacja przez axe DevTools

3. **Screen reader:**
   - Odczytanie wszystkich labels
   - Ogłoszenie błędów (role="alert")
   - Ogłoszenie stanu przycisku (disabled, loading)

4. **Color contrast:**
   - Sprawdzenie kontrastu tekstu (błędy, labels)
   - Minimum WCAG AA (4.5:1)

---

### Krok 12: Testowanie responsywności

**Urządzenia testowe:**

1. **Mobile (375px):**
   - Formularz zajmuje całą szerokość (z padding)
   - Wszystkie elementy czytelne
   - Przyciski łatwe do kliknięcia

2. **Tablet (768px):**
   - Formularz wycentrowany
   - max-w-md działa poprawnie

3. **Desktop (1280px):**
   - Formularz wycentrowany
   - Odpowiednie marginesy

---

### Krok 13: Optymalizacja i refactoring

**Potencjalne usprawnienia:**

1. **Custom hook useLoginForm:**
   - Ekstrakcja logiki do reużywalnego hooka
   - Łatwiejsze testowanie
   - Czystszy komponent

2. **Form library (React Hook Form):**
   - Rozważyć w przyszłości dla większych formularzy
   - MVP: własna implementacja

3. **Validation library (Zod):**
   - Wspólne schematy walidacji między frontendem a backendem
   - MVP: własne funkcje walidacyjne wystarczające

4. **Error boundary:**
   - Obsługa nieoczekiwanych błędów React
   - Fallback UI

5. **Loading skeleton:**
   - Zamiast pustej strony podczas sprawdzania sesji
   - Lepsza UX

---

### Krok 14: Dokumentacja

**Co udokumentować:**

1. **Komentarze w kodzie:**
   - JSDoc dla wszystkich funkcji
   - Inline comments dla skomplikowanej logiki

2. **README (opcjonalnie):**
   - Opis komponentu LoginForm
   - Props (jeśli zostaną dodane w przyszłości)
   - Przykład użycia

3. **Storybook (opcjonalnie, post-MVP):**
   - Stories dla różnych stanów komponentu
   - Interactive docs

---

### Krok 15: Finalne sprawdzenie przed merge

**Checklist:**

- [ ] Wszystkie User Stories spełnione (US-002)
- [ ] Walidacja działa poprawnie
- [ ] Supabase Auth integracja działa
- [ ] Redirect po logowaniu działa
- [ ] Redirect przy istniejącej sesji działa
- [ ] Błędy są wyświetlane po polsku
- [ ] Komunikaty błędów są user-friendly
- [ ] Generic error dla bezpieczeństwa
- [ ] Links do /reset-password i /register działają
- [ ] Password visibility toggle działa
- [ ] Toast notifications działają
- [ ] Accessibility (axe, keyboard, screen reader) ✓
- [ ] Responsywność (mobile, tablet, desktop) ✓
- [ ] Loading states wyświetlane poprawnie
- [ ] Kod jest czytelny i udokumentowany
- [ ] Brak linter errors
- [ ] TypeScript errors: 0

---

## Podsumowanie

Plan implementacji widoku logowania obejmuje:

1. **Komponent React LoginForm** z pełną logiką formularza, walidacją i integracją z Supabase Auth
2. **Stronę Astro login.astro** z SSR sprawdzaniem sesji i automatycznym redirectem
3. **Walidację wielopoziomową** (client-side + Supabase Auth)
4. **Bezpieczną obsługę błędów** z generic error messages
5. **Dostępność (accessibility)** z ARIA attributes i keyboard navigation
6. **Responsywny design** działający na wszystkich urządzeniach
7. **User-friendly UX** z loading states, toast notifications i clear feedback

Implementacja powinna zająć około 4-6 godzin dla doświadczonego frontend developera. Wszystkie wymagania z PRD i User Stories (US-002) będą spełnione.

