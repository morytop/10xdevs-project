import type { MealPlanViewProps } from "@/lib/viewmodels/dashboard.viewmodel";
import { MealPlanHeader } from "./MealPlanHeader";
import { MealPlanGrid } from "./MealPlanGrid";
import { FeedbackSection } from "./FeedbackSection";

/**
 * Główny kontener dla wyświetlania wygenerowanego planu posiłków
 * Zawiera header, grid z posiłkami oraz sekcję feedbacku
 */
export function MealPlanView({ plan, feedbackState, onRegenerate, onFeedbackChange }: MealPlanViewProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <MealPlanHeader onRegenerate={onRegenerate} />
      <MealPlanGrid meals={plan.meals} />
      <FeedbackSection feedbackState={feedbackState} onFeedbackChange={onFeedbackChange} />
    </div>
  );
}
