import { vi } from "vitest";
import type { PreferencesFormData } from "@/lib/viewmodels/preferences.viewmodel";
import type { MealPlanDTO } from "@/types";

/**
 * Test helpers and fixtures for custom hooks tests
 */

export const createMockFormData = (overrides: Partial<PreferencesFormData> = {}): PreferencesFormData => ({
  health_goal: "LOSE_WEIGHT",
  diet_type: "STANDARD",
  activity_level: 3,
  allergies: [],
  disliked_products: [],
  ...overrides,
});

export const createMockMealPlan = (overrides: Partial<MealPlanDTO> = {}): MealPlanDTO => ({
  id: "test-plan-id",
  user_id: "test-user-id",
  meals: [
    {
      name: "Śniadanie",
      ingredients: [
        { name: "Owsianka", amount: "50g" },
        { name: "Banan", amount: "1 sztuka" },
      ],
      steps: ["Ugotuj owsiankę", "Dodaj banana"],
      time: 10,
    },
    {
      name: "Obiad",
      ingredients: [
        { name: "Kurczak", amount: "150g" },
        { name: "Ryż", amount: "100g" },
      ],
      steps: ["Ugotuj ryż", "Usmaż kurczaka"],
      time: 25,
    },
    {
      name: "Kolacja",
      ingredients: [
        { name: "Sałata", amount: "200g" },
        { name: "Pomidor", amount: "2 sztuki" },
      ],
      steps: ["Umyj składniki", "Przygotuj sałatkę"],
      time: 5,
    },
  ],
  status: "generated",
  created_at: new Date().toISOString(),
  generated_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Mock implementations for common dependencies
 */
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

export const mockFetch = (response: unknown, status = 200) => {
  return vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    })
  );
};

/**
 * Helper to create delay for async tests
 */
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper to wait for hooks to update
 */
export const waitForHookUpdate = () => new Promise((resolve) => setTimeout(resolve, 0));
