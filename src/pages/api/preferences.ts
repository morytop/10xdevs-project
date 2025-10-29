import type { APIContext } from "astro";

import { DEAFULT_USER_ID } from "@/db/supabase.client";
import {
  CreatePreferencesSchema,
  UpdatePreferencesSchema,
  type UpdatePreferencesInput,
} from "@/lib/schemas/preferences.schema";
import { logAnalyticsEvent } from "@/lib/services/analytics.service";
import {
  ConflictError,
  PreferencesNotFoundError,
  PreferencesServiceError,
  createPreferences,
  getPreferences,
  updatePreferences,
} from "@/lib/services/preferences.service";
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

export const GET = async (context: APIContext) => {
  const supabase = context.locals.supabase;

  if (!supabase) {
    return createErrorResponse(500, {
      error: "Internal server error",
      message: "Konfiguracja Supabase nie jest dostępna",
    });
  }

  const userId = DEAFULT_USER_ID;

  try {
    const preferences = await getPreferences(supabase, userId);

    return createJsonResponse(preferences, 200);
  } catch (error) {
    if (error instanceof PreferencesNotFoundError) {
      return createErrorResponse(404, {
        error: "Not found",
        message: "Nie znaleziono preferencji. Wypełnij formularz onboardingu.",
      });
    }

    queueMicrotask(() =>
      logAnalyticsEvent(supabase, userId, "api_error", {
        endpoint: "/api/preferences",
        method: "GET",
        status: 500,
      })
    );

    return createErrorResponse(500, {
      error: "Internal server error",
      message: "Nie udało się pobrać preferencji. Spróbuj ponownie.",
    });
  }
};

export const PUT = async (context: APIContext) => {
  const supabase = context.locals.supabase;

  if (!supabase) {
    return createErrorResponse(500, {
      error: "Internal server error",
      message: "Konfiguracja Supabase nie jest dostępna",
    });
  }

  const userId = DEAFULT_USER_ID;

  let requestBody: unknown;

  try {
    requestBody = await context.request.json();
  } catch {
    return createErrorResponse(400, {
      error: "Validation error",
      details: ["Invalid JSON"],
    });
  }

  const parseResult = UpdatePreferencesSchema.safeParse(requestBody);

  if (!parseResult.success) {
    return createErrorResponse(400, {
      error: "Validation error",
      details: parseResult.error.errors.map((issue) => issue.message),
    });
  }

  const updatePayload = parseResult.data;

  try {
    const updatedPreferences = await updatePreferences(supabase, userId, updatePayload);

    queueMicrotask(() =>
      logAnalyticsEvent(supabase, userId, "profile_updated", {
        changedFields: getChangedFields(updatePayload),
      })
    );

    return createJsonResponse(updatedPreferences, 200);
  } catch (error) {
    if (error instanceof PreferencesNotFoundError) {
      return createErrorResponse(404, {
        error: "Not found",
        message: "Nie znaleziono preferencji. Wypełnij formularz onboardingu.",
      });
    }

    queueMicrotask(() =>
      logAnalyticsEvent(supabase, userId, "api_error", {
        endpoint: "/api/preferences",
        method: "PUT",
        status: 500,
      })
    );

    if (error instanceof PreferencesServiceError) {
      return createErrorResponse(500, {
        error: "Internal server error",
        message: "Nie udało się zaktualizować preferencji. Spróbuj ponownie.",
      });
    }

    return createErrorResponse(500, {
      error: "Internal server error",
      message: "Nie udało się zaktualizować preferencji. Spróbuj ponownie.",
    });
  }
};

function createErrorResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

function createJsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

function getChangedFields(payload: UpdatePreferencesInput) {
  return Object.entries(payload)
    .filter(([, value]) => value !== undefined)
    .map(([key]) => key);
}

const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;
