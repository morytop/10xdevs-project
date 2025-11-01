import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PreferencesFormSchema } from "@/lib/schemas/preferences.schema";
import {
  defaultPreferencesFormData,
  type PreferencesFormData,
  type PreferencesFormProps,
} from "@/lib/viewmodels/preferences.viewmodel";
import { createPreferences } from "@/lib/api/preferences.api";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useDraftRestore } from "@/hooks/useDraftRestore";
import { FormSection } from "./FormSection";
import { HealthGoalSelect } from "./HealthGoalSelect";
import { DietTypeSelect } from "./DietTypeSelect";
import { ActivityLevelSelect } from "./ActivityLevelSelect";
import { AllergyCheckboxGroup } from "./AllergyCheckboxGroup";
import { ProductCombobox } from "./ProductCombobox";
import { StickyFormFooter } from "./StickyFormFooter";
import { DraftRestoreModal } from "./DraftRestoreModal";
import { ActionButtons } from "./ActionButtons";
import { useDirtyForm } from "@/hooks/useDirtyForm";
import type { CreateUserPreferencesDTO, HealthGoal, DietType } from "@/types";

/**
 * Main preferences form component
 * Manages form state, validation, auto-save, and submission
 * Integrates all form field components and handles draft restoration
 * Supports both "create" and "edit" modes
 */
export function PreferencesForm({
  mode = "create",
  initialData,
  onSubmit: onSubmitProp,
  onCancel,
  isSubmitting: isSubmittingProp,
}: Partial<PreferencesFormProps> = {}) {
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isInternalSubmitting, setIsInternalSubmitting] = useState(false);

  // Use external or internal submitting state
  const isSubmitting = isSubmittingProp !== undefined ? isSubmittingProp : isInternalSubmitting;

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(PreferencesFormSchema),
    defaultValues: initialData || defaultPreferencesFormData,
    mode: "onBlur",
  });

  // Watch all form values for auto-save
  const formData = watch();

  // Draft restoration - only in create mode
  const { draft, showModal, loadDraft, clearDraft: clearDraftModal } = useDraftRestore();

  const handleContinue = () => {
    const draftData = loadDraft();
    if (draftData) {
      // Load draft data into form
      Object.entries(draftData).forEach(([key, value]) => {
        setValue(key as keyof PreferencesFormData, value);
      });
    }
  };

  const handleStartNew = () => {
    clearDraftModal();
  };

  // Auto-save to localStorage - only in create mode
  const { clearDraft: clearAutoSave } = useAutoSave(formData, mode === "create");

  // Track dirty state for edit mode
  const isDirty = useDirtyForm(initialData, formData);

  // Handle redirect after successful submission (only in create mode)
  useEffect(() => {
    if (shouldRedirect && mode === "create") {
      window.location.href = "/dashboard";
    }
  }, [shouldRedirect, mode]);

  const onSubmit = async (data: PreferencesFormData) => {
    // If external onSubmit is provided (edit mode), use it
    if (onSubmitProp) {
      await onSubmitProp(data);
      return;
    }

    // Otherwise use internal create logic (create mode)
    try {
      setIsInternalSubmitting(true);

      // Validate required fields
      if (!data.activity_level) {
        toast.error("Pole 'poziom aktywności' jest wymagane");
        return;
      }

      // Convert form data to DTO
      const dto: CreateUserPreferencesDTO = {
        health_goal: data.health_goal as HealthGoal,
        diet_type: data.diet_type as DietType,
        activity_level: data.activity_level,
        allergies: data.allergies && data.allergies.length > 0 ? data.allergies : undefined,
        disliked_products:
          data.disliked_products && data.disliked_products.length > 0 ? data.disliked_products : undefined,
      };

      // Submit to API
      await createPreferences(dto);

      // Success: clear draft and trigger redirect
      clearAutoSave();
      toast.success("Preferencje zapisane! Generujemy Twój pierwszy plan...");
      setShouldRedirect(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Nie udało się zapisać preferencji. Spróbuj ponownie.";
      toast.error(errorMessage);
    } finally {
      setIsInternalSubmitting(false);
    }
  };

  return (
    <>
      {/* Draft restoration modal - only in create mode */}
      {mode === "create" && showModal && draft && (
        <DraftRestoreModal
          open={showModal}
          onContinue={handleContinue}
          onStartNew={handleStartNew}
          onClose={handleContinue}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-8">
        <FormSection title="Jaki jest Twój główny cel zdrowotny?" required error={errors.health_goal?.message}>
          <HealthGoalSelect
            value={formData.health_goal}
            onChange={(value) => setValue("health_goal", value)}
            error={errors.health_goal?.message}
          />
        </FormSection>

        <FormSection title="Jakiego typu dietę preferujesz?" required error={errors.diet_type?.message}>
          <DietTypeSelect
            value={formData.diet_type}
            onChange={(value) => setValue("diet_type", value)}
            error={errors.diet_type?.message}
          />
        </FormSection>

        <FormSection
          title="Jaki jest Twój poziom aktywności fizycznej?"
          required
          error={errors.activity_level?.message}
        >
          <ActivityLevelSelect
            value={formData.activity_level}
            onChange={(value) => setValue("activity_level", value)}
            error={errors.activity_level?.message}
          />
        </FormSection>

        <FormSection
          title="Czy masz jakieś alergie lub nietolerancje pokarmowe?"
          subtitle="Możesz wybrać maksymalnie 10 pozycji"
          error={errors.allergies?.message}
        >
          <AllergyCheckboxGroup value={formData.allergies || []} onChange={(value) => setValue("allergies", value)} />
        </FormSection>

        <FormSection
          title="Jakich produktów nie lubisz?"
          subtitle="Nie uwzględnimy ich w Twoim planie. Możesz dodać maksymalnie 20 produktów."
          error={errors.disliked_products?.message}
        >
          <ProductCombobox
            value={formData.disliked_products || []}
            onChange={(value) => setValue("disliked_products", value)}
          />
        </FormSection>

        <StickyFormFooter>
          <ActionButtons mode={mode} isSubmitting={isSubmitting} isDirty={isDirty} onCancel={onCancel} />
        </StickyFormFooter>
      </form>
    </>
  );
}
