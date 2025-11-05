# Plan Testów dla Aplikacji "AI Meal Planner"

---

## 1. Wprowadzenie i Cele Testowania

### 1.1. Wprowadzenie

Niniejszy dokument przedstawia kompleksowy plan testów dla aplikacji "AI Meal Planner". Aplikacja ta jest nowoczesnym rozwiązaniem webowym zbudowanym w oparciu o framework Astro i React, wykorzystującym Supabase jako backend (baza danych i autentykacja) oraz OpenRouter do integracji z modelami językowymi (AI) w celu generowania spersonalizowanych planów żywieniowych.

Celem planu jest systematyczne podejście do weryfikacji jakości, funkcjonalności, wydajności i bezpieczeństwa aplikacji przed jej wdrożeniem produkcyjnym.

### 1.2. Cele Testowania

Główne cele procesu testowego to:

- **Weryfikacja funkcjonalna:** Zapewnienie, że wszystkie kluczowe funkcjonalności aplikacji, takie jak rejestracja, logowanie, zarządzanie preferencjami i generowanie planów żywieniowych, działają zgodnie ze specyfikacją.
- **Zapewnienie niezawodności:** Identyfikacja i eliminacja błędów, które mogłyby negatywnie wpłynąć na doświadczenie użytkownika, w szczególności w krytycznym procesie interakcji z AI.
- **Ocena jakości integracji:** Sprawdzenie poprawności komunikacji z usługami zewnętrznymi (Supabase, OpenRouter) i odporności aplikacji na ich ewentualne błędy lub niedostępność.
- **Walidacja bezpieczeństwa:** Upewnienie się, że dane użytkowników są chronione, a dostęp do poszczególnych zasobów aplikacji jest prawidłowo autoryzowany.
- **Potwierdzenie użyteczności i dostępności:** Sprawdzenie, czy interfejs użytkownika jest intuicyjny, responsywny na różnych urządzeniach i zgodny ze standardami dostępności (WCAG).

## 2. Zakres Testów

### 2.1. Funkcjonalności objęte testami (In-Scope)

- **Moduł Uwierzytelniania:**
  - Rejestracja nowego użytkownika.
  - Logowanie (poprawne i błędne dane).
  - Wylogowywanie.
  - Proces resetowania i aktualizacji hasła.
  - Ochrona tras i przekierowania (middleware).
- **Onboarding i Zarządzanie Preferencjami Użytkownika:**
  - Wypełnianie i walidacja formularza preferencji (cele, dieta, alergie itp.).
  - Zapisywanie preferencji przy pierwszym użyciu (Onboarding).
  - Edycja i aktualizacja preferencji w profilu użytkownika.
  - Funkcjonalność auto-zapisu i przywracania wersji roboczej formularza.
- **Główny Dashboard i Generowanie Planu Żywieniowego:**
  - Generowanie pierwszego planu żywieniowego.
  - Regeneracja istniejącego planu.
  - Poprawność wyświetlania wygenerowanego planu (3 posiłki, składniki, kroki).
  - Obsługa stanów interfejsu: pusty, ładowanie, błąd (z opcją ponowienia), plan załadowany.
  - Anulowanie procesu generowania planu.
- **System Ocen (Feedback):**
  - Przesyłanie oceny "pozytywna"/"negatywna" dla planu.
  - Aktualizacja istniejącej oceny.
- **Moduł Analityki:**
  - Śledzenie kluczowych zdarzeń (np. rejestracja, wygenerowanie planu, akceptacja planu).
- **Strony Publiczne i Komponenty UI:**
  - Strona główna (Landing Page) i jej komponenty.
  - Nawigacja publiczna i dla zalogowanych użytkowników.
  - Podstawowe komponenty UI (przyciski, formularze, modale).
- **API Endpoints:**
  - Walidacja danych wejściowych i schematów odpowiedzi dla wszystkich endpointów API.
  - Obsługa autoryzacji i błędów.
- **Integracja z AI (OpenRouter):**
  - Poprawność konstruowania promptów na podstawie preferencji użytkownika.
  - Odporność na niepoprawne lub niekompletne odpowiedzi od LLM (np. błędny JSON).
  - Obsługa timeoutów i błędów sieciowych.

### 2.2. Funkcjonalności wyłączone z testów (Out-of-Scope)

- Testowanie wewnętrznej infrastruktury Supabase i OpenRouter (zakładamy, że usługi te działają poprawnie; testujemy jedynie naszą integrację z nimi).
- Ocena merytorycznej "inteligencji" lub "kreatywności" modelu AI – skupiamy się na technicznej poprawności generowanych danych.
- Testy obciążeniowe na dużą skalę, wykraczające poza symulację umiarkowanego ruchu użytkowników.
- Szczegółowe testy każdej biblioteki UI – zakładamy, że dostarczone komponenty (np. shadcn/ui) są przetestowane przez ich autorów.

## 3. Typy Testów do Przeprowadzenia

| Typ Testu                    | Opis                                                                                                                              | Przykładowe Zastosowanie w Projekcie                                                                                                                                                                                                                                                                   |
| :--------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Testy Jednostkowe**        | Weryfikacja pojedynczych, izolowanych fragmentów kodu (funkcji, komponentów, hooków) w celu zapewnienia ich poprawnego działania. | - Funkcje walidacyjne Zod (`/lib/schemas/`).<br>- Customowe hooki React (np. `useElapsedTime`, `useDirtyForm`) z mockowaniem zależności.<br>- Logika serwisów (np. `preferences.service.ts`) z mockowaniem klienta Supabase.<br>- Funkcje pomocnicze (`/lib/utils.ts`).                                |
| **Testy Integracyjne**       | Sprawdzanie, czy poszczególne moduły i komponenty poprawnie współpracują ze sobą.                                                 | - Interakcja komponentu formularza (`PreferencesForm.tsx`) z hookami i logiką walidacji.<br>- Współdziałanie endpointu API z warstwą serwisową i bazą danych (Supabase).<br>- Poprawność przekazywania danych między komponentami nadrzędnymi i podrzędnymi (np. `DashboardContent` i `MealPlanView`). |
| **Testy End-to-End (E2E)**   | Symulacja pełnych scenariuszy użytkownika w przeglądarce, weryfikująca cały stos technologiczny od interfejsu po bazę danych.     | - **Ścieżka krytyczna:** Rejestracja -> Onboarding -> Wygenerowanie planu -> Wylogowanie.<br>- Logowanie -> Regeneracja planu -> Dodanie oceny.<br>- Proces resetowania hasła przez e-mail.                                                                                                            |
| **Testy API**                | Bezpośrednie testowanie endpointów API w celu weryfikacji logiki biznesowej, walidacji, autoryzacji i formatów odpowiedzi.        | - Wysłanie poprawnych i niepoprawnych danych do `/api/preferences`.<br>- Próba dostępu do `/api/meal-plans` bez autoryzacji.<br>- Testowanie endpointów chata (`/api/chat`, `/api/chat-stream`).                                                                                                       |
| **Testy Kompatybilności**    | Sprawdzenie, czy aplikacja działa i wygląda poprawnie w różnych przeglądarkach i na różnych rozmiarach ekranu (responsywność).    | - Manualne i/lub zautomatyzowane testy E2E na przeglądarkach: Chrome, Firefox, Safari.<br>- Weryfikacja układu UI na rozdzielczościach mobilnych, tabletowych i desktopowych.                                                                                                                          |
| **Testy Wydajnościowe**      | Ocena szybkości działania i responsywności aplikacji pod obciążeniem.                                                             | - Mierzenie czasu generowania planu posiłków (end-to-end).<br>- Analiza czasu ładowania kluczowych stron (np. Dashboard).<br>- Podstawowe testy obciążeniowe dla endpointu `/api/meal-plans`.                                                                                                          |
| **Testy Bezpieczeństwa**     | Identyfikacja potencjalnych luk w zabezpieczeniach aplikacji.                                                                     | - Weryfikacja, czy użytkownik A nie może modyfikować danych użytkownika B.<br>- Sprawdzenie, czy klucze API nie są eksponowane po stronie klienta.<br>- Testowanie ochrony tras zdefiniowanej w `middleware/index.ts`.                                                                                 |
| **Testy Dostępności (A11y)** | Zapewnienie, że aplikacja jest użyteczna dla osób z niepełnosprawnościami, zgodnie ze standardami WCAG.                           | - Audyt za pomocą narzędzi automatycznych (np. Axe).<br>- Manualna weryfikacja nawigacji za pomocą klawiatury i działania czytników ekranu.                                                                                                                                                            |

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### 4.1. Rejestracja i Logowanie

| ID      | Scenariusz                                                          | Oczekiwany Rezultat                                                                                                               | Priorytet |
| :------ | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- | :-------- |
| AUTH-01 | Rejestracja z poprawnymi i unikalnymi danymi                        | Użytkownik zostaje zarejestrowany, otrzymuje e-mail z potwierdzeniem i zostaje przekierowany na stronę logowania lub onboardingu. | P0        |
| AUTH-02 | Próba rejestracji z zajętym adresem e-mail                          | Wyświetlany jest komunikat o błędzie "Ten adres email jest już zajęty".                                                           | P0        |
| AUTH-03 | Rejestracja z niepoprawnym formatem e-maila lub zbyt krótkim hasłem | Formularz wyświetla błędy walidacji przy odpowiednich polach.                                                                     | P1        |
| AUTH-04 | Logowanie z poprawnymi danymi uwierzytelniającymi                   | Użytkownik zostaje zalogowany i przekierowany na stronę `/dashboard`.                                                             | P0        |
| AUTH-05 | Logowanie z błędnym hasłem lub nieistniejącym e-mailem              | Wyświetlany jest komunikat o błędzie "Nieprawidłowy email lub hasło".                                                             | P0        |
| AUTH-06 | Dostęp do chronionej trasy (`/dashboard`) bez logowania             | Użytkownik jest przekierowany na stronę logowania (`/login`).                                                                     | P0        |
| AUTH-07 | Dostęp do strony logowania (`/login`) po zalogowaniu                | Użytkownik jest automatycznie przekierowany na `/dashboard`.                                                                      | P1        |

### 4.2. Generowanie Planu Żywieniowego

| ID    | Scenariusz                                                                  | Oczekiwany Rezultat                                                                                           | Priorytet |
| :---- | :-------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ | :-------- |
| MP-01 | Generowanie planu po raz pierwszy przez nowego użytkownika (po onboardingu) | Wyświetla się modal ładowania, a następnie na dashboardzie pojawia się plan złożony z 3 posiłków.             | P0        |
| MP-02 | Regeneracja istniejącego planu                                              | Stary plan jest zastępowany nowym, wygenerowanym planem. Event analityczny `plan_regenerated` jest wysyłany.  | P0        |
| MP-03 | Próba generowania planu przez użytkownika bez zdefiniowanych preferencji    | Użytkownik jest przekierowywany na stronę onboardingu (`/onboarding`) lub otrzymuje stosowny komunikat błędu. | P1        |
| MP-04 | Anulowanie generowania planu w trakcie ładowania                            | Modal ładowania znika, a aplikacja wraca do poprzedniego stanu (pusty dashboard lub poprzedni plan).          | P1        |
| MP-05 | Błąd timeout podczas komunikacji z API OpenRouter                           | Wyświetlany jest komunikat o błędzie z możliwością ponowienia próby.                                          | P1        |
| MP-06 | API OpenRouter zwraca niepoprawny format danych (np. błędny JSON)           | Aplikacja przechwytuje błąd i wyświetla komunikat o błędzie z możliwością ponowienia.                         | P1        |
| MP-07 | Wygenerowany plan uwzględnia preferencje użytkownika (np. dieta wegańska)   | Plan nie zawiera produktów mięsnych i nabiału. Składniki są zgodne z wybraną dietą.                           | P1        |

### 4.3. Zarządzanie Preferencjami

| ID      | Scenariusz                                                           | Oczekiwany Rezultat                                                                                | Priorytet |
| :------ | :------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------- | :-------- |
| PREF-01 | Zapisanie poprawnie wypełnionego formularza preferencji (onboarding) | Dane zostają zapisane, a użytkownik jest przekierowany na `/dashboard` w celu wygenerowania planu. | P0        |
| PREF-02 | Edycja i zapisanie zmian w profilu użytkownika                       | Dane w profilu zostają zaktualizowane. Po zapisie użytkownik jest przekierowywany na dashboard.    | P0        |
| PREF-03 | Próba zapisania formularza z brakującymi wymaganymi polami           | Formularz wyświetla błędy walidacji przy odpowiednich polach i nie zostaje wysłany.                | P1        |
| PREF-04 | Przekroczenie limitu alergii (10) lub nielubianych produktów (20)    | Interfejs uniemożliwia dodanie kolejnych pozycji i wyświetla odpowiedni komunikat.                 | P2        |
| PREF-05 | Anulowanie edycji profilu bez dokonania zmian                        | Użytkownik jest przekierowywany z powrotem na dashboard.                                           | P1        |
| PREF-06 | Anulowanie edycji profilu po dokonaniu zmian                         | Wyświetla się modal z prośbą o potwierdzenie, czy na pewno opuścić stronę bez zapisywania zmian.   | P2        |

## 5. Środowisko Testowe

| Element            | Opis                                                                                                                                                                                                                                                                                                                                                      |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Infrastruktura** | - **Środowisko deweloperskie:** Lokalne maszyny deweloperów.<br>- **Środowisko testowe (Staging):** Dedykowana instancja aplikacji wdrożona na platformie hostingowej (np. Vercel, Netlify), połączona z osobnym, dedykowanym projektem Supabase w celu izolacji danych.<br>- **Środowisko produkcyjne:** Środowisko dostępne dla użytkowników końcowych. |
| **Baza Danych**    | Dedykowany projekt Supabase dla środowiska testowego, zawierający dane testowe (konta użytkowników z różnymi preferencjami).                                                                                                                                                                                                                              |
| **Klucze API**     | Dedykowany klucz API OpenRouter dla środowiska testowego z ustawionymi niskimi limitami wydatków.                                                                                                                                                                                                                                                         |
| **Przeglądarki**   | - Google Chrome (najnowsza wersja)<br>- Mozilla Firefox (najnowsza wersja)<br>- Safari (najnowsza wersja)                                                                                                                                                                                                                                                 |
| **Urządzenia**     | - Desktop (rozdzielczość >1280px)<br>- Tablet (rozdzielczość ~768px)<br>- Mobilne (rozdzielczość ~375px)                                                                                                                                                                                                                                                  |

## 6. Narzędzia do Testowania

| Kategoria                            | Narzędzie                                  | Zastosowanie                                                                                                        |
| :----------------------------------- | :----------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| **Testy Jednostkowe i Integracyjne** | **Vitest** + **React Testing Library**     | Testowanie komponentów, hooków i logiki React w środowisku Vite-native, spójnym z Astro.                            |
| **Testy End-to-End**                 | **Playwright**                             | Automatyzacja scenariuszy użytkownika w różnych przeglądarkach, obsługa testów API i generowanie śladów wydajności. |
| **Zarządzanie Testami i Błędami**    | **GitHub Issues** / **Jira**               | Tworzenie, śledzenie i zarządzanie przypadkami testowymi oraz raportowanie i monitorowanie cyklu życia błędów.      |
| **Ciągła Integracja (CI)**           | **GitHub Actions**                         | Automatyczne uruchamianie testów jednostkowych, integracyjnych i E2E przy każdym pushu i pull requeście.            |
| **Testy Dostępności**                | **Axe DevTools** (wtyczka do przeglądarki) | Skanowanie aplikacji w poszukiwaniu naruszeń standardów WCAG.                                                       |
| **Testy API (manualne)**             | **Postman** / **Insomnia**                 | Ręczne testowanie i debugowanie endpointów API.                                                                     |

## 7. Harmonogram Testów

Proces testowania będzie prowadzony równolegle z cyklem deweloperskim w ramach sprintów.

- **W trakcie sprintu:**
  - Deweloperzy piszą testy jednostkowe i integracyjne dla nowo tworzonych funkcjonalności.
  - Inżynier QA przygotowuje scenariusze testowe i rozpoczyna prace nad automatyzacją testów E2E.
- **Pod koniec sprintu (Code Freeze):**
  - Przeprowadzenie testów manualnych i eksploracyjnych na środowisku testowym.
  - Uruchomienie pełnej suity zautomatyzowanych testów regresji.
- **Przed wdrożeniem produkcyjnym:**
  - Testy dymne (Smoke Tests) na środowisku produkcyjnym w celu weryfikacji krytycznych ścieżek.
  - Finalna weryfikacja naprawionych błędów.

## 8. Kryteria Akceptacji Testów

### 8.1. Kryteria Wejścia (Rozpoczęcie Testów)

- Kod źródłowy został wdrożony na środowisku testowym.
- Wszystkie testy jednostkowe i integracyjne przechodzą pomyślnie.
- Dokumentacja dla testowanych funkcjonalności jest dostępna.

### 8.2. Kryteria Wyjścia (Zakończenie Testów)

- **100%** zdefiniowanych scenariuszy testowych P0 zostało wykonanych i zakończyło się sukcesem.
- **95%** wszystkich zdefiniowanych scenariuszy testowych zostało wykonanych i zakończyło się sukcesem.
- Brak otwartych błędów o priorytecie P0 (krytyczny) i P1 (wysoki).
- Wszystkie otwarte błędy o niższych priorytetach są udokumentowane i zaakceptowane przez Product Ownera do naprawy w przyszłych iteracjach.
- Raport z testów został przygotowany i zaakceptowany.

## 9. Role i Odpowiedzialności

| Rola              | Odpowiedzialność                                                                                                                                                                                                                                           |
| :---------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Deweloperzy**   | - Tworzenie testów jednostkowych i integracyjnych.<br>- Naprawa błędów zgłoszonych przez zespół QA.<br>- Wsparcie w analizie i diagnozowaniu złożonych problemów.                                                                                          |
| **Inżynier QA**   | - Projektowanie i utrzymanie planu testów.<br>- Tworzenie i utrzymanie zautomatyzowanych testów E2E.<br>- Wykonywanie testów manualnych i eksploracyjnych.<br>- Raportowanie błędów i weryfikacja poprawek.<br>- Przygotowanie finalnego raportu z testów. |
| **Product Owner** | - Dostarczanie kryteriów akceptacji dla funkcjonalności.<br>- Priorytetyzacja naprawy zgłoszonych błędów.<br>- Ostateczna akceptacja funkcjonalności i zatwierdzenie wdrożenia.                                                                            |

## 10. Procedury Raportowania Błędów

Wszystkie zidentyfikowane błędy będą raportowane w systemie do śledzenia błędów (np. GitHub Issues) i powinny zawierać następujące informacje:

- **Tytuł:** Krótki, zwięzły opis problemu, np. "[Błąd logowania] Aplikacja nie wyświetla błędu przy próbie logowania z pustym hasłem".
- **Środowisko:** Przeglądarka, system operacyjny, rozmiar ekranu, na którym wystąpił błąd.
- **Kroki do odtworzenia:** Numerowana lista kroków, które jednoznacznie prowadzą do wystąpienia błędu.
- **Oczekiwany rezultat:** Co powinno się wydarzyć po wykonaniu kroków.
- **Rzeczywisty rezultat:** Co faktycznie się wydarzyło.
- **Załączniki:** Zrzuty ekranu, nagrania wideo, logi z konsoli przeglądarki.
- **Priorytet/Waga:**
  - **P0 (Krytyczny/Blocker):** Błąd uniemożliwiający korzystanie z kluczowej funkcjonalności.
  - **P1 (Wysoki):** Błąd w istotnej funkcjonalności, który ma duży wpływ na UX.
  - **P2 (Średni):** Błąd w mniej istotnej funkcjonalności lub problem estetyczny.
  - **P3 (Niski):** Drobny błąd, literówka lub sugestia ulepszenia.
