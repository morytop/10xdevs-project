import type { MealCardProps } from "@/lib/viewmodels/dashboard.viewmodel";
import { MealCardHeader } from "./MealCardHeader";
import { IngredientList } from "./IngredientList";
import { StepsList } from "./StepsList";

/**
 * Karta pojedynczego posiłku
 * Wyświetla nagłówek, składniki i kroki przygotowania
 */
export function MealCard({ meal, index }: MealCardProps) {
  const mealTypes = ["Śniadanie", "Obiad", "Kolacja"];
  const mealType = mealTypes[index] || "";

  return (
    <article
      className="bg-card text-card-foreground border rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
      aria-label={`${mealType}: ${meal.name}`}
    >
      <MealCardHeader name={meal.name} time={meal.time} />

      <div className="space-y-6 mt-6">
        <IngredientList ingredients={meal.ingredients} />
        <StepsList steps={meal.steps} />
      </div>
    </article>
  );
}
