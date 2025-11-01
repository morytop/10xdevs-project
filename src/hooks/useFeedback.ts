import { useState } from "react";
import { toast } from "sonner";
import type { Rating } from "@/types";
import type { FeedbackState } from "@/lib/viewmodels/dashboard.viewmodel";

/**
 * Hook zarządzający stanem feedbacku
 * Obsługuje tworzenie nowego feedbacku i aktualizację istniejącego
 *
 * @returns obiekt z stanem feedbacku i funkcją do jego wysyłania
 */
export function useFeedback() {
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    feedbackId: null,
    rating: null,
    isSubmitting: false,
  });

  /**
   * Wysyła lub aktualizuje feedback użytkownika
   * Używa optimistic updates dla lepszego UX
   */
  const submitFeedback = async (mealPlanId: string, rating: Rating): Promise<void> => {
    // Zapisz poprzedni stan dla rollback w przypadku błędu
    const previousState = { ...feedbackState };

    // Optimistic update
    setFeedbackState((prev) => ({
      ...prev,
      rating,
      isSubmitting: true,
    }));

    try {
      let response: Response;

      if (feedbackState.feedbackId === null) {
        // Tworzenie nowego feedbacku
        response = await fetch("/api/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating,
            meal_plan_id: mealPlanId,
          }),
        });
      } else {
        // Aktualizacja istniejącego feedbacku
        response = await fetch(`/api/feedback/${feedbackState.feedbackId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating,
          }),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      const feedback = await response.json();

      // Aktualizacja stanu po sukcesie
      setFeedbackState({
        feedbackId: feedback.id,
        rating: feedback.rating,
        isSubmitting: false,
      });

      toast.success("Dziękujemy za opinię!");
    } catch (error) {
      // Log błędu dla debugowania
      console.error("Failed to submit feedback:", error);

      // Rollback do poprzedniego stanu
      setFeedbackState({
        ...previousState,
        isSubmitting: false,
      });

      toast.error("Nie udało się zapisać Twojej opinii. Spróbuj ponownie.");
    }
  };

  return {
    feedbackState,
    submitFeedback,
  };
}
