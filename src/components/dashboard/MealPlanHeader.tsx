import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MealPlanHeaderProps } from "@/lib/viewmodels/dashboard.viewmodel";

/**
 * Header sekcji planu z tytułem i przyciskiem regeneracji
 */
export function MealPlanHeader({ onRegenerate }: MealPlanHeaderProps) {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1">Twój plan posiłków na dzisiaj</h1>
        <p className="text-sm sm:text-base text-muted-foreground">{formattedDate}</p>
      </div>

      <Button
        variant="secondary"
        onClick={onRegenerate}
        className="flex items-center gap-2 sm:shrink-0 transition-all hover:scale-105"
      >
        <RefreshCw size={16} />
        <span>Wygeneruj nowy plan</span>
      </Button>
    </header>
  );
}
