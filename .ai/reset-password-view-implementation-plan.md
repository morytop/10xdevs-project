# Plan implementacji widoku Resetowania hasła

## 1. Przegląd

Widok resetowania hasła umożliwia użytkownikom odzyskanie dostępu do konta w przypadku zapomnienia hasła. Jest to publiczny widok, który wykorzystuje wbudowaną funkcjonalność Supabase do wysyłania linku resetującego hasło na podany adres email. Ze względów bezpieczeństwa, widok zawsze wyświetla komunikat sukcesu, niezależnie od tego, czy podany email istnieje w systemie - zapobiega to ujawnianiu informacji o zarejestrowanych użytkownikach.

**Główne cele widoku**:

- Umożliwienie użytkownikom zainicjowania procesu resetowania hasła
- Zapewnienie bezpieczeństwa poprzez generic success message
- Proste i intuicyjne UX
- Pełna dostępność (accessibility)

## 2. Routing widoku

**Ścieżka**: `/reset-password`

**Typ**: Publiczny (dostępny bez logowania)

**Plik strony**: `src/pages/reset-password.astro`

**Powiązania**:

- Link "Nie pamiętam hasła" na stronie `/login`
- Link powrotny "Wróć do logowania" prowadzący do `/login`

## 3. Struktura komponentów

```
src/pages/reset-password.astro (Strona Astro)
│
└── src/components/auth/ResetPasswordForm.tsx (React, interaktywny)
    │
    ├── src/components/ui/input.tsx (Shadcn/ui - pole email)
    ├── src/components/ui/label.tsx (Shadcn/ui - etykieta pola)
    ├── src/components/ui/button.tsx (Shadcn/ui - przycisk submit)
    └── src/components/ui/alert.tsx (Shadcn/ui - komunikaty sukcesu/błędu)
```

**Komponenty już istniejące (z Shadcn/ui)**:

- `Input` - pole tekstowe
- `Label` - etykieta dla pola
- `Button` - przycisk akcji
- `Alert` - komponenty do wyświetlania komunikatów

**Komponenty do stworzenia**:

- `ResetPasswordForm.tsx` - główny formularz resetowania hasła

## 4. Szczegóły komponentów

### 4.1. `reset-password.astro`

**Opis komponentu**: Strona Astro zawierająca widok resetowania hasła. Odpowiada za rendering strony i osadzenie interaktywnego komponentu React.

**Główne elementy**:

- Layout aplikacji (`Layout.astro`)
- Nagłówek strony z tytułem
- Komponent `ResetPasswordForm` (client:load)
- Informacja o celu strony
- Link powrotny do logowania (opcjonalnie w formularzu)

**Obsługiwane interakcje**: Brak (statyczna strona Astro)

**Obsługiwana walidacja**: Brak (walidacja w komponencie React)

**Typy**: Brak specyficznych typów

**Propsy**: Brak

**Struktura HTML**:

```astro
<Layout title="Resetowanie hasła">
  <main class="container max-w-md mx-auto py-12 px-4">
    <div class="text-center mb-8">
      <h1>Resetowanie hasła</h1>
      <p>Wprowadź swój adres email, a wyślemy Ci link do resetowania hasła</p>
    </div>
    <ResetPasswordForm client:load />
  </main>
</Layout>
```

### 4.2. `ResetPasswordForm.tsx`

**Opis komponentu**: Interaktywny formularz React do resetowania hasła. Obsługuje wprowadzanie email, walidację, komunikację z Supabase oraz wyświetlanie komunikatów sukcesu i błędów.

**Główne elementy**:

- Formularz HTML z polem email
- `Label` - etykieta "Adres email"
- `Input` - pole tekstowe typu email
- `Button` - przycisk "Wyślij link resetujący"
- `Alert` - komunikat sukcesu (po wysłaniu)
- `Alert` - komunikat błędu (przy błędzie walidacji lub API)
- Link "Wróć do logowania"

**Obsługiwane interakcje**:

- `onChange` na polu email - aktualizacja stanu i resetowanie błędów
- `onSubmit` formularza - walidacja i wysłanie żądania do Supabase
- `onClick` na linku powrotnym - nawigacja do `/login`

**Obsługiwana walidacja**:

1. **Email nie może być pusty**
   - Warunek: `email.trim() === ""`
   - Komunikat: "Adres email jest wymagany"
2. **Email musi być w poprawnym formacie**
   - Warunek: regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Komunikat: "Wprowadź poprawny adres email"

3. **Walidacja wykonywana**:
   - Po stronie klienta przed wysłaniem
   - W czasie rzeczywistym po pierwszej próbie submit (optional UX improvement)

**Typy**:

- `ResetPasswordFormData` - dane formularza
- `ResetPasswordFormState` - stan komponentu

**Propsy**: Brak (komponent autonomiczny)

**Stan wewnętrzny**:

```typescript
const [email, setEmail] = useState<string>("");
const [emailError, setEmailError] = useState<string>("");
const [isLoading, setIsLoading] = useState<boolean>(false);
const [isSuccess, setIsSuccess] = useState<boolean>(false);
const [apiError, setApiError] = useState<string>("");
```

**Logika komponentu**:

```typescript
const validateEmail = (email: string): string | null => {
  if (!email.trim()) {
    return "Adres email jest wymagany";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Wprowadź poprawny adres email";
  }
  return null;
};

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  // Reset błędów
  setEmailError("");
  setApiError("");

  // Walidacja
  const error = validateEmail(email);
  if (error) {
    setEmailError(error);
    return;
  }

  setIsLoading(true);

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      throw error;
    }

    setIsSuccess(true);
  } catch (err) {
    setApiError("Wystąpił błąd. Spróbuj ponownie później.");
    console.error("Reset password error:", err);
  } finally {
    setIsLoading(false);
  }
};
```

## 5. Typy

### 5.1. Typy formularza

```typescript
/**
 * Dane formularza resetowania hasła
 */
interface ResetPasswordFormData {
  /** Adres email użytkownika */
  email: string;
}

/**
 * Stan formularza resetowania hasła
 */
interface ResetPasswordFormState {
  /** Aktualnie wprowadzony email */
  email: string;
  /** Błąd walidacji pola email */
  emailError: string;
  /** Czy trwa wysyłanie żądania */
  isLoading: boolean;
  /** Czy żądanie zakończyło się sukcesem */
  isSuccess: boolean;
  /** Ogólny błąd API (jeśli wystąpił) */
  apiError: string;
}
```

### 5.2. Typy Supabase

Używamy typów z `@supabase/supabase-js`:

```typescript
import { createClient } from "@supabase/supabase-js";

// Metoda resetPasswordForEmail zwraca:
// Promise<{ data: {}, error: AuthError | null }>
```

## 6. Zarządzanie stanem

### 6.1. Stan lokalny komponentu

Zarządzanie stanem odbywa się wyłącznie przez React hooks w komponencie `ResetPasswordForm`:

**Stany**:

1. `email: string` - wartość pola email
2. `emailError: string` - komunikat błędu walidacji email
3. `isLoading: boolean` - flaga ładowania podczas wysyłania żądania
4. `isSuccess: boolean` - flaga sukcesu po wysłaniu
5. `apiError: string` - komunikat błędu API

**Flow zarządzania stanem**:

```
[Initial State]
email: ""
emailError: ""
isLoading: false
isSuccess: false
apiError: ""

↓ [User types email]

email: "user@example.com"
emailError: ""

↓ [User submits form]

isLoading: true
emailError: "" (reset)
apiError: "" (reset)

↓ [Validation]

IF validation fails:
  emailError: "error message"
  isLoading: false

IF validation passes:
  → Call Supabase API

  ↓ [API Response]

  IF success:
    isSuccess: true
    isLoading: false

  IF error:
    apiError: "error message"
    isLoading: false
```

### 6.2. Custom hooks

**Nie są wymagane custom hooks**. Stan jest prosty i zawiera się w pojedynczym komponencie. Wszystkie operacje można zrealizować za pomocą standardowych `useState` i obsługi zdarzeń.

**Uzasadnienie**:

- Prosty formularz z jednym polem
- Brak złożonej logiki współdzielonej między komponentami
- Brak potrzeby synchronizacji z innymi częściami aplikacji

## 7. Integracja API

### 7.1. Klient Supabase

**Import**:

```typescript
import { supabase } from "@/db/supabase.client";
```

**Konfiguracja**: Używamy istniejącego klienta Supabase z `src/db/supabase.client.ts`

### 7.2. Wywołanie API

**Metoda**: `supabase.auth.resetPasswordForEmail()`

**Typ żądania**:

```typescript
async resetPasswordForEmail(
  email: string,
  options?: {
    redirectTo?: string;
    captchaToken?: string;
  }
): Promise<{
  data: {};
  error: AuthError | null;
}>
```

**Parametry**:

- `email: string` - adres email użytkownika
- `options.redirectTo: string` - URL do przekierowania po kliknięciu w link (np. `/update-password`)

**Przykład użycia**:

```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/update-password`,
});
```

**Typ odpowiedzi**:

- `data: {}` - pusty obiekt (nie zawiera informacji o istnieniu użytkownika)
- `error: AuthError | null` - błąd jeśli wystąpił problem techniczny

**Obsługa odpowiedzi**:

```typescript
if (error) {
  // Błąd techniczny (np. problem z połączeniem, błąd serwera)
  setApiError("Wystąpił błąd. Spróbuj ponownie później.");
  return;
}

// Sukces - zawsze wyświetlamy generic message
setIsSuccess(true);
```

**Ważne**: API **zawsze zwraca sukces** dla istniejących i nieistniejących emaili (ze względów bezpieczeństwa). Email resetujący zostanie wysłany tylko jeśli konto istnieje.

## 8. Interakcje użytkownika

### 8.1. Wprowadzanie adresu email

**Akcja**: Użytkownik wpisuje email w pole tekstowe

**Handler**: `onChange` na komponencie `Input`

**Behavior**:

```typescript
const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
  setEmail(e.target.value);
  // Opcjonalnie: resetuj błąd jeśli był wcześniej wyświetlony
  if (emailError) {
    setEmailError("");
  }
};
```

**UX**:

- Błąd walidacji znika podczas wpisywania (po pierwszej próbie submit)
- Placeholder: "twoj@email.com"
- Type: "email" (natywna walidacja przeglądarki jako backup)

### 8.2. Wysłanie formularza

**Akcja**: Użytkownik klika "Wyślij link resetujący" lub naciska Enter

**Handler**: `onSubmit` na elemencie `<form>`

**Behavior**:

1. Zapobiegaj domyślnej akcji formularza (`preventDefault`)
2. Reset poprzednich błędów
3. Walidacja pola email
4. Jeśli walidacja nie przeszła - wyświetl błąd i zakończ
5. Jeśli walidacja przeszła - ustaw `isLoading = true`
6. Wywołaj `supabase.auth.resetPasswordForEmail()`
7. Obsłuż odpowiedź API
8. Ustaw `isLoading = false`
9. Wyświetl sukces lub błąd

**UX podczas ładowania**:

- Przycisk pokazuje spinner lub tekst "Wysyłanie..."
- Przycisk jest wyłączony (`disabled={isLoading}`)
- Pole email jest wyłączone
- Użytkownik nie może ponownie wysłać formularza

### 8.3. Powrót do logowania

**Akcja**: Użytkownik klika link "Wróć do logowania"

**Handler**: Standardowy link `<a>` lub Next.js `<Link>`

**Behavior**:

```tsx
<a href="/login" className="text-sm text-primary hover:underline">
  Wróć do logowania
</a>
```

**Pozycja**:

- Poniżej formularza (przed komunikatem sukcesu)
- Widoczny zawsze (przed i po wysłaniu)

### 8.4. Komunikat sukcesu

**Wyświetlany**: Po pomyślnym wywołaniu API (`isSuccess === true`)

**Treść**:

```
"Jeśli konto z tym adresem istnieje, wyślemy link do resetowania hasła.
Sprawdź swoją skrzynkę email."
```

**Typ**: `Alert` z wariantem "success" (zielony)

**Behavior**:

- Zastępuje formularz lub wyświetla się nad nim
- Użytkownik nie może już wysłać formularza ponownie (lub przycisk zmienia się na "Wyślij ponownie")

## 9. Warunki i walidacja

### 9.1. Walidacja pola email

**Warunek 1: Email nie może być pusty**

**Kiedy**: Przy próbie submit formularza

**Sprawdzenie**:

```typescript
if (!email.trim()) {
  return "Adres email jest wymagany";
}
```

**Komunikat**: "Adres email jest wymagany"

**Wpływ na UI**:

- Komunikat błędu pod polem email (czerwony tekst)
- Pole email z czerwoną obwódką
- Focus wraca na pole email
- Przycisk submit pozostaje aktywny

---

**Warunek 2: Email musi być w poprawnym formacie**

**Kiedy**: Przy próbie submit formularza (po sprawdzeniu czy niepuste)

**Sprawdzenie**:

```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return "Wprowadź poprawny adres email";
}
```

**Komunikat**: "Wprowadź poprawny adres email"

**Wpływ na UI**:

- Komunikat błędu pod polem email
- Pole email z czerwoną obwódką
- Focus wraca na pole email

### 9.2. Walidacja stanu formularza

**Warunek: Formularz nie może być wysłany podczas ładowania**

**Kiedy**: Użytkownik próbuje wysłać formularz gdy `isLoading === true`

**Sprawdzenie**: Atrybut `disabled` na przycisku

```tsx
<Button type="submit" disabled={isLoading}>
  {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
</Button>
```

**Wpływ na UI**:

- Przycisk wyszarzony i nieaktywny
- Pole email nieaktywne
- Ikona ładowania (spinner)

### 9.3. Walidacja po stronie przeglądarki (backup)

**HTML5 validation**:

```tsx
<Input
  type="email"
  required
  placeholder="twoj@email.com"
  // ...
/>
```

**Uzasadnienie**: Dodatkowa warstwa walidacji dla użytkowników, którzy mają wyłączony JavaScript lub jako fallback.

## 10. Obsługa błędów

### 10.1. Błędy walidacji

**Typ błędu**: Niepoprawne dane wejściowe

**Przykłady**:

- Puste pole email
- Email w niepoprawnym formacie

**Obsługa**:

```typescript
const error = validateEmail(email);
if (error) {
  setEmailError(error);
  return; // Nie wysyłaj żądania
}
```

**Komunikat użytkownikowi**:

- Wyświetlany pod polem email
- Czerwony kolor
- Ikona błędu (opcjonalnie)
- Konkretny komunikat: "Adres email jest wymagany" lub "Wprowadź poprawny adres email"

**UX**:

- Focus pozostaje na formularzu
- Błąd znika po rozpoczęciu edycji pola
- Możliwość natychmiastowej poprawy

### 10.2. Błędy API

**Typ błędu**: Problem z komunikacją z Supabase

**Przykłady**:

- Brak połączenia z internetem
- Timeout żądania
- Błąd serwera Supabase (500)
- Rate limiting

**Obsługa**:

```typescript
try {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/update-password`,
  });

  if (error) {
    throw error;
  }

  setIsSuccess(true);
} catch (err) {
  console.error("Reset password error:", err);
  setApiError("Wystąpił błąd. Spróbuj ponownie później.");
} finally {
  setIsLoading(false);
}
```

**Komunikat użytkownikowi**:

- Generic message: "Wystąpił błąd. Spróbuj ponownie później."
- Wyświetlany jako `Alert` z wariantem "destructive" (czerwony)
- Pozycja: nad formularzem lub pod przyciskiem

**UX**:

- Przycisk wraca do stanu aktywnego
- Użytkownik może spróbować ponownie
- Szczegóły błędu logowane do konsoli (dla debugowania)

### 10.3. Edge cases

**Case 1: Użytkownik wysyła formularz wielokrotnie**

**Obsługa**:

- Przycisk `disabled` podczas `isLoading`
- Można dodać cooldown (np. 60 sekund) przed kolejnym wysłaniem

**Case 2: Użytkownik wprowadza bardzo długi email**

**Obsługa**:

- Supabase ma wbudowane limity
- Można dodać `maxLength` na input (opcjonalnie)

**Case 3: Supabase zwraca sukces ale email nie dotarł**

**Obsługa**:

- Komunikat sugeruje sprawdzenie spamu
- Możliwość wysłania ponownie
- Informacja o czasie oczekiwania (kilka minut)

### 10.4. Accessibility (a11y) error handling

**Screen readers**:

```tsx
<Input aria-invalid={!!emailError} aria-describedby={emailError ? "email-error" : undefined} />;
{
  emailError && (
    <p id="email-error" role="alert" className="text-destructive">
      {emailError}
    </p>
  );
}
```

**Focus management**:

- Po błędzie walidacji, focus pozostaje na polu email
- Komunikat błędu jest ogłaszany przez screen reader (role="alert")

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

1.1. Utwórz plik `src/pages/reset-password.astro`

1.2. Utwórz plik `src/components/auth/ResetPasswordForm.tsx`

1.3. Upewnij się, że komponenty Shadcn/ui są dostępne:

- `src/components/ui/input.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/alert.tsx`

### Krok 2: Implementacja strony Astro

2.1. Otwórz `src/pages/reset-password.astro`

2.2. Zaimportuj layout i komponent React:

```astro
---
import Layout from "@/layouts/Layout.astro";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
---
```

2.3. Dodaj strukturę strony:

```astro
<Layout title="Resetowanie hasła | AI Meal Planner">
  <main class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md space-y-8">
      {/* Header */}
      <div class="text-center">
        <h1 class="text-3xl font-bold tracking-tight">Resetowanie hasła</h1>
        <p class="mt-2 text-muted-foreground">Wprowadź swój adres email, a wyślemy Ci link do resetowania hasła</p>
      </div>

      {/* Form */}
      <ResetPasswordForm client:load />
    </div>
  </main>
</Layout>
```

### Krok 3: Implementacja komponentu ResetPasswordForm - Struktura

3.1. Otwórz `src/components/auth/ResetPasswordForm.tsx`

3.2. Dodaj importy:

```typescript
import { useState, type FormEvent, type ChangeEvent } from "react";
import { supabase } from "@/db/supabase.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";
```

3.3. Zdefiniuj interfejsy typów (na początku pliku):

```typescript
interface ResetPasswordFormState {
  email: string;
  emailError: string;
  isLoading: boolean;
  isSuccess: boolean;
  apiError: string;
}
```

### Krok 4: Implementacja komponentu ResetPasswordForm - Stan i logika

4.1. Zdefiniuj stan komponentu:

```typescript
export default function ResetPasswordForm() {
  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>("");
```

4.2. Dodaj funkcję walidacji:

```typescript
const validateEmail = (email: string): string | null => {
  if (!email.trim()) {
    return "Adres email jest wymagany";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Wprowadź poprawny adres email";
  }

  return null;
};
```

4.3. Dodaj handler zmiany email:

```typescript
const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
  setEmail(e.target.value);
  // Reset błędu podczas wpisywania
  if (emailError) {
    setEmailError("");
  }
  if (apiError) {
    setApiError("");
  }
};
```

4.4. Dodaj handler submit:

```typescript
const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  // Reset poprzednich błędów
  setEmailError("");
  setApiError("");

  // Walidacja
  const validationError = validateEmail(email);
  if (validationError) {
    setEmailError(validationError);
    return;
  }

  // Wywołanie API
  setIsLoading(true);

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      throw error;
    }

    // Sukces
    setIsSuccess(true);
  } catch (err) {
    console.error("Reset password error:", err);
    setApiError("Wystąpił błąd. Spróbuj ponownie później.");
  } finally {
    setIsLoading(false);
  }
};
```

### Krok 5: Implementacja komponentu ResetPasswordForm - JSX

5.1. Dodaj JSX dla stanu sukcesu:

```typescript
  // Jeśli sukces - pokaż komunikat
  if (isSuccess) {
    return (
      <div className="space-y-6">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Jeśli konto z tym adresem istnieje, wyślemy link do resetowania hasła.
            Sprawdź swoją skrzynkę email (włącznie ze spamem).
          </AlertDescription>
        </Alert>

        <div className="text-center">
          <a
            href="/login"
            className="text-sm text-primary hover:underline"
          >
            Wróć do logowania
          </a>
        </div>
      </div>
    );
  }
```

5.2. Dodaj JSX dla formularza:

```typescript
  return (
    <div className="space-y-6">
      {/* Błąd API */}
      {apiError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      {/* Formularz */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">
            Adres email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="twoj@email.com"
            value={email}
            onChange={handleEmailChange}
            disabled={isLoading}
            required
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "email-error" : undefined}
            className={emailError ? "border-destructive" : ""}
          />
          {emailError && (
            <p
              id="email-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {emailError}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
        </Button>
      </form>

      {/* Link powrotny */}
      <div className="text-center">
        <a
          href="/login"
          className="text-sm text-primary hover:underline"
        >
          Wróć do logowania
        </a>
      </div>
    </div>
  );
}
```

### Krok 6: Dodanie linku na stronie logowania

6.1. Otwórz `src/pages/login.astro` lub `src/components/auth/LoginForm.tsx`

6.2. Dodaj link "Nie pamiętam hasła" pod formularzem:

```tsx
<div className="text-center mt-4">
  <a href="/reset-password" className="text-sm text-primary hover:underline">
    Nie pamiętam hasła
  </a>
</div>
```

6.3. Pozycja: Poniżej przycisku logowania, nad linkiem do rejestracji

### Krok 7: Utworzenie strony update-password

**Uwaga**: Strona `/update-password` to osobny widok, który będzie potrzebny do ustawienia nowego hasła. W tym planie implementujemy tylko `/reset-password`.

7.1. Upewnij się, że `redirectTo` w `resetPasswordForEmail` wskazuje na poprawny URL

7.2. Zaplanuj implementację strony `/update-password` jako kolejny task

### Krok 8: Testowanie - Przypadki testowe

8.1. **Test walidacji - pusty email**:

- Pozostaw pole puste
- Kliknij "Wyślij link"
- Oczekiwany wynik: "Adres email jest wymagany"

8.2. **Test walidacji - niepoprawny format**:

- Wprowadź "test" (bez @)
- Kliknij "Wyślij link"
- Oczekiwany wynik: "Wprowadź poprawny adres email"

8.3. **Test wysyłki - istniejący email**:

- Wprowadź zarejestrowany email
- Kliknij "Wyślij link"
- Oczekiwany wynik: Komunikat sukcesu + email w skrzynce

8.4. **Test wysyłki - nieistniejący email**:

- Wprowadź niezarejestrowany email
- Kliknij "Wyślij link"
- Oczekiwany wynik: Komunikat sukcesu (taki sam jak dla istniejącego)

8.5. **Test UX - disabled podczas ładowania**:

- Wprowadź poprawny email
- Kliknij "Wyślij link"
- Podczas ładowania spróbuj kliknąć ponownie
- Oczekiwany wynik: Przycisk nieaktywny, nie można wysłać ponownie

8.6. **Test linku powrotnego**:

- Kliknij "Wróć do logowania"
- Oczekiwany wynik: Przekierowanie do `/login`

### Krok 9: Testowanie - Accessibility

9.1. **Keyboard navigation**:

- Tab przez wszystkie elementy
- Enter na przycisku wysyła formularz
- Esc nie zamyka formularza (brak modala)

9.2. **Screen reader**:

- Użyj NVDA/JAWS/VoiceOver
- Sprawdź czy błędy są ogłaszane
- Sprawdź czy labels są poprawnie powiązane z inputami

9.3. **Color contrast**:

- Sprawdź kontrast tekstu błędu
- Sprawdź kontrast komunikatu sukcesu
- Minimum WCAG AA (4.5:1)

### Krok 10: Optymalizacje i polerowanie

10.1. **Loading state**:

- Dodaj spinner icon do przycisku podczas ładowania
- Opcjonalnie: dodaj skeleton loader

10.2. **Animations**:

- Fade-in dla komunikatów błędów/sukcesu
- Smooth transition między stanami

10.3. **Email cooldown** (opcjonalne):

- Dodaj timer 60 sekund przed kolejnym wysłaniem
- Wyświetl "Możesz wysłać ponownie za X sekund"

10.4. **Error recovery**:

- Dodaj przycisk "Spróbuj ponownie" przy błędzie API
- Auto-focus na polu email po błędzie

10.5. **Analytics** (opcjonalne):

- Log event "password_reset_requested"
- Track success rate
- Monitor błędów API

### Krok 11: Code review i cleanup

11.1. Sprawdź wszystkie typy TypeScript

11.2. Upewnij się, że nie ma console.log (oprócz error logging)

11.3. Sprawdź formatowanie kodu (Prettier)

11.4. Sprawdź linting (ESLint)

11.5. Dodaj komentarze JSDoc do funkcji walidacji

### Krok 12: Dokumentacja

12.1. Zaktualizuj dokumentację widoków (jeśli istnieje)

12.2. Dodaj komentarze w kodzie wyjaśniające logikę biznesową

12.3. Udokumentuj decyzje bezpieczeństwa (generic success message)

---

## Podsumowanie

Ten plan implementacji dostarcza wszystkie niezbędne informacje do stworzenia widoku resetowania hasła zgodnego z wymaganiami PRD i user stories. Kluczowe aspekty to:

- ✅ Prosta, intuicyjna walidacja
- ✅ Bezpieczny generic success message
- ✅ Pełna obsługa błędów i edge cases
- ✅ Accessibility (a11y)
- ✅ Integracja z Supabase
- ✅ Zgodność z tech stackiem (Astro + React + TypeScript)

Kolejne kroki po implementacji tego widoku to stworzenie strony `/update-password` do ustawienia nowego hasła po kliknięciu w link z emaila.
