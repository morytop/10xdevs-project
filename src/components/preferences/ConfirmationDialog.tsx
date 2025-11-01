import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmationDialogProps {
  /** Czy dialog jest otwarty */
  open: boolean;
  /** Callback zamknięcia */
  onClose: () => void;
  /** Callback potwierdzenia */
  onConfirm: () => void;
  /** Tytuł dialogu */
  title?: string;
  /** Opis dialogu */
  description?: string;
  /** Label przycisku potwierdzenia */
  confirmLabel?: string;
  /** Label przycisku anulowania */
  cancelLabel?: string;
}

/**
 * Dialog potwierdzenia dla akcji użytkownika
 * Używany przy anulowaniu edycji z niezapisanymi zmianami
 */
export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title = "Niezapisane zmiany",
  description = "Masz niezapisane zmiany. Czy na pewno chcesz opuścić stronę?",
  confirmLabel = "Opuść stronę",
  cancelLabel = "Zostań",
}: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
