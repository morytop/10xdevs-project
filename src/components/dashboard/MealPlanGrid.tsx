import type { MealPlanGridProps } from "@/lib/viewmodels/dashboard.viewmodel";
import { MealCard } from "./MealCard";

/**
 * Responsywny grid dla trzech kart posiłków
 * Mobile: 1 kolumna, Tablet: 2 kolumny, Desktop: 3 kolumny
 */
export function MealPlanGrid({ meals }: MealPlanGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {meals.map((meal, index) => (
        <MealCard key={index} meal={meal} index={index} />
      ))}
    </div>
  );
}
