# Dokument wymagań produktu (PRD) - AI Meal Planner MVP

## 1. Przegląd produktu

AI Meal Planner to aplikacja webowa pomagająca w codziennym planowaniu posiłków. Produkt wykorzystuje modele LLM do generowania spersonalizowanych planów posiłków na jeden dzień, uwzględniających cele zdrowotne użytkownika, preferencje żywieniowe, alergie i produkty nielubiane.

Zakres MVP obejmuje:

- System autentykacji użytkowników
- Zarządzanie profilem preferencji użytkownika
- Generowanie planu posiłków przez AI na podstawie profilu
- Prezentację wygenerowanego planu w czytelnym interfejsie
- Podstawowy system feedbacku i metryki akceptacji

Grupa docelowa (persony):

- Zajęta mama rodziny - potrzebuje szybkich rozwiązań na rodzinne posiłki
- Singiel dbający o formę - chce wspierać cele zdrowotne bez tracenia czasu
- Osoba z alergiami pokarmowymi - potrzebuje bezpiecznych propozycji posiłków

## 2. Problem użytkownika

Codzienne planowanie posiłków jest czasochłonne i prowadzi do "paraliżu decyzyjnego" - sytuacji, w której nadmiar opcji i konieczność codziennego podejmowania decyzji prowadzi do rezygnacji ze zdrowego odżywiania lub regularnego gotowania.

Główne bóle użytkowników:

- Brak czasu na planowanie posiłków zgodnych z celami zdrowotnymi
- Trudność w wymyślaniu różnorodnych posiłków
- Konieczność uwzględniania wielu zmiennych (alergie, preferencje, cele)
- Powtarzalność i nuda w codziennym menu
- Frustracja związana z codziennym pytaniem "co na obiad?"

Obecne rozwiązania:

- Ręczne planowanie - czasochłonne i męczące
- Gotowe plany dietetyczne - nieelastyczne i nie uwzględniają preferencji
- Aplikacje z przepisami - wymagają ręcznego wyboru i planowania
- Dietetycy - kosztowne i niedostępne dla wszystkich

AI Meal Planner rozwiązuje ten problem poprzez:

- Automatyczne generowanie spersonalizowanych planów w kilka sekund
- Uwzględnianie wszystkich preferencji i ograniczeń użytkownika
- Eliminację konieczności codziennego podejmowania decyzji
- Zapewnienie różnorodności przy zachowaniu zgodności z celami

## 3. Wymagania funkcjonalne

### 3.1. Autentykacja użytkowników

Obowiązkowa rejestracja i logowanie.

Funkcjonalności:

- Rejestracja nowego użytkownika (email + hasło)
- Logowanie istniejącego użytkownika
- Wylogowanie
- Resetowanie hasła (funkcjonalność Supabase)
- Walidacja formularzy (email, siła hasła)
- Komunikaty błędów i sukcesów

### 3.2. Onboarding i profil preferencji

Progresywny onboarding składający się z:

1. Rejestracja (email + hasło)
2. Automatyczne przekierowanie do formularza preferencji
3. Krótki formularz (maksymalnie 5 pytań)
4. Możliwość natychmiastowego wygenerowania pierwszego planu

Pola formularza preferencji:

- Cel zdrowotny (wybór z listy - WYMAGANE)
  - Opcje: Schudnąć, Przybrać na wadze, Utrzymać wagę, Zdrowo jeść, Zwiększyć energię
- Typ diety (wybór z listy - WYMAGANE)
  - Opcje: Standard, Wegetariańska, Wegańska, Bezglutenowa
- Poziom aktywności (skala 1-5 - WYMAGANE)
  - 1 = Siedzący tryb życia (brak aktywności)
  - 2 = Lekka aktywność (spacery, lekkie prace)
  - 3 = Umiarkowana aktywność (trening 3x w tygodniu)
  - 4 = Wysoka aktywność (trening 5x w tygodniu)
  - 5 = Bardzo wysoka aktywność (sport intensywny codziennie)
- Alergie/nietolerancje (wielokrotny wybór)
  - Maksymalnie 10 pozycji
  - Lista z checkbox: Gluten, Laktoza, Orzechy, Jajka, Ryby, Skorupiaki, Soja, inne
- Produkty nielubiane (lista z autouzupełnianiem)
  - Maksymalnie 20 pozycji
  - Baza produktów: statyczna lista popularnych produktów w JSON

Wymagania walidacji:

- Wszystkie pola wymagane muszą być wypełnione
- Limit 10 alergii
- Limit 20 produktów nielubanych
- Walidacja po stronie frontendu i backendu
- Czytelne komunikaty błędów w języku polskim

### 3.3. Edycja profilu

Dedykowana strona "Mój Profil" dostępna z głównego menu nawigacyjnego.

Funkcjonalności:

- Wyświetlanie obecnych preferencji użytkownika
- Edycja wszystkich pól z formularza onboardingu
- Zapisywanie zmian
- Komunikat potwierdzający zapisanie
- Możliwość anulowania edycji

### 3.4. Generowanie planu posiłków

Główna funkcjonalność aplikacji - generowanie spersonalizowanego planu posiłków na jeden dzień.

Proces generowania:

1. Użytkownik klika przycisk "Wygeneruj plan"
2. System wyświetla loader "Generuję plan..."
3. Backend wysyła request do LLM z profilem użytkownika
4. AI generuje plan trzech posiłków (śniadanie, obiad, kolacja)
5. Plan zapisuje się w bazie danych (nadpisując poprzedni)
6. Plan wyświetla się użytkownikowi

Format przepisu (dla każdego posiłku):

- Nazwa posiłku
- Lista składników z ilościami w jednostkach europejskich:
  - Gramy (g) dla mięsa, ryb
  - Sztuki (szt.) dla warzyw, owoców, jajek
  - Łyżki/łyżeczki (łyżka/łyżeczka) dla sypkich
  - Szklanki/ml dla płynnych
- Kroki przygotowania (numerowana lista)
- Szacowany czas przygotowania (w minutach)

Wymagania techniczne:

- Timeout 30 sekund
- Retry logic z exponential backoff (3 próby: 1s, 2s, 4s)
- Obsługa błędów API:
  - Komunikat "Nie udało się wygenerować planu. Spróbuj ponownie."
  - Przycisk "Spróbuj ponownie"

Prompt engineering dla AI:

- Uwzględnienie wszystkich wykluczeń (alergie, nielubiane produkty)
- Dopasowanie do typu diety
- Uwzględnienie celu zdrowotnego i poziomu aktywności
- Język polski
- Europejskie jednostki miar
- Realistyczne ilości składników
- Wykonalność przepisów w domowej kuchni

### 3.5. Wyświetlanie planu posiłków

Prezentacja wygenerowanego planu w czytelnym interfejsie.

Elementy interfejsu:

- Tytuł strony: "Twój plan posiłków na dzisiaj"
- Trzy sekcje: Śniadanie, Obiad, Kolacja
- Każda sekcja zawiera:
  - Nazwę posiłku (nagłówek)
  - Szacowany czas przygotowania
  - Listę składników z ilościami
  - Kroki przygotowania
- Przycisk "Wygeneruj nowy plan" (regeneracja całego planu)
- Mechanizm feedbacku: thumbs up / thumbs down dla całego planu

Wymagania UX:

- Czytelna typografia
- Responsywność
- Szybkie ładowanie
- Brak zdjęć posiłków w MVP

### 3.6. Regeneracja planu

Możliwość wygenerowania nowego planu, jeśli użytkownik nie jest zadowolony z obecnego.

Funkcjonalności:

- Przycisk "Wygeneruj nowy plan" widoczny na stronie z planem
- Proces identyczny jak przy pierwszym generowaniu
- Nadpisanie poprzedniego planu w bazie danych
- Logowanie akcji regeneracji do analytics

Wymagania:

- Brak limitu regeneracji w MVP
- Każda regeneracja to nowy request do API (koszt)
- Tracking liczby regeneracji na użytkownika

### 3.7. System feedbacku

Prosty mechanizm oceny planu posiłków.

Funkcjonalności:

- Ikony thumbs up / thumbs down pod planem
- Możliwość zmiany oceny
- Zapisanie feedbacku w bazie
- Brak wymogu feedbacku (opcjonalne)

## 4. Granice produktu

### 4.1. Funkcjonalności wyłączone z MVP

Następujące funkcjonalności świadomie NIE są częścią MVP:

- Automatyczne generowanie listy zakupów
  - Uzasadnienie: Zwiększa złożoność, wymaga dodatkowej logiki agregacji
  - Rozwój: Post-MVP, na podstawie feedbacku użytkowników

- Szczegółowe liczenie kalorii i makroskładników
  - Uzasadnienie: Wymaga integracji z bazami wartości odżywczych
  - Rozwój: Kolejna iteracja, jeśli okaże się priorytetem

- Przechowywanie biblioteki przepisów
  - Uzasadnienie: Każdy plan jest generowany "w locie", brak konieczności CMS
  - Rozwój: Możliwe w przyszłości jako "ulubione przepisy"

- Śledzenie postępów (waga, pomiary)
  - Uzasadnienie: Wykracza poza core problem (planowanie posiłków)
  - Rozwój: Osobny moduł w przyszłości

- Współdzielenie planów między użytkownikami
  - Uzasadnienie: Social features nie są kluczowe dla MVP
  - Rozwój: Post-MVP, jeśli pojawi się demand

- Importowanie przepisów lub skanowanie produktów
  - Uzasadnienie: Zbyt złożone dla MVP, wymaga OCR/integracji
  - Rozwój: Daleka przyszłość

- Aplikacje mobilne (iOS, Android)
  - Uzasadnienie: Projekt wyłącznie webowy, responsive design wystarczający
  - Rozwój: Nie planowane w projekcie edukacyjnym

- Historia wygenerowanych planów
  - Uzasadnienie: Uproszczenie bazy danych, tylko ostatni plan
  - Rozwój: Łatwe do dodania w przyszłości (tylko UI + query)

- Regeneracja pojedynczych posiłków
  - Uzasadnienie: Dodatkowa złożoność logiki i UI
  - Rozwój: Architektura przygotowana, możliwe w post-MVP

- Wielojęzyczność
  - Uzasadnienie: Tylko polski w MVP
  - Rozwój: Architektura przygotowana na i18n

### 4.2. Ograniczenia techniczne

- Timeout API: 30 sekund
- Maksymalne limity walidacji: 20 produktów nielubanych, 10 alergii
- Tylko jeden aktywny plan na użytkownika (nadpisywanie)
- Brak zdjęć posiłków
- Tylko przeglądarka webowa (brak Progressive Web App w MVP)
- Brak offline mode

### 4.3. Założenia projektowe

- Użytkownicy mają dostęp do internetu
- Użytkownicy korzystają z nowoczesnych przeglądarek (Chrome, Firefox, Safari, Edge - ostatnie 2 wersje)
- Użytkownicy rozumieją język polski
- Użytkownicy mają podstawowe umiejętności korzystania z aplikacji webowych
- Projekt jest edukacyjny - brak realnych użytkowników produkcyjnych
- Koszty API są akceptowalne dla celów nauki

## 5. Historyjki użytkowników

### US-001: Rejestracja nowego użytkownika

Tytuł: Rejestracja w systemie

Opis:
Jako nowy użytkownik
Chcę móc założyć konto w aplikacji
Aby móc korzystać z personalizowanych planów posiłków

Kryteria akceptacji:

- Użytkownik może otworzyć stronę rejestracji
- Formularz zawiera pola: email, hasło, potwierdzenie hasła
- Email jest walidowany (format email)
- Hasło musi mieć minimum 8 znaków
- Potwierdzenie hasła musi być identyczne z hasłem
- System wyświetla komunikat błędu przy niepoprawnych danych
- Po sukcesie użytkownik jest automatycznie zalogowany
- Po sukcesie użytkownik jest przekierowany do formularza onboardingu

### US-002: Logowanie użytkownika

Tytuł: Logowanie do aplikacji

Opis:
Jako zarejestrowany użytkownik
Chcę móc zalogować się do aplikacji
Aby uzyskać dostęp do mojego profilu i planów posiłków

Kryteria akceptacji:

- Użytkownik może otworzyć stronę logowania
- Formularz zawiera pola: email, hasło
- System waliduje poprawność danych logowania
- Przy błędnych danych wyświetla się komunikat "Nieprawidłowy email lub hasło"
- Po sukcesie użytkownik jest przekierowany do dashboardu
- Sesja użytkownika jest aktywna
- Link "Nie pamiętam hasła" prowadzi do funkcji resetowania

### US-003: Wylogowanie użytkownika

Tytuł: Wylogowanie z aplikacji

Opis:
Jako zalogowany użytkownik
Chcę móc się wylogować
Aby bezpiecznie zakończyć sesję

Kryteria akceptacji:

- Przycisk "Wyloguj" jest widoczny w menu nawigacyjnym
- Po kliknięciu sesja użytkownika jest kończona
- Użytkownik jest przekierowany na stronę logowania
- Próba dostępu do chronionych stron wymaga ponownego logowania

### US-004: Resetowanie hasła

Tytuł: Resetowanie zapomnianego hasła

Opis:
Jako użytkownik, który zapomniał hasła
Chcę móc je zresetować
Aby odzyskać dostęp do konta

Kryteria akceptacji:

- Link "Nie pamiętam hasła" jest widoczny na stronie logowania
- Formularz resetowania wymaga podania emaila
- System wysyła link resetujący na podany email (funkcjonalność Supabase)
- Komunikat potwierdzający wysłanie emaila jest wyświetlany
- Link w emailu prowadzi do formularza ustawienia nowego hasła
- Po ustawieniu nowego hasła użytkownik może się zalogować

### US-005: Wypełnienie profilu preferencji (onboarding)

Tytuł: Pierwsze wypełnienie profilu preferencji

Opis:
Jako nowo zarejestrowany użytkownik
Chcę wypełnić swoje preferencje żywieniowe
Aby otrzymać spersonalizowane plany posiłków

Kryteria akceptacji:

- Po rejestracji użytkownik jest automatycznie przekierowany do formularza
- Formularz zawiera wszystkie wymagane pola (cel, dieta, aktywność, alergie, nielubiane)
- Pola wymagane są oznaczone wizualnie (\*)
- Cel zdrowotny: dropdown z 5 opcjami
- Typ diety: dropdown z 4 opcjami
- Poziom aktywności: dropdown (1-5) z opisami
- Alergie: checkboxy z najpopularniejszymi + pole "inne"
- Produkty nielubiane: input z autouzupełnianiem, max 20 pozycji
- Przy próbie zapisu bez wypełnienia wymaganych pól - komunikat błędu
- Przy przekroczeniu limitu (20/10) - komunikat błędu
- Po sukcesie profil jest zapisany w bazie
- Użytkownik jest przekierowany do strony generowania pierwszego planu

### US-006: Wyświetlenie strony "Mój Profil"

Tytuł: Dostęp do strony profilu

Opis:
Jako zalogowany użytkownik
Chcę móc zobaczyć swoje obecne preferencje
Aby wiedzieć, co jest zapisane w moim profilu

Kryteria akceptacji:

- Link "Mój Profil" jest widoczny w menu nawigacyjnym
- Strona wyświetla wszystkie zapisane preferencje
- Formularz jest pre-wypełniony obecnymi wartościami
- Wszystkie pola są edytowalne
- Przycisk "Zapisz zmiany" jest widoczny
- Przycisk "Anuluj" cofa zmiany i wraca do poprzedniej strony

### US-007: Edycja profilu preferencji

Tytuł: Aktualizacja preferencji użytkownika

Opis:
Jako użytkownik z istniejącym profilem
Chcę móc edytować swoje preferencje
Aby dostosować je do zmieniających się potrzeb

Kryteria akceptacji:

- Użytkownik może zmienić dowolne pole w formularzu profilu
- Walidacja działa identycznie jak przy tworzeniu profilu
- Po kliknięciu "Zapisz zmiany" zmiany są zapisane w bazie
- Komunikat "Profil zaktualizowany" jest wyświetlany
- Kolejne generowanie planu uwzględnia nowe preferencje
- Przycisk "Anuluj" cofa niezapisane zmiany

### US-008: Generowanie pierwszego planu posiłków

Tytuł: Wygenerowanie pierwszego planu po onboardingu

Opis:
Jako użytkownik, który właśnie wypełnił profil
Chcę wygenerować mój pierwszy plan posiłków
Aby zobaczyć, jak działa aplikacja i otrzymać propozycje

Kryteria akceptacji:

- Po wypełnieniu profilu użytkownik widzi stronę z przyciskiem "Wygeneruj mój pierwszy plan"
- Krótka instrukcja wyjaśnia, czego się spodziewać
- Po kliknięciu przycisku wyświetla się loader "Generuję plan..."
- System wywołuje API LLM z profilem użytkownika
- W przypadku sukcesu plan jest wyświetlany (3 posiłki)
- Plan jest zapisany w bazie
- Użytkownik widzi wszystkie trzy posiłki
- Całość od rejestracji do wyświetlenia planu trwa <5 minut

### US-009: Generowanie kolejnego planu

Tytuł: Generowanie nowego planu przez zalogowanego użytkownika

Opis:
Jako użytkownik z istniejącym profilem
Chcę wygenerować nowy plan posiłków
Aby otrzymać świeże propozycje na dzisiaj

Kryteria akceptacji:

- Przycisk "Wygeneruj plan" jest widoczny na dashboardzie
- Po kliknięciu proces identyczny jak przy pierwszym planie
- Loader "Generuję plan..." jest wyświetlany
- Nowy plan nadpisuje poprzedni w bazie danych

### US-010: Wyświetlanie wygenerowanego planu

Tytuł: Prezentacja planu posiłków użytkownikowi

Opis:
Jako użytkownik, który wygenerował plan
Chcę zobaczyć szczegóły wszystkich trzech posiłków
Aby móc je przygotować

Kryteria akceptacji:

- Strona ma tytuł "Twój plan posiłków na dzisiaj"
- Trzy sekcje: Śniadanie, Obiad, Kolacja są wyraźnie oddzielone
- Każdy posiłek zawiera:
  - Nazwę posiłku (nagłówek)
  - Szacowany czas przygotowania
  - Listę składników z konkretnymi ilościami
  - Kroki przygotowania (numerowana lista)
- Jednostki są europejskie (g, szt., łyżka, szklanka)
- Przepisy są w języku polskim
- Przycisk "Wygeneruj nowy plan" jest widoczny
- Mechanizm feedbacku (thumbs up/down) jest widoczny
- Strona jest responsywna (mobile + desktop)

### US-011: Regeneracja planu

Tytuł: Wygenerowanie nowego planu zamiast obecnego

Opis:
Jako użytkownik niezadowolony z wygenerowanego planu
Chcę wygenerować nowy plan
Aby otrzymać inne propozycje posiłków

Kryteria akceptacji:

- Przycisk "Wygeneruj nowy plan" jest widoczny na stronie z planem
- Po kliknięciu proces generowania rozpoczyna się ponownie
- Loader jest wyświetlany
- Nowy plan nadpisuje poprzedni
- Brak limitu regeneracji w MVP
- Każda regeneracja to osobne wywołanie API (koszt)

### US-012: Ocena planu (feedback)

Tytuł: Wystawienie oceny wygenerowanemu planowi

Opis:
Jako użytkownik, który przejrzał plan
Chcę móc wyrazić swoją opinię o nim
Aby zespół mógł mierzyć satysfakcję użytkowników

Kryteria akceptacji:

- Ikony thumbs up i thumbs down są widoczne pod planem
- Po kliknięciu ikona zmienia kolor (zaznaczenie)
- Możliwość zmiany oceny (z up na down i odwrotnie)
- Feedback jest zapisywany w bazie
- Wizualna informacja "Dziękujemy za opinię" po zapisaniu
- Feedback jest opcjonalny (nie wymuszony)

### US-013: Obsługa błędu API podczas generowania

Tytuł: Informowanie użytkownika o błędzie generowania

Opis:
Jako użytkownik, którego plan nie mógł być wygenerowany
Chcę zobaczyć komunikat błędu i móc spróbować ponownie
Aby nie pozostać z pustą stroną

Kryteria akceptacji:

- Jeśli API zwraca błąd lub timeout (30s), loader znika
- Komunikat "Nie udało się wygenerować planu. Spróbuj ponownie." jest wyświetlany
- Przycisk "Spróbuj ponownie" pozwala powtórzyć próbę
- System automatycznie próbuje 3 razy (retry logic: 1s, 2s, 4s)
- Dopiero po 3 nieudanych próbach pokazuje błąd użytkownikowi
- Błąd jest logowany do konsoli

### US-014: Timeout przy generowaniu planu

Tytuł: Obsługa zbyt długiego oczekiwania na API

Opis:
Jako użytkownik czekający na plan
Chcę być poinformowany, jeśli generowanie trwa zbyt długo
Aby wiedzieć, że coś poszło nie tak

Kryteria akceptacji:

- Maksymalny czas oczekiwania to 30 sekund
- Po 30 sekundach loader znika
- Komunikat błędu jest wyświetlany
- Możliwość spróbowania ponownie
- Timeout jest logowany jako błąd API

### US-015: Tracking czasu na stronie (akceptacja planu)

Tytuł: Automatyczne określenie akceptacji planu

Opis:
Jako system
Chcę śledzić czas spędzony przez użytkownika na stronie z planem
Aby automatycznie określić, czy plan został zaakceptowany

Kryteria akceptacji:

- Timestamp wyświetlenia planu jest zapisywany (JavaScript)
- Czas spędzony na stronie jest śledzony
- Jeśli użytkownik NIE kliknie "Wygeneruj nowy plan" w ciągu 2 minut
  I spędzi na stronie minimum 30 sekund
  TO event 'plan_accepted' jest logowany
- Tracking działa w tle bez interakcji użytkownika

### US-016: Dashboard zalogowanego użytkownika

Tytuł: Strona główna dla zalogowanego użytkownika

Opis:
Jako zalogowany użytkownik
Chcę zobaczyć mój ostatni plan lub móc wygenerować nowy
Aby szybko uzyskać dostęp do funkcjonalności

Kryteria akceptacji:

- Po zalogowaniu użytkownik widzi dashboard
- Jeśli istnieje ostatni plan - jest wyświetlany
- Jeśli nie ma planu - widoczny jest przycisk "Wygeneruj plan"
- Menu nawigacyjne zawiera: Dashboard, Mój Profil, Wyloguj
- Wiadomość powitalna: "Cześć, [imię/email]!" (opcjonalnie)

### US-017: Walidacja limitu produktów nielubanych

Tytuł: Egzekwowanie limitu 20 produktów

Opis:
Jako system
Chcę zapobiec dodaniu więcej niż 20 produktów nielubanych
Aby zachować użyteczność profilu i wydajność AI

Kryteria akceptacji:

- Po dodaniu 20. produktu pole input jest dezaktywowane
- Komunikat "Możesz dodać maksymalnie 20 produktów" jest wyświetlany
- Aby dodać kolejny, użytkownik musi usunąć istniejący
- Walidacja działa zarówno na frontendzie jak i backendzie
- Próba obejścia limitu przez API jest blokowana

### US-018: Walidacja limitu alergii

Tytuł: Egzekwowanie limitu 10 alergii

Opis:
Jako system
Chcę zapobiec wyboru więcej niż 10 alergii
Aby profil był realistyczny i możliwy do obsłużenia przez AI

Kryteria akceptacji:

- Po zaznaczeniu 10. alergii pozostałe checkboxy są dezaktywowane
- Komunikat "Możesz wybrać maksymalnie 10 alergii" jest wyświetlany
- Aby wybrać kolejną, użytkownik musi odznaczyć istniejącą
- Walidacja działa zarówno na frontendzie jak i backendzie

### US-019: Autouzupełnianie produktów nielubanych

Tytuł: Sugestie produktów podczas wpisywania

Opis:
Jako użytkownik wypełniający profil
Chcę otrzymywać sugestie produktów podczas wpisywania
Aby łatwiej i szybciej wypełnić listę

Kryteria akceptacji:

- Po wpisaniu minimum 2 znaków pojawiają się sugestie
- Sugestie pochodzą ze statycznej listy popularnych produktów (JSON)
- Lista zawiera minimum 100 popularnych produktów polskiej kuchni
- Możliwość wyboru z listy lub wpisania własnego produktu
- Wpisane produkty dodają się jako "tagi" pod inputem
- Każdy tag ma ikonę X do usunięcia

### US-020: Responsywność aplikacji

Tytuł: Działanie aplikacji na urządzeniach mobilnych

Opis:
Jako użytkownik korzystający z telefonu
Chcę móc wygodnie używać aplikacji na małym ekranie
Aby planować posiłki w dowolnym miejscu

Kryteria akceptacji:

- Wszystkie strony są responsywne (mobile-first design)
- Formularze są czytelne i łatwe w obsłudze na telefonach
- Menu nawigacyjne zmienia się w hamburger menu na mobile
- Plan posiłków jest czytelny na małych ekranach (pojedyncza kolumna)
- Przyciski są wystarczająco duże do kliknięcia palcem
- Testowane na rzeczywistych urządzeniach mobilnych

### US-021: Zabezpieczenie przed nieautoryzowanym dostępem

Tytuł: Ochrona stron wymagających logowania

Opis:
Jako system
Chcę zapobiegać dostępowi niezalogowanych użytkowników do chronionych stron
Aby dane użytkowników były bezpieczne

Kryteria akceptacji:

- Strony wymagające logowania: Dashboard, Mój Profil, Generowanie planu
- Próba dostępu bez logowania przekierowuje na stronę logowania
- Po zalogowaniu użytkownik jest przekierowany na pierwotnie żądaną stronę
- Sesja wygasa po określonym czasie
- Middleware sprawdza autentykację dla chronionych route'ów

### US-022: Logowanie eventów do analytics

Tytuł: Zbieranie danych o aktywności użytkowników

Opis:
Jako system
Chcę zapisywać kluczowe akcje użytkowników
Aby móc mierzyć metryki sukcesu

Kryteria akceptacji:

- Każda kluczowa akcja jest zapisywana w tabeli analytics_events
- Zapisywane eventy: user_registered, profile_created, profile_updated, plan_generated, plan_regenerated, plan_accepted, feedback_given, api_error
- Każdy event zawiera: user_id, action_type, timestamp, metadata (JSON)
- Metadata zawiera kontekst specyficzny dla akcji (np. czas generowania)
- System nie blokuje akcji użytkownika, jeśli logowanie się nie powiedzie
- Logi są dostępne do analizy w bazie danych

### US-023: Prompt dla AI uwzględniający wszystkie preferencje

Tytuł: Generowanie planu zgodnego z profilem użytkownika

Opis:
Jako użytkownik
Chcę, aby wygenerowany plan uwzględniał wszystkie moje preferencje
Aby otrzymać bezpieczne i odpowiednie dla mnie posiłki

Kryteria akceptacji:

- AI otrzymuje kompletny profil użytkownika w prompcie
- Plan NIE zawiera produktów z listy alergii (0% błędów krytycznych)
- Plan NIE zawiera produktów z listy nielubanych (target: 90% zgodność)
- Plan jest zgodny z wybranym typem diety (100%)
- Plan uwzględnia cel zdrowotny (np. niskokaloryczny dla "schudnąć")
- Plan jest dostosowany do poziomu aktywności (większe/mniejsze porcje)
- Składniki są realistyczne i dostępne w polskich sklepach
- Przepisy są wykonalne w domowej kuchni
- Język jest polski, jednostki europejskie

### US-024: Wyświetlanie czasu oczekiwania na plan

Tytuł: Informowanie użytkownika o postępie generowania

Opis:
Jako użytkownik czekający na plan
Chcę wiedzieć, że system pracuje
Aby nie myśleć, że aplikacja się zawiesiła

Kryteria akceptacji:

- Natychmiast po kliknięciu "Wygeneruj plan" wyświetla się loader
- Loader zawiera tekst "Generuję plan..."
- Animacja loadera jest płynna (spinning icon)
- Loader zakrywa poprzednią zawartość strony
- Loader znika po otrzymaniu planu lub błędu
- Maksymalny czas wyświetlania loadera: 30 sekund (timeout)

### US-025: Persistent sesja użytkownika

Tytuł: Utrzymanie sesji po odświeżeniu strony

Opis:
Jako zalogowany użytkownik
Chcę pozostać zalogowany po odświeżeniu strony
Aby nie musieć logować się przy każdej wizycie

Kryteria akceptacji:

- Sesja Supabase jest przechowywana (cookies/localStorage)
- Po odświeżeniu strony użytkownik pozostaje zalogowany
- Sesja wygasa po określonym czasie (konfiguracja Supabase)
- Po wygaśnięciu sesji użytkownik jest przekierowany na logowanie
- Użytkownik może ręcznie się wylogować w każdej chwili

## 6. Metryki sukcesu

### 6.1. Kryterium sukcesu 1: Poprawność wykluczeń (90%)

Definicja:
Wygenerowane plany w 90% przypadków poprawnie uwzględniają zdefiniowane przez użytkownika wykluczenia (produkty nielubiane, alergie).

Sposób pomiaru:

- Formuła: (liczba planów bez błędnych składników / liczba wszystkich wygenerowanych planów) × 100%
- Źródło danych:
  - Automatyczny: Analiza feedbacku użytkowników (thumbs down z powodem)
  - Manualny: Ręczne testy próbne 50 planów
  - Opcjonalnie: Zgłoszenia błędów przez użytkowników

Target:

- MVP: 90% zgodność z wykluczeniami
- Krytyczne: 100% zgodność z alergiami (bezpieczeństwo)
- Produkty nielubiane: 90% (akceptowalne pojedyncze błędy)

### 6.2. Kryterium sukcesu 2: Akceptacja planów (70%)

Definicja:
Użytkownik akceptuje (nie regeneruje) wygenerowany plan posiłków w 70% przypadków.

Sposób pomiaru:

- Formuła: (liczba zaakceptowanych planów / liczba wszystkich wygenerowanych planów) × 100%
- Definicja akceptacji:
  - Brak regeneracji w ciągu 2 minut od wyświetlenia planu
    I
  - Pozostanie na stronie minimum 30 sekund
- Źródło danych:
  - Automatyczny tracking w JavaScript
  - Porównanie timestampów w analytics_events:
    - 'plan_generated' vs 'plan_regenerated'
    - Czas między eventami
  - Event 'plan_accepted' logowany automatycznie

Dashboard metryki:

- Liczba wygenerowanych planów (total)
- Liczba zaakceptowanych planów
- Wskaźnik akceptacji (%)
- Średnia liczba regeneracji na użytkownika
- Trend w czasie

Target:

- MVP: 70% akceptacji
- Benchmark: Liczba regeneracji <2 na użytkownika

### 6.3. Definicja sukcesu MVP

MVP uznajemy za udane, jeśli po 4 tygodniach testowania:

- Kryterium 1 (wykluczenia): ≥90% ✓
- Kryterium 2 (akceptacja): ≥70% ✓
- Brak krytycznych bugów blokujących użytkowanie
- Pozytywny feedback jakościowy od testerów
