# REST API Plan - AI Meal Planner MVP

## 1. Resources

The API exposes the following main resources, mapped to database tables:

| Resource             | Database Table     | Description                                                   |
| -------------------- | ------------------ | ------------------------------------------------------------- |
| **Preferences**      | `user_preferences` | User dietary preferences and restrictions (1:1 with user)     |
| **Meal Plans**       | `meal_plans`       | AI-generated daily meal plans (1:1 with user, overwriting)    |
| **Feedback**         | `feedback`         | User ratings and comments on meal plans (1:M with meal_plans) |
| **Analytics Events** | `analytics_events` | User activity tracking for metrics (1:M with users)           |

**Note on Authentication**: User authentication is handled entirely by Supabase Auth SDK (client-side). The API endpoints assume an authenticated user context via JWT token in the `Authorization` header.

---

## 2. Endpoints

### 2.1 User Preferences

#### Create User Preferences

Creates dietary preferences for the authenticated user during onboarding.

- **Method**: `POST`
- **Path**: `/api/preferences`
- **Description**: Creates user preferences. Only one preference profile per user (enforced by DB primary key on user_id).
- **Authentication**: Required (JWT token)

**Request Body** (JSON):

```json
{
  "health_goal": "LOSE_WEIGHT",
  "diet_type": "VEGETARIAN",
  "activity_level": 3,
  "allergies": ["Gluten", "Laktoza"],
  "disliked_products": ["Brokuły", "Papryka", "Cebula"]
}
```

**Request Body Schema**:

- `health_goal` (string, required): One of `LOSE_WEIGHT`, `GAIN_WEIGHT`, `MAINTAIN_WEIGHT`, `HEALTHY_EATING`, `BOOST_ENERGY`
- `diet_type` (string, required): One of `STANDARD`, `VEGETARIAN`, `VEGAN`, `GLUTEN_FREE`
- `activity_level` (integer, required): Integer between 1-5
- `allergies` (array of strings, optional): Maximum 10 items
- `disliked_products` (array of strings, optional): Maximum 20 items

**Success Response** (201 Created):

```json
{
  "user_id": "uuid-string",
  "health_goal": "LOSE_WEIGHT",
  "diet_type": "VEGETARIAN",
  "activity_level": 3,
  "allergies": ["Gluten", "Laktoza"],
  "disliked_products": ["Brokuły", "Papryka", "Cebula"]
}
```

**Error Responses**:

- `400 Bad Request`:
  ```json
  {
    "error": "Validation error",
    "details": ["Pole 'health_goal' jest wymagane", "Maksymalnie 10 alergii", "Maksymalnie 20 produktów nielubanych"]
  }
  ```
- `401 Unauthorized`:
  ```json
  {
    "error": "Unauthorized",
    "message": "Musisz być zalogowany, aby wykonać tę akcję"
  }
  ```
- `409 Conflict`:
  ```json
  {
    "error": "Conflict",
    "message": "Preferencje dla tego użytkownika już istnieją. Użyj PUT do aktualizacji."
  }
  ```

---

#### Get User Preferences

Retrieves the current user's dietary preferences.

- **Method**: `GET`
- **Path**: `/api/preferences`
- **Description**: Returns preferences for authenticated user
- **Authentication**: Required

**Success Response** (200 OK):

```json
{
  "user_id": "uuid-string",
  "health_goal": "LOSE_WEIGHT",
  "diet_type": "VEGETARIAN",
  "activity_level": 3,
  "allergies": ["Gluten", "Laktoza"],
  "disliked_products": ["Brokuły", "Papryka", "Cebula"]
}
```

**Error Responses**:

- `401 Unauthorized`: (same as above)
- `404 Not Found`:
  ```json
  {
    "error": "Not found",
    "message": "Nie znaleziono preferencji. Wypełnij formularz onboardingu."
  }
  ```

---

#### Update User Preferences

Updates the current user's dietary preferences.

- **Method**: `PUT`
- **Path**: `/api/preferences`
- **Description**: Updates all preference fields. Partial updates supported.
- **Authentication**: Required

**Request Body** (JSON):

```json
{
  "health_goal": "MAINTAIN_WEIGHT",
  "diet_type": "VEGAN",
  "activity_level": 4,
  "allergies": ["Orzechy", "Soja"],
  "disliked_products": ["Tofu"]
}
```

**Request Body Schema**: Same as POST (all fields optional for partial update)

**Success Response** (200 OK):

```json
{
  "user_id": "uuid-string",
  "health_goal": "MAINTAIN_WEIGHT",
  "diet_type": "VEGAN",
  "activity_level": 4,
  "allergies": ["Orzechy", "Soja"],
  "disliked_products": ["Tofu"]
}
```

**Error Responses**:

- `400 Bad Request`: (same validation errors as POST)
- `401 Unauthorized`: (same as above)
- `404 Not Found`: (same as GET)

---

### 2.2 Meal Plans

#### Generate Meal Plan

Generates a new AI meal plan for the current day. Overwrites any existing plan for the user.

- **Method**: `POST`
- **Path**: `/api/meal-plans`
- **Description**: Calls LLM to generate personalized meal plan based on user preferences. Implements retry logic and timeout. Tracks whether this is initial generation or regeneration for analytics.
- **Authentication**: Required
- **Timeout**: 30 seconds
- **Retry Logic**: 3 attempts with exponential backoff (1s, 2s, 4s)

**Request Body** (JSON):

```json
{
  "regeneration": false
}
```

**Request Body Schema**:

- `regeneration` (boolean, optional, default: false): Set to `true` if this is a regeneration of existing plan (for analytics tracking)

**Success Response** (201 Created):

```json
{
  "id": "uuid-string",
  "user_id": "uuid-string",
  "meals": [
    {
      "name": "Śniadanie: Owsianka z owocami",
      "ingredients": [
        {
          "name": "Płatki owsiane",
          "amount": "50g"
        },
        {
          "name": "Mleko roślinne",
          "amount": "200ml"
        },
        {
          "name": "Banan",
          "amount": "1 szt."
        }
      ],
      "steps": [
        "Zagotuj mleko roślinne w garnku",
        "Dodaj płatki owsiane i gotuj 5 minut na małym ogniu",
        "Przełóż do miski i udekoruj pokrojonym bananem"
      ],
      "time": 10
    },
    {
      "name": "Obiad: Makaron z warzywami",
      "ingredients": [
        {
          "name": "Makaron pełnoziarnisty",
          "amount": "100g"
        }
      ],
      "steps": ["Ugotuj makaron według instrukcji na opakowaniu"],
      "time": 25
    },
    {
      "name": "Kolacja: Sałatka grecka",
      "ingredients": [],
      "steps": [],
      "time": 15
    }
  ],
  "generated_at": "2025-10-27T14:30:00Z",
  "status": "generated",
  "created_at": "2025-10-27T14:30:00Z"
}
```

**Response Schema**:

- `id` (string): UUID of meal plan
- `user_id` (string): UUID of user
- `meals` (array): Array of 3 meal objects (breakfast, lunch, dinner)
  - `name` (string): Meal name
  - `ingredients` (array): Array of ingredient objects
    - `name` (string): Ingredient name
    - `amount` (string): Amount with European units (g, szt., łyżka, ml)
  - `steps` (array of strings): Preparation steps
  - `time` (integer): Estimated preparation time in minutes
- `generated_at` (string): ISO 8601 timestamp
- `status` (string): "generated"
- `created_at` (string): ISO 8601 timestamp

**Error Responses**:

- `400 Bad Request`:
  ```json
  {
    "error": "Bad request",
    "message": "Najpierw wypełnij swoje preferencje żywieniowe"
  }
  ```
- `401 Unauthorized`: (same as above)
- `500 Internal Server Error`:
  ```json
  {
    "error": "Generation failed",
    "message": "Nie udało się wygenerować planu. Spróbuj ponownie.",
    "retry_count": 3
  }
  ```
- `503 Service Unavailable`:
  ```json
  {
    "error": "Service unavailable",
    "message": "Serwis AI jest chwilowo niedostępny. Spróbuj za chwilę."
  }
  ```
- `504 Gateway Timeout`:
  ```json
  {
    "error": "Timeout",
    "message": "Generowanie planu trwa zbyt długo. Spróbuj ponownie."
  }
  ```

---

#### Get Current Meal Plan

Retrieves the current user's latest meal plan.

- **Method**: `GET`
- **Path**: `/api/meal-plans/current`
- **Description**: Returns the most recent meal plan for authenticated user
- **Authentication**: Required

**Success Response** (200 OK):

```json
{
  "id": "uuid-string",
  "user_id": "uuid-string",
  "meals": [
    {
      "name": "Śniadanie: Owsianka z owocami",
      "ingredients": [...],
      "steps": [...],
      "time": 10
    }
  ],
  "generated_at": "2025-10-27T14:30:00Z",
  "status": "generated",
  "created_at": "2025-10-27T14:30:00Z"
}
```

**Error Responses**:

- `401 Unauthorized`: (same as above)
- `404 Not Found`:
  ```json
  {
    "error": "Not found",
    "message": "Nie masz jeszcze wygenerowanego planu. Kliknij 'Wygeneruj plan'."
  }
  ```

---

### 2.3 Feedback

#### Submit Feedback

Creates feedback for the user's current meal plan.

- **Method**: `POST`
- **Path**: `/api/feedback`
- **Description**: Submits rating and optional comment for user's current meal plan. Multiple feedback entries per plan are allowed (user can change opinion).
- **Authentication**: Required

**Request Body** (JSON):

```json
{
  "rating": "THUMBS_UP",
  "comment": "Świetne propozycje, wszystko było pyszne!"
}
```

**Request Body Schema**:

- `rating` (string, required): One of `THUMBS_UP`, `THUMBS_DOWN`
- `comment` (string, optional): Maximum 500 characters

**Success Response** (201 Created):

```json
{
  "id": "uuid-string",
  "meal_plan_id": "uuid-string",
  "rating": "THUMBS_UP",
  "comment": "Świetne propozycje, wszystko było pyszne!",
  "created_at": "2025-10-27T15:00:00Z"
}
```

**Error Responses**:

- `400 Bad Request`:
  ```json
  {
    "error": "Validation error",
    "details": ["Ocena jest wymagana", "Komentarz może mieć maksymalnie 500 znaków"]
  }
  ```
- `401 Unauthorized`: (same as above)
- `404 Not Found`:
  ```json
  {
    "error": "Not found",
    "message": "Nie znaleziono planu posiłków do oceny"
  }
  ```

---

#### Update Feedback

Updates existing feedback.

- **Method**: `PUT`
- **Path**: `/api/feedback/:id`
- **Description**: Updates rating or comment of existing feedback. User can only update their own feedback.
- **Authentication**: Required
- **URL Parameters**:
  - `id` (string, required): UUID of feedback to update

**Request Body** (JSON):

```json
{
  "rating": "THUMBS_DOWN",
  "comment": "Jednak nie spodobało mi się śniadanie"
}
```

**Success Response** (200 OK):

```json
{
  "id": "uuid-string",
  "meal_plan_id": "uuid-string",
  "rating": "THUMBS_DOWN",
  "comment": "Jednak nie spodobało mi się śniadanie",
  "created_at": "2025-10-27T15:00:00Z"
}
```

**Error Responses**:

- `400 Bad Request`: (same as POST)
- `401 Unauthorized`: (same as above)
- `403 Forbidden`:
  ```json
  {
    "error": "Forbidden",
    "message": "Nie możesz edytować cudzej opinii"
  }
  ```
- `404 Not Found`:
  ```json
  {
    "error": "Not found",
    "message": "Nie znaleziono opinii o podanym ID"
  }
  ```

---

### 2.4 Analytics Events

#### Log Analytics Event

Logs a user activity event for metrics tracking. Primarily used for frontend-triggered events like `plan_accepted`.

- **Method**: `POST`
- **Path**: `/api/analytics/events`
- **Description**: Logs analytics event with metadata. Non-blocking - should not fail user-facing actions. Most events are logged automatically by backend, but this endpoint allows frontend to log specific events.
- **Authentication**: Required

**Request Body** (JSON):

```json
{
  "action_type": "plan_accepted",
  "metadata": {
    "time_on_page": 45,
    "plan_id": "uuid-string"
  }
}
```

**Request Body Schema**:

- `action_type` (string, required): One of `user_registered`, `profile_created`, `profile_updated`, `plan_generated`, `plan_regenerated`, `plan_accepted`, `feedback_given`, `api_error`
- `metadata` (object, optional): Additional context specific to the event

**Success Response** (204 No Content):

- No response body

**Error Responses**:

- `400 Bad Request`:
  ```json
  {
    "error": "Validation error",
    "message": "Nieprawidłowy typ akcji"
  }
  ```
- `401 Unauthorized`: (same as above)

**Note**: This endpoint should fail gracefully. If logging fails, it should not prevent the user action from completing.

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

**Provider**: Supabase Auth

**Implementation**:

- Client-side authentication uses Supabase Auth SDK
- Users register and log in directly through Supabase Auth API
- JWT tokens are automatically managed by Supabase client
- All API endpoints verify authentication via JWT in `Authorization` header

**Token Format**:

```
Authorization: Bearer <jwt-token>
```

### 3.2 Authorization

**Row Level Security (RLS)**:

- Database-level security enforced through Supabase RLS policies
- Users can only access their own data:
  - `user_preferences`: `auth.uid() = user_id`
  - `meal_plans`: `auth.uid() = user_id`
  - `feedback`: `auth.uid() = (SELECT user_id FROM meal_plans WHERE id = meal_plan_id)`
  - `analytics_events`: `auth.uid() = user_id`

**API Implementation**:

- API uses authenticated Supabase client (user's JWT forwarded)
- RLS policies automatically filter queries to user's data
- No need for manual user_id filtering in API logic
- Unauthorized access attempts return 403 Forbidden

### 3.3 Protected Routes

All API endpoints require authentication. Unauthenticated requests return:

```json
{
  "error": "Unauthorized",
  "message": "Musisz być zalogowany, aby wykonać tę akcję"
}
```

**Status Code**: 401 Unauthorized

---

## 4. Validation and Business Logic

### 4.1 Validation Rules

#### User Preferences

| Field               | Validation Rules                     | Error Message                                                                            |
| ------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------- |
| `health_goal`       | Required, must be one of enum values | "Pole 'cel zdrowotny' jest wymagane" / "Nieprawidłowa wartość celu zdrowotnego"          |
| `diet_type`         | Required, must be one of enum values | "Pole 'typ diety' jest wymagane" / "Nieprawidłowy typ diety"                             |
| `activity_level`    | Required, integer between 1-5        | "Pole 'poziom aktywności' jest wymagane" / "Poziom aktywności musi być liczbą od 1 do 5" |
| `allergies`         | Optional, array, max 10 items        | "Możesz wybrać maksymalnie 10 alergii"                                                   |
| `disliked_products` | Optional, array, max 20 items        | "Możesz dodać maksymalnie 20 produktów nielubanych"                                      |

**Enums**:

- `health_goal_enum`: `LOSE_WEIGHT`, `GAIN_WEIGHT`, `MAINTAIN_WEIGHT`, `HEALTHY_EATING`, `BOOST_ENERGY`
- `diet_type_enum`: `STANDARD`, `VEGETARIAN`, `VEGAN`, `GLUTEN_FREE`

#### Meal Plans

| Field                 | Validation Rules                         | Error Message                                          |
| --------------------- | ---------------------------------------- | ------------------------------------------------------ |
| `meals`               | Required, valid JSONB array with 3 meals | "Plan musi zawierać 3 posiłki"                         |
| `meals[].name`        | Required for each meal                   | "Każdy posiłek musi mieć nazwę"                        |
| `meals[].ingredients` | Required array (can be empty)            | "Każdy posiłek musi mieć listę składników"             |
| `meals[].steps`       | Required array (can be empty)            | "Każdy posiłek musi mieć kroki przygotowania"          |
| `meals[].time`        | Required integer                         | "Każdy posiłek musi mieć szacowany czas przygotowania" |
| `status`              | Must be one of enum values               | "Nieprawidłowy status planu"                           |

**Enums**:

- `status_enum`: `pending`, `generated`, `error`

#### Feedback

| Field     | Validation Rules                     | Error Message                                         |
| --------- | ------------------------------------ | ----------------------------------------------------- |
| `rating`  | Required, must be one of enum values | "Ocena jest wymagana" / "Nieprawidłowa wartość oceny" |
| `comment` | Optional, max 500 characters         | "Komentarz może mieć maksymalnie 500 znaków"          |

**Enums**:

- `rating_enum`: `THUMBS_UP`, `THUMBS_DOWN`

#### Analytics Events

| Field         | Validation Rules                     | Error Message                     |
| ------------- | ------------------------------------ | --------------------------------- |
| `action_type` | Required, must be one of enum values | "Nieprawidłowy typ akcji"         |
| `metadata`    | Optional, valid JSON object          | "Nieprawidłowy format metadanych" |

**Enums**:

- `action_type_enum`: `user_registered`, `profile_created`, `profile_updated`, `plan_generated`, `plan_regenerated`, `plan_accepted`, `feedback_given`, `api_error`

### 4.2 Business Logic Implementation

#### 4.2.1 User Preferences Management

**Create Preferences (POST /api/preferences)**:

1. Validate request body against schema
2. Verify user is authenticated
3. Check if preferences already exist (return 409 if yes)
4. Insert preferences with user_id from JWT
5. Log `profile_created` analytics event
6. Return created preferences

**Update Preferences (PUT /api/preferences)**:

1. Validate request body (partial updates allowed)
2. Verify user is authenticated
3. Check if preferences exist (return 404 if no)
4. Update preferences
5. Log `profile_updated` analytics event
6. Return updated preferences

#### 4.2.2 Meal Plan Generation

**Generate Plan (POST /api/meal-plans)**:

1. Verify user is authenticated
2. Fetch user preferences (return 400 if not found)
3. Check if existing plan (for analytics tracking)
4. Create meal plan record with status='pending'
5. Build LLM prompt with:
   - Health goal
   - Diet type
   - Activity level
   - Allergies (hard exclusions)
   - Disliked products (soft exclusions)
   - European units
   - Polish language
   - 3 meals (breakfast, lunch, dinner)
6. Call Openrouter API with prompt:
   - Set timeout: 30 seconds
   - Implement retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
7. On success:
   - Parse LLM response to JSONB structure
   - Validate JSONB structure (name, ingredients, steps, time for each meal)
   - Update meal plan status to 'generated'
   - Log `plan_generated` or `plan_regenerated` event
   - Return 201 with meal plan
8. On failure:
   - Update meal plan status to 'error'
   - Log `api_error` event with error details
   - Return appropriate error code (500/503/504)

**Database Behavior**:

- BEFORE INSERT trigger on `meal_plans` automatically deletes existing plan for user
- Ensures only one plan per user at all times

**Get Current Plan (GET /api/meal-plans/current)**:

1. Verify user is authenticated
2. Query meal_plans for user (RLS enforced)
3. Return plan if found, 404 if not

#### 4.2.3 Feedback Management

**Submit Feedback (POST /api/feedback)**:

1. Validate request body
2. Verify user is authenticated
3. Get user's current meal plan ID
4. If no plan, return 404
5. Insert feedback with meal_plan_id
6. Log `feedback_given` analytics event
7. Return created feedback

**Update Feedback (PUT /api/feedback/:id)**:

1. Validate request body
2. Verify user is authenticated
3. Check if feedback exists
4. Verify feedback belongs to user's meal plan (RLS)
5. Update feedback
6. Return updated feedback

#### 4.2.4 Analytics Event Logging

**Log Event (POST /api/analytics/events)**:

1. Validate action_type
2. Extract user_id from JWT
3. Add current timestamp
4. Insert event (non-blocking - catch and log errors but don't fail)
5. Return 204

**Automatic Event Logging**:
Backend automatically logs these events:

- `user_registered`: After successful Supabase signup
- `profile_created`: After POST /api/preferences
- `profile_updated`: After PUT /api/preferences
- `plan_generated`: After successful first plan generation
- `plan_regenerated`: After successful subsequent plan generation
- `feedback_given`: After POST /api/feedback
- `api_error`: After LLM API failures

**Frontend Event Logging**:
Frontend logs these events via POST /api/analytics/events:

- `plan_accepted`: When user stays on plan page 30+ seconds without regenerating

#### 4.2.5 Plan Acceptance Tracking

**Client-Side Implementation**:

1. On meal plan page load, start timer
2. Track if "Regenerate" button is clicked
3. If user stays on page 30+ seconds AND doesn't click regenerate within 2 minutes:
   - Call POST /api/analytics/events with action_type='plan_accepted'
   - Include metadata: time_on_page, plan_id

### 4.3 Error Handling Strategy

**Validation Errors (400)**:

- Return clear, user-friendly Polish messages
- Include field-specific error details
- Example: `{"error": "Validation error", "details": ["Pole 'cel zdrowotny' jest wymagane"]}`

**Authentication Errors (401)**:

- Return Polish message prompting login
- Frontend should redirect to login page

**Authorization Errors (403)**:

- Return Polish message indicating insufficient permissions
- Occurs when trying to access other users' data

**Not Found Errors (404)**:

- Return Polish message with helpful guidance
- Example: "Nie masz jeszcze preferencji. Wypełnij formularz."

**Server Errors (500/503/504)**:

- Return user-friendly Polish message
- Log detailed error for debugging
- For LLM timeouts: Suggest trying again

**Non-Blocking Failures**:

- Analytics event logging should never block user actions
- Catch and log errors but return success to user

### 4.4 Performance Considerations

**Database Indexes**:

- `meal_plans`: Index on (user_id, generated_at DESC) for fast current plan lookup
- `feedback`: Index on meal_plan_id for fast feedback queries
- `analytics_events`: Index on (user_id, timestamp DESC) for metrics queries

**Caching**:

- User preferences can be cached (rarely change)
- Current meal plan can be cached with short TTL

**Rate Limiting**:

- No rate limiting in MVP
- Track regeneration count in analytics for future implementation

---


_Document Version: 1.0_
_Last Updated: 2025-10-27_
