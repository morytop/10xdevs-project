import type { APIContext } from "astro";
import { z } from "zod";

import { OpenRouterService } from "@/lib/openrouter";
import type { Message } from "@/lib/openrouter";

export const prerender = false;

// Schemat walidacji dla wiadomości
const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1, "Content cannot be empty"),
});

// Schemat walidacji dla całego requestu
const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1, "Messages array cannot be empty"),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().positive().optional(),
});

export const POST = async (context: APIContext) => {
  let requestBody: unknown;

  // Parsowanie JSON
  try {
    requestBody = await context.request.json();
  } catch {
    return createErrorResponse(400, {
      error: "Validation error",
      details: ["Invalid JSON"],
    });
  }

  // Walidacja z użyciem Zod
  const parseResult = ChatRequestSchema.safeParse(requestBody);

  if (!parseResult.success) {
    return createErrorResponse(400, {
      error: "Validation error",
      details: parseResult.error.errors.map((issue) => issue.message),
    });
  }

  const { messages, model, temperature, max_tokens } = parseResult.data;

  try {
    // Utworzenie instancji serwisu (klucz API z env)
    const service = new OpenRouterService();

    // Wykonanie completion
    const response = await service.complete({
      messages: messages as Message[],
      model,
      temperature: temperature ?? 0.7,
      max_tokens: max_tokens ?? 1000,
    });

    // Zwrócenie odpowiedzi
    return createJsonResponse(response, 200);
  } catch (error) {
    // Obsługa znanych błędów OpenRouter
    if (error instanceof Error) {
      const statusCode = getErrorStatusCode(error);
      return createErrorResponse(statusCode, {
        error: error.name,
        message: error.message,
      });
    }

    return createErrorResponse(500, {
      error: "Internal server error",
      message: "Nie udało się wygenerować odpowiedzi. Spróbuj ponownie.",
    });
  }
};

/**
 * Mapuje błędy OpenRouter na odpowiednie kody HTTP
 */
function getErrorStatusCode(error: Error): number {
  const errorName = error.name;

  switch (errorName) {
    case "OpenRouterAuthError":
      return 401;
    case "OpenRouterValidationError":
      return 400;
    case "OpenRouterRateLimitError":
      return 429;
    case "OpenRouterTimeoutError":
      return 504;
    case "OpenRouterModelError":
    case "OpenRouterNetworkError":
    default:
      return 500;
  }
}

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

const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;
