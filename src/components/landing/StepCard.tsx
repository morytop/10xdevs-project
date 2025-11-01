export interface StepCardProps {
  /** Numer kroku (1, 2, 3) */
  number: number;
  /** Tytuł kroku */
  title: string;
  /** Opis kroku */
  description: string;
}

/**
 * Card component displaying a single step in the "How it works" section
 * Shows step number, title, and description
 */
export function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="flex flex-col items-center text-center p-6" role="listitem">
      <div
        className="mb-4 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold"
        aria-label={`Krok ${number}`}
      >
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
