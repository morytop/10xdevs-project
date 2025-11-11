import { useState, useCallback } from "react";
import { toast } from "sonner";
import { signIn, resetPassword, updatePassword, getRecoverySession } from "@/lib/services/auth.service";
import { registerUser } from "@/lib/api/auth.api";
import type {
  LoginFormData,
  RegisterFormData,
  ResetPasswordFormData,
  UpdatePasswordFormData,
  AuthResponse,
} from "@/lib/schemas/auth.schema";

// ============================================================================
// SHARED AUTH HOOK TYPES
// ============================================================================

interface UseAuthReturn<TData> {
  mutate: (data: TData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

// ============================================================================
// LOGIN HOOK
// ============================================================================

/**
 * Hook for handling user login
 * @returns Object with login function, loading state, and error handling
 */
export function useLogin(): UseAuthReturn<LoginFormData> & {
  onSuccess?: (data: AuthResponse) => void;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await signIn(data);

      if (response.session) {
        toast.success("Witaj ponownie!");

        // Odczytaj parametr redirectTo z URL (jeśli istnieje)
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get("redirectTo");

        // Przekierowanie: prioritetowo na redirectTo, domyślnie na /dashboard
        window.location.href = redirectTo || "/dashboard";
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd podczas logowania";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { mutate, isLoading, error, reset };
}

// ============================================================================
// REGISTER HOOK
// ============================================================================

/**
 * Hook for handling user registration
 * @returns Object with register function, loading state, and error handling
 */
export function useRegister(): UseAuthReturn<RegisterFormData> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await registerUser(data);

      // If registration requires email confirmation, inform the user
      if (response.requiresConfirmation) {
        toast.success("Konto utworzone. Sprawdź skrzynkę — wysłaliśmy link potwierdzający rejestrację.");
        // Redirect user to login so they can sign in after confirming email
        window.location.href = "/login";
        return;
      }

      // If session exists, user is signed in immediately
      if (response.session) {
        toast.success("Witaj w AI Meal Planner!");
        window.location.href = "/onboarding";
        return;
      }

      // Fallback success message
      toast.success("Konto utworzone. Sprawdź skrzynkę e-mail, aby potwierdzić rejestrację.");
      window.location.href = "/login";
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd podczas rejestracji";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { mutate, isLoading, error, reset };
}

// ============================================================================
// RESET PASSWORD HOOK
// ============================================================================

/**
 * Hook for handling password reset requests
 * @returns Object with resetPassword function, loading state, and error handling
 */
export function useResetPassword(): UseAuthReturn<ResetPasswordFormData> & {
  isSuccess: boolean;
  setIsSuccess: (success: boolean) => void;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const mutate = useCallback(async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      await resetPassword(data);
      setIsSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd. Spróbuj ponownie później.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setIsSuccess(false);
  }, []);

  return { mutate, isLoading, error, reset, isSuccess, setIsSuccess };
}

// ============================================================================
// UPDATE PASSWORD HOOK
// ============================================================================

/**
 * Hook for handling password updates
 * @returns Object with updatePassword function, loading state, and error handling
 */
export function useUpdatePassword(): UseAuthReturn<UpdatePasswordFormData> & {
  isSuccess: boolean;
  setIsSuccess: (success: boolean) => void;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const mutate = useCallback(async (data: UpdatePasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      await updatePassword(data);
      setIsSuccess(true);
      toast.success("Hasło zostało pomyślnie zmienione!");

      // Przekierowanie po 2 sekundach
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Wystąpił błąd podczas aktualizacji hasła. Spróbuj ponownie później.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setIsSuccess(false);
  }, []);

  return { mutate, isLoading, error, reset, isSuccess, setIsSuccess };
}

// ============================================================================
// RECOVERY SESSION HOOK
// ============================================================================

/**
 * Hook for checking recovery session validity
 * @returns Object with session data, loading state, and error handling
 */
export function useRecoverySession() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const checkSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await getRecoverySession();
      setIsValid(!!session);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się zweryfikować linku. Spróbuj ponownie.";
      setError(errorMessage);
      setIsValid(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    isValid,
    checkSession,
    refetch: checkSession,
  };
}
