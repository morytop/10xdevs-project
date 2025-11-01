import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useProfileData } from "@/hooks/useProfileData";
import { useDirtyForm } from "@/hooks/useDirtyForm";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { updatePreferences } from "@/lib/api/preferences.api";
import { preferencesToFormData, type PreferencesFormData } from "@/lib/viewmodels/preferences.viewmodel";
import { PreferencesForm } from "./PreferencesForm";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { ConfirmationDialog } from "./ConfirmationDialog";
import type { UpdateUserPreferencesDTO, HealthGoal, DietType } from "@/types";

/**
 * Główny kontener widoku "Mój Profil"
 * Zarządza stanem, pobieraniem danych, i zapisywaniem zmian preferencji użytkownika
 * Obsługuje:
 * - Pobieranie preferencji (GET /api/preferences)
 * - Aktualizację preferencji (PUT /api/preferences)
 * - Dirty state tracking
 * - Unsaved changes warning
 * - Confirmation dialog przy anulowaniu
 */
export function ProfileView() {
  const [isSaving, setIsSaving] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [initialFormData, setInitialFormData] = useState<PreferencesFormData | null>(null);
  const [formData, setFormData] = useState<PreferencesFormData | null>(null);

  // Pobierz dane preferencji użytkownika
  const { data: preferences, isLoading, error, refetch } = useProfileData();

  // Track dirty state - porównaj initialFormData z formData
  const isDirty = useDirtyForm(initialFormData, formData || ({} as PreferencesFormData));

  // Warning przy opuszczeniu strony z niezapisanymi zmianami
  useUnsavedChangesWarning(isDirty);

  // Pre-fill formData gdy preferences są załadowane
  useEffect(() => {
    if (preferences) {
      const loadedFormData = preferencesToFormData(preferences);
      setInitialFormData(loadedFormData);
      setFormData(loadedFormData);
    }
  }, [preferences]);

  /**
   * Handler submit formularza - aktualizuje preferencje
   */
  const handleSubmit = async (data: PreferencesFormData) => {
    try {
      setIsSaving(true);

      // Walidacja - sprawdź czy są wymagane pola
      if (!data.activity_level) {
        toast.error("Pole 'poziom aktywności' jest wymagane");
        return;
      }

      // Konwersja na DTO (wysyłamy wszystkie pola dla uproszczenia)
      const dto: UpdateUserPreferencesDTO = {
        health_goal: data.health_goal as HealthGoal,
        diet_type: data.diet_type as DietType,
        activity_level: data.activity_level,
        allergies: data.allergies && data.allergies.length > 0 ? data.allergies : null,
        disliked_products: data.disliked_products && data.disliked_products.length > 0 ? data.disliked_products : null,
      };

      // Aktualizuj preferencje
      await updatePreferences(dto);

      // Success - pokaż toast z informacją o przekierowaniu
      toast.success("Profil zaktualizowany! Przekierowuję na dashboard...");

      // Opóźniony redirect (1.5s), żeby użytkownik zobaczył komunikat
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Nie udało się zaktualizować preferencji. Spróbuj ponownie.";
      toast.error(errorMessage);
      console.error("[ProfileView] Update error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handler anulowania - sprawdza dirty state i pokazuje dialog
   */
  const handleCancel = () => {
    if (isDirty) {
      setShowCancelDialog(true);
    } else {
      // Brak zmian, bezpośredni redirect
      window.location.href = "/dashboard";
    }
  };

  /**
   * Potwierdzenie opuszczenia strony z niezapisanymi zmianami
   */
  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    window.location.href = "/dashboard";
  };

  /**
   * Zamknięcie dialogu potwierdzenia
   */
  const handleCloseDialog = () => {
    setShowCancelDialog(false);
  };

  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  // Brak danych (nie powinno się zdarzyć, bo useProfileData robi redirect)
  if (!preferences || !initialFormData) {
    return <ErrorState message="Nie udało się załadować profilu" onRetry={refetch} />;
  }

  return (
    <>
      <PreferencesForm
        mode="edit"
        initialData={initialFormData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSaving}
      />

      <ConfirmationDialog open={showCancelDialog} onClose={handleCloseDialog} onConfirm={handleConfirmCancel} />
    </>
  );
}
