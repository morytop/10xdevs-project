import { useState, useEffect } from "react";

/**
 * Hook do śledzenia upływającego czasu
 * Używany głównie w GeneratingModal do wyświetlania elapsed time
 *
 * @param isActive - czy timer jest aktywny
 * @returns liczba sekund od rozpoczęcia
 */
export function useElapsedTime(isActive: boolean): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  return elapsed;
}
