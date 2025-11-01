import { Loader2 } from "lucide-react";

/**
 * Loading state dla widoku profilu
 * Wyświetla skeleton loader podczas ładowania danych preferencji
 */
export function LoadingState() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">Ładowanie profilu...</p>
      </div>

      {/* Skeleton dla formularza */}
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-5 w-48 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
