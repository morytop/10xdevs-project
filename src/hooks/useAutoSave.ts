import { useEffect, useCallback, useMemo } from "react";
import { debounce } from "lodash-es";

const DRAFT_KEY = "preferences-draft";
const AUTO_SAVE_DELAY = 2000; // 2 sekundy

/**
 * Custom hook for auto-saving form data to localStorage
 * Uses debounce to avoid excessive writes
 *
 * @param data - The data to auto-save
 * @param enabled - Whether auto-save is enabled (default: true)
 * @returns Object with clearDraft function
 */
export function useAutoSave<T>(data: T, enabled = true) {
  const saveToLocalStorage = useCallback((dataToSave: T) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(dataToSave));
    } catch {
      // Silent fail - localStorage might be disabled
    }
  }, []);

  // Create debounced function
  const debouncedSave = useMemo(() => debounce(saveToLocalStorage, AUTO_SAVE_DELAY), [saveToLocalStorage]);

  useEffect(() => {
    if (enabled) {
      debouncedSave(data);
    }

    return () => {
      debouncedSave.cancel();
    };
  }, [data, enabled, debouncedSave]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Silent fail - localStorage might be disabled
    }
  }, []);

  return { clearDraft };
}
