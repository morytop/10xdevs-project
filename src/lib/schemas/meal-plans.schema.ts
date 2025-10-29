import { z } from "zod";

/**
 * Schema for validating request body of POST /api/meal-plans
 * Used to track whether this is initial generation or regeneration for analytics
 */
export const generateMealPlanSchema = z.object({
  regeneration: z.boolean().optional().default(false),
});

/**
 * Schema for validating ingredient structure from LLM response
 * Ensures each ingredient has both name and amount
 */
export const ingredientSchema = z.object({
  name: z.string().min(1, "Nazwa składnika nie może być pusta"),
  amount: z.string().min(1, "Ilość nie może być pusta"),
});

/**
 * Schema for validating individual meal structure from LLM response
 * Ensures meal has all required fields with proper types
 */
export const mealSchema = z.object({
  name: z.string().min(1, "Nazwa posiłku nie może być pusta"),
  ingredients: z.array(ingredientSchema),
  steps: z.array(z.string()),
  time: z.number().int().positive("Czas musi być liczbą dodatnią"),
});

/**
 * Schema for validating array of exactly 3 meals from LLM response
 * Enforces tuple structure: [breakfast, lunch, dinner]
 */
export const mealsArraySchema = z.tuple([mealSchema, mealSchema, mealSchema]);
