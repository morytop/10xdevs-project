<architecture_analysis>

1. Komponenty uczestniczące w autentykacji (z kodu i specyfikacji)

- Strony (Astro): `src/pages/login.astro`, `src/pages/register.astro`, `src/pages/reset-password.astro`, `src/pages/update-password.astro`, chronione: `src/pages/dashboard.astro`, `src/pages/profile.astro`, `src/pages/onboarding.astro`, layout: `src/layouts/Layout.astro`.
- Formularze (React): `LoginForm.tsx`, `RegisterForm.tsx`, `ResetPasswordForm.tsx`, `UpdatePasswordForm.tsx`.
- Nawigacja: `PublicNavigation.tsx` (goście), `AuthenticatedNavigation.tsx` (z przyciskiem Wyloguj → POST `/api/auth/logout`).
- Powiadomienia: `ToasterProvider.tsx`.
- Middleware/SSR: `src/middleware/index.ts` (przypisanie `locals.supabase`, redirect zalogowanych z `/` → `/dashboard`, planowana ochrona tras).
- Klient Supabase: `src/db/supabase.client.ts` (client-side, obecnie bez wariantu SSR z cookies).
- API: istniejące (`/api/analytics/events`, `/api/preferences`, `/api/meal-plans/*`), planowany endpoint: `POST /api/auth/logout`.
- Planowany kontekst stanu: `AuthProvider` (inicjalizacja store z danych SSR przekazywanych z Astro).

2. Główne strony i ich komponenty

- login.astro → `LoginForm` (+ `ToasterProvider`), SSR: `prerender = false`, check sesji → redirect `/dashboard`.
- register.astro → `RegisterForm` (+ `ToasterProvider`), SSR: `prerender = false`, check sesji → redirect `/dashboard`.
- reset-password.astro → `ResetPasswordForm` (publiczna, bez SSR check).
- update-password.astro → `UpdatePasswordForm` (publiczna, recovery flow Supabase).
- dashboard.astro, profile.astro, onboarding.astro → chronione (docelowo przez middleware), korzystają z `AuthenticatedNavigation` z przyciskiem „Wyloguj”.

3. Przepływ danych (wysoki poziom)

- Strony login/register wykonują SSR `supabase.auth.getSession()` (przez `Astro.locals.supabase`) → jeśli sesja istnieje: redirect do `/dashboard`.
- Formularze `LoginForm`/`RegisterForm` wywołują odpowiednio `supabaseClient.auth.signInWithPassword` i `supabaseClient.auth.signUp` → sukces: toast → redirect (dashboard / onboarding).
- `ResetPasswordForm` → `auth.resetPasswordForEmail(email, { redirectTo: /update-password })` → email z linkiem recovery → `UpdatePasswordForm` → `auth.updateUser({ password })` → redirect `/login`.
- `AuthenticatedNavigation` → „Wyloguj” → POST `/api/auth/logout` (nowy endpoint) → `auth.signOut()` po stronie serwera → redirect (`/` lub `/login`).
- Middleware (docelowo): PROTECTED_PATHS (`/dashboard`, `/profile`, `/onboarding`) → brak sesji: redirect `/login?redirectTo=...`; zalogowani nie wejdą na `/login`, `/register`.
- (Opcjonalnie, wg PRD/spec) Zdarzenia analytics: `user_registered`, `api_error` wysyłane do `/api/analytics/events`.

4. Opis ról/funkcjonalności

- `Layout.astro`: szkielet HTML, miejsce na content i provider toasta.
- `PublicNavigation`/`AuthenticatedNavigation`: nawigacja dla gościa/zalogowanego; w tej drugiej obsługa wylogowania (fallback czyszczenia localStorage do czasu endpointu SSR).
- `LoginForm`/`RegisterForm`: stan, walidacja, integracja Supabase Auth, toasty, redirecty.
- `ResetPasswordForm`/`UpdatePasswordForm`: reset hasła (link email → recovery → ustaw nowe hasło), komunikaty PL, redirect.
- `middleware/index.ts`: przypisuje `locals.supabase`; plan: pełna ochrona tras i SSR Supabase z cookies.
- `supabase.client.ts`: klient Supabase (klient), docelowo również klient SSR w middleware.
- `POST /api/auth/logout` (nowy): bez body, 204 No Content na sukces, 500 na błąd (spójny JSON błędu), wykonuje `auth.signOut()` po stronie serwera.
- `AuthProvider` (planowany): inicjalizacja auth store po stronie klienta na podstawie danych SSR przekazanych jako props.
  </architecture_analysis>

<mermaid_diagram>

```mermaid
flowchart TD

  %% Subgraf: Layout i provider toasta
  subgraph LAY["Warstwa Layout"]
    LAYOUT["Layout.astro"]
    TOASTER[["ToasterProvider"]]
  end

  %% Subgraf: Nawigacja
  subgraph NAV["Nawigacja"]
    NAV_PUBLIC["PublicNavigation"]:::nav
    NAV_AUTH["AuthenticatedNavigation (Wyloguj)"]:::nav
  end

  %% Subgraf: Strony publiczne (Astro)
  subgraph PUBPAGES["Strony Publiczne (Astro)"]
    P_LOGIN("/login"):::page
    P_REGISTER("/register"):::page
    P_RESET("/reset-password"):::page
    P_UPDATE("/update-password"):::page
  end

  %% Subgraf: Formularze (React)
  subgraph FORMS["Formularze (React)"]
    F_LOGIN["LoginForm"]:::form
    F_REGISTER["RegisterForm"]:::form
    F_RESET["ResetPasswordForm"]:::form
    F_UPDATE["UpdatePasswordForm"]:::form
  end

  %% Subgraf: Strony chronione (Astro)
  subgraph PROT["Strony Chronione (Astro)"]
    P_DASH("/dashboard"):::page
    P_PROFILE("/profile"):::page
    P_ONBOARD("/onboarding"):::page
  end

  %% Subgraf: Middleware i SSR
  subgraph SSR["Middleware i SSR"]
    MIDDLEWARE["middleware/index.ts\n(przypisz locals.supabase)\n+ ochrona tras (plan)"]:::updated
    SSR_CHECK{„Sesja istnieje?”}:::updated
  end

  %% Subgraf: API i Auth
  subgraph API["API i Auth"]
    API_LOGOUT["POST /api/auth/logout"]:::new
    API_ANALYTICS["POST /api/analytics/events"]
    SB_CLIENT["supabaseClient (klient)"]
    SB_SSR["locals.supabase (SSR)"]:::updated
    SB_AUTH((("Supabase Auth")))
  end

  %% Połączenia: layout i nawigacja
  LAYOUT --- TOASTER
  LAYOUT --- NAV_PUBLIC
  LAYOUT --- NAV_AUTH

  %% Public pages osadzają formularze
  P_LOGIN --> F_LOGIN
  P_REGISTER --> F_REGISTER
  P_RESET --> F_RESET
  P_UPDATE --> F_UPDATE

  %% SSR check na stronach login/register
  P_LOGIN -- "SSR: getSession()" --> SB_SSR
  P_REGISTER -- "SSR: getSession()" --> SB_SSR
  SB_SSR -- "redirect → /dashboard" --> P_DASH

  %% Akcje formularzy (client → Supabase Auth)
  F_LOGIN -- "auth.signInWithPassword" --> SB_CLIENT
  F_REGISTER -- "auth.signUp" --> SB_CLIENT
  F_RESET -- "resetPasswordForEmail" --> SB_CLIENT
  F_UPDATE -- "updateUser({ password })" --> SB_CLIENT
  SB_CLIENT ==> SB_AUTH

  %% Redirecty po sukcesie
  F_LOGIN -- "sukces" --> P_DASH
  F_REGISTER -- "sukces" --> P_ONBOARD
  F_UPDATE -- "sukces" --> P_LOGIN

  %% Nawigacja zalogowanego: Wyloguj → API
  NAV_AUTH -- "POST" --> API_LOGOUT
  API_LOGOUT -- "auth.signOut()" --> SB_SSR
  API_LOGOUT -- "204 → redirect" --> P_LOGIN
  SB_SSR ==> SB_AUTH

  %% Middleware: ochrona tras i redirecty (docelowo)
  MIDDLEWARE -- "/dashboard,/profile,/onboarding" --> PROT
  MIDDLEWARE -. "brak sesji → redirect" .-> P_LOGIN

  %% Analytics (opcjonalnie wg spec)
  F_REGISTER -. "user_registered" .-> API_ANALYTICS
  F_LOGIN -. "api_error" .-> API_ANALYTICS

  %% Połączenia layout ↔ strony
  LAYOUT --- P_LOGIN
  LAYOUT --- P_REGISTER
  LAYOUT --- P_RESET
  LAYOUT --- P_UPDATE
  LAYOUT --- P_DASH
  LAYOUT --- P_PROFILE
  LAYOUT --- P_ONBOARD

  %% Klasy stylów
  classDef page fill:#f0f4ff,stroke:#3b82f6,stroke-width:1px;
  classDef form fill:#f5f5f5,stroke:#6b7280,stroke-width:1px;
  classDef nav fill:#fdf2f8,stroke:#db2777,stroke-width:1px;
  classDef new fill:#e0f7ff,stroke:#0096c7,stroke-width:1px;
  classDef updated fill:#fff3cd,stroke:#d39e00,stroke-width:1px;
```

</mermaid_diagram>
