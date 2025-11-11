# AI Meal Planner PL

## Project Description

AI Meal Planner is a web application that leverages Large Language Models (LLMs) to generate personalised daily meal plans. The application considers users’ health goals, dietary preferences, allergies, and disliked ingredients to produce three realistic recipes (breakfast, lunch, dinner).

## Tech Stack

- **Frontend:** [Astro 5](https://astro.build) with [React 19](https://react.dev) & TypeScript 5
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com) & [shadcn/ui](https://ui.shadcn.com)
- **Backend-as-a-Service:** [Supabase](https://supabase.com) (PostgreSQL, Auth, Storage)
- **AI Provider:** [OpenRouter](https://openrouter.ai) (access to OpenAI, Anthropic, Google models & more)
- **CI/CD & Hosting:** GitHub Actions · Docker · DigitalOcean
- **Node Version:** **22.14.0** (`.nvmrc`)

## Testing

- **Unit tests:** Vitest + React Testing Library — Vitest as test runner and assertion framework; React Testing Library for DOM-focused component tests.
- **End-to-end (E2E) tests:** Playwright — cross-browser E2E automation for critical user flows, runnable locally and in CI.

## Getting Started Locally

```bash
# 1. Clone the repository
$ git clone https://github.com/morytop/10xdevs-project.git
$ cd 10xdevs-project

# 2. Install dependencies (locks versions via package-lock.json)
$ npm ci

# 3. Run the development server
$ npm run dev

# 4. Open the app
#    http://localhost:4321 (default Astro port)
```

### Environment Variables

Create a `.env` file (or use your preferred secret manager) and set:

```bash
SUPABASE_URL="..."
SUPABASE_ANON_KEY="..."
OPENROUTER_API_KEY="..." # optional – defaults to env: OPENAI_API_KEY
```

## Available Scripts

| Script             | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start Astro dev server (hot reload)  |
| `npm run build`    | Build the production bundle          |
| `npm run preview`  | Preview the production build locally |
| `npm run astro`    | Expose the Astro CLI                 |
| `npm run lint`     | Lint all files                       |
| `npm run lint:fix` | Lint & automatically fix issues      |
| `npm run format`   | Format files with Prettier           |

## Project Scope (MVP)

1. **Authentication** – Register, log-in, log-out, reset password
2. **User Onboarding** – Guided form to collect dietary profile (health goal, diet type, activity level, allergies, disliked ingredients)
3. **Meal Plan Generation** – AI generates daily plan (3 meals) with retry logic & timeout (30 s)
4. **Display & Feedback** – Responsive UI to present meals, regenerate plan, thumbs up/down feedback
5. **Analytics** – Track key events (`plan_generated`, `plan_regenerated`, `plan_accepted`, `feedback_given`, …)

_Out-of-scope for MVP_: shopping list, nutritional macros, recipe library, mobile apps, multi-language support, offline mode.

## API Endpoints

### `/api/preferences`

- `POST` — Creates user preferences (required: `health_goal`, `diet_type`, `activity_level`; optional: `allergies`, `disliked_products`). Returns status `201` together with the full preferences object.
- `GET` — Returns the current preferences of the authenticated user. Requires the `Authorization: Bearer <jwt>` header.
- `PUT` — Updates existing preferences; the payload may include any subset of fields (`null` clears the value). Requires authentication and returns the updated object.

#### Example (`GET`)

```bash
curl -X GET \
  https://app.example.com/api/preferences \
  -H "Authorization: Bearer <jwt-token>"
```

#### Example (`PUT`)

```bash
curl -X PUT \
  https://app.example.com/api/preferences \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "diet_type": "VEGAN",
    "allergies": ["Nuts"],
    "disliked_products": null
  }'
```

**Response codes**

- `200` — Success (GET/PUT)
- `201` — Preferences created (POST)
- `400` — Validation error (`details` contains the list of issues)
- `401` — Unauthorized
- `404` — Preferences not found for the user (GET/PUT)
- `500` — Unexpected server error

### `/api/meal-plans`

- `POST` — Generates a new AI-powered meal plan for the authenticated user. Requires user preferences to be set first. Accepts optional `regeneration` boolean (default: `false`) for analytics tracking. Returns status `201` with the generated meal plan containing 3 meals (breakfast, lunch, dinner).

#### Request Body

```json
{
  "regeneration": false
}
```

#### Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "meals": [
    {
      "name": "Śniadanie: Owsianka z owocami",
      "ingredients": [
        { "name": "Płatki owsiane", "amount": "50g" },
        { "name": "Mleko owsiane", "amount": "200ml" },
        { "name": "Banan", "amount": "1 szt." }
      ],
      "steps": [
        "Zagotuj mleko owsiane w garnku",
        "Dodaj płatki owsiane i gotuj 5 minut",
        "Udekoruj pokrojonym bananem"
      ],
      "time": 10
    },
    {
      "name": "Obiad: Makaron z warzywami",
      "ingredients": [...],
      "steps": [...],
      "time": 25
    },
    {
      "name": "Kolacja: Sałatka grecka",
      "ingredients": [...],
      "steps": [...],
      "time": 15
    }
  ],
  "generated_at": "2025-10-27T14:30:00Z",
  "status": "generated",
  "created_at": "2025-10-27T14:30:00Z"
}
```

**Response codes**

- `201` — Meal plan generated successfully
- `400` — User preferences not found (must create preferences first)
- `401` — Unauthorized
- `409` — Conflict (plan is already being generated, wait and retry)
- `500` — Generation failed after retries
- `503` — AI service unavailable
- `504` — Generation timeout (>30s)

### `/api/meal-plans/current`

- `GET` — Returns the current (most recent) meal plan for the authenticated user.

#### Response (200 OK)

Returns the same structure as `POST /api/meal-plans`.

**Response codes**

- `200` — Success
- `401` — Unauthorized
- `404` — No meal plan found for user (generate one first)
- `500` — Unexpected server error

#### Example

```bash
# Generate meal plan
curl -X POST \
  http://localhost:4321/api/meal-plans \
  -H "Content-Type: application/json" \
  -d '{"regeneration": false}'

# Get current meal plan
curl -X GET \
  http://localhost:4321/api/meal-plans/current
```

**Note:** During development, the API uses mock data for faster testing. Set `OPENROUTER_API_KEY` in `.env` and disable mocks for production AI generation.

### `/api/feedback`

- `POST` — Creates feedback for the most recent meal plan. Requires `rating` ("THUMBS_UP" or "THUMBS_DOWN"); optional `comment` (max 500 characters). Returns status `201` with the created feedback object.

#### Request Body

```json
{
  "rating": "THUMBS_UP",
  "comment": "Świetny plan, przepisy były proste i smaczne!"
}
```

#### Response (201 Created)

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "meal_plan_id": "550e8400-e29b-41d4-a716-446655440000",
  "rating": "THUMBS_UP",
  "comment": "Świetny plan, przepisy były proste i smaczne!",
  "created_at": "2025-10-27T15:00:00Z"
}
```

**Response codes**

- `201` — Feedback created successfully
- `400` — Validation error (invalid rating or comment too long)
- `401` — Unauthorized
- `404` — No meal plan found (generate a plan first)
- `409` — Conflict (feedback already exists for this plan)
- `500` — Unexpected server error

### `/api/feedback/:id`

- `PUT` — Updates existing feedback. Can update `rating` and/or `comment`. At least one field must be provided.
- `DELETE` — Deletes feedback by ID.

#### Update Example

```bash
curl -X PUT \
  http://localhost:4321/api/feedback/660e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": "THUMBS_DOWN",
    "comment": "Za dużo czasu przygotowania"
  }'
```

**Response codes**

- `200` — Feedback updated successfully
- `400` — Validation error
- `401` — Unauthorized
- `403` — Forbidden (not the owner of this feedback)
- `404` — Feedback not found
- `500` — Unexpected server error

### `/api/analytics/events`

- `POST` — Logs an analytics event for the current user. This endpoint is **non-blocking** and always returns `204 No Content` even if database logging fails, ensuring analytics never interrupts user experience.

**Note:** Currently uses default user ID for testing. Authentication will be implemented later.

#### Request Body

```json
{
  "action_type": "plan_accepted",
  "metadata": {
    "time_on_page": 45,
    "plan_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Available action types:**

- `user_registered` — User registration completed
- `profile_created` — User preferences created
- `profile_updated` — User preferences updated
- `plan_generated` — Meal plan generated
- `plan_regenerated` — Meal plan regenerated
- `plan_accepted` — User accepted meal plan (frontend-triggered)
- `feedback_given` — Feedback submitted
- `api_error` — API error occurred

**Response codes**

- `204` — No Content (success or hidden failure)
- `400` — Validation error (invalid action_type or metadata format)

#### Example

```bash
curl -X POST \
  http://localhost:4321/api/analytics/events \
  -H "Content-Type: application/json" \
  -d '{
    "action_type": "plan_accepted",
    "metadata": { "time_on_page": 45 }
  }'
```

**Note:** Most analytics events are logged automatically by the backend. The frontend should only use this endpoint for user-initiated events like `plan_accepted`.

## Project Status

🚧 **In active development.**

## License

Licensed under the MIT License. See [`LICENSE`](LICENSE) for details.
