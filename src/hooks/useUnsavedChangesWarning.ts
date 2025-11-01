import { useEffect } from "react";

/**
 * Hook do wyświetlania ostrzeżenia przy próbie opuszczenia strony z niezapisanymi zmianami
 * Dodaje event listener na beforeunload, który wyświetla natywny dialog przeglądarki
 * @param isDirty - czy formularz ma niezapisane zmiany
 * @param message - custom komunikat (opcjonalny, może być ignorowany przez przeglądarkę)
 */
export function useUnsavedChangesWarning(
  isDirty: boolean,
  message = "Masz niezapisane zmiany. Czy na pewno chcesz opuścić stronę?"
) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        // Większość nowoczesnych przeglądarek ignoruje custom message i pokazuje własny
        // ale ustawiamy go dla starszych przeglądarek
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, message]);
}
