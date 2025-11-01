import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ActionButtonsProps {
  /** Tryb pracy formularza */
  mode: "create" | "edit";
  /** Czy trwa submit */
  isSubmitting: boolean;
  /** Czy formularz został zmodyfikowany (używane tylko w edit mode) */
  isDirty: boolean;
  /** Callback anulowania (tylko w edit mode) */
  onCancel?: () => void;
  /** Custom label dla przycisku submit */
  submitLabel?: string;
}

/**
 * Kontener przycisków akcji formularza
 * W trybie "create" wyświetla tylko przycisk submit
 * W trybie "edit" wyświetla przycisk submit i przycisk anuluj
 */
export function ActionButtons({ mode, isSubmitting, isDirty, onCancel, submitLabel }: ActionButtonsProps) {
  const defaultSubmitLabel = mode === "create" ? "Zapisz i wygeneruj plan" : "Zapisz zmiany";
  const label = submitLabel || defaultSubmitLabel;

  // W trybie edit, przycisk submit jest disabled jeśli nie ma zmian
  const isDisabled = isSubmitting || (mode === "edit" && !isDirty);

  return (
    <div className="flex items-center gap-4 justify-end">
      {mode === "edit" && onCancel && (
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} size="lg">
          Anuluj
        </Button>
      )}
      <Button type="submit" disabled={isDisabled} size="lg">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? "Zapisuję..." : label}
      </Button>
    </div>
  );
}
