import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { supabaseClient } from "@/db/supabase.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthError } from "@supabase/supabase-js";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * LoginForm Component
 *
 * Główny interaktywny formularz logowania. Zarządza stanem formularza,
 * walidacją po stronie klienta, komunikacją z Supabase Auth oraz obsługą błędów.
 * Komponent jest w pełni dostępny (accessibility) i responsywny.
 */
export function LoginForm() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [touched, setTouched] = useState<TouchedFields>({
    email: false,
    password: false,
  });

  // ============================================================================
  // VALIDATION FUNCTIONS
  // ============================================================================

  /**
   * Walidacja pola email
   * @param email - Email do walidacji
   * @returns Komunikat błędu lub undefined jeśli poprawny
   */
  const validateEmail = (email: string): string | undefined => {
    // Sprawdzenie czy pole nie jest puste
    if (!email.trim()) {
      return "Email jest wymagany";
    }

    // Sprawdzenie formatu email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Podaj prawidłowy adres email";
    }

    return undefined;
  };

  /**
   * Walidacja pola hasła
   * @param password - Hasło do walidacji
   * @returns Komunikat błędu lub undefined jeśli poprawne
   */
  const validatePassword = (password: string): string | undefined => {
    // Sprawdzenie czy pole nie jest puste
    if (!password.trim()) {
      return "Hasło jest wymagane";
    }

    return undefined;
  };

  /**
   * Walidacja całego formularza
   * @returns True jeśli formularz jest poprawny, false w przeciwnym razie
   */
  const validateForm = (): boolean => {
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    const newErrors: ValidationErrors = {};
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);

    // Oznaczenie wszystkich pól jako touched
    setTouched({
      email: true,
      password: true,
    });

    // Zwrócenie true jeśli brak błędów
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Obsługa zmiany wartości pola input
   * @param field - Nazwa pola
   * @param value - Nowa wartość
   */
  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    // Aktualizacja formData
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Czyszczenie błędu dla zmienianego pola
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }

    // Czyszczenie błędu globalnego przy jakiejkolwiek zmianie
    if (errors.general) {
      setErrors((prev) => ({
        ...prev,
        general: undefined,
      }));
    }
  };

  /**
   * Obsługa opuszczenia pola (blur)
   * @param field - Nazwa pola
   */
  const handleBlur = (field: keyof LoginFormData) => {
    // Oznaczenie pola jako touched
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));

    // Walidacja pola
    let fieldError: string | undefined;
    if (field === "email") {
      fieldError = validateEmail(formData.email);
    } else if (field === "password") {
      fieldError = validatePassword(formData.password);
    }

    // Ustawienie błędu jeśli niepoprawne
    if (fieldError) {
      setErrors((prev) => ({
        ...prev,
        [field]: fieldError,
      }));
    }
  };

  /**
   * Toggle widoczności hasła
   */
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  /**
   * Mapowanie błędów Supabase na user-friendly komunikaty
   * @param error - Błąd z Supabase Auth
   */
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
    else if (error.message.includes("network") || error.message.includes("fetch")) {
      errorMessage = "Sprawdź połączenie internetowe i spróbuj ponownie";
    }
    // Server errors
    else if (error.status === 500 || (error.status && error.status >= 500)) {
      errorMessage = "Wystąpił błąd serwera. Spróbuj ponownie za chwilę";
    }

    setErrors({ general: errorMessage });
    toast.error(errorMessage);
  };

  /**
   * Obsługa submit formularza
   * @param e - Event formularza
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // Zapobieganie domyślnej akcji formularza
    e.preventDefault();

    // Walidacja całego formularza
    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    // Ustawienie loading state
    setIsLoading(true);

    // Wyczyszczenie poprzednich błędów
    setErrors({});

    try {
      // Wywołanie Supabase Auth API
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (error) {
        // Log error for debugging purposes
        // console.error("Supabase Auth Error:", error);
        handleAuthError(error);
        return;
      }

      // Sukces - sesja została automatycznie zapisana przez Supabase
      if (data.session) {
        toast.success("Witaj ponownie!");

        // Odczytaj parametr redirectTo z URL (jeśli istnieje)
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get("redirectTo");

        // Przekierowanie: prioritetowo na redirectTo, domyślnie na /dashboard
        window.location.href = redirectTo || "/dashboard";
      }
    } catch {
      // Obsługa nieoczekiwanych błędów
      setErrors({ general: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie" });
      toast.error("Wystąpił nieoczekiwany błąd");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const isSubmitDisabled = isLoading || !formData.email || !formData.password;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="bg-white shadow-lg rounded-lg p-8">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Zaloguj się</h1>
        <p className="text-gray-600">Wpisz swoje dane, aby uzyskać dostęp do konta</p>
      </div>

      {/* General Error Message */}
      {errors.general && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md" role="alert">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      {/* Form Section */}
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </Label>
          <Input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            autoComplete="email"
            aria-required="true"
            aria-invalid={touched.email && !!errors.email}
            aria-describedby={touched.email && errors.email ? "email-error" : undefined}
            className={touched.email && errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {touched.email && errors.email && (
            <p id="email-error" className="text-sm text-red-600" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Hasło
          </Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              onBlur={() => handleBlur("password")}
              autoComplete="current-password"
              aria-required="true"
              aria-invalid={touched.password && !!errors.password}
              aria-describedby={touched.password && errors.password ? "password-error" : undefined}
              className={
                touched.password && errors.password ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"
              }
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
              aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {touched.password && errors.password && (
            <p id="password-error" className="text-sm text-red-600" role="alert">
              {errors.password}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitDisabled} className="w-full">
          {isLoading ? "Logowanie..." : "Zaloguj się"}
        </Button>
      </form>

      {/* Password Reset Link */}
      <div className="mt-4 text-center">
        <a href="/reset-password" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
          Nie pamiętam hasła
        </a>
      </div>

      {/* Register Link */}
      <div className="mt-6 text-center text-sm text-gray-600">
        Nie masz konta?{" "}
        <a href="/register" className="text-blue-600 hover:text-blue-500 font-medium">
          Zarejestruj się
        </a>
      </div>
    </div>
  );
}
