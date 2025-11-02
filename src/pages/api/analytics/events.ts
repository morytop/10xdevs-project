import type { APIRoute } from "astro";
import type { Database } from "@/db/database.types";

import { logAnalyticsEventSchema } from "@/lib/schemas/analytics.schema";
import { logAnalyticsEvent } from "@/lib/services/analytics.service";

type AnalyticsMetadata = Database["public"]["Tables"]["analytics_events"]["Insert"]["metadata"];

export const prerender = false;

/**
 * Logs an analytics event for the authenticated user.
 *
 * This endpoint is non-blocking - it always returns 204 No Content
 * even if database logging fails. This ensures analytics never
 * interrupts user experience.
 *
 * @route POST /api/analytics/events
 *
 * @example
 * // Frontend usage (fire-and-forget)
 * fetch('/api/analytics/events', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json'
 *   },
 *   body: JSON.stringify({
 *     action_type: 'plan_accepted',
 *     metadata: { time_on_page: 45, plan_id: 'uuid' }
 *   })
 * }).catch(() => {
 *   // Ignore errors - non-critical
 * });
 *
 * @returns 204 No Content on success (or hidden failure)
 * @returns 400 Bad Request on validation error
 * @returns 401 Unauthorized if user is not authenticated
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Get Supabase client
  const supabase = locals.supabase;

  // 2. Verify authenticated user via Supabase server client
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    // eslint-disable-next-line no-console
    console.error("[POST /api/analytics/events] auth.getUser failed:", authError.message);
  }

  if (!user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Musisz być zalogowany, aby logować eventy.",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: "Validation error",
        message: "Nieprawidłowy format JSON",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Validate request body
  const validationResult = logAnalyticsEventSchema.safeParse(body);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Validation error",
        message: validationResult.error.errors[0].message,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 5. Call service to log event (non-blocking - errors are caught in service)
  const { action_type, metadata } = validationResult.data;
  await logAnalyticsEvent(supabase, user.id, action_type, metadata as AnalyticsMetadata);

  // 6. Return success (even if logging failed - non-blocking behavior)
  return new Response(null, { status: 204 });
};
