import { mealsArraySchema } from "@/lib/schemas/meal-plans.schema";
import type { UserPreferencesDTO, Meal } from "@/types";
import { OpenRouterService as BaseOpenRouterService } from "@/lib/openrouter/service";

/**
 * Service wrapper for meal plan generation using OpenRouter
 * Uses the advanced OpenRouterService implementation under the hood
 * Provides backward compatibility with the old interface
 */
export class OpenRouterService {
  private readonly baseService: BaseOpenRouterService | null;
  private readonly useMocks: boolean;

  constructor(apiKey: string, useMocks = true) {
    this.useMocks = useMocks;

    // Only initialize base service if not using mocks
    if (!useMocks && apiKey) {
      this.baseService = new BaseOpenRouterService({
        apiKey,
        defaultModel: "openai/gpt-4o-mini", // Fast, reliable and cost-effective
        timeout: 30000, // 30 seconds
        maxRetries: 3,
        retryDelay: 1000,
        siteName: "10xDevs AI Meal Planner",
        siteUrl: "https://10xdevs-project.com",
      });
    } else {
      this.baseService = null;
    }
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

    if (!this.baseService) {
      throw new Error("OpenRouter service not initialized. API key may be missing.");
    }

    // Use the new advanced service with structured messages
    const messages = [
      {
        role: "system" as const,
        content: this.buildSystemPrompt(),
      },
      {
        role: "user" as const,
        content: this.buildUserPrompt(preferences),
      },
    ];

    try {
      console.log("[OpenRouter] Starting meal plan generation...");

      const response = await this.baseService.complete({
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0].message.content;

      console.log("[OpenRouter] Received response, parsing JSON...");

      // Parse JSON response and validate structure
      const meals = JSON.parse(content);
      const validatedMeals = mealsArraySchema.parse(meals);

      console.log("[OpenRouter] Successfully generated and validated meal plan");

      return validatedMeals;
    } catch (error) {
      console.error("[OpenRouter] Failed to generate meal plan:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw new Error(`Failed to generate meal plan: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Builds system prompt for LLM with enhanced instructions
   */
  private buildSystemPrompt(): string {
    return `Jesteś ekspertem dietetykiem z 10-letnim doświadczeniem w planowaniu posiłków.
Twoje zadanie to generowanie REALISTYCZNYCH, SMACZNYCH i ZDROWYCH planów posiłków na jeden dzień.

ZASADY:
- Używaj TYLKO realnych produktów dostępnych w polskich sklepach
- Porcje muszą być REALISTYCZNE (np. 50g płatków, 200ml mleka, 150g mięsa)
- Kroki muszą być SZCZEGÓŁOWE i wykonalne dla osoby z podstawowymi umiejętnościami
- Czas musi być REALISTYCZNY (śniadanie: 10-15min, obiad: 30-45min, kolacja: 15-25min)
- NIE wymyślaj egzotycznych, trudnodostępnych produktów
- Przepisy muszą być proste i praktyczne do wykonania w domu

FORMAT ODPOWIEDZI:
Zwróć tablicę 3 posiłków (śniadanie, obiad, kolacja) w formacie JSON.
Każdy posiłek MUSI mieć następującą strukturę:
{
  "name": "Typ posiłku: Nazwa dania" (np. "Śniadanie: Owsianka z owocami"),
  "ingredients": [
    {"name": "Nazwa składnika", "amount": "ilość z jednostką (g, ml, szt.)"}
  ],
  "steps": ["Krok 1", "Krok 2", ...],
  "time": liczba_minut (liczba całkowita)
}

WAŻNE: Zwróć TYLKO poprawny JSON bez żadnych dodatkowych komentarzy, nagłówków czy formatowania markdown.`;
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
