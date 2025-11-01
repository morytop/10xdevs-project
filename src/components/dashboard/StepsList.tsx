import type { StepsListProps } from "@/lib/viewmodels/dashboard.viewmodel";

/**
 * Lista kroków przygotowania posiłku
 * Wyświetla numerowaną listę instrukcji
 */
export function StepsList({ steps }: StepsListProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Przygotowanie</h3>
      <ol className="space-y-2 list-decimal list-inside">
        {steps.map((step, index) => (
          <li key={index} className="text-sm leading-relaxed">
            <span className="inline">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
