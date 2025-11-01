import { Clock } from "lucide-react";
import type { MealCardHeaderProps } from "@/lib/viewmodels/dashboard.viewmodel";

/**
 * Header karty posiłku z nazwą i czasem przygotowania
 */
export function MealCardHeader({ name, time }: MealCardHeaderProps) {
  return (
    <div className="space-y-2 pb-4 border-b">
      <h2 className="text-xl font-bold leading-tight">{name}</h2>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Clock size={16} />
        <span className="text-sm font-medium">{time} min</span>
      </div>
    </div>
  );
}
