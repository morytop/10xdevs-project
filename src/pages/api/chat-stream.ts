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
const ChatStreamRequestSchema = z.object({
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
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Walidacja z użyciem Zod
  const parseResult = ChatStreamRequestSchema.safeParse(requestBody);

  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        error: "Validation error",
        details: parseResult.error.errors.map((issue) => issue.message),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { messages, model, temperature, max_tokens } = parseResult.data;

  try {
    // Utworzenie instancji serwisu
    const service = new OpenRouterService();

    // Utworzenie ReadableStream dla SSE
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const encoder = new TextEncoder();

          // Streamowanie odpowiedzi
          for await (const chunk of service.streamComplete({
            messages: messages as Message[],
            model,
            temperature: temperature ?? 0.7,
            max_tokens: max_tokens ?? 1000,
          })) {
            const content = chunk.choices[0]?.delta?.content;

            if (content) {
              // Wyślij chunk jako SSE
              const data = `data: ${JSON.stringify({ content })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }

            // Sprawdź czy to koniec
            if (chunk.choices[0]?.finish_reason) {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
          }

          controller.close();
        } catch (error) {
          console.error("Chat stream error:", error);

          // Wyślij błąd jako ostatni event
          const encoder = new TextEncoder();
          const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
          const errorData = `data: ${JSON.stringify({ error: errorMessage })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat stream API error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Nie udało się rozpocząć streamowania. Spróbuj ponownie.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
