import { ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EmptyStateProps } from "@/lib/viewmodels/dashboard.viewmodel";

/**
 * Empty state gdy użytkownik nie ma jeszcze wygenerowanego planu
 * Zachęca do pierwszego wygenerowania planu
 */
export function EmptyState({ onGenerate, isFirstTime = true }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in duration-500">
      <div className="mb-6 p-6 rounded-full bg-primary/10 animate-in zoom-in duration-700">
        <ChefHat size={48} className="text-primary" />
      </div>

      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 animate-in slide-in-from-bottom-4 duration-700 delay-100">
        {isFirstTime ? "Cześć! Jesteś gotowy na swój pierwszy plan posiłków?" : "Wygeneruj nowy plan"}
      </h2>

      <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-md animate-in slide-in-from-bottom-4 duration-700 delay-200">
        {isFirstTime
          ? "Kliknij poniżej, a AI wygeneruje dla Ciebie spersonalizowany plan na dzisiaj."
          : "Kliknij poniżej, aby wygenerować nowy plan posiłków na dzisiaj."}
      </p>

      <Button
        size="lg"
        onClick={onGenerate}
        className="min-w-[240px] animate-in slide-in-from-bottom-4 duration-700 delay-300"
      >
        {isFirstTime ? "Wygeneruj mój pierwszy plan" : "Wygeneruj plan"}
      </Button>
    </div>
  );
}
