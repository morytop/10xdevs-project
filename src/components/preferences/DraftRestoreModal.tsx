import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DraftRestoreModalProps {
  open: boolean;
  onContinue: () => void;
  onStartNew: () => void;
  onClose: () => void;
}

/**
 * Modal asking user if they want to continue filling the form from saved draft
 * Appears when localStorage contains saved form data from previous session
 */
export function DraftRestoreModal({ open, onContinue, onStartNew, onClose }: DraftRestoreModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chcesz kontynuować wypełnianie?</DialogTitle>
          <DialogDescription>
            Znaleźliśmy zapisany formularz. Czy chcesz kontynuować od miejsca, w którym skończyłeś?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onStartNew}>
            Zacznij od nowa
          </Button>
          <Button onClick={onContinue}>Kontynuuj</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
