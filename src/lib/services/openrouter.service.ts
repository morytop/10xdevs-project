import { mealsArraySchema } from "@/lib/schemas/meal-plans.schema";
import type { UserPreferencesDTO, Meal } from "@/types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s
const TIMEOUT_MS = 30000; // 30 seconds

/**
 * Service for communicating with Openrouter.ai API
 * Handles LLM-based meal plan generation with retry logic and timeout
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly useMocks: boolean;

  constructor(apiKey: string, useMocks = true) {
    this.apiKey = apiKey;
    this.useMocks = useMocks; // Use mocks during development
  }

  /**
   * Generates a meal plan using LLM based on user preferences
   * Returns tuple of exactly 3 meals: [breakfast, lunch, dinner]
   *
   * @param preferences - User's dietary preferences and requirements
   * @returns Promise resolving to array of 3 meals
   * @throws Error if generation fails after all retries or on timeout
   */
  async generateMealPlan(preferences: UserPreferencesDTO): Promise<[Meal, Meal, Meal]> {
    if (this.useMocks) {
      return this.generateMockMealPlan(preferences);
    }

    return this.generateWithRetry(preferences, 0);
  }

  /**
   * Internal method implementing retry logic with exponential backoff
   */
  private async generateWithRetry(preferences: UserPreferencesDTO, attempt: number): Promise<[Meal, Meal, Meal]> {
    try {
      return await this.callLLMWithTimeout(preferences);
    } catch (error) {
      console.error(`[OpenRouter] Generation attempt ${attempt + 1} failed:`, {
        error: error instanceof Error ? error.message : String(error),
        attempt: attempt + 1,
        maxRetries: MAX_RETRIES,
      });

      // If we've exhausted all retries, throw the error
      if (attempt >= MAX_RETRIES - 1) {
        throw new Error(
          `Failed to generate meal plan after ${MAX_RETRIES} attempts: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      // Wait before retrying (exponential backoff)
      await this.sleep(RETRY_DELAYS[attempt]);

      // Retry
      return this.generateWithRetry(preferences, attempt + 1);
    }
  }

  /**
   * Calls LLM API with timeout protection
   */
  private async callLLMWithTimeout(preferences: UserPreferencesDTO): Promise<[Meal, Meal, Meal]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://10xdevs-project.com", // Optional: for rankings
          "X-Title": "10xDevs AI Meal Planner", // Optional: for rankings
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001", // Fast and cost-effective
          messages: [
            {
              role: "system",
              content: this.buildSystemPrompt(),
            },
            {
              role: "user",
              content: this.buildUserPrompt(preferences),
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error("Service unavailable");
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("Empty response from LLM");
      }

      // Parse JSON response and validate structure
      const meals = JSON.parse(content);
      return mealsArraySchema.parse(meals);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timeout");
      }

      throw error;
    }
  }

  /**
   * Builds system prompt for LLM
   */
  private buildSystemPrompt(): string {
    return `Jesteś ekspertem dietetykiem. Twoje zadanie to generowanie zdrowych, smacznych planów posiłków na jeden dzień.
Zawsze zwracaj odpowiedź w formacie JSON z tablicą 3 posiłków (śniadanie, obiad, kolacja).
Każdy posiłek musi mieć:
- name: pełna nazwa z typem posiłku (np. "Śniadanie: Owsianka z owocami")
- ingredients: tablica składników z polami "name" i "amount" (używaj europejskich jednostek: g, ml, szt.)
- steps: tablica kroków przygotowania
- time: szacowany czas przygotowania w minutach (liczba całkowita)

Zwróć TYLKO poprawny JSON bez dodatkowych komentarzy.`;
  }

  /**
   * Builds user prompt based on preferences
   */
  private buildUserPrompt(preferences: UserPreferencesDTO): string {
    const parts: string[] = [
      `Wygeneruj plan 3 posiłków (śniadanie, obiad, kolacja) dla osoby o następujących preferencjach:`,
    ];

    // Health goal mapping
    const goalMap: Record<string, string> = {
      LOSE_WEIGHT: "odchudzanie",
      GAIN_WEIGHT: "przybranie na wadze",
      MAINTAIN_WEIGHT: "utrzymanie wagi",
      HEALTHY_EATING: "zdrowe odżywianie",
      BOOST_ENERGY: "zwiększenie energii",
    };
    parts.push(`- Cel zdrowotny: ${goalMap[preferences.health_goal] || preferences.health_goal}`);

    // Diet type mapping
    const dietMap: Record<string, string> = {
      STANDARD: "standardowa (wszędobylska)",
      VEGETARIAN: "wegetariańska",
      VEGAN: "wegańska",
      GLUTEN_FREE: "bezglutenowa",
    };
    parts.push(`- Dieta: ${dietMap[preferences.diet_type] || preferences.diet_type}`);

    // Activity level
    parts.push(`- Poziom aktywności: ${preferences.activity_level}/5`);

    // Allergies
    if (preferences.allergies && preferences.allergies.length > 0) {
      parts.push(`- Alergie: ${preferences.allergies.join(", ")}`);
    }

    // Disliked products
    if (preferences.disliked_products && preferences.disliked_products.length > 0) {
      parts.push(`- Nielubiane produkty: ${preferences.disliked_products.join(", ")}`);
    }

    parts.push(
      "\nFormat odpowiedzi (TYLKO JSON, bez dodatkowego tekstu):",
      '[{"name":"Śniadanie: ...","ingredients":[{"name":"...","amount":"..."}],"steps":["..."],"time":15},{"name":"Obiad: ...","ingredients":[...],"steps":[...],"time":30},{"name":"Kolacja: ...","ingredients":[...],"steps":[...],"time":20}]'
    );

    return parts.join("\n");
  }

  /**
   * Mock meal plan generator for development
   */
  private async generateMockMealPlan(preferences: UserPreferencesDTO): Promise<[Meal, Meal, Meal]> {
    // Simulate API delay
    await this.sleep(1000);

    const isDietVegan = preferences.diet_type === "VEGAN";
    const isDietVegetarian = preferences.diet_type === "VEGETARIAN" || isDietVegan;

    const breakfast: Meal = {
      name: "Śniadanie: Owsianka z owocami",
      ingredients: [
        { name: "Płatki owsiane", amount: "50g" },
        { name: isDietVegan ? "Mleko owsiane" : "Mleko", amount: "200ml" },
        { name: "Banan", amount: "1 szt." },
        { name: "Miód", amount: "1 łyżka" },
      ],
      steps: [
        "Zagotuj mleko w garnku",
        "Dodaj płatki owsiane i gotuj 5 minut na małym ogniu, mieszając",
        "Przełóż do miski",
        "Udekoruj pokrojonym bananem i polej miodem",
      ],
      time: 10,
    };

    const lunch: Meal = {
      name: isDietVegetarian ? "Obiad: Makaron z warzywami" : "Obiad: Kurczak z ryżem i warzywami",
      ingredients: isDietVegetarian
        ? [
            { name: "Makaron pełnoziarnisty", amount: "100g" },
            { name: "Papryka", amount: "1 szt." },
            { name: "Cukinia", amount: "1 szt." },
            { name: "Pomidory", amount: "200g" },
            { name: "Oliwa z oliwek", amount: "2 łyżki" },
            { name: "Czosnek", amount: "2 ząbki" },
          ]
        : [
            { name: "Filet z kurczaka", amount: "150g" },
            { name: "Ryż brązowy", amount: "80g" },
            { name: "Brokuł", amount: "200g" },
            { name: "Marchew", amount: "1 szt." },
            { name: "Oliwa z oliwek", amount: "1 łyżka" },
          ],
      steps: isDietVegetarian
        ? [
            "Ugotuj makaron według instrukcji na opakowaniu",
            "Pokrój warzywa w kostkę",
            "Podsmaż czosnek na oliwie",
            "Dodaj warzywa i smaż 10 minut",
            "Wymieszaj z odsączonym makaronem",
          ]
        : [
            "Ugotuj ryż według instrukcji",
            "Pokrój kurczaka w kostkę i usmaż na oliwie",
            "Ugotuj brokuły i marchew na parze",
            "Podawaj razem z ryżem",
          ],
      time: 25,
    };

    const dinner: Meal = {
      name: "Kolacja: Sałatka grecka",
      ingredients: [
        { name: "Sałata rzymska", amount: "1 główka" },
        { name: "Ogórek", amount: "1 szt." },
        { name: "Pomidory koktajlowe", amount: "200g" },
        { name: isDietVegan ? "Tofu" : "Ser feta", amount: "100g" },
        { name: "Oliwki", amount: "50g" },
        { name: "Oliwa z oliwek", amount: "2 łyżki" },
        { name: "Sok z cytryny", amount: "1 łyżka" },
      ],
      steps: [
        "Pokrój wszystkie warzywa",
        "Pokrusz ser feta (lub tofu)",
        "Wymieszaj wszystkie składniki w misce",
        "Polej oliwą i sokiem z cytryny",
        "Dopraw solą i pieprzem",
      ],
      time: 15,
    };

    return [breakfast, lunch, dinner];
  }

  /**
   * Helper to sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create OpenRouterService instance
 * Uses environment variable for API key
 *
 * @param useMocks - Whether to use mock data instead of real API calls (default: true for development)
 */
export function createOpenRouterService(useMocks = true): OpenRouterService {
  const apiKey = import.meta.env.OPENROUTER_API_KEY || "";

  if (!apiKey && !useMocks) {
    throw new Error("OPENROUTER_API_KEY environment variable is required when not using mocks");
  }

  return new OpenRouterService(apiKey, useMocks);
}
