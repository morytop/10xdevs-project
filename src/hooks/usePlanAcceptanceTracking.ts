import { useEffect, useRef } from "react";

/**
 * Hook do automatycznego trackowania akceptacji planu
 * Wysyła event analytics gdy użytkownik:
 * - Spędził minimum 30 sekund na stronie z planem
 * - Nie regenerował planu przez 2 minuty
 *
 * @param planId - ID aktualnego planu (null jeśli brak planu)
 * @param isGenerating - czy plan jest w trakcie generowania
 */
export function usePlanAcceptanceTracking(planId: string | null, isGenerating: boolean): void {
  const seenTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const acceptanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasTrackedRef = useRef<boolean>(false);

  useEffect(() => {
    // Clear wszystkie timery przy cleanup
    const clearTimers = () => {
      if (seenTimeoutRef.current) {
        clearTimeout(seenTimeoutRef.current);
        seenTimeoutRef.current = null;
      }
      if (acceptanceTimeoutRef.current) {
        clearTimeout(acceptanceTimeoutRef.current);
        acceptanceTimeoutRef.current = null;
      }
    };

    // Jeśli brak planu lub trwa generowanie - wyczyść timery
    if (!planId || isGenerating) {
      clearTimers();
      startTimeRef.current = null;
      hasTrackedRef.current = false;
      return;
    }

    // Rozpocznij tracking dla nowego planu
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
      hasTrackedRef.current = false;
    }

    // Timer 1: Po 30 sekundach zapisz timestamp "seen"
    seenTimeoutRef.current = setTimeout(() => {
      // Plan został zobaczony przez użytkownika (silent tracking)
    }, 30000); // 30 seconds

    // Timer 2: Po 2 minutach wyślij analytics event
    acceptanceTimeoutRef.current = setTimeout(() => {
      // Jeśli użytkownik nie regenerował planu przez 2 minuty - uznajemy to za akceptację
      if (!hasTrackedRef.current && startTimeRef.current) {
        const timeOnPage = Math.floor((Date.now() - startTimeRef.current) / 1000);

        // Wyślij analytics event (fire-and-forget)
        fetch("/api/analytics/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action_type: "plan_accepted",
            context: {
              plan_id: planId,
              time_on_page: timeOnPage,
            },
          }),
        }).catch((error) => {
          // Błędy analytics nie wpływają na UX
          console.error("Failed to track plan acceptance:", error);
        });

        hasTrackedRef.current = true;
      }
    }, 120000); // 2 minutes

    // Cleanup przy unmount lub zmianie dependencies
    return clearTimers;
  }, [planId, isGenerating]);
}
