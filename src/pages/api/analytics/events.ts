import type { APIRoute } from "astro";
import type { Database } from "@/db/database.types";

import { logAnalyticsEventSchema } from "@/lib/schemas/analytics.schema";
import { logAnalyticsEvent } from "@/lib/services/analytics.service";
import { DEAFULT_USER_ID } from "@/db/supabase.client";

type AnalyticsMetadata = Database["public"]["Tables"]["analytics_events"]["Insert"]["metadata"];

export const prerender = false;

/**
 * Logs an analytics event for the default user.
 *
 * This endpoint is non-blocking - it always returns 204 No Content
 * even if database logging fails. This ensures analytics never
 * interrupts user experience.
 *
 * Note: Currently uses DEAFULT_USER_ID for testing purposes.
 * Authentication will be implemented in a future iteration.
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
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Get Supabase client
  const supabase = locals.supabase;

  // 2. Parse request body
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

  // 3. Validate request body
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

  // 4. Call service to log event (non-blocking - errors are caught in service)
  const { action_type, metadata } = validationResult.data;
  await logAnalyticsEvent(supabase, DEAFULT_USER_ID, action_type, metadata as AnalyticsMetadata);

  // 5. Return success (even if logging failed - non-blocking behavior)
  return new Response(null, { status: 204 });
};
