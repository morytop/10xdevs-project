import type { IngredientListProps } from "@/lib/viewmodels/dashboard.viewmodel";

/**
 * Lista składników posiłku
 * Wyświetla składniki z ilościami w formacie "amount name"
 */
export function IngredientList({ ingredients }: IngredientListProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Składniki</h3>
      <ul className="space-y-1.5">
        {ingredients.map((ingredient, index) => (
          <li key={index} className="text-sm flex items-start gap-2">
            <span className="text-muted-foreground mt-0.5">•</span>
            <span>
              <span className="font-medium">{ingredient.amount}</span> {ingredient.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
