import { useState, type FormEvent, type ChangeEvent } from "react";
import { supabaseClient } from "@/db/supabase.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * ResetPasswordForm Component
 *
 * Interaktywny formularz resetowania hasła. Zarządza walidacją email,
 * komunikacją z Supabase Auth oraz wyświetlaniem komunikatów sukcesu/błędów.
 * Ze względów bezpieczeństwa zawsze wyświetla generic success message.
 */
export default function ResetPasswordForm() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>("");

  // ============================================================================
  // VALIDATION FUNCTIONS
  // ============================================================================

  /**
   * Walidacja pola email
   * @param email - Email do walidacji
   * @returns Komunikat błędu lub null jeśli poprawny
   */
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

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Obsługa zmiany wartości pola email
   * @param e - Event z pola input
   */
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

  /**
   * Obsługa submit formularza
   * @param e - Event formularza
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    // Zapobieganie domyślnej akcji formularza
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
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        throw error;
      }

      // Sukces
      setIsSuccess(true);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Reset password error:", err);
      setApiError("Wystąpił błąd. Spróbuj ponownie później.");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // RENDER - SUCCESS STATE
  // ============================================================================

  // Jeśli sukces - pokaż komunikat
  if (isSuccess) {
    return (
      <div className="space-y-6 bg-white shadow-lg rounded-lg p-8">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Jeśli konto z tym adresem istnieje, wyślemy link do resetowania hasła. Sprawdź swoją skrzynkę email
            (włącznie ze spamem).
          </AlertDescription>
        </Alert>

        <div className="text-center">
          <a href="/login" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
            Wróć do logowania
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
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Adres email <span className="text-red-600">*</span>
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
            autoComplete="email"
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "email-error" : undefined}
            className={emailError ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {emailError && (
            <p id="email-error" role="alert" className="text-sm text-red-600">
              {emailError}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
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
