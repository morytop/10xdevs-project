import { useCallback } from "react";
import { useMealPlan } from "@/hooks/useMealPlan";
import { useFeedback } from "@/hooks/useFeedback";
import { usePlanAcceptanceTracking } from "@/hooks/usePlanAcceptanceTracking";
import { useElapsedTime } from "@/hooks/useElapsedTime";
import { EmptyState } from "./EmptyState";
import { MealPlanView } from "./MealPlanView";
import { GeneratingModal } from "./GeneratingModal";
import { ErrorState } from "./ErrorState";

/**
 * Główny komponent Dashboard zarządzający całym stanem
 * Orchestruje pobieranie planu, generowanie, feedback i tracking
 * Renderuje odpowiedni widok w zależności od stanu
 */
export function DashboardContent() {
  // Główny stan planu
  const { state, generatePlan, cancelGeneration } = useMealPlan();

  // Stan feedbacku
  const { feedbackState, submitFeedback } = useFeedback();

  // Elapsed time dla generowania
  const elapsedTime = useElapsedTime(state.type === "generating");

  // Plan ID dla trackingu (jeśli plan załadowany)
  const planId = state.type === "loaded" ? state.plan.id : null;
  const isGenerating = state.type === "generating";

  // Previous plan dla error state (do retry)
  const previousPlan = state.type === "error" ? state.previousPlan : undefined;

  // Automatyczny tracking akceptacji planu
  usePlanAcceptanceTracking(planId, isGenerating);

  // Określ aria-busy dla accessibility
  const isBusy = state.type === "generating";

  // Memoized handlers to prevent unnecessary re-renders
  const handleGenerateFirst = useCallback(() => {
    generatePlan(false);
  }, [generatePlan]);

  const handleRegenerate = useCallback(() => {
    generatePlan(true);
  }, [generatePlan]);

  const handleFeedbackChange = useCallback(
    (rating: "THUMBS_UP" | "THUMBS_DOWN") => {
      if (planId) {
        submitFeedback(planId, rating);
      }
    },
    [planId, submitFeedback]
  );

  const handleRetry = useCallback(() => {
    const wasRegeneration = previousPlan !== undefined;
    generatePlan(wasRegeneration);
  }, [previousPlan, generatePlan]);

  return (
    <div aria-busy={isBusy} aria-live="polite" role="main">
      {/* Screen reader announcement */}
      <h1 className="sr-only">Dashboard - Plany Posiłków</h1>

      {/* Empty State - brak planu */}
      {state.type === "empty" && <EmptyState onGenerate={handleGenerateFirst} isFirstTime={true} />}

      {/* Loaded State - plan wygenerowany */}
      {state.type === "loaded" && (
        <MealPlanView
          plan={state.plan}
          feedbackState={feedbackState}
          onRegenerate={handleRegenerate}
          onFeedbackChange={handleFeedbackChange}
        />
      )}

      {/* Generating Modal - trwa generowanie */}
      {state.type === "generating" && <GeneratingModal onCancel={cancelGeneration} elapsedTime={elapsedTime} />}

      {/* Error State - błąd generowania */}
      {state.type === "error" && (
        <>
          <ErrorState message={state.message} onRetry={handleRetry} retryable={state.retryable} />

          {/* Jeśli był poprzedni plan, wyświetl go pod błędem */}
          {state.previousPlan && (
            <MealPlanView
              plan={state.previousPlan}
              feedbackState={feedbackState}
              onRegenerate={handleRegenerate}
              onFeedbackChange={handleFeedbackChange}
            />
          )}
        </>
      )}
    </div>
  );
}
