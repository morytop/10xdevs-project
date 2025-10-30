import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateFeedbackDTO, UpdateFeedbackDTO, FeedbackDTO } from "@/types";
import { MealPlansService, MealPlanNotFoundError } from "./meal-plans.service";
import { logAnalyticsEvent } from "./analytics.service";

/**
 * Błąd dla sytuacji gdy feedback nie został znaleziony
 */
export class FeedbackNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeedbackNotFoundError";
  }
}

/**
 * Błąd dla sytuacji gdy użytkownik próbuje edytować cudzą opinię
 */
export class FeedbackForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeedbackForbiddenError";
  }
}

/**
 * Ogólny błąd serwisu feedback
 */
export class FeedbackServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeedbackServiceError";
  }
}

/**
 * Service for managing user feedback on meal plans
 */
export class FeedbackService {
  constructor(
    private supabase: SupabaseClient,
    private mealPlansService: MealPlansService
  ) {}

  /**
   * Creates feedback for user's current meal plan
   *
   * @param userId - User's unique identifier from JWT
   * @param data - Feedback data (rating + optional comment)
   * @returns Promise resolving to created FeedbackDTO
   * @throws MealPlanNotFoundError if user has no meal plan
   * @throws FeedbackServiceError if database operation fails
   */
  async createFeedback(userId: string, data: CreateFeedbackDTO): Promise<FeedbackDTO> {
    if (!userId) {
      throw new FeedbackServiceError("User ID is required");
    }

    try {
      // Step 1: Get user's current meal plan
      const mealPlan = await this.mealPlansService.getCurrentMealPlan(userId);

      if (!mealPlan) {
        throw new MealPlanNotFoundError("Nie znaleziono planu posiłków do oceny");
      }

      // Step 2: Insert feedback into database
      const { data: feedback, error } = await this.supabase
        .from("feedback")
        .insert({
          meal_plan_id: mealPlan.id,
          rating: data.rating,
          comment: data.comment || null,
        })
        .select()
        .single();

      if (error) {
        console.error("[FeedbackService] Failed to create feedback:", {
          userId,
          mealPlanId: mealPlan.id,
          error: error.message,
        });
        throw new FeedbackServiceError("Nie udało się zapisać opinii");
      }

      // Step 3: Log analytics event (non-blocking)
      try {
        await logAnalyticsEvent(this.supabase, userId, "feedback_given", {
          feedback_id: feedback.id,
          meal_plan_id: feedback.meal_plan_id,
          rating: feedback.rating,
        });
      } catch (error) {
        console.error("[FeedbackService] Analytics logging failed:", error);
        // Don't throw - this shouldn't fail the feedback creation
      }

      return feedback as FeedbackDTO;
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof MealPlanNotFoundError || error instanceof FeedbackServiceError) {
        throw error;
      }

      // Wrap unexpected errors
      console.error("[FeedbackService] Unexpected error:", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new FeedbackServiceError("Wystąpił błąd podczas zapisywania opinii");
    }
  }

  /**
   * Updates existing feedback
   *
   * @param userId - User's unique identifier from JWT
   * @param feedbackId - ID of feedback to update
   * @param data - Updated feedback data (rating and/or comment)
   * @returns Promise resolving to updated FeedbackDTO
   * @throws FeedbackNotFoundError if feedback doesn't exist
   * @throws FeedbackForbiddenError if user doesn't own the feedback
   * @throws FeedbackServiceError if database operation fails
   */
  async updateFeedback(userId: string, feedbackId: string, data: UpdateFeedbackDTO): Promise<FeedbackDTO> {
    if (!userId) {
      throw new FeedbackServiceError("User ID is required");
    }

    if (!feedbackId) {
      throw new FeedbackServiceError("Feedback ID is required");
    }

    try {
      // Step 1: Check ownership of the feedback
      const existingFeedback = await this.getFeedbackWithOwnership(feedbackId, userId);

      if (!existingFeedback) {
        throw new FeedbackNotFoundError("Nie znaleziono opinii o podanym ID");
      }

      // Step 2: Update feedback
      const { data: updatedFeedback, error } = await this.supabase
        .from("feedback")
        .update({
          rating: data.rating,
          comment: data.comment !== undefined ? data.comment || null : undefined,
        })
        .eq("id", feedbackId)
        .select()
        .single();

      if (error) {
        console.error("[FeedbackService] Failed to update feedback:", {
          userId,
          feedbackId,
          error: error.message,
        });
        throw new FeedbackServiceError("Nie udało się zaktualizować opinii");
      }

      return updatedFeedback as FeedbackDTO;
    } catch (error) {
      // Re-throw custom errors
      if (
        error instanceof FeedbackNotFoundError ||
        error instanceof FeedbackForbiddenError ||
        error instanceof FeedbackServiceError
      ) {
        throw error;
      }

      // Wrap unexpected errors
      console.error("[FeedbackService] Unexpected error:", {
        userId,
        feedbackId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new FeedbackServiceError("Wystąpił błąd podczas aktualizacji opinii");
    }
  }

  /**
   * Gets feedback with ownership verification
   * Checks if feedback exists and belongs to the user
   *
   * @private
   */
  private async getFeedbackWithOwnership(feedbackId: string, userId: string) {
    const { data, error } = await this.supabase
      .from("feedback")
      .select(
        `
        *,
        meal_plan:meal_plans!inner(user_id)
      `
      )
      .eq("id", feedbackId)
      .maybeSingle();

    if (error) {
      console.error("[FeedbackService] Failed to fetch feedback:", {
        feedbackId,
        error: error.message,
      });
      throw new FeedbackServiceError("Nie udało się pobrać opinii");
    }

    if (!data) {
      return null;
    }

    // Check ownership
    // meal_plan is joined from database query with inner join
    const feedbackWithPlan = data as typeof data & {
      meal_plan: { user_id: string };
    };

    if (feedbackWithPlan.meal_plan.user_id !== userId) {
      throw new FeedbackForbiddenError("Nie możesz edytować cudzej opinii");
    }

    return data;
  }
}

/**
 * Factory function to create FeedbackService instance
 *
 * @param supabase - Supabase client instance (from context.locals)
 * @param mealPlansService - MealPlansService instance
 */
export function createFeedbackService(supabase: SupabaseClient, mealPlansService: MealPlansService): FeedbackService {
  return new FeedbackService(supabase, mealPlansService);
}
