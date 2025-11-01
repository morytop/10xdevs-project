import type { FeedbackSectionProps } from "@/lib/viewmodels/dashboard.viewmodel";
import { FeedbackButtons } from "./FeedbackButtons";

/**
 * Sekcja z pytaniem o opinię i buttonami oceny
 * Wizualnie oddzielona od reszty planu
 */
export function FeedbackSection({ feedbackState, onFeedbackChange }: FeedbackSectionProps) {
  return (
    <section className="mt-8 pt-6 border-t" aria-label="Oceń plan posiłków">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-lg font-medium">Czy podoba Ci się ten plan?</p>
        <FeedbackButtons
          rating={feedbackState.rating}
          isSubmitting={feedbackState.isSubmitting}
          onChange={onFeedbackChange}
        />
      </div>
    </section>
  );
}
