import type { HealthGoal, DietType, UserPreferencesDTO } from "@/types";

/**
 * Form data structure matching Zod schema output
 * Używany jako typ dla formularza i localStorage draft
 */
export interface PreferencesFormData {
  health_goal: HealthGoal | "";
  diet_type: DietType | "";
  activity_level: number | null;
  allergies?: string[];
  disliked_products?: string[];
}

/**
 * Default/empty form values
 */
export const defaultPreferencesFormData: PreferencesFormData = {
  health_goal: "",
  diet_type: "",
  activity_level: null,
  allergies: [],
  disliked_products: [],
};

/**
 * Stan głównego widoku profilu
 */
export interface ProfileViewState {
  /** Czy trwa ładowanie początkowe danych */
  isLoading: boolean;
  /** Czy trwa zapisywanie zmian */
  isSaving: boolean;
  /** Czy formularz został zmodyfikowany */
  isDirty: boolean;
  /** Komunikat błędu (jeśli wystąpił) */
  error: string | null;
  /** Oryginalne dane użytkownika z API */
  initialData: UserPreferencesDTO | null;
  /** Obecny stan formularza */
  formData: PreferencesFormData;
}

/**
 * Props formularza preferencji
 */
export interface PreferencesFormProps {
  /** Tryb pracy formularza */
  mode: "create" | "edit";
  /** Początkowe dane (tylko w edit mode) */
  initialData?: PreferencesFormData;
  /** Callback po submit */
  onSubmit: (data: PreferencesFormData) => Promise<void>;
  /** Callback anulowania (tylko w edit mode) */
  onCancel?: () => void;
  /** Czy trwa submit */
  isSubmitting: boolean;
}

/**
 * Response z API przy błędzie
 */
export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: string[];
}

/**
 * Konwertuje UserPreferencesDTO na PreferencesFormData
 * Używane przy ładowaniu danych do edycji
 */
export function preferencesToFormData(preferences: UserPreferencesDTO): PreferencesFormData {
  return {
    health_goal: preferences.health_goal,
    diet_type: preferences.diet_type,
    activity_level: preferences.activity_level,
    allergies: preferences.allergies || [],
    disliked_products: preferences.disliked_products || [],
  };
}

/**
 * Health goal option for select dropdown
 */
export interface HealthGoalOption {
  value: HealthGoal;
  label: string;
}

export const healthGoalOptions: HealthGoalOption[] = [
  { value: "LOSE_WEIGHT", label: "Schudnąć" },
  { value: "GAIN_WEIGHT", label: "Przybrać na wadze" },
  { value: "MAINTAIN_WEIGHT", label: "Utrzymać wagę" },
  { value: "HEALTHY_EATING", label: "Zdrowo jeść" },
  { value: "BOOST_ENERGY", label: "Zwiększyć energię" },
];

/**
 * Diet type option for select dropdown
 */
export interface DietTypeOption {
  value: DietType;
  label: string;
}

export const dietTypeOptions: DietTypeOption[] = [
  { value: "STANDARD", label: "Standardowa" },
  { value: "VEGETARIAN", label: "Wegetariańska" },
  { value: "VEGAN", label: "Wegańska" },
  { value: "GLUTEN_FREE", label: "Bezglutenowa" },
];

/**
 * Activity level option with description
 */
export interface ActivityLevelOption {
  value: number;
  label: string;
  description: string;
}

export const activityLevelOptions: ActivityLevelOption[] = [
  { value: 1, label: "Siedzący tryb życia", description: "brak aktywności" },
  { value: 2, label: "Lekka aktywność", description: "spacery, lekkie prace" },
  { value: 3, label: "Umiarkowana aktywność", description: "trening 3x w tygodniu" },
  { value: 4, label: "Wysoka aktywność", description: "trening 5x w tygodniu" },
  { value: 5, label: "Bardzo wysoka aktywność", description: "sport intensywny codziennie" },
];

/**
 * Allergy checkbox option
 */
export interface AllergyOption {
  value: string;
  label: string;
  isOther?: boolean;
}

export const allergyOptions: AllergyOption[] = [
  { value: "Gluten", label: "Gluten" },
  { value: "Laktoza", label: "Laktoza" },
  { value: "Orzechy", label: "Orzechy" },
  { value: "Jajka", label: "Jajka" },
  { value: "Ryby", label: "Ryby" },
  { value: "Skorupiaki", label: "Skorupiaki" },
  { value: "Soja", label: "Soja" },
  { value: "Inne", label: "Inne", isOther: true },
];

/**
 * Product for autocomplete
 */
export interface Product {
  name: string;
}
