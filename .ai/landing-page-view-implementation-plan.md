# Plan implementacji widoku Landing Page

## 1. Przegląd

Landing Page to publiczny widok główny aplikacji AI Meal Planner, dostępny pod ścieżką `/`. Jest to pierwszy punkt kontaktu z niezalogowanymi użytkownikami, którego głównym celem jest przekonanie ich do rejestracji poprzez prezentację wartości produktu. Widok prezentuje problem użytkownika (paraliza decyzyjna w planowaniu posiłków), proponuje rozwiązanie (automatyczne generowanie spersonalizowanych planów przez AI) i prowadzi do rejestracji poprzez wyraźny Call-to-Action.

Landing Page jest zoptymalizowany pod kątem konwersji (rejestracja), accessibility (WCAG 2.1 AA) oraz responsywności (mobile-first design).

## 2. Routing widoku

**Ścieżka**: `/`

**Typ widoku**: Publiczny

**Logika przekierowań**:

- Niezalogowani użytkownicy: Wyświetlenie Landing Page
- Zalogowani użytkownicy: Automatyczne przekierowanie na `/dashboard` (middleware sprawdza sesję)

**Implementacja przekierowania**: Astro middleware sprawdza sesję użytkownika przed wyrenderowaniem strony. Jeśli użytkownik jest zalogowany, następuje redirect na `/dashboard`.

## 3. Struktura komponentów

```
/pages/index.astro (Astro page - server-side)
├── Layout.astro (layout wrapper)
│   └── PublicNavigation (component)
│       ├── Logo
│       ├── NavLinks (desktop)
│       ├── MobileMenu (mobile hamburger)
│       └── AuthButtons
└── main (landing content)
    ├── Hero (component)
    │   ├── HeroHeading
    │   ├── HeroSubtitle
    │   └── HeroCTA (primary button → /register)
    ├── Benefits (component)
    │   ├── BenefitCard (x3)
    │   │   ├── Icon
    │   │   ├── Title
    │   │   └── Description
    ├── HowItWorks (component)
    │   ├── StepCard (x3)
    │   │   ├── StepNumber
    │   │   ├── StepTitle
    │   │   └── StepDescription
    └── CTASection (component)
        ├── CTAHeading
        ├── CTADescription
        └── CTAButton (primary → /register)
```

**Hierarchia komponentów**:

- **Level 0**: `index.astro` (Astro page)
- **Level 1**: `Layout.astro`, `PublicNavigation`
- **Level 2**: `Hero`, `Benefits`, `HowItWorks`, `CTASection`
- **Level 3**: `BenefitCard`, `StepCard`, `Button`, `Logo`

## 4. Szczegóły komponentów

### 4.1. PublicNavigation

**Opis**: Górna nawigacja dla niezalogowanych użytkowników. Sticky, przezroczysta z blur backdrop. Na mobile zamienia się w hamburger menu.

**Główne elementy HTML**:

```html
<nav aria-label="Główna nawigacja">
  <div class="container">
    <Logo />
    <!-- Desktop -->
    <div class="desktop-links">
      <a href="#benefits">Korzyści</a>
      <a href="#how-it-works">Jak to działa</a>
    </div>
    <!-- Mobile -->
    <MobileMenuButton />
    <MobileMenu />

    <div class="auth-buttons">
      <button variant="ghost" href="/login">Zaloguj się</button>
      <button variant="default" href="/register">Zarejestruj się</button>
    </div>
  </div>
</nav>
```

**Obsługiwane zdarzenia**:

- Klik na "Zaloguj się" → Nawigacja do `/login`
- Klik na "Zarejestruj się" → Nawigacja do `/register`
- Klik na hamburger icon (mobile) → Toggle mobile menu
- Klik na link anchor (#benefits, #how-it-works) → Smooth scroll do sekcji

**Warunki walidacji**: Brak walidacji (tylko nawigacja)

**Typy**: Brak specyficznych DTO

**Propsy**: Brak (standalone component)

**Accessibility**:

- `<nav aria-label="Główna nawigacja">`
- Skip to main content link (visible on focus)
- Focus visible styles
- Keyboard navigation (Tab, Enter)
- Mobile menu z focus trap

### 4.2. Hero

**Opis**: Główna sekcja przyciągająca uwagę, zawierająca nagłówek z wartością produktu, krótki opis i główny CTA. Wizualnie dominująca sekcja (min-height viewport, centered content).

**Główne elementy HTML**:

```html
<section class="hero" aria-labelledby="hero-heading">
  <div class="container">
    <h1 id="hero-heading">Przestań martwić się, co na obiad</h1>
    <p class="subtitle">
      AI wygeneruje dla Ciebie spersonalizowany plan posiłków w kilka sekund. Uwzględniając Twoje cele, dietę i
      preferencje.
    </p>
    <button size="lg" href="/register">Zacznij teraz</button>
    <p class="trust-signal">Darmowe konto • Bez karty kredytowej</p>
  </div>
</section>
```

**Obsługiwane zdarzenia**:

- Klik "Zacznij teraz" → Nawigacja do `/register`

**Warunki walidacji**: Brak walidacji

**Typy**: Brak specyficznych DTO

**Propsy**: Brak (standalone component)

**Accessibility**:

- `<section aria-labelledby="hero-heading">`
- Semantic heading hierarchy (h1)
- Wysokich kontrast tekstu (minimum 4.5:1)
- CTA button accessible (min 44x44px touch target)

### 4.3. Benefits

**Opis**: Sekcja prezentująca trzy główne korzyści z używania aplikacji. Grid layout (3 kolumny desktop, 1 kolumna mobile). Każda korzyść jako karta z ikoną, tytułem i opisem.

**Główne elementy HTML**:

```html
<section id="benefits" aria-labelledby="benefits-heading">
  <div class="container">
    <h2 id="benefits-heading">Dlaczego AI Meal Planner?</h2>
    <div class="benefits-grid">
      <BenefitCard
        icon="Clock"
        title="Oszczędność czasu"
        description="Nie trać godzin na planowanie. AI wygeneruje plan w 10 sekund."
      />
      <BenefitCard
        icon="Target"
        title="Pełna personalizacja"
        description="Plan dostosowany do Twoich celów, diety, alergii i preferencji."
      />
      <BenefitCard
        icon="Sparkles"
        title="Zawsze świeże pomysły"
        description="Każdy plan jest inny. Zapomnij o powtarzalnym menu."
      />
    </div>
  </div>
</section>
```

**Obsługiwane zdarzenia**: Brak interakcji (statyczna sekcja)

**Warunki walidacji**: Brak walidacji

**Typy**: Brak specyficznych DTO

**Propsy**:

```typescript
// BenefitCard props
interface BenefitCardProps {
  icon: string; // Icon name (lucide-react)
  title: string;
  description: string;
}
```

**Accessibility**:

- `<section id="benefits" aria-labelledby="benefits-heading">` (anchor link target)
- Semantic heading (h2)
- Icons jako `aria-hidden="true"` (decorative)
- Czytelna typografia (min 16px body text)

### 4.4. HowItWorks

**Opis**: Sekcja wizualizująca proces korzystania z aplikacji w 3 krokach. Każdy krok jako karta z numerem, tytułem i opisem. Layout horizontal (desktop) lub vertical (mobile).

**Główne elementy HTML**:

```html
<section id="how-it-works" aria-labelledby="how-it-works-heading">
  <div class="container">
    <h2 id="how-it-works-heading">Jak to działa?</h2>
    <div class="steps-container">
      <StepCard
        number="{1}"
        title="Wypełnij preferencje"
        description="Powiedz nam o swoich celach, diecie i alergiach."
      />
      <StepCard
        number="{2}"
        title="Wygeneruj plan"
        description="AI stworzy dla Ciebie plan trzech posiłków na dzisiaj."
      />
      <StepCard number="{3}" title="Gotuj i ciesz się" description="Masz wszystkie składniki i kroki przygotowania." />
    </div>
  </div>
</section>
```

**Obsługiwane zdarzenia**: Brak interakcji (statyczna sekcja)

**Warunki walidacji**: Brak walidacji

**Typy**: Brak specyficznych DTO

**Propsy**:

```typescript
// StepCard props
interface StepCardProps {
  number: number; // 1, 2, 3
  title: string;
  description: string;
}
```

**Accessibility**:

- `<section id="how-it-works" aria-labelledby="how-it-works-heading">`
- Semantic heading (h2)
- Numbered list semantic (`<ol>` alternatywnie)
- Visual number jako `aria-label="Krok {number}"`

### 4.5. CTASection

**Opis**: Dolna sekcja Call-to-Action, zachęcająca do rejestracji. Wyróżniona wizualnie (background color/gradient), centered content.

**Główne elementy HTML**:

```html
<section class="cta-section" aria-labelledby="cta-heading">
  <div class="container">
    <h2 id="cta-heading">Gotowy na Twój pierwszy plan?</h2>
    <p>Dołącz za darmo i wygeneruj spersonalizowany plan w kilka minut.</p>
    <button size="lg" href="/register">Zacznij za darmo</button>
  </div>
</section>
```

**Obsługiwane zdarzenia**:

- Klik "Zacznij za darmo" → Nawigacja do `/register`

**Warunki walidacji**: Brak walidacji

**Typy**: Brak specyficznych DTO

**Propsy**: Brak (standalone component)

**Accessibility**:

- Semantic section z labelledby
- Kontrastowy CTA button
- Touch-friendly button size

### 4.6. Footer

**Opis**: Minimalistyczny footer z copyright i linkami (opcjonalnymi placeholderami w MVP).

**Główne elementy HTML**:

```html
<footer>
  <div class="container">
    <p>© 2025 AI Meal Planner</p>
    <nav aria-label="Footer navigation">
      <a href="#">O aplikacji</a>
      <a href="#">Kontakt</a>
      <a href="#">Polityka prywatności</a>
    </nav>
  </div>
</footer>
```

**Obsługiwane zdarzenia**: Klik na linki (placeholders - brak docelowych stron w MVP)

**Warunki walidacji**: Brak walidacji

**Typy**: Brak specyficznych DTO

**Propsy**: Brak (standalone component)

## 5. Typy

Landing Page nie wymaga specyficznych DTO ani typów związanych z API, ponieważ jest statycznym widokiem informacyjnym bez integracji z backendem.

**Propsy komponentów** (interfejsy TypeScript):

```typescript
// src/components/landing/BenefitCard.tsx
export interface BenefitCardProps {
  /** Nazwa ikony z lucide-react (np. "Clock", "Target", "Sparkles") */
  icon: string;
  /** Tytuł korzyści */
  title: string;
  /** Opis korzyści */
  description: string;
}

// src/components/landing/StepCard.tsx
export interface StepCardProps {
  /** Numer kroku (1, 2, 3) */
  number: number;
  /** Tytuł kroku */
  title: string;
  /** Opis kroku */
  description: string;
}
```

## 6. Zarządzanie stanem

Landing Page jest **stateless** - nie wymaga zarządzania stanem.

**Uzasadnienie**:

- Widok jest czysto prezentacyjny (informacje statyczne)
- Brak formularzy ani interakcji wymagających state
- Brak wywołań API
- Nawigacja odbywa się przez linki (`<a>` tags) bez JavaScript

**Jedyne state w widoku**:

- **Mobile menu toggle** (otwarte/zamknięte) - lokalny state w komponencie `PublicNavigation`:
  ```typescript
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  ```

Nie jest wymagany custom hook ani global state.

## 7. Integracja API

Landing Page **nie wymaga integracji z API**.

**Uzasadnienie**:

- Widok jest statyczny, bez dynamicznych danych z serwera
- Jedyna interakcja to nawigacja do `/register` i `/login`, które są obsługiwane przez routing (nie API)

**Sprawdzenie sesji użytkownika** (dla przekierowania zalogowanych):

- Odbywa się po stronie serwera przez **Astro middleware**
- Middleware sprawdza sesję Supabase przed wyrenderowaniem strony
- Jeśli użytkownik zalogowany → `return Astro.redirect('/dashboard')`
- Landing Page nigdy nie jest renderowany dla zalogowanych użytkowników

**Implementacja w Astro middleware** (`src/middleware/index.ts`):

```typescript
export async function onRequest(context, next) {
  const { url, locals, redirect } = context;

  // Sprawdzenie sesji Supabase
  const session = await getSession(context);

  // Jeśli na landing page i zalogowany → redirect
  if (url.pathname === "/" && session) {
    return redirect("/dashboard");
  }

  return next();
}
```

## 8. Interakcje użytkownika

### 8.1. Nawigacja do rejestracji

**Trigger**: Klik na przycisk "Zacznij teraz" (Hero) lub "Zacznij za darmo" (CTASection)

**Oczekiwane zachowanie**:

1. Użytkownik klika CTA button
2. Przeglądarka nawiguje do `/register`
3. Wyświetlenie widoku rejestracji

**Implementacja**: Standardowy link `<a href="/register">` (brak JavaScript)

### 8.2. Nawigacja do logowania

**Trigger**: Klik na "Zaloguj się" w nawigacji

**Oczekiwane zachowanie**:

1. Użytkownik klika "Zaloguj się"
2. Nawigacja do `/login`
3. Wyświetlenie widoku logowania

**Implementacja**: Link `<a href="/login">`

### 8.3. Smooth scroll do sekcji

**Trigger**: Klik na link anchor w nawigacji (#benefits, #how-it-works)

**Oczekiwane zachowanie**:

1. Użytkownik klika link (np. "Korzyści")
2. Strona płynnie scrolluje do sekcji `<section id="benefits">`
3. Focus ustawiony na heading sekcji (accessibility)

**Implementacja**:

```typescript
// Optional: Enhanced smooth scroll z focus management
const handleAnchorClick = (e: Event, targetId: string) => {
  e.preventDefault();
  const target = document.getElementById(targetId);
  if (target) {
    target.scrollIntoView({ behavior: "smooth" });
    // Focus dla screen readers
    const heading = target.querySelector("h2");
    heading?.focus();
  }
};
```

### 8.4. Toggle mobile menu

**Trigger**: Klik na hamburger icon (mobile)

**Oczekiwane zachowanie**:

1. Użytkownik klika hamburger icon (☰)
2. Mobile menu slide in z lewej/prawej
3. Backdrop (blur) pojawia się za menu
4. Focus trap aktywowany w menu
5. Escape lub klik backdrop → zamknięcie menu

**Implementacja**: Komponent `Sheet` z Shadcn/ui + state hook:

```typescript
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
```

## 9. Warunki i walidacja

Landing Page **nie wymaga walidacji**, ponieważ nie zawiera formularzy ani inputów użytkownika.

**Jedyny warunek weryfikowany przez middleware**:

### 9.1. Sprawdzenie sesji użytkownika

**Warunek**: Jeśli użytkownik jest zalogowany, nie powinien widzieć Landing Page

**Komponent dotyczący**: Astro middleware (server-side)

**Wpływ na interfejs**:

- **Zalogowany użytkownik**: Automatic redirect na `/dashboard` (Landing Page nie renderuje się)
- **Niezalogowany użytkownik**: Landing Page renderuje się normalnie

**Implementacja**:

```typescript
// src/middleware/index.ts
if (url.pathname === "/" && session) {
  return redirect("/dashboard");
}
```

## 10. Obsługa błędów

Landing Page jest statycznym widokiem i nie wymaga rozbudowanej obsługi błędów. Potencjalne scenariusze:

### 10.1. Błąd middleware (sprawdzanie sesji)

**Scenariusz**: Middleware nie może sprawdzić sesji Supabase (błąd sieci, timeout)

**Obsługa**:

- Fallback: Traktuj użytkownika jako niezalogowanego
- Renderuj Landing Page normalnie
- Logowanie błędu do konsoli (silent fail dla użytkownika)

**Implementacja**:

```typescript
try {
  const session = await getSession(context);
  if (session) return redirect("/dashboard");
} catch (error) {
  console.error("Session check failed:", error);
  // Fallback: continue rendering landing page
}
```

### 10.2. Broken navigation links

**Scenariusz**: Link prowadzi do nieistniejącej strony (np. footer placeholders)

**Obsługa**:

- Placeholder linki w MVP mają `href="#"` (nie prowadzą nigdzie)
- W przyszłości: Zastąpienie prawdziwymi stronami lub usunięcie linków
- Opcjonalnie: Toast "Ta funkcja jest niedostępna w MVP"

### 10.3. Brak JavaScript (progressive enhancement)

**Scenariusz**: Użytkownik wyłączył JavaScript w przeglądarce

**Obsługa**:

- Wszystkie kluczowe funkcje (nawigacja CTA) działają bez JS (standardowe linki `<a>`)
- Mobile menu nie działa (graceful degradation - linki widoczne zawsze na desktop)
- Smooth scroll degraduje się do standardowego jumpu

## 11. Kroki implementacji

### Krok 1: Setup struktury projektu

1. Utworzenie pliku `src/pages/index.astro`
2. Utworzenie folderu `src/components/landing/` dla komponentów Landing Page
3. Utworzenie folderu `src/components/layout/` dla komponentów nawigacji

### Krok 2: Implementacja Layout i Navigation

1. **Utworzenie `src/layouts/Layout.astro`** (jeśli nie istnieje):
   - Base HTML structure
   - Head meta tags (title, description, viewport)
   - Import global styles
   - Slot dla page content

2. **Utworzenie `src/components/layout/PublicNavigation.tsx`** (React component):
   - Container z logo po lewej, auth buttons po prawej
   - Desktop links (Benefits, Jak to działa) jako anchor links
   - Mobile hamburger menu (Shadcn/ui `Sheet` component)
   - Sticky positioning z backdrop blur
   - Responsywny layout (Tailwind breakpoints)

3. **Utworzenie `src/components/layout/Logo.tsx`**:
   - Text logo: "AI Meal Planner"
   - Link do `/` (home)
   - SVG icon (opcjonalnie)

4. **Testowanie nawigacji**:
   - Desktop: Wszystkie linki widoczne, klikalne
   - Mobile: Hamburger menu otwiera się/zamyka poprawnie
   - Accessibility: Keyboard navigation działa, focus visible

### Krok 3: Implementacja Hero section

1. **Utworzenie `src/components/landing/Hero.astro`**:
   - Container z centered content
   - H1 heading: "Przestań martwić się, co na obiad"
   - Subtitle paragraph
   - Primary CTA button (Shadcn/ui `Button`): "Zacznij teraz" → `/register`
   - Trust signal: "Darmowe konto • Bez karty kredytowej"
2. **Stylowanie**:
   - Min-height: 100vh (fullscreen)
   - Flexbox/Grid dla centrowania
   - Responsive typography (clamp() dla fluid sizing)
   - High contrast colors

3. **Testowanie**:
   - CTA button prowadzi do `/register`
   - Responsywność (mobile/tablet/desktop)
   - Kontrast tekstu (Lighthouse audit)

### Krok 4: Implementacja Benefits section

1. **Utworzenie `src/components/landing/BenefitCard.tsx`** (React component):
   - Props: `icon`, `title`, `description`
   - Card layout z ikoną na górze, title, description
   - Icon z lucide-react library
   - Tailwind styling

2. **Utworzenie `src/components/landing/Benefits.astro`**:
   - Section wrapper z heading "Dlaczego AI Meal Planner?"
   - Grid layout (3 columns desktop, 1 column mobile)
   - 3x `BenefitCard`:
     - Icon: Clock, Title: "Oszczędność czasu", Description: "..."
     - Icon: Target, Title: "Pełna personalizacja", Description: "..."
     - Icon: Sparkles, Title: "Zawsze świeże pomysły", Description: "..."

3. **Testowanie**:
   - Grid responsive (3/2/1 columns)
   - Icons renderują się poprawnie
   - Czytelność na wszystkich ekranach

### Krok 5: Implementacja HowItWorks section

1. **Utworzenie `src/components/landing/StepCard.tsx`** (React component):
   - Props: `number`, `title`, `description`
   - Card z dużym numerem (visual), title, description
   - Tailwind styling

2. **Utworzenie `src/components/landing/HowItWorks.astro`**:
   - Section wrapper z heading "Jak to działa?"
   - Layout: horizontal (desktop) / vertical (mobile)
   - 3x `StepCard`:
     - Number: 1, Title: "Wypełnij preferencje", Description: "..."
     - Number: 2, Title: "Wygeneruj plan", Description: "..."
     - Number: 3, Title: "Gotuj i ciesz się", Description: "..."
   - Opcjonalnie: Arrows/lines między krokami (desktop)

3. **Testowanie**:
   - Layout horizontal na desktop, vertical na mobile
   - Numeracja widoczna i czytelna
   - Semantic HTML (optional `<ol>`)

### Krok 6: Implementacja CTASection

1. **Utworzenie `src/components/landing/CTASection.astro`**:
   - Section z background color/gradient (wyróżnienie)
   - Centered content
   - H2 heading: "Gotowy na Twój pierwszy plan?"
   - Description paragraph
   - Primary CTA button: "Zacznij za darmo" → `/register`

2. **Stylowanie**:
   - Kontrastowy background (np. gradient)
   - Duży padding (vertical spacing)
   - CTA button wyróżniony (size="lg")

3. **Testowanie**:
   - CTA button prowadzi do `/register`
   - Wyróżnienie wizualne od innych sekcji

### Krok 7: Implementacja Footer

1. **Utworzenie `src/components/layout/Footer.astro`**:
   - Container z copyright: "© 2025 AI Meal Planner"
   - Opcjonalne linki: "O aplikacji", "Kontakt", "Polityka prywatności" (placeholders)
   - Flexbox layout (row desktop, column mobile)

2. **Testowanie**:
   - Footer renderuje się poprawnie
   - Linki placeholder (href="#") nie powodują błędów

### Krok 8: Integracja w index.astro

1. **Utworzenie `src/pages/index.astro`**:
   - Import `Layout.astro`
   - Import wszystkich landing components
   - Struktura:

     ```astro
     ---
     import Layout from "../layouts/Layout.astro";
     import Hero from "../components/landing/Hero.astro";
     import Benefits from "../components/landing/Benefits.astro";
     import HowItWorks from "../components/landing/HowItWorks.astro";
     import CTASection from "../components/landing/CTASection.astro";
     ---

     <Layout title="AI Meal Planner - Spersonalizowane plany posiłków">
       <main>
         <Hero />
         <Benefits />
         <HowItWorks />
         <CTASection />
       </main>
     </Layout>
     ```

2. **Testowanie**:
   - Wszystkie sekcje renderują się w poprawnej kolejności
   - Brak błędów w konsoli
   - Responsywność całej strony

### Krok 9: Implementacja middleware (redirect zalogowanych)

1. **Modyfikacja `src/middleware/index.ts`**:
   - Sprawdzenie sesji Supabase
   - Jeśli użytkownik zalogowany i pathname === '/' → redirect('/dashboard')

   ```typescript
   export async function onRequest(context, next) {
     const { url, locals, redirect } = context;

     try {
       const session = await getSession(context);

       if (url.pathname === "/" && session) {
         return redirect("/dashboard");
       }
     } catch (error) {
       console.error("Session check failed:", error);
       // Fallback: continue rendering
     }

     return next();
   }
   ```

2. **Testowanie**:
   - Niezalogowany użytkownik widzi Landing Page
   - Zalogowany użytkownik jest przekierowany na `/dashboard`
   - Błąd middleware nie blokuje renderowania (fallback działa)

### Krok 10: Stylowanie i polish

1. **Tailwind classes**:
   - Responsive utilities (sm:, md:, lg:, xl:)
   - Spacing consistency (Tailwind spacing scale)
   - Color palette (używaj theme colors z config)
   - Typography (text sizes, line heights)

2. **Accessibility audit**:
   - Lighthouse audit (score >90)
   - Keyboard navigation test (Tab przez wszystkie interactive elements)
   - Screen reader test (NVDA/VoiceOver)
   - Kontrast tekstu (minimum 4.5:1)
   - Alt texts dla ikon (aria-hidden="true" dla decorative)

3. **Performance optimization**:
   - Lazy loading images (jeśli dodane w przyszłości)
   - Minimize JavaScript (Astro partial hydration)
   - Font optimization (preload, font-display: swap)

### Krok 11: Testowanie end-to-end

1. **Desktop testing** (Chrome, Firefox, Safari):
   - Wszystkie sekcje widoczne
   - Nawigacja działa
   - CTA buttons prowadzą do `/register`
   - Smooth scroll do anchor links działa

2. **Mobile testing** (real devices lub DevTools):
   - Responsywny layout (wszystkie breakpoints)
   - Mobile menu otwiera się i zamyka
   - Touch targets min 44x44px
   - Czytelność na małych ekranach

3. **Edge cases**:
   - JavaScript wyłączony → CTA links działają (progressive enhancement)
   - Slow connection → content visible (no layout shift)
   - Zalogowany użytkownik → redirect na `/dashboard` działa

### Krok 12: Dokumentacja i cleanup

1. **Komentarze w kodzie**:
   - Descriptions dla komponentów
   - Props documentation (JSDoc/TSDoc)

2. **README update** (jeśli dotyczy):
   - Opis Landing Page
   - Lista komponentów

3. **Code review checklist**:
   - ✅ Accessibility (WCAG 2.1 AA)
   - ✅ Responsywność (mobile-first)
   - ✅ Performance (Lighthouse >90)
   - ✅ TypeScript types (no `any`)
   - ✅ Semantic HTML
   - ✅ Error handling (middleware fallback)
   - ✅ Zgodność z PRD i UI Plan

---

## Podsumowanie

Landing Page jest prostym, statycznym widokiem skupionym na konwersji (rejestracja). Implementacja powinna zająć **1-2 dni** dla doświadczonego frontend developera, z uwzględnieniem:

- Setup struktury komponentów (3-4h)
- Implementacja sekcji (Hero, Benefits, HowItWorks, CTA) (4-5h)
- Stylowanie i responsywność (2-3h)
- Accessibility i testing (2-3h)

Kluczowe priorytety:

1. **Klarowny CTA** - "Zacznij teraz" wyraźnie widoczny
2. **Responsywność** - mobile-first design
3. **Accessibility** - WCAG 2.1 AA compliance
4. **Performance** - szybkie ładowanie (Astro static generation)

Po implementacji Landing Page, naturalny next step to widok **Register** (`/register`), do którego prowadzą wszystkie CTA buttons.
