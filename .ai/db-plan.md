# Schemat Bazy Danych - AI Meal Planner MVP

## 1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

### users

This table is managed by Supabase Auth.

| Kolumna      | Typ  | Ograniczenia | Opis                                     |
| ------------ | ---- | ------------ | ---------------------------------------- |
| id           | uuid | PRIMARY KEY  | Identyfikator użytkownika (z auth.users) |
| display_name | text |              | Opcjonalna nazwa wyświetlana (np. imię)  |

### user_preferences

Preferencje żywieniowe użytkownika (relacja 1:1 z users).

| Kolumna           | Typ              | Ograniczenia                                          | Opis                                                                                          |
| ----------------- | ---------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| user_id           | uuid             | PRIMARY KEY, FOREIGN KEY (users.id) ON DELETE CASCADE | Identyfikator użytkownika                                                                     |
| health_goal       | health_goal_enum | NOT NULL                                              | Cel zdrowotny (enum: LOSE_WEIGHT, GAIN_WEIGHT, MAINTAIN_WEIGHT, HEALTHY_EATING, BOOST_ENERGY) |
| diet_type         | diet_type_enum   | NOT NULL                                              | Typ diety (enum: STANDARD, VEGETARIAN, VEGAN, GLUTEN_FREE)                                    |
| activity_level    | integer          | NOT NULL, CHECK (activity_level BETWEEN 1 AND 5)      | Poziom aktywności (1-5)                                                                       |
| allergies         | text[]           | CHECK (array_length(allergies, 1) <= 10)              | Lista alergii (max 10 pozycji)                                                                |
| disliked_products | text[]           | CHECK (array_length(disliked_products, 1) <= 20)      | Lista nielubianych produktów (max 20 pozycji)                                                 |

### meal_plans

Plany posiłków (relacja 1:1 z users, nadpisywane).

| Kolumna      | Typ         | Ograniczenia                                                                                                                                                                                      | Opis                                                             |
| ------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| id           | uuid        | PRIMARY KEY DEFAULT gen_random_uuid()                                                                                                                                                             | Identyfikator planu                                              |
| user_id      | uuid        | FOREIGN KEY (users.id) ON DELETE CASCADE, UNIQUE                                                                                                                                                  | Identyfikator użytkownika (unikalny - jeden plan na użytkownika) |
| meals        | jsonb       | NOT NULL, CHECK (jsonb_path_exists(meals, '$.[*].name') AND jsonb_path_exists(meals, '$.[*].ingredients') AND jsonb_path_exists(meals, '$.[*].steps') AND jsonb_path_exists(meals, '$.[*].time')) | Struktura posiłków (śniadanie, obiad, kolacja) jako JSONB array  |
| generated_at | timestamptz | DEFAULT now()                                                                                                                                                                                     | Czas wygenerowania planu                                         |
| status       | status_enum | DEFAULT 'pending'                                                                                                                                                                                 | Status generowania (enum: pending, generated, error)             |
| created_at   | timestamptz | DEFAULT now()                                                                                                                                                                                     | Czas utworzenia rekordu (dla przyszłości)                        |

### feedback

Oceny planów posiłków (relacja 1:M z meal_plans).

| Kolumna      | Typ         | Ograniczenia                                  | Opis                                  |
| ------------ | ----------- | --------------------------------------------- | ------------------------------------- |
| id           | uuid        | PRIMARY KEY DEFAULT gen_random_uuid()         | Identyfikator feedbacku               |
| meal_plan_id | uuid        | FOREIGN KEY (meal_plans.id) ON DELETE CASCADE | Identyfikator planu posiłków          |
| rating       | rating_enum | NOT NULL                                      | Ocena (enum: THUMBS_UP, THUMBS_DOWN)  |
| comment      | text        | CHECK (length(comment) <= 500)                | Opcjonalny komentarz (max 500 znaków) |
| created_at   | timestamptz | DEFAULT now()                                 | Czas utworzenia feedbacku             |

### analytics_events

Zdarzenia analityczne dla metryk (relacja 1:M z users).

| Kolumna     | Typ              | Ograniczenia                             | Opis                                                                                                                                            |
| ----------- | ---------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| id          | uuid             | PRIMARY KEY DEFAULT gen_random_uuid()    | Identyfikator zdarzenia                                                                                                                         |
| user_id     | uuid             | FOREIGN KEY (users.id) ON DELETE CASCADE | Identyfikator użytkownika                                                                                                                       |
| action_type | action_type_enum | NOT NULL                                 | Typ akcji (enum: user_registered, profile_created, profile_updated, plan_generated, plan_regenerated, plan_accepted, feedback_given, api_error) |
| timestamp   | timestamptz      | NOT NULL                                 | Czas zdarzenia                                                                                                                                  |
| metadata    | jsonb            |                                          | Dodatkowe dane kontekstowe jako JSONB                                                                                                           |
| created_at  | timestamptz      | DEFAULT now()                            | Czas utworzenia rekordu (dla przyszłości)                                                                                                       |

### Enums

```sql
CREATE TYPE health_goal_enum AS ENUM ('LOSE_WEIGHT', 'GAIN_WEIGHT', 'MAINTAIN_WEIGHT', 'HEALTHY_EATING', 'BOOST_ENERGY');
CREATE TYPE diet_type_enum AS ENUM ('STANDARD', 'VEGETARIAN', 'VEGAN', 'GLUTEN_FREE');
CREATE TYPE status_enum AS ENUM ('pending', 'generated', 'error');
CREATE TYPE rating_enum AS ENUM ('THUMBS_UP', 'THUMBS_DOWN');
CREATE TYPE action_type_enum AS ENUM ('user_registered', 'profile_created', 'profile_updated', 'plan_generated', 'plan_regenerated', 'plan_accepted', 'feedback_given', 'api_error');
```

## 2. Relacje między tabelami

- **users** ↔ **user_preferences**: Relacja 1:1 (user_id jako FK i PK w user_preferences)
- **users** ↔ **meal_plans**: Relacja 1:1 (user_id jako FK, UNIQUE, z triggerem do nadpisywania istniejącego planu)
- **meal_plans** ↔ **feedback**: Relacja 1:M (meal_plan_id jako FK w feedback, ON DELETE CASCADE)
- **users** ↔ **analytics_events**: Relacja 1:M (user_id jako FK w analytics_events)

Wszystkie FK mają ON DELETE CASCADE dla integralności danych.

## 3. Indeksy

- **user_preferences**:
  - PRIMARY KEY (user_id)
- **meal_plans**:
  - UNIQUE (user_id)
  - INDEX (user_id, generated_at DESC)
- **feedback**:
  - INDEX (meal_plan_id)
- **analytics_events**:
  - INDEX (user_id, timestamp DESC)
  - GIN INDEX na metadata (jsonb_ops)

## 4. Zasady PostgreSQL (RLS - Row Level Security)

RLS włączone na tabelach zawierających wrażliwe dane użytkownika:

- **user_preferences**:

  ```sql
  ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can only access their own preferences" ON user_preferences
    USING (auth.uid() = user_id);
  ```

- **meal_plans**:

  ```sql
  ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can only access their own meal plans" ON meal_plans
    USING (auth.uid() = user_id);
  ```

- **feedback**:

  ```sql
  ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can only access feedback for their meal plans" ON feedback
    USING (auth.uid() = (SELECT user_id FROM meal_plans WHERE id = meal_plan_id));
  ```

- **analytics_events**: Brak RLS (dane analityczne mogą być dostępne dla admina, ale z polityką podobną dla prywatności)

## 5. Dodatkowe uwagi i wyjaśnienia

- **Nadpisywanie planu**: BEFORE INSERT trigger na meal_plans usuwa istniejący rekord dla tego samego user_id, zapewniając tylko jeden plan na użytkownika zgodnie z PRD.
- **Struktura JSONB meals**: Przykład struktury: [{"name": "Śniadanie", "ingredients": [{"name": "Owsianka", "amount": "50g"}], "steps": ["Przygotuj..."], "time": 15}]. Check constraint zapewnia obecność wymaganych kluczy.
- **Skalowalność**: Brak partycjonowania w MVP, ale pola timestamp przygotowują do przyszłego partycjonowania (np. analytics_events po miesiącach z retencją 90 dni).
- **Bezpieczeństwo**: RLS zapewnia, że użytkownicy widzą tylko swoje dane. Supabase Auth zarządza użytkownikami.
- **Normalizacja**: Schemat w 3NF, z uzasadnioną denormalizacją w JSONB dla elastyczności struktury posiłków bez nadmiernej liczby tabel.
- **Unresolved issues z sesji**: Szczegóły triggera i check constraints wymagają implementacji w Supabase. Walidacja autouzupełniania nielubianych produktów będzie po stronie aplikacji (statyczna lista JSON). Dokładna struktura JSONB zostanie potwierdzona po testach z AI promptem.
