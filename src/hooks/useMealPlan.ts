import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { MealPlanDTO, GenerateMealPlanDTO } from "@/types";
import type { DashboardState } from "@/lib/viewmodels/dashboard.viewmodel";

/**
 * Hook zarządzający stanem planu posiłków
 * Obsługuje pobieranie, generowanie i anulowanie planu
 *
 * @returns obiekt z stanem i funkcjami do zarządzania planem
 */
export function useMealPlan() {
  const [state, setState] = useState<DashboardState>({ type: "empty" });
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Pobiera aktualny plan użytkownika z API
   */
  const fetchCurrentPlan = async (): Promise<void> => {
    try {
      const response = await fetch("/api/meal-plans/current", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // 404 - brak planu (normalne dla nowego użytkownika)
      if (response.status === 404) {
        setState({ type: "empty" });
        return;
      }

      // 401 - niezalogowany, redirect do strony głównej
      if (response.status === 401) {
        window.location.href = "/";
        return;
      }

      // Inne błędy
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Wystąpił błąd podczas pobierania planu" }));
        setState({
          type: "error",
          message: error.message || "Wystąpił błąd podczas pobierania planu",
          retryable: true,
        });
        return;
      }

      // Sukces - walidacja i zapisanie planu
      const plan: MealPlanDTO = await response.json();

      // Walidacja struktury planu
      if (!plan.meals || plan.meals.length !== 3) {
        throw new Error("Invalid meal plan structure - expected 3 meals");
      }

      // Walidacja każdego posiłku
      plan.meals.forEach((meal, index) => {
        if (
          !meal.name ||
          !Array.isArray(meal.ingredients) ||
          !Array.isArray(meal.steps) ||
          typeof meal.time !== "number"
        ) {
          throw new Error(`Invalid meal structure at position ${index + 1}`);
        }
      });

      // Walidacja statusu
      if (plan.status !== "generated") {
        throw new Error("Plan status is not 'generated'");
      }

      setState({ type: "loaded", plan });
    } catch (error) {
      if (error instanceof Error) {
        setState({
          type: "error",
          message: error.message || "Wystąpił błąd podczas pobierania planu",
          retryable: true,
        });
      }
    }
  };

  /**
   * Generuje nowy plan posiłków
   * @param isRegeneration - czy to regeneracja istniejącego planu
   */
  const generatePlan = async (isRegeneration: boolean): Promise<void> => {
    // Zapisz poprzedni plan jeśli istnieje
    const previousPlan = state.type === "loaded" ? state.plan : undefined;

    // Utwórz nowy AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Zmień stan na generating
    setState({
      type: "generating",
      startTime: Date.now(),
      previousPlan,
    });

    try {
      const body: GenerateMealPlanDTO = {
        regeneration: isRegeneration,
      };

      const response = await fetch("/api/meal-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      // 400 - brak preferencji
      if (response.status === 400) {
        const error = await response.json().catch(() => ({
          message: "Najpierw wypełnij swoje preferencje żywieniowe",
        }));
        setState({
          type: "error",
          message: error.message || "Najpierw wypełnij swoje preferencje żywieniowe",
          retryable: false,
          previousPlan,
        });
        return;
      }

      // 401 - token wygasł
      if (response.status === 401) {
        window.location.href = "/";
        return;
      }

      // 503 - serwis niedostępny
      if (response.status === 503) {
        setState({
          type: "error",
          message: "Serwis AI jest chwilowo niedostępny. Spróbuj za chwilę.",
          retryable: true,
          previousPlan,
        });
        return;
      }

      // 504 - timeout
      if (response.status === 504) {
        setState({
          type: "error",
          message: "Generowanie planu trwa zbyt długo. Spróbuj ponownie.",
          retryable: true,
          previousPlan,
        });
        return;
      }

      // Inne błędy
      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Nie udało się wygenerować planu. Spróbuj ponownie.",
        }));
        setState({
          type: "error",
          message: error.message || "Nie udało się wygenerować planu. Spróbuj ponownie.",
          retryable: true,
          previousPlan,
        });
        return;
      }

      // Sukces
      const plan: MealPlanDTO = await response.json();

      // Walidacja struktury
      if (!plan.meals || plan.meals.length !== 3) {
        throw new Error("Invalid meal plan structure - expected 3 meals");
      }

      setState({ type: "loaded", plan });

      // Analytics tracking w tle (fire-and-forget)
      fetch("/api/analytics/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action_type: isRegeneration ? "plan_regenerated" : "plan_generated",
          context: {
            plan_id: plan.id,
          },
        }),
      }).catch((error) => {
        console.error("Failed to track plan generation:", error);
      });
    } catch (error) {
      // Obsługa AbortError (anulowanie przez użytkownika)
      if (error instanceof Error && error.name === "AbortError") {
        // Powrót do poprzedniego stanu
        if (previousPlan) {
          setState({ type: "loaded", plan: previousPlan });
        } else {
          setState({ type: "empty" });
        }
        toast.info("Generowanie przerwane");
        return;
      }

      // Błędy sieci
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setState({
          type: "error",
          message: "Błąd połączenia. Sprawdź swoje połączenie internetowe.",
          retryable: true,
          previousPlan,
        });
        return;
      }

      // Inne błędy
      setState({
        type: "error",
        message: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
        retryable: true,
        previousPlan,
      });
    }
  };

  /**
   * Anuluje trwające generowanie planu
   */
  const cancelGeneration = (): void => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  // Fetch initial plan przy mount
  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  return {
    state,
    generatePlan,
    cancelGeneration,
    refetch: fetchCurrentPlan,
  };
}
