# AI Meal Planner

## Project Description

AI Meal Planner is a web application that leverages Large Language Models (LLMs) to generate personalised daily meal plans. The application considers users’ health goals, dietary preferences, allergies, and disliked ingredients to produce three realistic recipes (breakfast, lunch, dinner).

## Tech Stack

- **Frontend:** [Astro 5](https://astro.build) with [React 19](https://react.dev) & TypeScript 5
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com) & [shadcn/ui](https://ui.shadcn.com)
- **Backend-as-a-Service:** [Supabase](https://supabase.com) (PostgreSQL, Auth, Storage)
- **AI Provider:** [OpenRouter](https://openrouter.ai) (access to OpenAI, Anthropic, Google models & more)
- **CI/CD & Hosting:** GitHub Actions · Docker · DigitalOcean
- **Node Version:** **22.14.0** (`.nvmrc`)

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

## Project Status

🚧 **In active development.** 

## License

Licensed under the MIT License. See [`LICENSE`](LICENSE) for details.
