## Specyfikacja architektury modułu autentykacji

Zakres: US-001 (Rejestracja), US-002 (Logowanie), US-003 (Wylogowanie), US-004 (Reset hasła), US-021 (Ochrona stron) na podstawie wymagań z `@prd.md` i stacku z `@tech-stack.md`.

Technologie: Astro 5 (SSR, Node adapter), React 19, TypeScript 5, Tailwind 4, Shadcn/ui, Supabase Auth, Zod (walidacja).

Cele niefunkcjonalne:

- Zachowanie obecnej struktury i stylu projektu (nie łamać istniejących funkcji aplikacji).
- Spójny UX, komunikaty w języku polskim, dostępność (ARIA).
- SSR i ochrona tras zgodnie z `astro.config.mjs` (output: "server").

## 1. Architektura interfejsu użytkownika

### 1.1 Strony (Astro) i layouty

- `src/layouts/Layout.astro`
  - Wspólny layout stron publicznych i chronionych.
  - Integracja z Toaster (`src/components/ToasterProvider.tsx`) na stronach z formularzami auth.

- Strony publiczne (widoczne dla niezalogowanych):
  - `src/pages/login.astro`
    - SSR: `export const prerender = false`.
    - Przed renderowaniem: sprawdza sesję przez `Astro.locals.supabase.auth.getSession()`; jeśli jest aktywna sesja → redirect do `/dashboard`.
    - Zawiera `LoginForm` (`client:load`).
  - `src/pages/register.astro`
    - SSR: `export const prerender = false`.
    - Analogiczna kontrola sesji jak w login (redirect na `/dashboard` dla zalogowanych).
    - Zawiera `RegisterForm` (`client:load`).
  - `src/pages/reset-password.astro`
    - Publiczna, bez kontroli sesji.
    - Zawiera `ResetPasswordForm` (`client:load`).
  - `src/pages/update-password.astro`
    - Publiczna, ale zakłada, że użytkownik trafia z linku recovery (Supabase).
    - Zawiera `UpdatePasswordForm` (`client:load`).

- Strony chronione (wymagają sesji):
  - `src/pages/dashboard.astro`, `src/pages/profile.astro`, (opcjonalnie) `src/pages/onboarding.astro`.
  - Ochrona tras realizowana centralnie w middleware (patrz 2.2). Strony mogą (opcjonalnie) posiadać SSR check dla szybszego redirectu i `export const prerender = false` jeśli wymagają dynamicznej sesji na serwerze.

- Nawigacja:
  - `src/components/layout/AuthenticatedNavigation.tsx`
    - Widoczna dla zalogowanych (Dashboard, Mój Profil, przycisk „Wyloguj”).
  - „Wyloguj” wywołuje `POST /api/auth/logout` i po sukcesie przekierowuje na `/login` (zgodnie z US-003).
    - UX: responsywny navbar, obsługa mobile menu (Sheet z Shadcn/ui).
  - `src/components/layout/PublicNavigation.tsx`
    - Widoczna dla niezalogowanych (np. linki do logowania/rejestracji).

### 1.2 Komponenty React (formularze) – odpowiedzialności

- `src/components/auth/LoginForm.tsx`
  - Pola: `email`, `password`.
  - Walidacja client-side: poprawność formatu email, obecność hasła.
  - Integracja: `supabaseClient.auth.signInWithPassword`.
  - Stany: `isLoading`, błędy pól i globalny, przełączanie widoczności hasła.
  - Po sukcesie: toast „Witaj ponownie!” → redirect `/dashboard`.
  - Po błędzie: mapowanie błędów Supabase na polskie komunikaty („Nieprawidłowy email lub hasło”, błędy sieci/serwera), toast błędu.

- `src/components/auth/RegisterForm.tsx`
  - Pola: `email`, `password` (min 8), `passwordConfirmation`.
  - Walidacja client-side: format email, minimalna długość hasła, zgodność haseł.
  - Integracja: `supabaseClient.auth.signUp` (autopotwierdzenie w dev: `enable_confirmations=false` w `supabase/config.toml`).
  - Po sukcesie: toast powitalny → redirect `/onboarding`.
  - Po błędzie: mapowanie znanych błędów (np. „email zajęty”), toasty.

- `src/components/auth/ResetPasswordForm.tsx`
  - Pole: `email` + walidacja.
  - Integracja: `supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: {origin}/update-password })`.
  - Info o bezpieczeństwie: zawsze komunikat sukcesu „Jeśli konto istnieje... wyślemy link”, bez ujawniania istnienia konta.
  - Po sukcesie: stan success z informacją i linkiem do logowania.

- `src/components/auth/UpdatePasswordForm.tsx`
  - Pola: `password` (min 8), `confirmPassword`.
  - Precondition: sprawdzenie recovery session (`auth.getSession()` → recovery). Jeśli brak/nieprawidłowy token, informacja i CTA do ponowienia procedury.
  - Integracja: `supabaseClient.auth.updateUser({ password })`.
  - Po sukcesie: komunikat i redirect do `/login`.

### 1.3 Rozdzielenie odpowiedzialności (Astro vs React)

- Strony `.astro` (server):
  - SSR routing i ochrona (redirecty), decyzje nawigacyjne przed renderem.
  - Składanie layoutu, wstrzykiwanie komponentów interaktywnych (`client:load`).

- Komponenty React (client):
  - Interaktywność formularzy: stan, walidacja, integracja z Supabase Auth.
  - Toastery (sonner) i komunikaty błędów.

### 1.4 Walidacja i komunikaty błędów (spójny UX)

- Walidacja client-side:
  - Email: regex, komunikaty: „Email jest wymagany”, „Podaj prawidłowy adres email”.
  - Hasło: „Hasło jest wymagane”, „Hasło musi mieć minimum 8 znaków”.
  - Potwierdzenie: „Potwierdzenie hasła jest wymagane”, „Hasła muszą być identyczne”.

- Błędy Supabase → komunikaty PL:
  - Logowanie: „Nieprawidłowy email lub hasło”.
  - Sieć: „Sprawdź połączenie internetowe i spróbuj ponownie”.
  - Serwer: „Wystąpił błąd serwera. Spróbuj ponownie za chwilę”.

- A11y i użyteczność:
  - `aria-invalid`, `aria-describedby` dla błędów pól.
  - Widoczny obszar błędu globalnego nad formularzem.
  - Blokada przycisków podczas `isLoading`.

### 1.5 Najważniejsze scenariusze

- Użytkownik zalogowany wchodzi na `/login` lub `/register` → natychmiastowy redirect do `/dashboard` (SSR).
- Użytkownik niezalogowany wchodzi na stronę chronioną → redirect do `/login?redirectTo=/pierwotna-trasa` (middleware).
- Rejestracja → automatyczne zalogowanie → redirect do `/onboarding`.
- Reset hasła → email → `update-password` z recovery session → ustaw nowe hasło → redirect `/login`.
- Wylogowanie → POST `/api/auth/logout` → redirect `/`.
- Wylogowanie → POST `/api/auth/logout` → redirect `/login`.

- Analytics (zgodnie z PRD):
  - `user_registered` po udanej rejestracji.
  - `api_error` w przypadku błędów Auth (opcjonalnie wzbogacić metadane o endpoint i status).

### 1.6 Inicjalizacja auth store przez props z Astro (bez endpointu sesji)

- Strony `.astro` mogą przekazać do aplikacji React dane o aktualnym użytkowniku jako props z SSR (zamiast odpytywać dedykowany endpoint).
- Przykład (wzorzec): `src/pages/index.astro` lub dowolna strona składająca shell UI:
  - W frontmatter: `const { data: { session } } = await Astro.locals.supabase.auth.getSession()`.
  - Zbudować obiekt `currentUser`: `{ id: session?.user.id, email: session?.user.email } | null`.
  - Przekazać `currentUser` jako props do komponentu React inicjalizującego store, np. `AuthProvider` (`client:load`).
- `AuthProvider` (nowy komponent kontekstowy) inicjalizuje auth store po stronie klienta na podstawie props i udostępnia go pozostałym komponentom.
- Bezpieczeństwo: przekazujemy wyłącznie minimalny zestaw danych (bez tokenów).
- Uwaga: jeśli middleware przekierowuje zalogowanych z `/` → `/dashboard`, ten wzorzec stosujem
  y na stronach takich jak `dashboard.astro` (również mogą przekazać `currentUser`).

## 2. Logika backendowa

### 2.1 Endpointy API

- `POST /api/auth/logout`
  - Plik: `src/pages/api/auth/logout.ts` (nowy).
  - Wejście: brak body.
  - Działanie: używa `context.locals.supabase` do `auth.signOut()`.
  - Wyjście:
    - `204 No Content` – sukces.
    - `500` – błąd; JSON: `{ "error": "Internal server error", "message": "Nie udało się wylogować" }`.
  - Uwagi:
    - Zgodnie z zasadą projektu API: `export const prerender = false`.
    - Ujednolicony kształt błędów (jak w `preferences.ts`).
    - W przypadku błędu logować `api_error` przez `logAnalyticsEvent` (jeśli dostępny `user_id`).

- Brak endpointu do sprawdzania sesji: zamiast tego UI inicjalizuje stan autentykacji przez props z SSR (patrz 1.6), co eliminuje potrzebę `GET /api/auth/session`.

### 2.2 Middleware (ochrona tras i SSR supabase)

- Plik: `src/middleware/index.ts`
  - Aktualnie: przypisuje `supabaseClient` do `context.locals.supabase` i przekierowuje zalogowanych z `/` → `/dashboard`.

- Docelowo (zalecane):
  - Zastąpić zwykłe `createClient` rozwiązaniem serwerowym (`@supabase/ssr`) z integracją cookies Astro, np. dostarczając helper do tworzenia klienta na podstawie `context.request` i `Astro.cookies`. Dzięki temu SSR będzie widział prawdziwą sesję użytkownika, a `auth.signOut()` w API skasuje cookies.
  - Przykładowa logika (bez implementacji kodu):
    - `const supabase = createServerClient(...)` → `context.locals.supabase = supabase`.
    - PROTECTED_PATHS: `['/dashboard', '/profile', '/onboarding']` (zgodnie z US-021). Generowanie planu odbywa się w `dashboard.astro`, więc ochrona `/dashboard` pokrywa także „Generowanie planu”. Jeśli w przyszłości wydzielimy dedykowaną trasę (np. `/plan`), należy dodać ją do PROTECTED_PATHS.
    - AUTH_ONLY_PATHS: `['/login', '/register']` (dla zalogowanych – redirect do `/dashboard`).
    - Jeśli `request.url.pathname` ∈ PROTECTED_PATHS i brak sesji → redirect do `/login?redirectTo=${pathname}`.
    - Jeśli `pathname` ∈ AUTH_ONLY_PATHS i jest sesja → redirect do `/dashboard`.
    - Zachować istniejące zachowanie `/` → `/dashboard` dla zalogowanych.

- Wyjątki i kompatybilność:
  - Nie blokować `/api/*` bez potrzeby (wyjątek: endpointy wymagające auth mogą same sprawdzać sesję).
  - Do czasu migracji na `@supabase/ssr` UI pozostaje odpowiedzialny za czyszczenie localStorage przy wylogowaniu (fallback obecny w `AuthenticatedNavigation.tsx`).
  - Wygasanie sesji: respektujemy ustawienia w `supabase/config.toml` (`jwt_expiry`). Jeśli sesja jest nieaktywna/nieprawidłowa, middleware traktuje użytkownika jako niezalogowanego i kieruje na `/login?redirectTo=...` (spełnienie US-021).

### 2.3 SSR i renderowanie stron

- `astro.config.mjs` ma `output: "server"` i adapter Node – wykorzystywać SSR.
- Strony wymagające dynamicznej sesji (login/register/protected) powinny mieć `export const prerender = false`.
- W SSR używać `Astro.locals.supabase` do wczesnych redirectów (szybsze UX, mniej migotania UI).

### 2.4 Walidacja danych wejściowych i obsługa wyjątków

- W API trasach k
  orzystać z Zod (spójnie z istniejącymi endpointami) – w przypadku `POST /api/auth/logout` brak body, więc walidacja nie jest wymagana.
- Standardowa odpowiedź błędu JSON (spójna jak w `src/pages/api/preferences.ts`):
  - `{ "error": string, "message"?: string, "details"?: string[] }`.
- Logowanie błędów do konsoli i (opcjonalnie) do `analytics_events` przez `logAnalyticsEvent(supabase, userId, 'api_error', { endpoint, method, status })`.

## 3. System autentykacji (Supabase Auth + Astro)

### 3.1 Rejestracja (US-001)

- UI: `RegisterForm` z walidacją (`email`, `password >= 8`, `passwordConfirmation`).
- Backend/Auth: `supabaseClient.auth.signUp` (w dev `enable_confirmations=false` → automatyczna sesja po rejestracji, potwierdza `supabase/config.toml`).
- Nawigacja: redirect na `/onboarding` po sukcesie.
- Analytics: `user_registered` (przez `logAnalyticsEvent`).

### 3.2 Logowanie (US-002)

- UI: `LoginForm` z walidacją, obsługa błędów i toastów.
- Backend/Auth: `supabaseClient.auth.signInWithPassword`.
- Nawigacja: redirect na `/dashboard`.
- Bezpieczeństwo: blokady podczas `isLoading`, brak ujawniania szczegółów błędów poza „Nieprawidłowy email lub hasło”.

### 3.3 Wylogowanie (US-003)

- UI: przycisk „Wyloguj” w `AuthenticatedNavigation`.
- Backend/API: `POST /api/auth/logout` → `auth.signOut()` na serwerze (po migracji na `@supabase/ssr` czyszczenie cookies SSR).
- UX: redirect na `/` po sukcesie (fallback: czyszczenie `localStorage` jak w obecnym komponencie, do czasu migracji SSR cookies).

### 3.4 Reset hasła (US-004)

- UI: `ResetPasswordForm` (email) → generuje link z `redirectTo={origin}/update-password`.
- UI: `UpdatePasswordForm` – wymaga recovery session; po ustawieniu nowego hasła redirect do `/login`.
- Bezpieczeństwo: generowanie generycznych komunikatów sukcesu, brak ujawniania istnienia konta.

### 3.5 Ochrona stron (US-021)

- Centralna ochrona tras w middleware (PROTECTED_PATHS: `/dashboard`, `/profile`, opcjonalnie `/onboarding`).
- Niezalogowanych przekierowywać na `/login?redirectTo=...`.
- Zalogowanych nie wpuszczać na `/login` i `/register` (redirect `/dashboard`).

### 3.6 Spójność z resztą systemu

- Zgodność z istniejącą architekturą:
  - Zachować integrację z `logAnalyticsEvent` i spójne formaty odpowiedzi JSON w API.
  - Nie modyfikować struktury katalogów – nowe elementy:
    - `src/pages/api/auth/logout.ts` (nowy endpoint).
  - Strony i komponenty auth pozostają w obecnych lokalizacjach:
    - Strony: `src/pages/login.astro`, `src/pages/register.astro`, `src/pages/reset-password.astro`, `src/pages/update-password.astro`.
    - Komponenty: `src/components/auth/*`.

- Plan docelowej migracji SSR Sup
  abase (niełamiący MVP):
  - Wprowadzić helper do tworzenia klienta serwerowego Supabase (`@supabase/ssr`) i przypisywać go do `context.locals.supabase` w middleware (odczyt/zapis cookies przez Astro).
  - Po migracji: usunąć fallback czyszczenia `localStorage` w `AuthenticatedNavigation` i polegać na serwerowym `auth.signOut()`.
  - W endpointach i SSR redirectach zacząć pobierać `user_id` z sesji (usunąć tymczasowe `DEAFULT_USER_ID`).

## 4. Kontrakty, moduły i zmiany w kodzie (bez implementacji)

- Nowy endpoint:
  - `src/pages/api/auth/logout.ts`
    - Metoda: `POST`.
    - Wejście: brak.
    - Wyjście: `204` lub błąd `500` (spójny JSON błędu).
    - `export const prerender = false`.

- Middleware (`src/middleware/index.ts`):
  - Rozszerzyć o listy `PROTECTED_PATHS` i `AUTH_ONLY_PATHS` oraz odpowiednie redirecty.
  - Docelowo: zastąpić klienta `createClient` wariantem SSR z obsługą cookies.

- Strony Astro:
  - Upewnić się, że `login.astro` i `register.astro` mają `prerender = false` (już jest).
  - Dla stron chronionych – używać tylko middleware do ochrony (SSR check na stronie opcjonalny, ale akceptowalny dla szybszego redirectu).

- Komponenty React (formularze):
  - Zachować obecne walidacje i mapowanie błędów.
  - Ujednolicić komunikaty (PL) i dostępność (ARIA), spójny wzorzec toastów.

- Komponent kontekstowy (nowy):
  - `src/
components/auth/AuthProvider.tsx` – przyjmuje `currentUser` (z SSR) i inicjalizuje auth store/Context; udostępnia go komponentom potomnym.

- Analytics:
  - Rejestracja: `user_registered`.
  - Błędy autentykacji: `api_error` (endpoint, metoda, status w metadata).

- Bezpieczeństwo:
  - Brak przechowywania haseł w UI; komunikaty generyczne przy resetowaniu.
  - SameSite i HttpOnly cookies – uzyskane „za darmo” po migracji do SSR Supabase.

## 5. Scenariusze testowe (akceptacja PRD)

- US-001 Rejestracja:
  - Poprawna rejestracja → automatyczna sesja → redirect `/onboarding`.
  - Walidacja: email, hasło >= 8, zgodność haseł.
  - Błędy: email zajęty, sieć, serwer.

- US-002 Logowanie:
  - Poprawne dane → redirect `/dashboard`.
  - Niepoprawne dane → „Nieprawidłowy email lub hasło”.
  - Link do resetu obecny.

- US-003 Wylogowanie:
  - POST `/api/auth/logout` → 204 → redirect `/`.
  - Próba wejścia na chronione trasy po wylogowaniu → redirect `/login`.

- US-004 Reset hasła:
  - Wysłanie resetu (zawsze generyczny sukces).
  - Link recovery → ustaw nowe hasło → redirect `/login`.

- US-021 Ochrona stron:
  - Niezalogowany na `/dashboard`/`/profile` → redirect `/login?redirectTo=...`.
  - Zalogowany na `/login`/`/register` → redirect `/dashboard`.

## 6. Uwagi końcowe i ryzyka

- Ryzyko SSR bez `@supabase/ssr`: serwerowe `getSession()` może nie odczytać cookies – dlatego zalecana migracja do klienta SSR (bez wpływu na MVP, planowana w kolejnej iteracji).
- Spójność eventów analytics z PRD: używać wyłącznie zdefiniowanych typów (`user_registered`, `api_error`, ...). Rozszerzenia (np. `user_logged_out`) wymagają aktualizacji enumów w DB – poza MVP.
- Zgodność i niełamanie istniejącej logiki: spec utrzymuje aktualne pliki i wzorce; nowe rzeczy to wyłącznie endpoint logout i rozszerzenie middleware.
