import type { APIContext } from "astro";

import { DEAFULT_USER_ID } from "@/db/supabase.client";
import { CreatePreferencesSchema } from "@/lib/schemas/preferences.schema";
import { logAnalyticsEvent } from "@/lib/services/analytics.service";
import { ConflictError, createPreferences } from "@/lib/services/preferences.service";
import type { CreateUserPreferencesDTO } from "@/types";

export const prerender = false;

export const POST = async (context: APIContext) => {
  const supabase = context.locals.supabase;

  if (!supabase) {
    return createErrorResponse(500, {
      error: "Internal server error",
      message: "Konfiguracja Supabase nie jest dostępna",
    });
  }

  let requestBody: unknown;

  try {
    requestBody = await context.request.json();
  } catch {
    return createErrorResponse(400, {
      error: "Validation error",
      details: ["Invalid JSON"],
    });
  }

  const parseResult = CreatePreferencesSchema.safeParse(requestBody);

  if (!parseResult.success) {
    return createErrorResponse(400, {
      error: "Validation error",
      details: parseResult.error.errors.map((issue) => issue.message),
    });
  }

  try {
    const preferencesData: CreateUserPreferencesDTO = parseResult.data;
    const userId = DEAFULT_USER_ID;

    const preferences = await createPreferences(supabase, userId, preferencesData);

    queueMicrotask(() => {
      logAnalyticsEvent(supabase, userId, "profile_created");
    });

    return new Response(JSON.stringify(preferences), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof ConflictError) {
      return createErrorResponse(409, {
        error: "Conflict",
        message: "Preferencje dla tego użytkownika już istnieją. Użyj PUT do aktualizacji.",
      });
    }

    return createErrorResponse(500, {
      error: "Internal server error",
      message: "Nie udało się zapisać preferencji. Spróbuj ponownie.",
    });
  }
};

function createErrorResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
