import type { RegisterFormData, AuthResponse } from "@/lib/schemas/auth.schema";

/**
 * Registers a new user via API
 * @param data - Register form data
 * @returns Promise with auth response
 * @throws Error with message from API response
 */
export async function registerUser(data: RegisterFormData): Promise<AuthResponse> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: data.email.trim(),
      password: data.password,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Wystąpił błąd podczas rejestracji",
    }));
    throw new Error(error.error || error.message || "Wystąpił błąd podczas rejestracji");
  }

  return response.json();
}
