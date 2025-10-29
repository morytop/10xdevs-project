import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateUserPreferencesDTO, UpdateUserPreferencesDTO, UserPreferencesDTO } from "@/types";

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class PreferencesServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PreferencesServiceError";
  }
}

export class PreferencesNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PreferencesNotFoundError";
  }
}

export async function createPreferences(
  supabase: SupabaseClient,
  userId: string,
  data: CreateUserPreferencesDTO
): Promise<UserPreferencesDTO> {
  if (!userId) {
    throw new PreferencesServiceError("User ID required");
  }

  const { data: existingPreferences, error: existingError } = await supabase
    .from("user_preferences")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") {
    throw new PreferencesServiceError("Nie udało się sprawdzić preferencji użytkownika");
  }

  if (existingPreferences) {
    throw new ConflictError("Preferencje dla tego użytkownika już istnieją");
  }

  const { data: createdPreferences, error: insertError } = await supabase
    .from("user_preferences")
    .insert({ user_id: userId, ...data })
    .select()
    .single();

  if (insertError) {
    throw new PreferencesServiceError("Nie udało się zapisać preferencji użytkownika");
  }

  return createdPreferences;
}

export async function getPreferences(supabase: SupabaseClient, userId: string): Promise<UserPreferencesDTO> {
  if (!userId) {
    throw new PreferencesServiceError("User ID required");
  }

  const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new PreferencesServiceError("Nie udało się pobrać preferencji użytkownika");
  }

  if (!data) {
    throw new PreferencesNotFoundError("Preferencje użytkownika nie istnieją");
  }

  return data;
}

export async function updatePreferences(
  supabase: SupabaseClient,
  userId: string,
  payload: UpdateUserPreferencesDTO
): Promise<UserPreferencesDTO> {
  if (!userId) {
    throw new PreferencesServiceError("User ID required");
  }

  const updateData = removeUndefined(payload);

  if (Object.keys(updateData).length === 0) {
    throw new PreferencesServiceError("Dane aktualizacji są wymagane");
  }

  const { data: existingPreferences, error: fetchError } = await supabase
    .from("user_preferences")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError && fetchError.code !== "PGRST116") {
    throw new PreferencesServiceError("Nie udało się sprawdzić preferencji użytkownika");
  }

  if (!existingPreferences) {
    throw new PreferencesNotFoundError("Preferencje użytkownika nie istnieją");
  }

  const { data: updatedPreferences, error: updateError } = await supabase
    .from("user_preferences")
    .update(updateData)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError) {
    if (updateError.code === "PGRST116") {
      throw new PreferencesNotFoundError("Preferencje użytkownika nie istnieją");
    }

    throw new PreferencesServiceError("Nie udało się zaktualizować preferencji użytkownika");
  }

  return updatedPreferences;
}

function removeUndefined<T extends Record<string, unknown>>(payload: T): Partial<T> {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as Partial<T>;
}
