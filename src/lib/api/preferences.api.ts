import type { CreateUserPreferencesDTO, UpdateUserPreferencesDTO, UserPreferencesDTO } from "@/types";

/**
 * Creates user preferences via API
 * @param data - User preferences data (without user_id, taken from JWT)
 * @returns Created preferences object
 * @throws Error with message from API response
 */
export async function createPreferences(data: CreateUserPreferencesDTO): Promise<UserPreferencesDTO> {
  const response = await fetch("/api/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Nie udało się zapisać preferencji" }));
    throw new Error(error.message || "Nie udało się zapisać preferencji");
  }

  return response.json();
}

/**
 * Fetches current user preferences via API
 * @returns User preferences or null if not found
 * @throws Error with message from API response
 */
export async function getPreferences(): Promise<UserPreferencesDTO | null> {
  const response = await fetch("/api/preferences", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Nie udało się pobrać preferencji" }));
    throw new Error(error.message || "Nie udało się pobrać preferencji");
  }

  return response.json();
}

/**
 * Updates user preferences via API
 * @param data - Partial user preferences data to update
 * @returns Updated preferences object
 * @throws Error with message from API response
 */
export async function updatePreferences(data: UpdateUserPreferencesDTO): Promise<UserPreferencesDTO> {
  const response = await fetch("/api/preferences", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Nie udało się zaktualizować preferencji" }));
    throw new Error(error.message || "Nie udało się zaktualizować preferencji");
  }

  return response.json();
}
