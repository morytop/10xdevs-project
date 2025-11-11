import type { SupabaseClient } from "@/db/supabase.client";
import type { MealPlanDTO, UserPreferencesDTO, Meal } from "@/types";
import { createOpenRouterService } from "./openrouter.service";

/**
 * Custom error for meal plan generation failures
 */
export class MealPlanGenerationError extends Error {
  constructor(
    message: string,
    public retryCount?: number
  ) {
    super(message);
    this.name = "MealPlanGenerationError";
  }
}

/**
 * Custom error for meal plan not found scenarios
 */
export class MealPlanNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MealPlanNotFoundError";
  }
}

/**
 * Custom error for meal plan service failures
 */
export class MealPlanServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MealPlanServiceError";
  }
}

/**
 * Service for managing meal plans
 * Handles generation, retrieval, and persistence of AI-generated meal plans
 */
export class MealPlansService {
  constructor(
    private supabase: SupabaseClient,
    private openRouterService = createOpenRouterService(true)
  ) {}

  /**
   * Generates a new meal plan for a user using AI
   * Creates/updates a meal plan record with 1:1 relationship (one plan per user)
   *
   * @param userId - User's unique identifier
   * @param preferences - User's dietary preferences and requirements
   * @returns Promise resolving to the generated meal plan
   * @throws MealPlanGenerationError if generation fails
   * @throws MealPlanServiceError if database operations fail
   */
  async generateMealPlan(userId: string, preferences: UserPreferencesDTO): Promise<MealPlanDTO> {
    if (!userId) {
      throw new MealPlanServiceError("User ID is required");
    }

    if (!preferences) {
      throw new MealPlanServiceError("User preferences are required");
    }

    try {
      // Step 0: Check if there's already a pending generation in progress
      const existingPlan = await this.checkExistingPlan(userId);
      if (existingPlan?.status === "pending") {
        throw new MealPlanServiceError("Plan jest już generowany. Poczekaj chwilę i spróbuj ponownie.");
      }

      // Step 1: Create/update pending record in database
      await this.createPendingPlan(userId);

      // Step 2: Generate meals using AI (with retry logic and timeout)
      let meals: [Meal, Meal, Meal];

      try {
        meals = await this.openRouterService.generateMealPlan(preferences);
      } catch {
        // Step 3a: Update status to "error" if generation failed
        await this.updatePlanStatus(userId, "error");

        throw new MealPlanGenerationError(
          "Nie udało się wygenerować planu. Spróbuj ponownie.",
          3 // retryCount
        );
      }

      // Step 3b: Save generated meals to database with "generated" status
      const mealPlan = await this.saveMealPlan(userId, meals);

      return mealPlan;
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof MealPlanGenerationError || error instanceof MealPlanServiceError) {
        throw error;
      }

      // Wrap unexpected errors
      throw new MealPlanServiceError("Wystąpił błąd podczas generowania planu");
    }
  }

  /**
   * Retrieves the current (most recent) meal plan for a user
   *
   * @param userId - User's unique identifier
   * @returns Promise resolving to the meal plan or null if not found
   * @throws MealPlanNotFoundError if user has no meal plan
   * @throws MealPlanServiceError if database query fails
   */
  async getCurrentMealPlan(userId: string): Promise<MealPlanDTO | null> {
    if (!userId) {
      throw new MealPlanServiceError("User ID is required");
    }

    try {
      const { data, error } = await this.supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw new MealPlanServiceError("Nie udało się pobrać planu posiłków");
      }

      if (!data) {
        throw new MealPlanNotFoundError("Nie masz jeszcze wygenerowanego planu. Kliknij 'Wygeneruj plan'.");
      }

      // Transform database row to DTO
      return this.transformToDTO(data);
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof MealPlanNotFoundError || error instanceof MealPlanServiceError) {
        throw error;
      }

      // Wrap unexpected errors
      throw new MealPlanServiceError("Wystąpił błąd podczas pobierania planu");
    }
  }

  /**
   * Checks if user has an existing meal plan and returns it
   *
   * @private
   */
  private async checkExistingPlan(userId: string) {
    const { data, error } = await this.supabase
      .from("meal_plans")
      .select("id, status")
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      // Don't throw - allow generation to proceed
      return null;
    }

    return data;
  }

  /**
   * Creates or updates a meal plan record with "pending" status
   * Uses UPSERT to maintain 1:1 relationship (one plan per user)
   *
   * @private
   */
  private async createPendingPlan(userId: string) {
    const { data, error } = await this.supabase
      .from("meal_plans")
      .upsert(
        {
          user_id: userId,
          meals: [], // Empty meals during pending
          status: "pending",
          generated_at: null,
        },
        {
          onConflict: "user_id", // UNIQUE constraint on user_id
        }
      )
      .select()
      .single();

    if (error) {
      throw new MealPlanServiceError("Nie udało się utworzyć planu");
    }

    return data;
  }

  /**
   * Saves generated meals to database with "generated" status
   *
   * @private
   */
  private async saveMealPlan(userId: string, meals: [Meal, Meal, Meal]): Promise<MealPlanDTO> {
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from("meal_plans")
      .upsert(
        {
          user_id: userId,
          meals: meals as unknown as never, // JSON type
          status: "generated",
          generated_at: now,
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single();

    if (error) {
      throw new MealPlanServiceError("Nie udało się zapisać planu");
    }

    return this.transformToDTO(data);
  }

  /**
   * Updates meal plan status (for error cases)
   *
   * @private
   */
  private async updatePlanStatus(userId: string, status: "pending" | "generated" | "error") {
    await this.supabase.from("meal_plans").update({ status }).eq("user_id", userId);
    // Don't throw on error - this is a best-effort update
  }

  /**
   * Transforms database row to MealPlanDTO
   * Validates meals array structure and ensures non-null status
   *
   * @private
   */
  private transformToDTO(data: {
    id: string;
    user_id: string | null;
    meals: unknown;
    generated_at: string | null;
    status: "pending" | "generated" | "error" | null;
    created_at: string | null;
  }): MealPlanDTO {
    // Validate meals is an array with 3 elements
    const meals = Array.isArray(data.meals) ? data.meals : [];
    if (meals.length !== 3) {
      throw new MealPlanServiceError("Invalid meal plan structure");
    }

    return {
      id: data.id,
      user_id: data.user_id,
      meals: meals as [Meal, Meal, Meal],
      generated_at: data.generated_at,
      status: data.status || "pending", // Default to pending if null
      created_at: data.created_at,
    };
  }
}

/**
 * Factory function to create MealPlansService instance
 *
 * @param supabase - Supabase client instance (from context.locals)
 * @param useMocks - Whether to use mock AI generation (default: true for development)
 */
export function createMealPlansService(supabase: SupabaseClient, useMocks = true): MealPlansService {
  const openRouterService = createOpenRouterService(useMocks);
  return new MealPlansService(supabase, openRouterService);
}
