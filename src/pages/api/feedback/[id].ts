import type { APIContext } from "astro";

import { DEAFULT_USER_ID } from "@/db/supabase.client";
import { feedbackIdSchema, updateFeedbackSchema } from "@/lib/schemas/feedback.schema";
import {
  FeedbackForbiddenError,
  FeedbackNotFoundError,
  FeedbackServiceError,
  createFeedbackService,
} from "@/lib/services/feedback.service";
import { createMealPlansService } from "@/lib/services/meal-plans.service";
import type { UpdateFeedbackDTO } from "@/types";

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
 * PUT /api/feedback/:id
 * Updates existing feedback for user's meal plan
 */
export const PUT = async (context: APIContext) => {
  const supabase = context.locals.supabase;

  // Guard: Check if Supabase client is available
  if (!supabase) {
    return createErrorResponse(500, {
      error: "Internal server error",
      message: "Konfiguracja Supabase nie jest dostępna",
    });
  }

  // Validate feedback ID from URL params
  const feedbackId = context.params.id;

  const idParseResult = feedbackIdSchema.safeParse(feedbackId);

  if (!idParseResult.success) {
    return createErrorResponse(400, {
      error: "Bad request",
      message: "Nieprawidłowy format ID opinii",
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
  const parseResult = updateFeedbackSchema.safeParse(requestBody);

  if (!parseResult.success) {
    return createErrorResponse(400, {
      error: "Validation error",
      details: parseResult.error.errors.map((issue) => issue.message),
    });
  }

  const feedbackData: UpdateFeedbackDTO = parseResult.data;
  const validatedFeedbackId = idParseResult.data; // Use validated ID from Zod
  const userId = DEAFULT_USER_ID; // No auth for now - using default user

  try {
    // Create services
    const mealPlansService = createMealPlansService(supabase);
    const feedbackService = createFeedbackService(supabase, mealPlansService);

    // Update feedback
    const feedback = await feedbackService.updateFeedback(userId, validatedFeedbackId, feedbackData);

    return new Response(JSON.stringify(feedback), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    // Handle FeedbackNotFoundError → 404
    if (error instanceof FeedbackNotFoundError) {
      return createErrorResponse(404, {
        error: "Not found",
        message: error.message,
      });
    }

    // Handle FeedbackForbiddenError → 403
    if (error instanceof FeedbackForbiddenError) {
      return createErrorResponse(403, {
        error: "Forbidden",
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
    console.error("[PUT /api/feedback/:id] Unexpected error:", {
      userId,
      feedbackId: validatedFeedbackId,
      error: error instanceof Error ? error.message : String(error),
    });

    return createErrorResponse(500, {
      error: "Internal server error",
      message: "Wystąpił błąd podczas aktualizacji opinii",
    });
  }
};

/**
 * Handle all other HTTP methods → 405
 */
export const ALL = async () => {
  return createErrorResponse(405, {
    error: "Method not allowed",
    message: "Dozwolona tylko metoda PUT",
  });
};
