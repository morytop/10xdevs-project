import { useState, useEffect } from "react";
import type { PreferencesFormData } from "@/lib/viewmodels/preferences.viewmodel";

const DRAFT_KEY = "preferences-draft";

/**
 * Custom hook for restoring draft data from localStorage
 * Automatically checks for saved draft on mount and shows modal if found
 *
 * @returns Object with draft data, modal state, and control functions
 */
export function useDraftRestore() {
  const [draft, setDraft] = useState<PreferencesFormData | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft) as PreferencesFormData;
        setDraft(parsed);
        setShowModal(true);
      }
    } catch {
      // Silent fail - localStorage might be disabled or data corrupted
    }
  }, []);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setDraft(null);
      setShowModal(false);
    } catch {
      // Silent fail - localStorage might be disabled
    }
  };

  const loadDraft = () => {
    setShowModal(false);
    return draft;
  };

  return { draft, showModal, loadDraft, clearDraft };
}
