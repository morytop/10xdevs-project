# Architektura UI dla AI Meal Planner MVP

## 1. Przegląd struktury UI

### 1.1. Założenia projektowe

AI Meal Planner to aplikacja webowa zaprojektowana z myślą o prostocie, szybkości i dostępności. Architektura UI opiera się na następujących zasadach:

- **Minimalizm**: Onboarding od rejestracji do pierwszego planu w <5 minut
- **Responsywność**: Mobile-first design z Tailwind utility classes
- **Accessibility**: WCAG 2.1 AA compliance
- **Język**: Wszystkie treści i komunikaty w języku polskim
- **Spójność**: Shadcn/ui jako fundament komponentów

### 1.2. Stack technologiczny UI

- **Framework**: Astro 5 (routing, SSR) + React 19 (interaktywne komponenty)
- **Styling**: Tailwind CSS 4
- **Komponenty**: Shadcn/ui (Button, Input, Card, Select, Dialog, Toast, Badge, Combobox)
- **Walidacja**: Zod schemas + React Hook Form (complex forms)
- **State Management**: React hooks + Context API (tylko dla auth)
- **Type Safety**: TypeScript 5

### 1.3. Główne wzorce architektoniczne

**Feature-based component organization**:
```
src/components/
├── ui/              # Shadcn/ui base components
├── auth/            # Authentication-related components
├── preferences/     # User preferences components
├── meal-plan/       # Meal plan display components
├── layout/          # Navigation, Header, Footer
└── shared/          # Shared utilities (LoadingSpinner, ErrorMessage, EmptyState)
```

**API Integration Pattern**:
```
React Component → Custom Hook → Supabase Client → API Endpoint → Database
```

**State Management Strategy**:
- Global: AuthContext (user session)
- Local: React useState/useReducer per component
- Persistent: localStorage (form drafts only)
- No global state library w MVP (simple enough without it)

### 1.4. Routing i ochrona stron

**Hybrydowa ochrona**:
- **Server-side**: Astro middleware sprawdza sesję i przekierowuje
- **Client-side**: React ProtectedRoute component jako dodatkowe zabezpieczenie

**Inteligentne przekierowanie**:
- Nowy użytkownik bez preferencji → `/onboarding`
- Użytkownik z preferencjami, bez planu → `/dashboard` (CTA do generowania)
- Użytkownik z planem → `/dashboard` (wyświetlenie planu)
- Niezalogowany na chronionej stronie → `/login`
- Zalogowany na `/login` lub `/register` → `/dashboard`

---

## 2. Lista widoków

### 2.1. Landing Page (`/`)

**Główny cel**: Zachęcenie nowych użytkowników do rejestracji poprzez prezentację wartości produktu.

**Typ widoku**: Publiczny (tylko dla niezalogowanych)

**Kluczowe informacje do wyświetlenia**:
- Hero section z wartością produktu ("Przestań martwić się, co na obiad")
- 3 główne benefity (oszczędność czasu, personalizacja, różnorodność)
- Wizualna prezentacja działania (3 kroki: Wypełnij preferencje → Wygeneruj plan → Gotuj)
- Social proof (opcjonalnie w przyszłości)
- Call-to-action: "Zacznij teraz" (→ `/register`)

**Kluczowe komponenty**:
- `Hero` - główna sekcja z CTA
- `Benefits` - lista 3 benefitów z ikonami
- `HowItWorks` - wizualizacja procesu
- `CTASection` - dolny CTA "Zacznij za darmo"
- `PublicNavigation` - minimalna nawigacja (Logo, "Zaloguj się", "Zarejestruj się")

**UX/Accessibility/Security**:
- Responsywny layout (mobile-first)
- Skip to main content link
- Alt texts dla wszystkich grafik
- Kontrast tekstu minimum 4.5:1
- Zalogowani użytkownicy automatycznie przekierowywani na `/dashboard`

**Interakcje**:
- Klik "Zacznij teraz" → `/register`
- Klik "Zaloguj się" → `/login`

---

### 2.2. Rejestracja (`/register`)

**Główny cel**: Umożliwienie nowym użytkownikom założenia konta.

**Typ widoku**: Publiczny (tylko dla niezalogowanych)

**Kluczowe informacje do wyświetlenia**:
- Formularz rejestracji
- Walidacja w czasie rzeczywistym (blur event)
- Komunikaty błędów inline
- Link do logowania dla istniejących użytkowników

**Kluczowe komponenty**:
- `RegisterForm` - główny formularz
  - `FormField` (email)
  - `FormField` (hasło, type="password")
  - `FormField` (potwierdzenie hasła)
  - `SubmitButton` (loading state)
- `ErrorMessage` - inline errors pod polami
- `Link` - "Masz już konto? Zaloguj się"

**Pola formularza**:
1. **Email** (required)
   - Type: email
   - Walidacja: format email
   - Error: "Podaj prawidłowy adres email"
2. **Hasło** (required)
   - Type: password
   - Walidacja: minimum 8 znaków
   - Error: "Hasło musi mieć minimum 8 znaków"
   - Helper text: "Minimum 8 znaków"
   - Toggle visibility (eye icon)
3. **Potwierdzenie hasła** (required)
   - Type: password
   - Walidacja: identyczne z hasłem
   - Error: "Hasła muszą być identyczne"

**UX/Accessibility/Security**:
- Label dla każdego inputu
- `aria-required="true"` dla wymaganych pól
- `aria-invalid` dla pól z błędami
- `aria-describedby` dla error messages
- Autofocus na pierwszym polu
- Enter submits form
- Disabled submit button podczas ładowania
- Loading spinner w przycisku podczas rejestracji
- Password strength indicator (opcjonalnie)

**Przepływ**:
1. Użytkownik wypełnia formularz
2. Walidacja na blur każdego pola
3. Submit → wywołanie Supabase Auth (signUp)
4. Loading state (przycisk disabled + spinner)
5. **Sukces**: Auto-login + przekierowanie na `/onboarding`
6. **Błąd**: Toast notification + error message (np. "Email już istnieje")

**Przypadki brzegowe**:
- Email już zarejestrowany → "Ten adres email jest już zajęty"
- Błąd sieci → "Sprawdź połączenie internetowe i spróbuj ponownie"
- Błąd serwera → "Wystąpił błąd. Spróbuj ponownie za chwilę"

---

### 2.3. Logowanie (`/login`)

**Główny cel**: Umożliwienie istniejącym użytkownikom dostępu do konta.

**Typ widoku**: Publiczny (tylko dla niezalogowanych)

**Kluczowe informacje do wyświetlenia**:
- Formularz logowania
- Link do resetowania hasła
- Link do rejestracji dla nowych użytkowników

**Kluczowe komponenty**:
- `LoginForm` - główny formularz
  - `FormField` (email)
  - `FormField` (hasło)
  - `SubmitButton`
- `Link` - "Nie pamiętam hasła"
- `Link` - "Nie masz konta? Zarejestruj się"

**Pola formularza**:
1. **Email** (required)
   - Type: email
   - Walidacja: format email
2. **Hasło** (required)
   - Type: password
   - Toggle visibility

**UX/Accessibility/Security**:
- Podobne do `/register`
- Generic error message dla bezpieczeństwa: "Nieprawidłowy email lub hasło" (nie ujawniamy, czy email istnieje)
- Autofill friendly (autocomplete="email", autocomplete="current-password")

**Przepływ**:
1. Użytkownik wypełnia formularz
2. Submit → wywołanie Supabase Auth (signIn)
3. Loading state
4. **Sukces**: Przekierowanie na `/dashboard` (middleware decyduje o dalszym routingu)
5. **Błąd**: "Nieprawidłowy email lub hasło"

**Przypadki brzegowe**:
- Wiele nieudanych prób → rate limiting (Supabase handles this)
- Sesja już aktywna → automatyczne przekierowanie na `/dashboard`

---

### 2.4. Resetowanie hasła (`/reset-password`)

**Główny cel**: Umożliwienie użytkownikom odzyskania dostępu do konta.

**Typ widoku**: Publiczny

**Kluczowe informacje do wyświetlenia**:
- Formularz z polem email
- Instrukcja: "Wyślemy link do resetowania hasła na Twój email"
- Po wysłaniu: Komunikat sukcesu

**Kluczowe komponenty**:
- `ResetPasswordForm`
  - `FormField` (email)
  - `SubmitButton`
- `SuccessMessage` - po wysłaniu

**Przepływ**:
1. Użytkownik podaje email
2. Submit → Supabase resetPasswordForEmail()
3. **Zawsze sukces** (nie ujawniamy, czy email istnieje)
4. Wyświetlenie: "Jeśli konto z tym adresem istnieje, wyślemy link do resetowania hasła"

**UX/Accessibility/Security**:
- Generic success message (security)
- Link powrotny do `/login`

---

### 2.5. Onboarding - Formularz preferencji (`/onboarding`)

**Główny cel**: Zebranie preferencji żywieniowych nowego użytkownika w <5 minut.

**Typ widoku**: Chroniony (wymaga zalogowania, brak preferencji)

**Kluczowe informacje do wyświetlenia**:
- Nagłówek: "Poznajmy Twoje preferencje"
- Subtitle: "To zajmie tylko 2 minuty. Na podstawie tych informacji wygenerujemy Twój pierwszy plan."
- Formularz single-page (wszystkie 5 pytań widoczne)
- Progress indicator (opcjonalnie)
- Sticky footer z przyciskiem "Zapisz i wygeneruj plan"

**Struktura formularza** (5 sekcji):

#### Sekcja 1: Cel zdrowotny
- **Label**: "Jaki jest Twój główny cel zdrowotny?" *
- **Component**: `Select` (dropdown)
- **Opcje**:
  - Schudnąć
  - Przybrać na wadze
  - Utrzymać wagę
  - Zdrowo jeść
  - Zwiększyć energię
- **Backend value**: `LOSE_WEIGHT`, `GAIN_WEIGHT`, `MAINTAIN_WEIGHT`, `HEALTHY_EATING`, `BOOST_ENERGY`

#### Sekcja 2: Typ diety
- **Label**: "Jakiego typu dietę preferujesz?" *
- **Component**: `Select`
- **Opcje**:
  - Standardowa
  - Wegetariańska
  - Wegańska
  - Bezglutenowa
- **Backend value**: `STANDARD`, `VEGETARIAN`, `VEGAN`, `GLUTEN_FREE`

#### Sekcja 3: Poziom aktywności
- **Label**: "Jaki jest Twój poziom aktywności fizycznej?" *
- **Component**: `Select` lub `RadioGroup` z opisami
- **Opcje**:
  - 1 - Siedzący tryb życia (brak aktywności)
  - 2 - Lekka aktywność (spacery, lekkie prace)
  - 3 - Umiarkowana aktywność (trening 3x w tygodniu)
  - 4 - Wysoka aktywność (trening 5x w tygodniu)
  - 5 - Bardzo wysoka aktywność (sport intensywny codziennie)
- **Backend value**: 1-5 (integer)

#### Sekcja 4: Alergie i nietolerancje
- **Label**: "Czy masz jakieś alergie lub nietolerancje pokarmowe?"
- **Subtitle**: "Możesz wybrać maksymalnie 10 pozycji"
- **Component**: `CheckboxGroup`
- **Opcje** (lista checkboxów):
  - Gluten
  - Laktoza
  - Orzechy
  - Jajka
  - Ryby
  - Skorupiaki
  - Soja
  - Inne (text input pojawia się po zaznaczeniu)
- **Walidacja**: Max 10 zaznaczonych
- **Counter**: "X/10 wybranych"
- **Behavior**: Po zaznaczeniu 10, pozostałe checkboxy disabled

#### Sekcja 5: Produkty nielubiane
- **Label**: "Jakich produktów nie lubisz?"
- **Subtitle**: "Nie uwzględnimy ich w Twoim planie. Możesz dodać maksymalnie 20 produktów."
- **Component**: `Combobox` (autouzupełnianie)
- **Funkcjonalność**:
  - Input z autouzupełnianiem (min 2 znaki)
  - Fuzzy search w `products.json`
  - Wybrane produkty jako Badge'y pod inputem
  - Każdy badge z ikoną X (dismissible)
  - Counter "X/20 produktów"
  - Po osiągnięciu 20, input disabled
- **Lista produktów**: ~100-200 popularnych polskich produktów (warzywa, owoce, mięsa, nabiał, przyprawy, zboża)

**Kluczowe komponenty**:
- `PreferencesForm` - container
- `FormSection` - wizualne grupowanie
- `Select` - dla dropdowns
- `CheckboxGroup` - dla alergii
- `AllergyCheckbox` - custom checkbox z limitem
- `ProductCombobox` - autouzupełnianie
- `ProductBadge` - wybrane produkty
- `StickyFooter` - sticky button na dole
- `SubmitButton` - "Zapisz i wygeneruj plan"

**Features**:
- **Auto-save do localStorage**: Co 2 sekundy podczas wypełniania
- **Draft restoration**: Przy powrocie na stronę, ładowanie draftu
- **Draft cleanup**: Po sukcesie, usunięcie draftu
- **Live validation**: Walidacja na blur każdego pola
- **Visual feedback**: Green checkmark obok wypełnionych sekcji (opcjonalnie)

**UX/Accessibility/Security**:
- `<fieldset>` dla każdej sekcji
- `<legend>` dla labels sekcji
- `aria-required="true"` dla wymaganych
- `aria-describedby` dla subtitles i errors
- Keyboard navigation (Tab, Arrow keys dla radio/checkbox, Enter dla combobox)
- Focus management (auto-focus na pierwszym błędzie przy submit)
- Color-blind friendly (nie tylko kolor dla błędów)

**Przepływ**:
1. Użytkownik wypełnia formularz
2. Auto-save do localStorage co 2s
3. Submit → walidacja
4. **Błąd**: Scroll do pierwszego błędu + focus + error message
5. **Sukces**: 
   - POST `/api/preferences`
   - Czyszczenie localStorage
   - Przekierowanie na `/dashboard`
   - Dashboard automatycznie triggeruje generowanie pierwszego planu

**Przypadki brzegowe**:
- Użytkownik opuszcza stronę → draft zapisany
- Użytkownik wraca → modal "Chcesz kontynuować wypełnianie?" [Tak/Zacznij od nowa]
- Przekroczenie limitu alergii/produktów → checkboxy/input disabled + komunikat
- Błąd API → toast + możliwość retry

**Walidacja**:
- Frontend: Zod schema + React Hook Form
- Backend: Identyczna walidacja w API endpoint

---

### 2.6. Dashboard (`/dashboard`)

**Główny cel**: Główny hub użytkownika - wyświetlenie planu lub możliwość wygenerowania nowego.

**Typ widoku**: Chroniony (wymaga zalogowania + preferencji)

**Typy stanów**:

#### Stan 1: Brak wygenerowanego planu (pierwszy raz po onboardingu lub po błędzie)
**Wyświetlane elementy**:
- Powitanie: "Cześć! Jesteś gotowy na swój pierwszy plan posiłków?"
- Krótka instrukcja: "Kliknij poniżej, a AI wygeneruje dla Ciebie spersonalizowany plan na dzisiaj."
- `EmptyState` z ikoną
- Duży przycisk CTA: "Wygeneruj mój pierwszy plan"

#### Stan 2: Plan wygenerowany (główny widok)
**Wyświetlane elementy**:
- **Header sekcji**:
  - Nagłówek: "Twój plan posiłków na dzisiaj"
  - Data: "30 października 2025" (opcjonalnie)
  - Przycisk: "Wygeneruj nowy plan" (secondary style)
- **Meal Plan Grid** (responsywny):
  - Desktop (>1024px): 3 kolumny (śniadanie, obiad, kolacja obok siebie)
  - Tablet (768-1023px): 2 kolumny (śniadanie + obiad w pierwszym rzędzie, kolacja w drugim)
  - Mobile (<768px): 1 kolumna (karty jedna pod drugą)
- **Każda karta posiłku zawiera**:
  - Nazwa posiłku (np. "Śniadanie: Owsianka z owocami")
  - Szacowany czas przygotowania (ikona zegara + "10 minut")
  - Lista składników z ilościami
  - Kroki przygotowania (numerowana lista)
- **Feedback Section** (pod całym planem):
  - Tekst: "Czy podoba Ci się ten plan?"
  - Thumbs up button
  - Thumbs down button
  - Toast po kliknięciu: "Dziękujemy za opinię"

#### Stan 3: Generowanie planu (loading state)
**Wyświetlane elementy**:
- Fullscreen modal z backdrop (blur)
- Spinner (animowany, pulsujący)
- Tekst: "Generuję plan..."
- Subtext: "To może zająć do 30 sekund"
- Wskaźnik czasu (opcjonalnie): "Minęło: 5s"
- Przycisk: "Anuluj" (AbortController)

#### Stan 4: Błąd generowania
**Wyświetlane elementy**:
- Error state w miejscu planu
- Ikona błędu
- Komunikat: "Nie udało się wygenerować planu. Spróbuj ponownie."
- Przycisk: "Spróbuj ponownie"

**Kluczowe komponenty**:
- `DashboardHeader` - header z przyciskiem generowania
- `MealPlanGrid` - responsywny grid
- `MealCard` - karta pojedynczego posiłku
  - `MealCardHeader` - nazwa + czas
  - `IngredientList` - lista składników
  - `StepsList` - kroki przygotowania
- `FeedbackButtons` - thumbs up/down
- `GeneratingModal` - fullscreen modal
- `EmptyState` - stan bez planu
- `ErrorState` - błąd generowania

**Komponenty nawigacji** (widoczne zawsze):
- Logo (link do dashboard)
- Link: "Dashboard" (active)
- Link: "Mój Profil"
- Przycisk: "Wyloguj"

**UX/Accessibility/Security**:
- Skip to main content
- Landmark regions (`<main>`, `<nav>`)
- Headings hierarchy (h1 → h2 → h3)
- Loading spinner z `aria-live="polite"` i `aria-busy="true"`
- Modal z focus trap (focus na "Anuluj", Escape zamyka)
- Feedback buttons:
  - `aria-label="Oceń plan pozytywnie"`
  - `aria-pressed` dla aktywnego stanu
  - Keyboard accessible (Space/Enter)
- Responsive images (brak zdjęć w MVP, ale gotowe na przyszłość)

**Interakcje**:

1. **Klik "Wygeneruj plan" / "Wygeneruj nowy plan"**:
   - Otwarcie GeneratingModal
   - POST `/api/meal-plans` (regeneration: true jeśli istnieje plan)
   - Tracking analytics: `plan_generated` lub `plan_regenerated`
   - **Sukces**: Zamknięcie modalu + wyświetlenie planu
   - **Błąd**: Zamknięcie modalu + ErrorState + retry button
   - **Timeout (30s)**: Zamknięcie modalu + komunikat timeout

2. **Klik "Anuluj" w modal**:
   - AbortController.abort()
   - Zamknięcie modalu
   - Toast: "Generowanie przerwane"
   - Powrót do poprzedniego stanu

3. **Klik thumbs up/down**:
   - Pierwsza ocena: POST `/api/feedback` (rating: THUMBS_UP/THUMBS_DOWN)
   - Zmiana oceny: PUT `/api/feedback/:id`
   - Zapisanie feedback ID w state
   - Toast: "Dziękujemy za opinię" (2s)
   - Visual feedback: zmiana koloru buttona (zielony/czerwony)
   - `aria-pressed="true"` dla aktywnego

4. **Plan Acceptance Tracking** (automatyczny):
   - Timer startuje przy załadowaniu planu
   - Jeśli użytkownik NIE kliknie "Wygeneruj nowy plan" w ciągu 2 minut
   - I spędzi na stronie minimum 30 sekund
   - TO POST `/api/analytics/events` (action: plan_accepted, metadata: {time_on_page, plan_id})

**Przypadki brzegowe**:
- Timeout API (30s) → komunikat + retry
- Błąd sieci → komunikat + retry
- 503 Service Unavailable → "Serwis chwilowo niedostępny. Spróbuj za chwilę."
- Użytkownik zamyka kartę podczas generowania → następna wizyta pokazuje ostatni plan (nie było sukcesu)
- Wielokrotne regeneracje → brak limitu w MVP, ale tracking do analytics

**Responsywność**:
```
Mobile (<768px):
- Pojedyncza kolumna
- Karty jedna pod drugą
- Sticky header z przyciskiem

Tablet (768-1023px):
- 2 kolumny grid
- Feedback buttons poniżej

Desktop (>1024px):
- 3 kolumny grid
- Wszystko widoczne bez scrollowania (ideally)
```

---

### 2.7. Mój Profil (`/profile`)

**Główny cel**: Umożliwienie edycji preferencji żywieniowych.

**Typ widoku**: Chroniony (wymaga zalogowania)

**Kluczowe informacje do wyświetlenia**:
- Nagłówek: "Mój Profil"
- Subtitle: "Zaktualizuj swoje preferencje. Kolejny wygenerowany plan uwzględni zmiany."
- Formularz identyczny jak `/onboarding`, ale:
  - Pre-wypełniony obecnymi wartościami
  - Tytuł sekcji: "Edytuj preferencje"
  - Przycisk: "Zapisz zmiany" (zamiast "Zapisz i wygeneruj plan")
  - Dodatkowy przycisk: "Anuluj" (powrót bez zapisywania)

**Kluczowe komponenty**:
- `PreferencesForm` (reused from onboarding, ale w trybie edycji)
- `FormSection` - identyczne sekcje
- `ActionButtons` - "Zapisz zmiany" + "Anuluj"

**Przepływ**:
1. GET `/api/preferences` przy załadowaniu strony
2. Loading state podczas fetchowania
3. Pre-wypełnienie formularza obecnymi wartościami
4. Użytkownik edytuje pola
5. **Klik "Zapisz zmiany"**:
   - Walidacja
   - PUT `/api/preferences`
   - Loading state (przycisk disabled + spinner)
   - **Sukces**: Toast "Profil zaktualizowany" + przekierowanie na `/dashboard`
   - **Błąd**: Toast z komunikatem błędu
6. **Klik "Anuluj"**:
   - Jeśli są niezapisane zmiany → modal potwierdzenia "Masz niezapisane zmiany. Czy na pewno chcesz opuścić stronę?"
   - Powrót na `/dashboard`

**UX/Accessibility/Security**:
- Identical to onboarding form
- Unsaved changes warning (dirty form detection)
- Keyboard shortcuts: Ctrl+S to save (opcjonalnie)
- "Ostatnia aktualizacja: [data]" (opcjonalnie)

**Przypadki brzegowe**:
- Formularz nie zmieniony → przycisk "Zapisz zmiany" disabled (opcjonalnie)
- Błąd 404 (preferencje nie istnieją - nie powinno się zdarzyć) → redirect na `/onboarding`
- Concurrent edit (bardzo rzadkie) → ostatnia zmiana wygrywa

---

## 3. Mapa podróży użytkownika

### 3.1. User Journey: Nowy użytkownik (Happy Path)

**Cel**: Od landing page do pierwszego wygenerowanego planu w <5 minut.

**Kroki**:

1. **Landing Page (`/`)**
   - Użytkownik odwiedza stronę
   - Czyta o benefitach
   - Decyzja: "Chcę spróbować"
   - Akcja: Klik "Zacznij teraz"
   - **→ Przejście do `/register`**

2. **Rejestracja (`/register`)**
   - Wypełnia email, hasło, potwierdzenie
   - Live walidacja zapewnia poprawność
   - Akcja: Klik "Zarejestruj się"
   - System: Supabase Auth tworzy konto + auto-login
   - **→ Automatyczne przekierowanie na `/onboarding`**
   - **Czas: ~1 minuta**

3. **Onboarding (`/onboarding`)**
   - Widzi formularz preferencji
   - Wypełnia 5 sekcji:
     - Cel: "Zdrowo jeść"
     - Dieta: "Wegetariańska"
     - Aktywność: "3 - Umiarkowana"
     - Alergie: "Laktoza, Orzechy"
     - Produkty nielubiane: "Brokuły, Kalafior"
   - Auto-save działa w tle (draft)
   - Akcja: Klik "Zapisz i wygeneruj plan"
   - System: POST `/api/preferences` + czyszczenie draftu
   - **→ Automatyczne przekierowanie na `/dashboard`**
   - **Czas: ~2-3 minuty**

4. **Dashboard - Generowanie pierwszego planu (`/dashboard`)**
   - Widzi EmptyState z CTA
   - Akcja: Klik "Wygeneruj mój pierwszy plan" (auto-trigger możliwy)
   - System: Otwiera GeneratingModal
   - POST `/api/meal-plans` (regeneration: false)
   - LLM generuje plan (~10-20 sekund)
   - Modal zamyka się
   - **→ Wyświetlenie planu**
   - **Czas: ~30 sekund**

5. **Dashboard - Przeglądanie planu (`/dashboard`)**
   - Widzi 3 karty posiłków
   - Czyta składniki i kroki
   - Tracker startuje w tle (plan acceptance)
   - Opcjonalnie: Klik thumbs up (feedback)
   - System: POST `/api/feedback`
   - Toast: "Dziękujemy za opinię"
   - Po 30+ sekundach na stronie: automatyczny event `plan_accepted`
   - **Czas: ~1-2 minuty przeglądania**

**Łączny czas: 4-7 minut od landing do planu**

---

### 3.2. User Journey: Powracający użytkownik

**Scenariusz A: Użytkownik chce wygenerować nowy plan**

1. **Login (`/login`)**
   - Wpisuje email i hasło
   - Akcja: Klik "Zaloguj się"
   - **→ Przekierowanie na `/dashboard`**

2. **Dashboard z poprzednim planem (`/dashboard`)**
   - Widzi wczorajszy plan
   - Decyzja: "Chcę coś innego dziś"
   - Akcja: Klik "Wygeneruj nowy plan"
   - GeneratingModal + regeneracja
   - **→ Nowy plan wyświetlony**

3. **Przeglądanie i gotowanie**
   - Użytkownik zapisuje sobie przepis (mental note lub screenshot)
   - Wraca później do app dla kolejnego planu

**Scenariusz B: Użytkownik chce zmienić preferencje**

1. **Login (`/login`)**
   - **→ `/dashboard`**

2. **Dashboard (`/dashboard`)**
   - Akcja: Klik "Mój Profil" w nawigacji
   - **→ Przejście do `/profile`**

3. **Edycja profilu (`/profile`)**
   - Zmienia typ diety z "Wegetariańska" na "Wegańska"
   - Akcja: Klik "Zapisz zmiany"
   - System: PUT `/api/preferences`
   - Toast: "Profil zaktualizowany"
   - **→ Przekierowanie na `/dashboard`**

4. **Dashboard (`/dashboard`)**
   - Widzi stary plan (jeszcze wegetariański)
   - Akcja: Klik "Wygeneruj nowy plan"
   - **→ Nowy plan uwzględnia zmiany (wegański)**

---

### 3.3. User Journey: Error Recovery

**Scenariusz: Timeout podczas generowania planu**

1. **Dashboard (`/dashboard`)**
   - Akcja: Klik "Wygeneruj plan"
   - GeneratingModal otwiera się

2. **Timeout po 30 sekundach**
   - Modal zamyka się
   - ErrorState wyświetla się na dashboard
   - Komunikat: "Nie udało się wygenerować planu. Spróbuj ponownie."
   - Przycisk: "Spróbuj ponownie"

3. **Retry**
   - Akcja: Klik "Spróbuj ponownie"
   - GeneratingModal ponownie
   - Tym razem sukces (10s)
   - **→ Plan wyświetlony**

---

### 3.4. User Journey: Forgotten Password

1. **Login (`/login`)**
   - Użytkownik nie pamięta hasła
   - Akcja: Klik "Nie pamiętam hasła"
   - **→ Przekierowanie na `/reset-password`**

2. **Reset Password (`/reset-password`)**
   - Wpisuje email
   - Akcja: Klik "Wyślij link"
   - System: Supabase wysyła email
   - SuccessMessage: "Jeśli konto istnieje, wyślemy link"

3. **Email**
   - Użytkownik otwiera email
   - Klik w link resetowania
   - **→ Strona Supabase z formularzem nowego hasła**

4. **Ustawienie nowego hasła**
   - Wpisuje nowe hasło
   - Supabase zapisuje
   - **→ Przekierowanie na `/login`**

5. **Login z nowym hasłem**
   - **→ `/dashboard`**

---

### 3.5. Critical User Flows - Decision Trees

#### Flow 1: Po zalogowaniu - gdzie przekierować?

```
Użytkownik loguje się
↓
Middleware sprawdza sesję → Zalogowany ✓
↓
Sprawdź: Czy ma preferencje?
├─ NIE → Przekierowanie na /onboarding
└─ TAK → Przekierowanie na /dashboard
    ↓
    Dashboard sprawdza: Czy ma plan?
    ├─ NIE → EmptyState z CTA "Wygeneruj pierwszy plan"
    └─ TAK → Wyświetlenie planu
```

#### Flow 2: Generowanie planu

```
Klik "Wygeneruj plan"
↓
Otwórz GeneratingModal
↓
POST /api/meal-plans
↓
Czekaj (max 30s)
├─ Sukces (10-20s) → Zamknij modal → Wyświetl plan
├─ Timeout (30s) → Zamknij modal → ErrorState → Retry button
├─ Error 500/503 → Zamknij modal → ErrorState → Retry button
└─ User kliknął "Anuluj" → AbortController → Zamknij modal → Toast
```

#### Flow 3: Feedback system

```
Użytkownik ogląda plan
↓
Decyzja: Czy chce ocenić?
├─ NIE → Plan Acceptance Tracker (30s+)
└─ TAK → Klik thumbs up/down
    ↓
    Czy to pierwsza ocena tego planu?
    ├─ TAK → POST /api/feedback → Zapisz feedback ID
    └─ NIE → PUT /api/feedback/:id
    ↓
    Toast: "Dziękujemy za opinię"
    ↓
    Visual feedback: Zmiana koloru buttona
```

---

## 4. Układ i struktura nawigacji

### 4.1. Główny układ aplikacji

**Layout Pattern: Conditional Navigation**

Aplikacja używa dwóch typów nawigacji w zależności od stanu użytkownika:

1. **Public Navigation** - dla niezalogowanych (`/`, `/login`, `/register`, `/reset-password`)
2. **Authenticated Navigation** - dla zalogowanych (`/dashboard`, `/profile`, `/onboarding`)

---

### 4.2. Public Navigation

**Lokalizacja**: Top bar, sticky

**Elementy**:
- **Logo** (po lewej, link do `/`)
- **Spacer** (flex-grow)
- **Link: "Zaloguj się"** (secondary button style) → `/login`
- **Button: "Zarejestruj się"** (primary button style) → `/register`

**Responsywność**:
- Desktop: Wszystkie elementy widoczne
- Mobile: Logo + collapsed menu (hamburger)

**Accessibility**:
- `<nav aria-label="Główna nawigacja">`
- Skip to main content link (visible on focus)

---

### 4.3. Authenticated Navigation

**Lokalizacja**: Top bar lub sidebar (decyzja: top bar dla prostoty MVP)

**Elementy**:
- **Logo** (link do `/dashboard`)
- **Link: "Dashboard"** → `/dashboard` (bold gdy active)
- **Link: "Mój Profil"** → `/profile`
- **Spacer**
- **User menu** (dropdown):
  - Wyświetla email użytkownika
  - Opcje:
    - "Mój Profil" (duplikat dla wygody)
    - "Wyloguj"

**Alternatywa (prostsza dla MVP)**:
- Logo
- Dashboard
- Mój Profil
- Button: "Wyloguj" (destructive style)

**Responsywność**:
- Desktop: Horizontal layout
- Mobile: Hamburger menu (Sheet slide-in)

**Active state**:
- Bold text dla aktywnej strony
- Opcjonalnie: Border-bottom lub background color

**Accessibility**:
- `<nav aria-label="Nawigacja aplikacji">`
- `aria-current="page"` dla aktywnej strony
- Focus visible styles

---

### 4.4. Mobile Navigation Pattern

**Desktop (>768px)**: Horizontal top bar

**Mobile (<768px)**: Hamburger menu

**Hamburger Menu Behavior**:
1. Icon (☰) w prawym górnym rogu
2. Klik otwiera Sheet (slide-in drawer) z lewej lub prawej
3. Sheet zawiera:
   - Close button (X) na górze
   - Lista linków (vertical)
   - Wyloguj na dole
4. Backdrop (blur) za Sheet'em
5. Escape/klik na backdrop zamyka
6. Focus trap wewnątrz Sheet

**Komponent**: Shadcn/ui `Sheet`

---

### 4.5. Breadcrumbs (opcjonalnie w przyszłości)

**Nie używane w MVP** - aplikacja jest płaska (2 poziomy: dashboard + profile), breadcrumbs nie są potrzebne.

---

### 4.6. Footer (opcjonalnie)

**Minimalistyczny footer** (widoczny tylko na public pages):
- Copyright: "© 2025 AI Meal Planner"
- Links: "O aplikacji", "Kontakt", "Polityka prywatności" (placeholder w MVP)

**Na authenticated pages**: Brak footera (clean interface)

---

### 4.7. Navigation State Management

**AuthContext dostarcza**:
- `user` - informacje o zalogowanym użytkowniku
- `loading` - czy auth state jest ładowany
- `signOut()` - funkcja wylogowania

**Navigation component**:
```tsx
const { user, loading } = useAuth();

if (loading) return <NavigationSkeleton />;
return user ? <AuthenticatedNav /> : <PublicNav />;
```

**Highlight active route**:
```tsx
const pathname = window.location.pathname;
<Link 
  href="/dashboard" 
  className={pathname === '/dashboard' ? 'active' : ''}
>
  Dashboard
</Link>
```

---

## 5. Kluczowe komponenty

### 5.1. Atomic Design - Hierarchia komponentów

Komponenty zorganizowane w strukturze feature-based z elementami atomic design:

```
src/components/
├── ui/                 # Atoms: Base Shadcn/ui components
├── shared/             # Molecules: Reusable composite components
├── layout/             # Organisms: Layout components
├── auth/               # Features: Authentication
├── preferences/        # Features: User preferences
└── meal-plan/          # Features: Meal planning
```

---

### 5.2. UI Layer (Shadcn/ui - Atoms)

Bazowe komponenty z Shadcn/ui, używane w całej aplikacji:

#### Button
- **Variants**: default, destructive, outline, ghost, link
- **Sizes**: sm, default, lg
- **States**: default, hover, focus, disabled, loading
- **Usage**: CTA, submit, cancel, navigation

#### Input
- **Types**: text, email, password, number
- **States**: default, focus, error, disabled
- **Features**: Label, helper text, error message
- **Usage**: Wszystkie formularze

#### Select
- **Features**: Dropdown, search (opcjonalnie), keyboard navigation
- **Usage**: Cel zdrowotny, typ diety, poziom aktywności

#### Checkbox
- **States**: unchecked, checked, indeterminate, disabled
- **Usage**: Alergie

#### Badge
- **Variants**: default, secondary, destructive, outline
- **Usage**: Wybrane produkty nielubiane

#### Card / CardHeader / CardContent / CardFooter
- **Usage**: Karty posiłków, EmptyState

#### Dialog / Sheet
- **Dialog**: GeneratingModal, confirmation modals
- **Sheet**: Mobile navigation

#### Toast (Sonner)
- **Variants**: default, success, error, info
- **Position**: bottom-right
- **Duration**: 2-5 seconds
- **Usage**: Success messages, errors, feedback confirmations

#### Combobox
- **Features**: Autocomplete, search, keyboard navigation
- **Usage**: Produkty nielubiane

#### Label
- **Usage**: Wszystkie inputy (accessibility)

#### Spinner (custom or Shadcn/ui)
- **Usage**: Loading states

---

### 5.3. Shared Layer (Molecules)

Komponenty wielokrotnego użytku, złożone z atoms:

#### LoadingSpinner
```tsx
<LoadingSpinner 
  size="sm" | "md" | "lg"
  text="Ładowanie..." 
/>
```
- **Usage**: Inline loading states

#### EmptyState
```tsx
<EmptyState
  icon={<Icon />}
  title="Brak danych"
  description="Opis stanu pustego"
  action={<Button>CTA</Button>}
/>
```
- **Usage**: Dashboard bez planu, pusta lista

#### ErrorMessage
```tsx
<ErrorMessage
  message="Komunikat błędu"
  retry={() => refetch()}
/>
```
- **Usage**: API errors, form errors

#### FormField
```tsx
<FormField
  label="Email"
  name="email"
  type="email"
  required
  error="Błąd walidacji"
  helpText="Tekst pomocniczy"
/>
```
- **Composition**: Label + Input + Error message + Helper text
- **Usage**: Wszystkie formularze

#### ProductBadge
```tsx
<ProductBadge
  product="Brokuły"
  onRemove={() => removeProduct('Brokuły')}
/>
```
- **Composition**: Badge + X icon button
- **Usage**: Wybrane produkty nielubiane

---

### 5.4. Layout Layer (Organisms)

Komponenty strukturalne aplikacji:

#### PublicNavigation
- Logo + links (Zaloguj się, Zarejestruj się)
- Responsive (hamburger na mobile)

#### AuthenticatedNavigation
- Logo + Dashboard + Mój Profil + Wyloguj
- Active state highlighting
- Responsive (hamburger na mobile)

#### Header
- Container dla navigation
- Sticky positioning

#### Footer
- Copyright + links
- Tylko na public pages

#### PageContainer
```tsx
<PageContainer maxWidth="2xl">
  {children}
</PageContainer>
```
- Wrapper dla content z max-width
- Padding i centrowanie

#### StickyFooter
```tsx
<StickyFooter>
  <Button>Zapisz</Button>
</StickyFooter>
```
- Sticky na dole viewport
- Shadow dla oddzielenia od content
- **Usage**: Formularz onboardingu

---

### 5.5. Auth Feature Components

#### LoginForm
- Email + Password fields
- Submit button (loading state)
- Link do reset password
- Link do register
- **API**: Supabase Auth signIn()

#### RegisterForm
- Email + Password + Confirm Password
- Submit button (loading state)
- Link do login
- **API**: Supabase Auth signUp()

#### ResetPasswordForm
- Email field
- Submit button
- Success message
- **API**: Supabase Auth resetPasswordForEmail()

#### ProtectedRoute
```tsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```
- HOC sprawdzający auth state
- Redirect na /login jeśli niezalogowany
- Loading spinner podczas sprawdzania

---

### 5.6. Preferences Feature Components

#### PreferencesForm
- **Props**: `defaultValues` (dla edit mode), `onSuccess`
- **Sections**:
  - HealthGoalSelect
  - DietTypeSelect
  - ActivityLevelSelect
  - AllergyCheckboxGroup
  - DislikedProductsCombobox
- **Features**:
  - Auto-save (useFormDraft hook)
  - Live validation
  - Submit handling
- **Modes**: Create (onboarding) | Edit (profile)

#### AllergyCheckboxGroup
- Lista checkboxów z limitem 10
- Counter "X/10 wybranych"
- Disable po osiągnięciu limitu
- **Props**: `selected`, `onChange`, `maxItems={10}`

#### DislikedProductsCombobox
- Combobox z autouzupełnianiem
- Fuzzy search w products.json
- Badge'y dla wybranych
- Counter "X/20 produktów"
- **Props**: `selected`, `onChange`, `maxItems={20}`, `products`

---

### 5.7. Meal Plan Feature Components

#### MealPlanGrid
```tsx
<MealPlanGrid meals={[breakfast, lunch, dinner]} />
```
- Responsywny grid (3/2/1 kolumny)
- **Composition**: 3x MealCard

#### MealCard
```tsx
<MealCard meal={mealData} />
```
- **Structure**:
  - Card wrapper
  - CardHeader (nazwa + czas)
  - CardContent:
    - IngredientList
    - StepsList

#### IngredientList
```tsx
<IngredientList ingredients={[
  { name: "Płatki owsiane", amount: "50g" }
]} />
```
- Unordered list
- Checkbox dla shopping list (future)

#### StepsList
```tsx
<StepsList steps={[
  "Krok 1: ...",
  "Krok 2: ..."
]} />
```
- Ordered list (numerowana)
- Clear typography

#### FeedbackButtons
```tsx
<FeedbackButtons
  currentRating={rating}
  onRate={(rating) => handleFeedback(rating)}
/>
```
- Thumbs up + Thumbs down buttons
- Visual states (active/inactive)
- ARIA attributes
- Toast on submit

#### GeneratingModal
```tsx
<GeneratingModal
  isOpen={generating}
  onCancel={handleCancel}
/>
```
- Fullscreen Dialog
- Spinner + text
- "Anuluj" button
- Elapsed time (opcjonalnie)
- AbortController integration

---

### 5.8. Utility Components i Hooks

#### Custom Hooks

**useAuth**
```tsx
const { user, loading, signIn, signUp, signOut } = useAuth();
```
- Wraps AuthContext
- Provides auth methods

**usePreferences**
```tsx
const { data, loading, error, refetch } = usePreferences();
```
- GET `/api/preferences`
- Returns current user preferences

**useCreatePreferences**
```tsx
const { mutate, loading, error } = useCreatePreferences();
```
- POST `/api/preferences`
- Onboarding submission

**useUpdatePreferences**
```tsx
const { mutate, loading, error } = useUpdatePreferences();
```
- PUT `/api/preferences`
- Profile update

**useMealPlan**
```tsx
const { data, loading, error, refetch } = useMealPlan();
```
- GET `/api/meal-plans/current`
- Returns current meal plan

**useGenerateMealPlan**
```tsx
const { mutate, loading, error, cancel } = useGenerateMealPlan();
```
- POST `/api/meal-plans`
- Supports AbortController for cancellation
- Retry logic (3 attempts)

**useCreateFeedback**
```tsx
const { mutate, loading, error } = useCreateFeedback();
```
- POST `/api/feedback`
- First feedback submission

**useUpdateFeedback**
```tsx
const { mutate, loading, error } = useUpdateFeedback();
```
- PUT `/api/feedback/:id`
- Change rating

**useAnalytics**
```tsx
const { logEvent } = useAnalytics();
```
- POST `/api/analytics/events`
- Non-blocking event logging

**useFormDraft**
```tsx
const { saveDraft, loadDraft, clearDraft } = useFormDraft('onboarding');
```
- localStorage integration
- Auto-save every 2s
- Draft restoration

**usePlanAcceptance**
```tsx
usePlanAcceptance(planId);
```
- Automatic tracking
- Logs `plan_accepted` event after 30s+ on page

#### Utility Functions

**getErrorMessage(error: unknown): string**
- Maps API errors to Polish messages
- Handles Zod validation errors
- Fallback for unknown errors

**formatDate(date: Date): string**
- Polish locale formatting
- "30 października 2025"

**cn(...classes): string**
- Class name utility (clsx + tailwind-merge)
- Usage w Shadcn/ui

---

### 5.9. Type Definitions

#### Database Types
```typescript
// src/db/database.types.ts (generated from Supabase)
export type Database = {
  public: {
    Tables: {
      user_preferences: { ... },
      meal_plans: { ... },
      feedback: { ... },
      analytics_events: { ... }
    }
  }
}
```

#### DTO Types
```typescript
// src/types.ts
export interface PreferencesFormData {
  health_goal: HealthGoal;
  diet_type: DietType;
  activity_level: number;
  allergies: string[];
  disliked_products: string[];
}

export interface MealPlan {
  id: string;
  user_id: string;
  meals: Meal[];
  generated_at: string;
  status: 'pending' | 'generated' | 'error';
}

export interface Meal {
  name: string;
  ingredients: Ingredient[];
  steps: string[];
  time: number;
}

export interface Ingredient {
  name: string;
  amount: string;
}

export type HealthGoal = 
  | 'LOSE_WEIGHT' 
  | 'GAIN_WEIGHT' 
  | 'MAINTAIN_WEIGHT' 
  | 'HEALTHY_EATING' 
  | 'BOOST_ENERGY';

export type DietType = 
  | 'STANDARD' 
  | 'VEGETARIAN' 
  | 'VEGAN' 
  | 'GLUTEN_FREE';

export type FeedbackRating = 'THUMBS_UP' | 'THUMBS_DOWN';
```

#### Zod Schemas
```typescript
// src/lib/validation.ts
import { z } from 'zod';

export const preferencesSchema = z.object({
  health_goal: z.enum(['LOSE_WEIGHT', 'GAIN_WEIGHT', 'MAINTAIN_WEIGHT', 'HEALTHY_EATING', 'BOOST_ENERGY']),
  diet_type: z.enum(['STANDARD', 'VEGETARIAN', 'VEGAN', 'GLUTEN_FREE']),
  activity_level: z.number().int().min(1).max(5),
  allergies: z.array(z.string()).max(10).optional(),
  disliked_products: z.array(z.string()).max(20).optional(),
});

export const feedbackSchema = z.object({
  rating: z.enum(['THUMBS_UP', 'THUMBS_DOWN']),
  comment: z.string().max(500).optional(),
});
```

---

### 5.10. Data Flow Pattern

**典型owy data flow dla mutations**:

```
1. User Action (np. klik "Zapisz")
   ↓
2. Component wywołuje custom hook
   const { mutate } = useCreatePreferences();
   await mutate(formData);
   ↓
3. Hook wywołuje API function
   await createPreferences(formData);
   ↓
4. API function używa Supabase client
   const { data, error } = await supabase
     .from('user_preferences')
     .insert(formData);
   ↓
5. Response wraca przez hook do component
   ↓
6. Component handleuje success/error
   - Success: Toast + navigation
   - Error: Toast + error message
```

---

## 6. Mapowanie User Stories do UI

### Mapowanie historyjek użytkownika z PRD do elementów UI

| User Story | Widok(i) | Komponenty | API Endpoint | Accessibility |
|------------|----------|-----------|--------------|---------------|
| **US-001**: Rejestracja | `/register` | `RegisterForm`, `FormField`, `SubmitButton` | Supabase Auth signUp | Labels, aria-required, aria-invalid |
| **US-002**: Logowanie | `/login` | `LoginForm`, `FormField` | Supabase Auth signIn | Labels, aria-required |
| **US-003**: Wylogowanie | Nawigacja (wszystkie authenticated) | `AuthenticatedNavigation`, Button "Wyloguj" | Supabase Auth signOut | Keyboard accessible |
| **US-004**: Reset hasła | `/reset-password` | `ResetPasswordForm` | Supabase resetPasswordForEmail | Labels, success message |
| **US-005**: Onboarding | `/onboarding` | `PreferencesForm`, `AllergyCheckboxGroup`, `DislikedProductsCombobox` | POST `/api/preferences` | Fieldsets, legends, aria-describedby, max limits |
| **US-006**: Wyświetlenie profilu | `/profile` | `PreferencesForm` (pre-filled) | GET `/api/preferences` | Same as onboarding |
| **US-007**: Edycja profilu | `/profile` | `PreferencesForm`, "Zapisz"/"Anuluj" buttons | PUT `/api/preferences` | Unsaved changes warning |
| **US-008**: Pierwszy plan | `/dashboard` | `EmptyState`, `GeneratingModal`, `MealPlanGrid` | POST `/api/meal-plans` | aria-live for loading, focus management |
| **US-009**: Kolejny plan | `/dashboard` | Button "Wygeneruj nowy plan", `GeneratingModal` | POST `/api/meal-plans` (regeneration: true) | Same as US-008 |
| **US-010**: Wyświetlanie planu | `/dashboard` | `MealPlanGrid`, `MealCard`, `IngredientList`, `StepsList` | GET `/api/meal-plans/current` | Semantic HTML, headings hierarchy |
| **US-011**: Regeneracja | `/dashboard` | Button "Wygeneruj nowy plan" | POST `/api/meal-plans` | Confirmation (optional) |
| **US-012**: Feedback | `/dashboard` | `FeedbackButtons` (thumbs up/down) | POST/PUT `/api/feedback` | aria-label, aria-pressed, keyboard |
| **US-013**: Błąd API | `/dashboard` | `ErrorState`, retry button | N/A | Clear error message, retry action |
| **US-014**: Timeout | `/dashboard` | `GeneratingModal` (timeout handling) | N/A | Timeout message after 30s |
| **US-015**: Plan Acceptance Tracking | `/dashboard` | `usePlanAcceptance` hook (automatic) | POST `/api/analytics/events` | Passive tracking (no UI) |
| **US-016**: Dashboard | `/dashboard` | All dashboard components | GET `/api/meal-plans/current`, GET `/api/preferences` | Navigation landmarks |
| **US-017**: Limit produktów | `/onboarding`, `/profile` | `DislikedProductsCombobox` (disabled at 20) | Validated in POST/PUT `/api/preferences` | Counter "X/20", disabled state message |
| **US-018**: Limit alergii | `/onboarding`, `/profile` | `AllergyCheckboxGroup` (disabled at 10) | Validated in POST/PUT `/api/preferences` | Counter "X/10", disabled state message |
| **US-019**: Autouzupełnianie | `/onboarding`, `/profile` | `DislikedProductsCombobox` with fuzzy search | Local (products.json) | Keyboard navigation, aria-autocomplete |
| **US-020**: Responsywność | Wszystkie widoki | Tailwind responsive utilities | N/A | Mobile-first, touch targets 44x44px |
| **US-021**: Ochrona routes | Wszystkie chronione | `ProtectedRoute`, Astro middleware | N/A | Redirect to login on unauthorized |
| **US-022**: Analytics | Wszystkie widoki | `useAnalytics` hook | POST `/api/analytics/events` | Passive tracking |
| **US-023**: Prompt AI | Backend logic | N/A | LLM integration in POST `/api/meal-plans` | N/A |
| **US-024**: Loader | `/dashboard` | `GeneratingModal` with spinner + text | N/A | aria-live, aria-busy |
| **US-025**: Persistent session | Wszystkie widoki | `AuthContext`, Supabase session management | N/A | Auto-restore session on refresh |

---

## 7. Zgodność z API Plan

### Mapowanie API endpoints do UI actions

| API Endpoint | HTTP Method | UI Trigger | Component | Success Action | Error Handling |
|--------------|-------------|------------|-----------|----------------|----------------|
| `/api/preferences` | POST | "Zapisz i wygeneruj plan" (onboarding) | `PreferencesForm` | Redirect to `/dashboard` + toast | Inline errors + toast |
| `/api/preferences` | GET | Page load (`/profile`) | `PreferencesForm` | Pre-fill form | Error page or redirect |
| `/api/preferences` | PUT | "Zapisz zmiany" (`/profile`) | `PreferencesForm` | Toast + redirect to `/dashboard` | Inline errors + toast |
| `/api/meal-plans` | POST | "Wygeneruj plan" button | `GeneratingModal` | Display plan in `MealPlanGrid` | `ErrorState` with retry |
| `/api/meal-plans/current` | GET | Dashboard load | `MealPlanGrid` | Display plan | `EmptyState` if 404 |
| `/api/feedback` | POST | Thumbs up/down (first time) | `FeedbackButtons` | Toast "Dziękujemy" + visual feedback | Toast error |
| `/api/feedback/:id` | PUT | Thumbs up/down (change) | `FeedbackButtons` | Toast + visual feedback | Toast error |
| `/api/analytics/events` | POST | Automatic (plan_accepted) | `usePlanAcceptance` | Silent (no user feedback) | Silent fail (non-blocking) |

### API Error Codes → UI Response

| Status Code | UI Element | Message | Action |
|-------------|-----------|---------|--------|
| 400 | Inline error under field | Field-specific Polish message | User corrects input |
| 401 | Toast + Redirect | "Sesja wygasła. Zaloguj się ponownie" | Redirect to `/login` |
| 403 | Toast | "Brak uprawnień" | Stay on page |
| 404 (preferences) | Redirect | N/A | Redirect to `/onboarding` |
| 404 (meal plan) | EmptyState | "Nie masz jeszcze planu" | Show "Wygeneruj plan" CTA |
| 500 | Toast or ErrorState | "Wystąpił błąd. Spróbuj ponownie." | Retry button |
| 503 | Toast or ErrorState | "Serwis chwilowo niedostępny" | Retry button |
| 504 | ErrorState | "Timeout. Spróbuj ponownie." | Retry button |

---

## 8. Punkty bólu użytkownika i rozwiązania UI

### Identyfikacja pain points z PRD i ich rozwiązania w UI

| Pain Point (z PRD) | UI Solution | Component/Feature |
|--------------------|-------------|-------------------|
| **"Paralysis decyzyjny"** - nadmiar opcji | Single CTA na dashboard: "Wygeneruj plan" (brak wyboru, AI decyduje) | `EmptyState`, primary CTA button |
| **Brak czasu na planowanie** | Onboarding <5 minut, single-page form, auto-save | `PreferencesForm` with auto-save |
| **Trudność wymyślania różnorodnych posiłków** | AI generuje różnorodne plany, regeneracja bez limitu | `GeneratingModal`, "Wygeneruj nowy plan" |
| **Uwzględnianie wielu zmiennych** | Formularz zbiera wszystkie preferencje raz, AI je pamięta | `PreferencesForm` z 5 sekcjami |
| **Powtarzalność menu** | Każda regeneracja = nowe propozycje | Regeneration feature |
| **Frustracja "co na obiad?"** | Dashboard zawsze pokazuje gotowy plan | `MealPlanGrid` with 3 meals |
| **Czasochłonne planowanie** | Automatyczne generowanie w 10-20s | `GeneratingModal` with quick generation |
| **Trudność z alergiami** | Hard exclusions w formularzu, 100% zgodność | `AllergyCheckboxGroup` + AI prompt |
| **Brak personalizacji gotowych diet** | Formularz z celami, dietą, aktywnością | All preferences fields |
| **Koszt dietetyków** | Darmowa aplikacja (MVP) | Free access |

### UX Improvements dla smooth experience

1. **Auto-save formularza**
   - **Problem**: Użytkownik może stracić dane przy przypadkowym zamknięciu
   - **Solution**: Auto-save co 2s do localStorage + draft restoration

2. **Loading states**
   - **Problem**: Użytkownik nie wie, czy app działa
   - **Solution**: `GeneratingModal` z spinner, tekstem i timerem

3. **Inline validation**
   - **Problem**: Użytkownik dowiaduje się o błędach dopiero po submit
   - **Solution**: Live validation on blur + visual feedback (checkmarks)

4. **Cancel generation**
   - **Problem**: Użytkownik może chcieć przerwać długie generowanie
   - **Solution**: "Anuluj" button w modal + AbortController

5. **Feedback bez wymuszania**
   - **Problem**: Wymuszony feedback irytuje
   - **Solution**: Optional thumbs up/down + passive tracking (plan_accepted)

6. **Clear error messages**
   - **Problem**: Techniczne błędy są niezrozumiałe
   - **Solution**: Polish messages, retry buttons, helpful guidance

7. **Responsive design**
   - **Problem**: Niewygodne użytkowanie na mobile
   - **Solution**: Mobile-first, tested on real devices, touch-friendly buttons

8. **Accessibility**
   - **Problem**: Wykluczenie użytkowników z disabilities
   - **Solution**: WCAG 2.1 AA compliance, keyboard navigation, ARIA attributes

---

## 9. Kluczowe decyzje projektowe

### Podsumowanie ważnych decyzji architektonicznych z Session Notes

1. **Single-page onboarding form** zamiast multi-step wizard
   - **Rationale**: Szybsze wypełnienie (<3 min), mniej kliknięć, wizualne grupowanie sekcji wystarcza

2. **Fullscreen modal dla generowania** zamiast inline spinner
   - **Rationale**: Focus użytkownika na procesie, możliwość anulowania, lepsze UX dla długiej operacji

3. **Auto-save do localStorage** zamiast backend drafts
   - **Rationale**: Prostsze w implementacji, działa offline, brak obciążenia API

4. **Tailwind utility variants** zamiast osobnych komponentów dla mobile/desktop
   - **Rationale**: Mniejszy bundle, łatwiejsze utrzymanie, standard w Tailwind ecosystem

5. **Inline error messages** zamiast toast dla form validation
   - **Rationale**: Errors przy polach są bardziej zrozumiałe, toast dla mutations success/error

6. **Wbudowane state management** (hooks + Context) zamiast React Query/Zustand
   - **Rationale**: MVP jest prosty, nie potrzebuje złożonego state management, można dodać później

7. **Hybrydowa ochrona routes** (Astro middleware + React guards)
   - **Rationale**: Security in depth, lepsze UX (brak flickera), SEO-friendly

8. **Feature-based component structure** zamiast atomic design pure
   - **Rationale**: Łatwiejsze skalowanie, clear ownership, lepsze dla team collaboration (przyszłość)

9. **Passive plan acceptance tracking** zamiast forced feedback
   - **Rationale**: Mniej intrusive, accurate metrics (czas na stronie), optional explicit feedback

10. **Zod + React Hook Form** dla complex forms, native validation dla simple forms
    - **Rationale**: Balance między DX i bundle size, RHF gdzie potrzebne (onboarding/profile)

---

## 10. Następne kroki implementacji

### Priorytetyzacja implementacji (rekomendowane)

#### Faza 1: Foundation (tydzień 1)
1. Setup projektu (Astro + React + Tailwind + Shadcn/ui)
2. Konfiguracja Supabase client
3. Database types generation
4. AuthContext implementation
5. Astro middleware (route protection)
6. Basic layout (Navigation, PageContainer)

#### Faza 2: Authentication (tydzień 1-2)
1. Public Navigation
2. Landing page (basic)
3. Register page + LoginForm component
4. Login page + RegisterForm component
5. Reset password page
6. AuthenticatedNavigation

#### Faza 3: Preferences (tydzień 2-3)
1. PreferencesForm structure
2. Health goal + diet type + activity level (Select components)
3. AllergyCheckboxGroup z limitem
4. products.json (lista produktów)
5. DislikedProductsCombobox z fuzzy search
6. useFormDraft hook (localStorage auto-save)
7. POST /api/preferences integration

#### Faza 4: Meal Plan Generation (tydzień 3-4)
1. Dashboard structure (EmptyState)
2. GeneratingModal component
3. useGenerateMealPlan hook (z AbortController)
4. MealPlanGrid layout
5. MealCard + IngredientList + StepsList
6. POST /api/meal-plans integration
7. GET /api/meal-plans/current integration

#### Faza 5: Feedback & Analytics (tydzień 4)
1. FeedbackButtons component
2. useCreateFeedback + useUpdateFeedback hooks
3. POST/PUT /api/feedback integration
4. usePlanAcceptance hook (automatic tracking)
5. useAnalytics hook
6. POST /api/analytics/events integration

#### Faza 6: Profile & Polish (tydzień 5)
1. Profile page (reuse PreferencesForm)
2. GET /api/preferences integration
3. PUT /api/preferences integration
4. Unsaved changes warning
5. Error handling improvements
6. Toast notifications (Sonner)
7. Loading states polish
8. Mobile testing & fixes

#### Faza 7: Testing & Refinement (tydzień 6)
1. Accessibility audit (keyboard navigation, ARIA)
2. Responsiveness testing (real devices)
3. Error scenarios testing
4. Performance optimization
5. Bug fixes
6. Documentation

---

## 11. Metryki sukcesu UI/UX

### Mierzalne cele UX (oprócz metryk z PRD)

1. **Time to First Plan (TTFP)**
   - Target: <5 minut od rejestracji do wyświetlenia planu
   - Measure: Analytics timestamps (user_registered → plan_generated)

2. **Form Completion Rate**
   - Target: >90% użytkowników kończy onboarding
   - Measure: (profile_created / user_registered) × 100%

3. **Error Rate**
   - Target: <5% form submissions z błędami walidacji
   - Measure: Validation errors / total submissions

4. **Generation Success Rate**
   - Target: >95% generowań kończy się sukcesem (nie timeout/error)
   - Measure: (plan_generated / API calls) × 100%

5. **Mobile Usage**
   - Target: >40% użytkowników na mobile (MVP edukacyjny, realnie może być mniej)
   - Measure: User agent analysis

6. **Accessibility Compliance**
   - Target: 100% WCAG 2.1 AA
   - Measure: Lighthouse audit, manual testing

---

## 12. Podsumowanie

Architektura UI AI Meal Planner MVP jest zaprojektowana z myślą o:

- **Prostocie**: Minimalistyczny design, jasne ścieżki użytkownika
- **Szybkości**: Onboarding <5 minut, generowanie planu <30s
- **Dostępności**: WCAG 2.1 AA, keyboard navigation, ARIA attributes
- **Responsywności**: Mobile-first, tested on real devices
- **Bezpieczeństwie**: Hybrydowa ochrona routes, RLS policies
- **Skalowalności**: Feature-based structure, gotowa na rozbudowę

Kluczowe widoki (landing, register, onboarding, dashboard, profile) tworzą spójną podróż od odkrycia produktu do codziennego użytkowania. Komponenty są zorganizowane w reusable, accessible building blocks z Shadcn/ui jako solidną podstawą.

API integration poprzez custom hooks zapewnia separation of concerns i łatwość testowania. State management jest minimalistyczny (tylko AuthContext globalnie), co jest wystarczające dla MVP.

Architektura jest gotowa do implementacji i spełnia wszystkie wymagania z PRD, API Plan i Session Notes.

