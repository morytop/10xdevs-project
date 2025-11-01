import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { GeneratingModalProps } from "@/lib/viewmodels/dashboard.viewmodel";

/**
 * Fullscreen modal wyświetlany podczas generowania planu
 * Zawiera loader, status, elapsed time i możliwość anulowania
 */
export function GeneratingModal({ onCancel, elapsedTime }: GeneratingModalProps) {
  return (
    <Dialog open={true} modal={true}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={false}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          onCancel();
        }}
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        aria-busy="true"
        aria-describedby="generating-description"
      >
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" aria-hidden="true" />

          <DialogTitle className="text-2xl font-bold mb-2">Generuję plan...</DialogTitle>

          <DialogDescription id="generating-description" className="text-muted-foreground mb-4">
            To może zająć do 30 sekund
          </DialogDescription>

          {elapsedTime > 0 && (
            <p className="text-sm text-muted-foreground mb-6" role="status" aria-live="polite">
              Minęło: <span className="font-medium">{elapsedTime}s</span>
            </p>
          )}

          {elapsedTime > 30 && (
            <p className="text-sm text-orange-500 mb-6" role="alert" aria-live="assertive">
              Generowanie trwa dłużej niż zwykle...
            </p>
          )}

          <Button variant="outline" onClick={onCancel} className="mt-2">
            Anuluj
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
