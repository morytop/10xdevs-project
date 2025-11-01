import type { MealPlanDTO, Rating, Meal, Ingredient } from "@/types";

/**
 * Stan głównego widoku Dashboard
 * Union type reprezentujący wszystkie możliwe stany interfejsu
 */
export type DashboardState =
  | { type: "empty" } // Brak planu
  | { type: "loaded"; plan: MealPlanDTO } // Plan załadowany
  | { type: "generating"; startTime: number; previousPlan?: MealPlanDTO } // Generowanie (opcjonalnie z poprzednim planem)
  | { type: "error"; message: string; retryable: boolean; previousPlan?: MealPlanDTO }; // Błąd (opcjonalnie z poprzednim planem)

/**
 * Stan systemu feedbacku
 */
export interface FeedbackState {
  /** ID istniejącego feedbacku (jeśli użytkownik już ocenił) */
  feedbackId: string | null;
  /** Aktualnie wybrana ocena */
  rating: Rating | null;
  /** Czy feedback jest w trakcie wysyłania */
  isSubmitting: boolean;
}

/**
 * Typy błędów API do rozróżnienia strategii obsługi
 */
export type ApiErrorType =
  | "UNAUTHORIZED" // 401 - redirect do logowania
  | "NOT_FOUND" // 404 - brak planu (normalne)
  | "BAD_REQUEST" // 400 - brak preferencji
  | "TIMEOUT" // 504 - timeout
  | "SERVICE_UNAVAILABLE" // 503 - serwis niedostępny
  | "INTERNAL_ERROR" // 500 - błąd serwera
  | "NETWORK_ERROR" // błąd sieci
  | "ABORT_ERROR"; // anulowane przez użytkownika

/**
 * Szczegóły błędu z typem i komunikatem
 */
export interface ApiError {
  type: ApiErrorType;
  message: string;
  retryable: boolean;
}

/**
 * Propsy komponentów
 */

export interface EmptyStateProps {
  onGenerate: () => void;
  isFirstTime?: boolean;
}

export interface MealPlanViewProps {
  plan: MealPlanDTO;
  feedbackState: FeedbackState;
  onRegenerate: () => void;
  onFeedbackChange: (rating: Rating) => void;
}

export interface MealPlanHeaderProps {
  onRegenerate: () => void;
}

export interface MealPlanGridProps {
  meals: [Meal, Meal, Meal];
}

export interface MealCardProps {
  meal: Meal;
  index: number;
}

export interface MealCardHeaderProps {
  name: string;
  time: number;
}

export interface IngredientListProps {
  ingredients: Ingredient[];
}

export interface StepsListProps {
  steps: string[];
}

export interface FeedbackSectionProps {
  feedbackState: FeedbackState;
  onFeedbackChange: (rating: Rating) => void;
}

export interface FeedbackButtonsProps {
  rating: Rating | null;
  isSubmitting: boolean;
  onChange: (rating: Rating) => void;
}

export interface GeneratingModalProps {
  onCancel: () => void;
  elapsedTime: number;
}

export interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  retryable?: boolean;
}
