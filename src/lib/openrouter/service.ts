import type {
  OpenRouterConfig,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  Model,
  Message,
  ResponseFormat,
} from "./types";

import {
  OpenRouterError,
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterValidationError,
  OpenRouterModelError,
  OpenRouterTimeoutError,
  OpenRouterNetworkError,
} from "./errors";

export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private headers: Record<string, string>;

  constructor(config: OpenRouterConfig = {}) {
    // Pobierz klucz API
    this.apiKey = config.apiKey || import.meta.env.OPENROUTER_API_KEY || "";

    if (!this.apiKey) {
      throw new OpenRouterAuthError(
        "API key is required. Set OPENROUTER_API_KEY environment variable or pass it in config."
      );
    }

    // Ustaw konfigurację
    this.baseUrl = config.baseUrl || "https://openrouter.ai/api/v1";
    this.defaultModel = config.defaultModel || import.meta.env.OPENROUTER_DEFAULT_MODEL || "openai/gpt-4o-mini";
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;

    // Przygotuj nagłówki
    this.headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    // Dodaj opcjonalne nagłówki dla analytics
    if (config.siteName || import.meta.env.OPENROUTER_SITE_NAME) {
      this.headers["X-Title"] = config.siteName || import.meta.env.OPENROUTER_SITE_NAME;
    }

    if (config.siteUrl || import.meta.env.OPENROUTER_SITE_URL) {
      this.headers["HTTP-Referer"] = config.siteUrl || import.meta.env.OPENROUTER_SITE_URL;
    }
  }

  /**
   * Wykonuje zapytanie completion do OpenRouter API
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    this.validateRequest(request);

    const body = {
      ...request,
      model: request.model || this.defaultModel,
      stream: false,
    };

    return this.executeRequest<CompletionResponse>("/chat/completions", body);
  }

  /**
   * Wygodna metoda do zapytań z ustrukturyzowanymi odpowiedziami
   */
  async completeWithSchema<T>(
    messages: Message[],
    schema: ResponseFormat["json_schema"],
    options: Omit<CompletionRequest, "messages" | "response_format"> = {}
  ): Promise<T> {
    const response = await this.complete({
      ...options,
      messages,
      response_format: {
        type: "json_schema",
        json_schema: schema,
      },
    });

    try {
      return JSON.parse(response.choices[0].message.content) as T;
    } catch (error) {
      throw new OpenRouterError("Failed to parse structured response", undefined, error);
    }
  }

  /**
   * Streamuje odpowiedź z OpenRouter API
   */
  async *streamComplete(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    this.validateRequest(request);

    const body = {
      ...request,
      model: request.model || this.defaultModel,
      stream: true,
    };

    const response = await this.executeRequest<Response>("/chat/completions", body, { stream: true });

    yield* this.parseStreamResponse(response);
  }

  /**
   * Pobiera listę dostępnych modeli
   */
  async getAvailableModels(): Promise<Model[]> {
    interface ModelsResponse {
      data: Model[];
    }

    const response = await this.executeRequest<ModelsResponse>("/models", {});
    return response.data;
  }

  /**
   * Wykonuje HTTP request z retry logic
   */
  private async executeRequest<T>(endpoint: string, body: unknown, options: { stream?: boolean } = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Dla streamingu zwróć cały response
        if (options.stream) {
          if (!response.ok) {
            const errorBody = await response.json();
            throw this.mapApiError(response.status, errorBody);
          }
          return response as T;
        }

        // Dla normalnych requestów parsuj JSON
        const data = await response.json();

        if (!response.ok) {
          throw this.mapApiError(response.status, data);
        }

        return data as T;
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error as Error;

        // Sprawdź czy to AbortError (timeout)
        if (error instanceof Error && error.name === "AbortError") {
          lastError = new OpenRouterTimeoutError(`Request timeout after ${this.timeout}ms`);
        }

        // Sprawdź czy to błąd sieciowy
        if (error instanceof TypeError && error.message.includes("fetch")) {
          lastError = new OpenRouterNetworkError("Failed to connect to OpenRouter API");
        }

        // Sprawdź czy błąd jest retriable
        const shouldRetry = await this.handleRetry(attempt, lastError);

        if (!shouldRetry) {
          throw lastError;
        }

        // Czekaj przed następną próbą (exponential backoff)
        await this.delay(this.retryDelay * Math.pow(2, attempt));
      }
    }

    throw lastError;
  }

  /**
   * Określa czy request powinien być ponowiony
   */
  private async handleRetry(attempt: number, error: Error): Promise<boolean> {
    // Nie retry jeśli osiągnięto max
    if (attempt >= this.maxRetries) {
      return false;
    }

    // Retry dla błędów sieciowych
    if (error instanceof OpenRouterNetworkError) {
      return true;
    }

    // Retry dla timeout
    if (error instanceof OpenRouterTimeoutError) {
      return true;
    }

    // Retry dla błędów serwera (5xx)
    if (error instanceof OpenRouterModelError) {
      return true;
    }

    // Nie retry dla innych błędów
    return false;
  }

  /**
   * Waliduje request przed wysłaniem
   */
  private validateRequest(request: CompletionRequest): void {
    if (!request.messages || request.messages.length === 0) {
      throw new OpenRouterValidationError("Messages array cannot be empty", "messages");
    }

    for (const message of request.messages) {
      if (!message.role || !message.content) {
        throw new OpenRouterValidationError("Each message must have role and content", "messages");
      }

      if (!["system", "user", "assistant"].includes(message.role)) {
        throw new OpenRouterValidationError(`Invalid message role: ${message.role}`, "messages");
      }
    }

    if (request.temperature !== undefined) {
      if (request.temperature < 0 || request.temperature > 2) {
        throw new OpenRouterValidationError("Temperature must be between 0 and 2", "temperature");
      }
    }

    if (request.top_p !== undefined) {
      if (request.top_p < 0 || request.top_p > 1) {
        throw new OpenRouterValidationError("top_p must be between 0 and 1", "top_p");
      }
    }

    if (request.frequency_penalty !== undefined) {
      if (request.frequency_penalty < -2 || request.frequency_penalty > 2) {
        throw new OpenRouterValidationError("frequency_penalty must be between -2 and 2", "frequency_penalty");
      }
    }

    if (request.presence_penalty !== undefined) {
      if (request.presence_penalty < -2 || request.presence_penalty > 2) {
        throw new OpenRouterValidationError("presence_penalty must be between -2 and 2", "presence_penalty");
      }
    }

    if (request.max_tokens !== undefined && request.max_tokens <= 0) {
      throw new OpenRouterValidationError("max_tokens must be greater than 0", "max_tokens");
    }

    if (request.response_format) {
      this.validateResponseFormat(request.response_format);
    }
  }

  /**
   * Waliduje response_format
   */
  private validateResponseFormat(format: ResponseFormat): void {
    if (format.type !== "json_schema") {
      throw new OpenRouterValidationError('response_format type must be "json_schema"', "response_format");
    }

    if (!format.json_schema) {
      throw new OpenRouterValidationError("json_schema is required in response_format", "response_format");
    }

    if (format.json_schema.strict !== true) {
      throw new OpenRouterValidationError("json_schema.strict must be true", "response_format");
    }

    if (!format.json_schema.name) {
      throw new OpenRouterValidationError("json_schema.name is required", "response_format");
    }

    if (!format.json_schema.schema) {
      throw new OpenRouterValidationError("json_schema.schema is required", "response_format");
    }

    if (format.json_schema.schema.type !== "object") {
      throw new OpenRouterValidationError('json_schema.schema.type must be "object"', "response_format");
    }

    if (format.json_schema.schema.additionalProperties !== false) {
      throw new OpenRouterValidationError(
        "json_schema.schema.additionalProperties must be false for strict mode",
        "response_format"
      );
    }
  }

  /**
   * Mapuje błędy API na odpowiednie klasy błędów
   */
  private mapApiError(statusCode: number, body: unknown): OpenRouterError {
    const errorBody = body as { error?: { message?: string; type?: string } };
    const message = errorBody?.error?.message || "Unknown error occurred";

    switch (statusCode) {
      case 401:
      case 403:
        return new OpenRouterAuthError(message);

      case 429:
        return new OpenRouterRateLimitError(message);

      case 400:
        return new OpenRouterValidationError(message);

      case 404:
        return new OpenRouterModelError("Model not found or unavailable");

      case 500:
      case 502:
      case 503:
      case 504:
        return new OpenRouterModelError(message);

      default:
        return new OpenRouterError(message, statusCode);
    }
  }

  /**
   * Parsuje Server-Sent Events stream
   */
  private async *parseStreamResponse(response: Response): AsyncGenerator<StreamChunk> {
    if (!response.body) {
      throw new OpenRouterError("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Zachowaj ostatnią niepełną linię w buforze
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();

          // Ignoruj puste linie i komentarze
          if (!trimmed || trimmed.startsWith(":")) {
            continue;
          }

          // Sprawdź czy to linia z danymi
          if (trimmed.startsWith("data: ")) {
            const data = trimmed.slice(6);

            // Sprawdź czy to koniec streamu
            if (data === "[DONE]") {
              return;
            }

            try {
              const chunk = JSON.parse(data) as StreamChunk;
              yield chunk;
            } catch {
              // Ignore parsing errors for malformed chunks
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Helper do czekania
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
