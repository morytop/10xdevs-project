import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { supabaseClient } from "@/db/supabase.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * UpdatePasswordForm Component
 *
 * Formularz do ustawiania nowego hasła po kliknięciu w link resetujący.
 * Waliduje token recovery z Supabase, weryfikuje poprawność hasła
 * i aktualizuje hasło użytkownika.
 */
export default function UpdatePasswordForm() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Sprawdzenie czy użytkownik ma aktywną sesję recovery
   * (przyszedł z linku w emailu)
   */
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error || !data.session) {
          setIsTokenValid(false);
          setApiError("Link resetujący wygasł lub jest nieprawidłowy. Poproś o nowy link.");
          return;
        }

        setIsTokenValid(true);
      } catch {
        setIsTokenValid(false);
        setApiError("Nie udało się zweryfikować linku. Spróbuj ponownie.");
      }
    };

    checkSession();
  }, []);

  // ============================================================================
  // VALIDATION FUNCTIONS
  // ============================================================================

  /**
   * Walidacja pola hasła
   * @param password - Hasło do walidacji
   * @returns Komunikat błędu lub null jeśli poprawne
   */
  const validatePassword = (password: string): string | null => {
    if (!password.trim()) {
      return "Hasło jest wymagane";
    }

    if (password.length < 8) {
      return "Hasło musi mieć co najmniej 8 znaków";
    }

    return null;
  };

  /**
   * Walidacja pola potwierdzenia hasła
   * @param confirmPassword - Potwierdzenie hasła
   * @param originalPassword - Oryginalne hasło
   * @returns Komunikat błędu lub null jeśli poprawne
   */
  const validateConfirmPassword = (confirmPassword: string, originalPassword: string): string | null => {
    if (!confirmPassword.trim()) {
      return "Potwierdzenie hasła jest wymagane";
    }

    if (confirmPassword !== originalPassword) {
      return "Hasła nie są identyczne";
    }

    return null;
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Obsługa zmiany wartości pola hasła
   * @param e - Event z pola input
   */
  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);

    // Reset błędów podczas wpisywania
    if (passwordError) {
      setPasswordError("");
    }
    if (apiError) {
      setApiError("");
    }
    // Jeśli confirmPassword już ma wartość, zwaliduj ponownie
    if (confirmPassword && confirmPasswordError) {
      setConfirmPasswordError("");
    }
  };

  /**
   * Obsługa zmiany wartości pola potwierdzenia hasła
   * @param e - Event z pola input
   */
  const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);

    // Reset błędu podczas wpisywania
    if (confirmPasswordError) {
      setConfirmPasswordError("");
    }
    if (apiError) {
      setApiError("");
    }
  };

  /**
   * Toggle widoczności hasła
   */
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  /**
   * Toggle widoczności potwierdzenia hasła
   */
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  /**
   * Obsługa submit formularza
   * @param e - Event formularza
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    // Zapobieganie domyślnej akcji formularza
    e.preventDefault();

    // Reset poprzednich błędów
    setPasswordError("");
    setConfirmPasswordError("");
    setApiError("");

    // Walidacja pola hasła
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    // Walidacja pola potwierdzenia hasła
    const confirmPasswordValidationError = validateConfirmPassword(confirmPassword, password);
    if (confirmPasswordValidationError) {
      setConfirmPasswordError(confirmPasswordValidationError);
      return;
    }

    // Wywołanie API
    setIsLoading(true);

    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      // Sukces
      setIsSuccess(true);

      // Przekierowanie po 2 sekundach
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Update password error:", err);
      setApiError("Wystąpił błąd podczas aktualizacji hasła. Spróbuj ponownie później.");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // RENDER - LOADING STATE (checking token)
  // ============================================================================

  if (isTokenValid === null) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <p className="text-gray-600">Weryfikowanie linku...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - INVALID TOKEN STATE
  // ============================================================================

  if (isTokenValid === false) {
    return (
      <div className="space-y-6 bg-white shadow-lg rounded-lg p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{apiError || "Link resetujący wygasł lub jest nieprawidłowy."}</AlertDescription>
        </Alert>

        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">Poproś o nowy link do resetowania hasła.</p>
          <div className="flex flex-col gap-2">
            <a href="/reset-password" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
              Wyślij nowy link
            </a>
            <a href="/login" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
              Wróć do logowania
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - SUCCESS STATE
  // ============================================================================

  if (isSuccess) {
    return (
      <div className="space-y-6 bg-white shadow-lg rounded-lg p-8">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Hasło zostało pomyślnie zmienione! Za chwilę zostaniesz przekierowany do logowania.
          </AlertDescription>
        </Alert>

        <div className="text-center">
          <a href="/login" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
            Przejdź do logowania
          </a>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - FORM STATE
  // ============================================================================

  return (
    <div className="space-y-6 bg-white shadow-lg rounded-lg p-8">
      {/* Błąd API */}
      {apiError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      {/* Formularz */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Pole nowego hasła */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Nowe hasło <span className="text-red-600">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Co najmniej 8 znaków"
              value={password}
              onChange={handlePasswordChange}
              disabled={isLoading}
              required
              autoComplete="new-password"
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? "password-error" : undefined}
              className={passwordError ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"}
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
          {passwordError && (
            <p id="password-error" role="alert" className="text-sm text-red-600">
              {passwordError}
            </p>
          )}
        </div>

        {/* Pole potwierdzenia hasła */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
            Potwierdź hasło <span className="text-red-600">*</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Wprowadź hasło ponownie"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              disabled={isLoading}
              required
              autoComplete="new-password"
              aria-invalid={!!confirmPasswordError}
              aria-describedby={confirmPasswordError ? "confirm-password-error" : undefined}
              className={confirmPasswordError ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"}
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
              aria-label={showConfirmPassword ? "Ukryj hasło" : "Pokaż hasło"}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {confirmPasswordError && (
            <p id="confirm-password-error" role="alert" className="text-sm text-red-600">
              {confirmPasswordError}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Aktualizowanie..." : "Ustaw nowe hasło"}
        </Button>
      </form>

      {/* Link powrotny */}
      <div className="text-center">
        <a href="/login" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
          Wróć do logowania
        </a>
      </div>
    </div>
  );
}
