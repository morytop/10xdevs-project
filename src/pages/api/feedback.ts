import type { APIContext } from "astro";

import { DEAFULT_USER_ID } from "@/db/supabase.client";
import { createFeedbackSchema } from "@/lib/schemas/feedback.schema";
import { FeedbackServiceError, createFeedbackService } from "@/lib/services/feedback.service";
import { MealPlanNotFoundError, createMealPlansService } from "@/lib/services/meal-plans.service";
import type { CreateFeedbackDTO } from "@/types";

export const prerender = false;

const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

/**
 * Helper function to create JSON error responses
 */
function createErrorResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

/**
 * POST /api/feedback
 * Creates new feedback for user's current meal plan
 */
export const POST = async (context: APIContext) => {
  const supabase = context.locals.supabase;

  // Guard: Check if Supabase client is available
  if (!supabase) {
    return createErrorResponse(500, {
      error: "Internal server error",
      message: "Konfiguracja Supabase nie jest dostępna",
    });
  }

  // Parse request body
  let requestBody: unknown;

  try {
    requestBody = await context.request.json();
  } catch {
    return createErrorResponse(400, {
      error: "Bad request",
      message: "Nieprawidłowy format JSON",
    });
  }

  // Validate request body with Zod
  const parseResult = createFeedbackSchema.safeParse(requestBody);

  if (!parseResult.success) {
    return createErrorResponse(400, {
      error: "Validation error",
      details: parseResult.error.errors.map((issue) => issue.message),
    });
  }

  const feedbackData: CreateFeedbackDTO = parseResult.data;
  const userId = DEAFULT_USER_ID; // No auth for now - using default user

  try {
    // Create services
    const mealPlansService = createMealPlansService(supabase);
    const feedbackService = createFeedbackService(supabase, mealPlansService);

    // Create feedback
    const feedback = await feedbackService.createFeedback(userId, feedbackData);

    return new Response(JSON.stringify(feedback), {
      status: 201,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    // Handle MealPlanNotFoundError → 404
    if (error instanceof MealPlanNotFoundError) {
      return createErrorResponse(404, {
        error: "Not found",
        message: error.message,
      });
    }

    // Handle FeedbackServiceError → 500
    if (error instanceof FeedbackServiceError) {
      return createErrorResponse(500, {
        error: "Internal server error",
        message: error.message,
      });
    }

    // Handle unexpected errors
    console.error("[POST /api/feedback] Unexpected error:", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });

    return createErrorResponse(500, {
      error: "Internal server error",
      message: "Wystąpił błąd podczas zapisywania opinii",
    });
  }
};

/**
 * Handle all other HTTP methods → 405
 */
export const ALL = async () => {
  return createErrorResponse(405, {
    error: "Method not allowed",
    message: "Dozwolona tylko metoda POST",
  });
};
