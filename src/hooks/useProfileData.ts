import { useState, useEffect } from "react";
import { getPreferences } from "@/lib/api/preferences.api";
import type { UserPreferencesDTO } from "@/types";

interface UseProfileDataReturn {
  /** Dane preferencji użytkownika lub null jeśli nie znaleziono */
  data: UserPreferencesDTO | null;
  /** Czy trwa ładowanie danych */
  isLoading: boolean;
  /** Komunikat błędu (jeśli wystąpił) */
  error: string | null;
  /** Funkcja do ponownego pobrania danych */
  refetch: () => Promise<void>;
}

/**
 * Hook do pobierania preferencji użytkownika
 * Automatycznie wykonuje redirect na /onboarding jeśli preferencje nie istnieją (404)
 * @returns Obiekt z danymi, stanem ładowania i funkcją refetch
 */
export function useProfileData(): UseProfileDataReturn {
  const [data, setData] = useState<UserPreferencesDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const preferences = await getPreferences();

      if (preferences === null) {
        // Brak preferencji - redirect na onboarding
        window.location.href = "/onboarding";
        return;
      }

      setData(preferences);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się pobrać preferencji. Spróbuj ponownie.";
      setError(errorMessage);
      console.error("[useProfileData]", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  return { data, isLoading, error, refetch: fetchPreferences };
}
