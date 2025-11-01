import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FeedbackButtonsProps } from "@/lib/viewmodels/dashboard.viewmodel";
import { cn } from "@/lib/utils";

/**
 * Para buttonów thumbs up i thumbs down do oceny planu
 * Obsługuje stan aktywności i submitting state
 */
export function FeedbackButtons({ rating, isSubmitting, onChange }: FeedbackButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isSubmitting}
        onClick={() => onChange("THUMBS_UP")}
        aria-label="Oceń plan pozytywnie"
        aria-pressed={rating === "THUMBS_UP"}
        className={cn(
          "transition-all duration-200 hover:scale-105",
          rating === "THUMBS_UP" && "bg-green-500 text-white hover:bg-green-600 border-green-500 shadow-md"
        )}
      >
        <ThumbsUp size={16} className={cn(rating === "THUMBS_UP" && "fill-current")} />
        <span className="ml-2">Podoba mi się</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isSubmitting}
        onClick={() => onChange("THUMBS_DOWN")}
        aria-label="Oceń plan negatywnie"
        aria-pressed={rating === "THUMBS_DOWN"}
        className={cn(
          "transition-all duration-200 hover:scale-105",
          rating === "THUMBS_DOWN" && "bg-red-500 text-white hover:bg-red-600 border-red-500 shadow-md"
        )}
      >
        <ThumbsDown size={16} className={cn(rating === "THUMBS_DOWN" && "fill-current")} />
        <span className="ml-2">Nie podoba mi się</span>
      </Button>
    </div>
  );
}
