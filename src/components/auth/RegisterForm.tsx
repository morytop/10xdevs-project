import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Server-side registration is handled via the API endpoint at /api/auth/register

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Interface representing register form data
 */
interface RegisterFormData {
  /** User's email address */
  email: string;
  /** User's password (minimum 8 characters) */
  password: string;
  /** Password confirmation (must match password) */
  passwordConfirmation: string;
}

/**
 * Interface representing validation errors for each field
 */
interface ValidationErrors {
  /** Email field validation error */
  email?: string;
  /** Password field validation error */
  password?: string;
  /** Password confirmation field validation error */
  passwordConfirmation?: string;
  /** Global error (e.g., API error) */
  general?: string;
}

/**
 * Interface representing the touched state of form fields
 */
interface TouchedFields {
  email: boolean;
  password: boolean;
  passwordConfirmation: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * RegisterForm component
 * Main registration form with validation, Supabase Auth integration,
 * and complete form state management
 */
export default function RegisterForm() {
  // Form data state
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    passwordConfirmation: "",
  });

  // Validation errors state
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Password visibility state
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState<boolean>(false);

  // Touched fields state (for conditional error display)
  const [touched, setTouched] = useState<TouchedFields>({
    email: false,
    password: false,
    passwordConfirmation: false,
  });

  // ============================================================================
  // Validation Functions
  // ============================================================================

  /**
   * Validate email field
   * @param email - Email value to validate
   * @returns Error message or undefined if valid
   */
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return "Email jest wymagany";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Podaj prawidłowy adres email";
    }

    return undefined;
  };

  /**
   * Validate password field
   * @param password - Password value to validate
   * @returns Error message or undefined if valid
   */
  const validatePassword = (password: string): string | undefined => {
    if (!password.trim()) {
      return "Hasło jest wymagane";
    }

    if (password.length < 8) {
      return "Hasło musi mieć minimum 8 znaków";
    }

    return undefined;
  };

  /**
   * Validate password confirmation field
   * @param password - Original password
   * @param passwordConfirmation - Password confirmation value
   * @returns Error message or undefined if valid
   */
  const validatePasswordConfirmation = (password: string, passwordConfirmation: string): string | undefined => {
    if (!passwordConfirmation.trim()) {
      return "Potwierdzenie hasła jest wymagane";
    }

    if (passwordConfirmation !== password) {
      return "Hasła muszą być identyczne";
    }

    return undefined;
  };

  /**
   * Validate entire form before submission
   * @returns true if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    const confirmError = validatePasswordConfirmation(formData.password, formData.passwordConfirmation);
    if (confirmError) newErrors.passwordConfirmation = confirmError;

    setErrors(newErrors);

    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
      passwordConfirmation: true,
    });

    return Object.keys(newErrors).length === 0;
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle input change
   * @param field - Field name to update
   * @param value - New field value
   */
  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Handle field blur (validate on blur)
   * @param field - Field name that lost focus
   */
  const handleBlur = (field: keyof RegisterFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    let error: string | undefined;

    if (field === "email") {
      error = validateEmail(formData.email);
    } else if (field === "password") {
      error = validatePassword(formData.password);
    } else if (field === "passwordConfirmation") {
      error = validatePasswordConfirmation(formData.password, formData.passwordConfirmation);
    }

    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  /**
   * Toggle password visibility
   * @param field - Which password field to toggle
   */
  const togglePasswordVisibility = (field: "password" | "passwordConfirmation") => {
    if (field === "password") {
      setShowPassword((prev) => !prev);
    } else {
      setShowPasswordConfirmation((prev) => !prev);
    }
  };

  /**
   * Handle authentication errors (server or client)
   * @param error - Error object or message
   */
  const handleAuthError = (error: unknown) => {
    let errorMessage = "Wystąpił błąd. Spróbuj ponownie.";

    // Helper to safely extract message from unknown error
    interface ErrorLike {
      message?: string;
      status?: number;
    }

    const extractMessage = (err: unknown): string => {
      if (typeof err === "string") return err;
      if (err && typeof err === "object" && "message" in err && typeof (err as ErrorLike).message === "string") {
        return (err as ErrorLike).message as string;
      }
      return "";
    };

    const message = String(extractMessage(error));

    if (
      message.includes("already registered") ||
      message.includes("User already registered") ||
      message.includes("duplicate")
    ) {
      errorMessage = "Ten adres email jest już zajęty";
    } else if (message.includes("network") || message.includes("fetch")) {
      errorMessage = "Sprawdź połączenie internetowe i spróbuj ponownie";
    } else if ((error as ErrorLike)?.status === 500 || ((error as ErrorLike)?.status ?? 0) >= 500) {
      errorMessage = "Wystąpił błąd serwera. Spróbuj ponownie za chwilę";
    } else if (message) {
      // Fallback to server-provided message when available
      errorMessage = message;
    }

    setErrors({ general: errorMessage });
    toast.error(errorMessage);
  };

  /**
   * Handle form submission
   * @param e - Form event
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({}); // Clear previous errors

    try {
      // Call our server-side registration endpoint
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim(), password: formData.password }),
      });

      const payload = await res.json();

      if (!res.ok) {
        handleAuthError(payload?.error ?? payload?.message ?? "Wystąpił błąd podczas rejestracji");
        return;
      }

      // If registration requires email confirmation, inform the user
      if (payload?.requiresConfirmation) {
        toast.success("Konto utworzone. Sprawdź skrzynkę — wysłaliśmy link potwierdzający rejestrację.");
        // Redirect user to login so they can sign in after confirming email
        window.location.href = "/login";
        return;
      }

      // If session exists, user is signed in immediately
      if (payload?.session) {
        toast.success("Witaj w AI Meal Planner!");
        window.location.href = "/onboarding";
        return;
      }

      // Fallback success message
      toast.success("Konto utworzone. Sprawdź skrzynkę e-mail, aby potwierdzić rejestrację.");
      window.location.href = "/login";
    } catch (error) {
      // Log unexpected submit errors for debugging
      // eslint-disable-next-line no-console
      console.error("Register submit error:", error);
      setErrors({ general: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie" });
      toast.error("Wystąpił nieoczekiwany błąd");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // Helper: Check if submit button should be disabled
  // ============================================================================

  const isSubmitDisabled = isLoading || !formData.email || !formData.password || !formData.passwordConfirmation;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="bg-white shadow-lg rounded-lg p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Zarejestruj się</h1>
        <p className="text-gray-600">Załóż konto i zacznij korzystać z AI Meal Planner</p>
      </div>

      {/* Form */}
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
            aria-required="true"
            aria-invalid={touched.email && !!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={touched.email && errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {touched.email && errors.email && (
            <p id="email-error" className="text-sm text-red-600 mt-1" role="alert">
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
              aria-required="true"
              aria-invalid={touched.password && !!errors.password}
              aria-describedby={errors.password ? "password-error" : "password-helper"}
              className={
                touched.password && errors.password ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"
              }
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("password")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p id="password-helper" className="text-sm text-gray-500">
            Minimum 8 znaków
          </p>
          {touched.password && errors.password && (
            <p id="password-error" className="text-sm text-red-600 mt-1" role="alert">
              {errors.password}
            </p>
          )}
        </div>

        {/* Password Confirmation Field */}
        <div className="space-y-2">
          <Label htmlFor="passwordConfirmation" className="text-sm font-medium text-gray-700">
            Powtórz hasło
          </Label>
          <div className="relative">
            <Input
              type={showPasswordConfirmation ? "text" : "password"}
              id="passwordConfirmation"
              name="passwordConfirmation"
              value={formData.passwordConfirmation}
              onChange={(e) => handleInputChange("passwordConfirmation", e.target.value)}
              onBlur={() => handleBlur("passwordConfirmation")}
              aria-required="true"
              aria-invalid={touched.passwordConfirmation && !!errors.passwordConfirmation}
              aria-describedby={errors.passwordConfirmation ? "passwordConfirmation-error" : undefined}
              className={
                touched.passwordConfirmation && errors.passwordConfirmation
                  ? "border-red-500 focus-visible:ring-red-500 pr-10"
                  : "pr-10"
              }
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("passwordConfirmation")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label={showPasswordConfirmation ? "Ukryj hasło" : "Pokaż hasło"}
            >
              {showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {touched.passwordConfirmation && errors.passwordConfirmation && (
            <p id="passwordConfirmation-error" className="text-sm text-red-600 mt-1" role="alert">
              {errors.passwordConfirmation}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitDisabled} className="w-full">
          {isLoading ? "Rejestracja..." : "Zarejestruj się"}
        </Button>
      </form>

      {/* Login Link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Masz już konto?{" "}
          <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Zaloguj się
          </a>
        </p>
      </div>
    </div>
  );
}
