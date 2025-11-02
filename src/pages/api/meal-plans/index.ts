import type { APIContext } from "astro";

import { generateMealPlanSchema } from "@/lib/schemas/meal-plans.schema";
import { logAnalyticsEvent } from "@/lib/services/analytics.service";
import {
  MealPlanGenerationError,
  MealPlanServiceError,
  createMealPlansService,
} from "@/lib/services/meal-plans.service";
import { PreferencesNotFoundError, getPreferences } from "@/lib/services/preferences.service";
import type { GenerateMealPlanDTO } from "@/types";

export const prerender = false;

const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

/**
 * POST /api/meal-plans
 * Generates a new meal plan for the authenticated user using AI
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

  // Verify authenticated user using Supabase server client
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    // eslint-disable-next-line no-console
    console.error("[POST /api/meal-plans] auth.getUser failed:", authError.message);
  }

  if (!user) {
    return createErrorResponse(401, {
      error: "Unauthorized",
      message: "Musisz być zalogowany, aby wygenerować plan posiłków.",
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
  const parseResult = generateMealPlanSchema.safeParse(requestBody);

  if (!parseResult.success) {
    return createErrorResponse(400, {
      error: "Validation error",
      details: parseResult.error.errors.map((issue) => issue.message),
    });
  }

  const { regeneration }: GenerateMealPlanDTO = parseResult.data;

  const userId = user.id;

  try {
    // Step 1: Get user preferences (required for meal plan generation)
    let preferences;

    try {
      preferences = await getPreferences(supabase, userId);
    } catch (error) {
      if (error instanceof PreferencesNotFoundError) {
        return createErrorResponse(400, {
          error: "Bad request",
          message: "Najpierw wypełnij swoje preferencje żywieniowe",
        });
      }

      // Other preferences errors
      // eslint-disable-next-line no-console
      console.error("[POST /api/meal-plans] Failed to fetch preferences:", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      return createErrorResponse(500, {
        error: "Internal server error",
        message: "Nie udało się pobrać preferencji użytkownika",
      });
    }

    // Step 2: Generate meal plan using service
    const mealPlansService = createMealPlansService(supabase, false); // useMocks = false (use real OpenRouter API)
    let mealPlan;

    try {
      mealPlan = await mealPlansService.generateMealPlan(userId, preferences, regeneration || false);
    } catch (error) {
      if (error instanceof MealPlanGenerationError) {
        return createErrorResponse(500, {
          error: "Generation failed",
          message: error.message,
          retry_count: error.retryCount,
        });
      }

      if (error instanceof MealPlanServiceError) {
        // Check if it's a concurrent request error
        if (error.message.includes("już generowany")) {
          return createErrorResponse(409, {
            error: "Conflict",
            message: error.message,
          });
        }

        return createErrorResponse(500, {
          error: "Internal server error",
          message: error.message,
        });
      }

      // Unexpected errors
      // eslint-disable-next-line no-console
      console.error("[POST /api/meal-plans] Unexpected error:", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });

      return createErrorResponse(500, {
        error: "Internal server error",
        message: "Wystąpił błąd podczas generowania planu",
      });
    }

    // Step 3: Log analytics event (async, don't wait)
    queueMicrotask(() => {
      const actionType = regeneration ? "plan_regenerated" : "plan_generated";
      logAnalyticsEvent(supabase, userId, actionType, {
        meal_plan_id: mealPlan.id,
      });
    });

    // Step 4: Return success response
    return new Response(JSON.stringify(mealPlan), {
      status: 201,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    // Catch-all for unexpected errors
    // eslint-disable-next-line no-console
    console.error("[POST /api/meal-plans] Unhandled error:", {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return createErrorResponse(500, {
      error: "Internal server error",
      message: "Wystąpił nieoczekiwany błąd",
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
