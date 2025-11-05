import { supabaseClient } from "@/db/supabase.client";
import type { AuthError } from "@supabase/supabase-js";
import type {
  LoginFormData,
  RegisterFormData,
  ResetPasswordFormData,
  UpdatePasswordFormData,
} from "@/lib/schemas/auth.schema";

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

export class AuthServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthServiceError";
  }
}

export class InvalidCredentialsError extends AuthServiceError {
  constructor() {
    super("Nieprawidłowy email lub hasło");
    this.name = "InvalidCredentialsError";
  }
}

export class UserAlreadyExistsError extends AuthServiceError {
  constructor() {
    super("Ten adres email jest już zajęty");
    this.name = "UserAlreadyExistsError";
  }
}

export class NetworkError extends AuthServiceError {
  constructor() {
    super("Sprawdź połączenie internetowe i spróbuj ponownie");
    this.name = "NetworkError";
  }
}

export class ServerError extends AuthServiceError {
  constructor() {
    super("Wystąpił błąd serwera. Spróbuj ponownie za chwilę");
    this.name = "ServerError";
  }
}

// ============================================================================
// ERROR MAPPING UTILITIES
// ============================================================================

/**
 * Maps Supabase AuthError to user-friendly error messages
 * @param error - Supabase AuthError
 * @returns AuthServiceError instance
 */
function mapAuthError(error: AuthError): AuthServiceError {
  // Invalid credentials (email doesn't exist or wrong password)
  if (
    error.message.includes("Invalid login credentials") ||
    error.message.includes("invalid") ||
    error.status === 400
  ) {
    return new InvalidCredentialsError();
  }

  // Network errors
  if (error.message.includes("network") || error.message.includes("fetch")) {
    return new NetworkError();
  }

  // Server errors
  if (error.status === 500 || (error.status && error.status >= 500)) {
    return new ServerError();
  }

  // Default error
  return new AuthServiceError("Wystąpił błąd. Spróbuj ponownie.");
}

/**
 * Safely extracts error message from unknown error type
 * @param error - Unknown error object
 * @returns Extracted message string
 */
function extractErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const err = error as { message: unknown };
    if (typeof err.message === "string") {
      return err.message;
    }
  }
  return "";
}

// ============================================================================
// AUTH SERVICE FUNCTIONS
// ============================================================================

/**
 * Signs in user with email and password
 * @param data - Login form data
 * @returns Promise with auth response
 * @throws AuthServiceError on failure
 */
export async function signIn(data: LoginFormData) {
  try {
    const { data: authData, error } = await supabaseClient.auth.signInWithPassword({
      email: data.email.trim(),
      password: data.password,
    });

    if (error) {
      throw mapAuthError(error);
    }

    return authData;
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }
    // Handle unexpected errors
    throw new AuthServiceError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie");
  }
}

/**
 * Signs up user with email and password
 * @param data - Register form data
 * @returns Promise with auth response
 * @throws AuthServiceError on failure
 */
export async function signUp(data: RegisterFormData) {
  try {
    const { data: authData, error } = await supabaseClient.auth.signUp({
      email: data.email.trim(),
      password: data.password,
    });

    if (error) {
      // Handle specific signup errors
      const message = extractErrorMessage(error);
      if (
        message.includes("already registered") ||
        message.includes("User already registered") ||
        message.includes("duplicate")
      ) {
        throw new UserAlreadyExistsError();
      }

      throw mapAuthError(error);
    }

    return authData;
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }
    // Handle unexpected errors
    throw new AuthServiceError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie");
  }
}

/**
 * Sends password reset email
 * @param data - Reset password form data
 * @returns Promise with success status
 * @throws AuthServiceError on failure
 */
export async function resetPassword(data: ResetPasswordFormData) {
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      throw mapAuthError(error);
    }

    return { success: true };
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }
    // Handle unexpected errors
    throw new AuthServiceError("Wystąpił błąd. Spróbuj ponownie później.");
  }
}

/**
 * Updates user password (requires active recovery session)
 * @param data - Update password form data
 * @returns Promise with auth response
 * @throws AuthServiceError on failure
 */
export async function updatePassword(data: UpdatePasswordFormData) {
  try {
    const { data: authData, error } = await supabaseClient.auth.updateUser({
      password: data.password,
    });

    if (error) {
      throw mapAuthError(error);
    }

    return authData;
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }
    // Handle unexpected errors
    throw new AuthServiceError("Wystąpił błąd podczas aktualizacji hasła. Spróbuj ponownie później.");
  }
}

/**
 * Checks if user has an active recovery session
 * @returns Promise with session data or null
 * @throws AuthServiceError on failure
 */
export async function getRecoverySession() {
  try {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      throw mapAuthError(error);
    }

    return data.session;
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }
    // Handle unexpected errors
    throw new AuthServiceError("Nie udało się zweryfikować linku. Spróbuj ponownie.");
  }
}
