import type { APIContext } from "astro";

import { MealPlanNotFoundError, MealPlanServiceError, createMealPlansService } from "@/lib/services/meal-plans.service";

export const prerender = false;

const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

/**
 * GET /api/meal-plans/current
 * Retrieves the current (most recent) meal plan for the authenticated user
 */
export const GET = async (context: APIContext) => {
  const supabase = context.locals.supabase;

  // Guard: Check if Supabase client is available
  if (!supabase) {
    return createErrorResponse(500, {
      error: "Internal server error",
      message: "Konfiguracja Supabase nie jest dostępna",
    });
  }

  // Verify authenticated user using Supabase server client
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    // eslint-disable-next-line no-console
    console.error("[GET /api/meal-plans/current] auth.getUser failed:", authError.message);
  }

  if (!user) {
    return createErrorResponse(401, {
      error: "Unauthorized",
      message: "Musisz być zalogowany, aby pobrać plan posiłków.",
    });
  }

  const userId = user.id;

  try {
    // Get current meal plan using service
    const mealPlansService = createMealPlansService(supabase, false); // useMocks = false (use real OpenRouter API)
    const mealPlan = await mealPlansService.getCurrentMealPlan(userId);

    // Return success response
    return new Response(JSON.stringify(mealPlan), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    // Handle "not found" case
    if (error instanceof MealPlanNotFoundError) {
      return createErrorResponse(404, {
        error: "Not found",
        message: error.message,
      });
    }

    // Handle service errors
    if (error instanceof MealPlanServiceError) {
      return createErrorResponse(500, {
        error: "Internal server error",
        message: error.message,
      });
    }

    // Unexpected errors
    // eslint-disable-next-line no-console
    console.error("[GET /api/meal-plans/current] Unexpected error:", {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return createErrorResponse(500, {
      error: "Internal server error",
      message: "Wystąpił błąd podczas pobierania planu",
    });
  }
};

/**
 * Helper function to create error responses
 */
function createErrorResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}
