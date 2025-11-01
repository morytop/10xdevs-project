import { useMemo } from "react";
import type { PreferencesFormData } from "@/lib/viewmodels/preferences.viewmodel";

/**
 * Hook do śledzenia czy formularz został zmodyfikowany względem początkowych danych
 * Wykonuje deep comparison na wszystkich polach formularza
 * @param initialData - początkowe dane formularza
 * @param currentData - obecne dane formularza
 * @returns boolean - true jeśli formularz jest "brudny" (ma niezapisane zmiany)
 */
export function useDirtyForm(
  initialData: PreferencesFormData | null | undefined,
  currentData: PreferencesFormData
): boolean {
  return useMemo(() => {
    if (!initialData) return false;

    // Porównanie prostych pól
    if (initialData.health_goal !== currentData.health_goal) return true;
    if (initialData.diet_type !== currentData.diet_type) return true;
    if (initialData.activity_level !== currentData.activity_level) return true;

    // Porównanie tablic alergii (sorted + stringify dla uniknięcia problemu z kolejnością)
    const initialAllergies = [...(initialData.allergies || [])].sort();
    const currentAllergies = [...(currentData.allergies || [])].sort();
    if (JSON.stringify(initialAllergies) !== JSON.stringify(currentAllergies)) {
      return true;
    }

    // Porównanie tablic produktów nielubanych
    const initialProducts = [...(initialData.disliked_products || [])].sort();
    const currentProducts = [...(currentData.disliked_products || [])].sort();
    if (JSON.stringify(initialProducts) !== JSON.stringify(currentProducts)) {
      return true;
    }

    return false;
  }, [initialData, currentData]);
}
