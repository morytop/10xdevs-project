import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateUserPreferencesDTO } from "@/types";

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

export async function createPreferences(supabase: SupabaseClient, userId: string, data: CreateUserPreferencesDTO) {
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
