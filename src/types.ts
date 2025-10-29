// ============================================================================
// DTO Types for AI Meal Planner MVP
// ============================================================================
// This file contains Data Transfer Objects (DTOs) and Command Models that
// represent the structure of data exchanged between the frontend and API.
// All DTOs are derived from database types to ensure type safety.
// ============================================================================

import type { Tables, TablesInsert, TablesUpdate, Enums } from "./db/database.types";

// ============================================================================
// 1. USER PREFERENCES DTOs
// ============================================================================

/**
 * DTO for creating user preferences (POST /api/preferences)
 * Omits user_id as it comes from authenticated JWT token
 */
export type CreateUserPreferencesDTO = Omit<TablesInsert<"user_preferences">, "user_id">;

/**
 * DTO for updating user preferences (PUT /api/preferences)
 * All fields are optional to support partial updates
 */
export type UpdateUserPreferencesDTO = Partial<Omit<TablesUpdate<"user_preferences">, "user_id">>;

/**
 * DTO for user preferences response (GET/POST/PUT responses)
 * Returns the full user preferences object
 */
export type UserPreferencesDTO = Tables<"user_preferences">;

// ============================================================================
// 2. MEAL PLANS DTOs
// ============================================================================

/**
 * Ingredient structure for meal plans
 * Represents a single ingredient with name and amount
 */
export interface Ingredient {
  /** Name of the ingredient (e.g., "Płatki owsiane") */
  name: string;
  /** Amount with European units (e.g., "50g", "200ml", "1 szt.") */
  amount: string;
}

/**
 * Meal structure for meal plans
 * Represents a single meal (breakfast, lunch, or dinner)
 */
export interface Meal {
  /** Full meal name (e.g., "Śniadanie: Owsianka z owocami") */
  name: string;
  /** List of ingredients needed for the meal */
  ingredients: Ingredient[];
  /** Step-by-step preparation instructions */
  steps: string[];
  /** Estimated preparation time in minutes */
  time: number;
}

/**
 * DTO for generating a meal plan (POST /api/meal-plans)
 * Used to track whether this is initial generation or regeneration
 */
export interface GenerateMealPlanDTO {
  /** Whether this is a regeneration of existing plan (for analytics) */
  regeneration?: boolean;
}

/**
 * DTO for meal plan response (GET/POST responses)
 * Extends database Row type with properly typed meals array
 */
export type MealPlanDTO = Omit<Tables<"meal_plans">, "meals" | "status"> & {
  /** Tuple of exactly 3 meals (breakfast, lunch, dinner) */
  meals: [Meal, Meal, Meal];
  /** Meal plan status (never null in API responses) */
  status: MealPlanStatus;
};

// ============================================================================
// 3. FEEDBACK DTOs
// ============================================================================

/**
 * DTO for creating feedback (POST /api/feedback)
 * Omits id, created_at (auto-generated) and meal_plan_id (from context)
 */
export type CreateFeedbackDTO = Omit<TablesInsert<"feedback">, "id" | "created_at" | "meal_plan_id">;

/**
 * DTO for updating feedback (PUT /api/feedback/:id)
 * All fields optional to support partial updates
 */
export type UpdateFeedbackDTO = Partial<Omit<TablesUpdate<"feedback">, "id" | "created_at" | "meal_plan_id">>;

/**
 * DTO for feedback response (GET/POST/PUT responses)
 * Returns the full feedback object
 */
export type FeedbackDTO = Tables<"feedback">;

// ============================================================================
// 4. ANALYTICS EVENTS DTOs
// ============================================================================

/**
 * DTO for logging analytics events (POST /api/analytics/events)
 * Omits id, created_at, user_id (from JWT), and timestamp (auto-generated)
 */
export type LogAnalyticsEventDTO = Omit<
  TablesInsert<"analytics_events">,
  "id" | "created_at" | "user_id" | "timestamp"
>;

// ============================================================================
// 5. ENUM RE-EXPORTS
// ============================================================================
// Re-export enums from database types for convenient access

/** Health goal options for user preferences */
export type HealthGoal = Enums<"health_goal_enum">;

/** Diet type options for user preferences */
export type DietType = Enums<"diet_type_enum">;

/** Rating options for feedback (thumbs up/down) */
export type Rating = Enums<"rating_enum">;

/** Meal plan status (pending, generated, error) */
export type MealPlanStatus = Enums<"status_enum">;

/** Analytics action types for event tracking */
export type ActionType = Enums<"action_type_enum">;

// ============================================================================
// 6. CONSTANT VALUES FOR ENUMS
// ============================================================================
// Re-export enum constants for runtime usage

export { Constants } from "./db/database.types";
