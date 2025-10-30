import type { HealthGoal, DietType } from "@/types";

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
