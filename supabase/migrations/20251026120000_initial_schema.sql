-- Migration: Initial schema for AI Meal Planner MVP
-- Created: 2025-10-26 12:00:00 UTC
-- Purpose: Creates all tables, enums, indexes, and security policies for the meal planner application
-- Affected tables: users, user_preferences, meal_plans, feedback, analytics_events
-- Special considerations: Enables RLS on user data tables, includes trigger for meal plan overwriting

-- ========================================
-- ENUMS
-- ========================================

-- Health goal options for user preferences
create type health_goal_enum as enum ('LOSE_WEIGHT', 'GAIN_WEIGHT', 'MAINTAIN_WEIGHT', 'HEALTHY_EATING', 'BOOST_ENERGY');

-- Diet type options for user preferences
create type diet_type_enum as enum ('STANDARD', 'VEGETARIAN', 'VEGAN', 'GLUTEN_FREE');

-- Status options for meal plan generation
create type status_enum as enum ('pending', 'generated', 'error');

-- Rating options for meal plan feedback
create type rating_enum as enum ('THUMBS_UP', 'THUMBS_DOWN');

-- Action types for analytics events
create type action_type_enum as enum ('user_registered', 'profile_created', 'profile_updated', 'plan_generated', 'plan_regenerated', 'plan_accepted', 'feedback_given', 'api_error');

-- ========================================
-- FUNCTIONS
-- ========================================

-- Function to validate meal plan JSONB structure
-- Ensures each meal in the array has required fields: name, ingredients, steps, time
create or replace function validate_meal_plan_structure(meals_data jsonb)
returns boolean as $$
begin
    -- Check if meals_data is an array
    if jsonb_typeof(meals_data) != 'array' then
        return false;
    end if;

    -- Check if array is not empty
    if jsonb_array_length(meals_data) = 0 then
        return false;
    end if;

    -- Check each meal in the array has required structure
    return not exists (
        select 1
        from jsonb_array_elements(meals_data) as meal
        where not (
            meal ? 'name' and
            meal ? 'ingredients' and
            meal ? 'steps' and
            meal ? 'time' and
            jsonb_typeof(meal->'name') = 'string' and
            jsonb_typeof(meal->'ingredients') = 'array' and
            jsonb_typeof(meal->'steps') = 'array' and
            jsonb_typeof(meal->'time') = 'number'
        )
    );
end;
$$ language plpgsql immutable;

-- ========================================
-- TABLES
-- ========================================

-- Users table (managed by Supabase Auth - no need to create here)

-- User preferences table - stores nutritional preferences and restrictions
create table user_preferences (
    user_id uuid primary key references auth.users(id) on delete cascade,
    health_goal health_goal_enum not null,
    diet_type diet_type_enum not null,
    activity_level integer not null check (activity_level between 1 and 5),
    allergies text[] check (array_length(allergies, 1) <= 10),
    disliked_products text[] check (array_length(disliked_products, 1) <= 20)
);

-- Meal plans table - stores generated meal plans (one per user, overwritten on regeneration)
create table meal_plans (
    id uuid primary key default gen_random_uuid(),
    user_id uuid unique references auth.users(id) on delete cascade,
    meals jsonb not null check (validate_meal_plan_structure(meals)),
    generated_at timestamptz default now(),
    status status_enum default 'pending',
    created_at timestamptz default now()
);

-- Feedback table - stores user ratings and comments on meal plans
create table feedback (
    id uuid primary key default gen_random_uuid(),
    meal_plan_id uuid references meal_plans(id) on delete cascade,
    rating rating_enum not null,
    comment text check (length(comment) <= 500),
    created_at timestamptz default now()
);

-- Analytics events table - stores user interaction events for metrics
create table analytics_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    action_type action_type_enum not null,
    timestamp timestamptz not null,
    metadata jsonb,
    created_at timestamptz default now()
);

-- ========================================
-- INDEXES
-- ========================================

-- Indexes for user_preferences (primary key already handles user_id indexing)

-- Indexes for meal_plans
create index idx_meal_plans_user_id_generated_at on meal_plans(user_id, generated_at desc);

-- Indexes for feedback
create index idx_feedback_meal_plan_id on feedback(meal_plan_id);

-- Indexes for analytics_events
create index idx_analytics_events_user_timestamp on analytics_events(user_id, timestamp desc);
create index idx_analytics_events_metadata on analytics_events using gin(metadata jsonb_ops);

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger to ensure only one meal plan per user (overwrites existing plan)
create or replace function overwrite_existing_meal_plan()
returns trigger as $$
begin
    -- Delete existing meal plan for this user before inserting new one
    delete from meal_plans where user_id = new.user_id and id != new.id;
    return new;
end;
$$ language plpgsql;

create trigger trigger_overwrite_meal_plan
    before insert on meal_plans
    for each row
    execute function overwrite_existing_meal_plan();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on user_preferences
-- Users can only access their own preferences
alter table user_preferences enable row level security;

create policy "users_can_access_own_preferences_select" on user_preferences
    for select using (auth.uid() = user_id);

create policy "users_can_access_own_preferences_insert" on user_preferences
    for insert with check (auth.uid() = user_id);

create policy "users_can_access_own_preferences_update" on user_preferences
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_can_access_own_preferences_delete" on user_preferences
    for delete using (auth.uid() = user_id);

-- Enable RLS on meal_plans
-- Users can only access their own meal plans
alter table meal_plans enable row level security;

create policy "users_can_access_own_meal_plans_select" on meal_plans
    for select using (auth.uid() = user_id);

create policy "users_can_access_own_meal_plans_insert" on meal_plans
    for insert with check (auth.uid() = user_id);

create policy "users_can_access_own_meal_plans_update" on meal_plans
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_can_access_own_meal_plans_delete" on meal_plans
    for delete using (auth.uid() = user_id);

-- Enable RLS on feedback
-- Users can only access feedback for their own meal plans
alter table feedback enable row level security;

create policy "users_can_access_feedback_for_own_plans_select" on feedback
    for select using (auth.uid() = (select user_id from meal_plans where id = meal_plan_id));

create policy "users_can_access_feedback_for_own_plans_insert" on feedback
    for insert with check (auth.uid() = (select user_id from meal_plans where id = meal_plan_id));

create policy "users_can_access_feedback_for_own_plans_update" on feedback
    for update using (auth.uid() = (select user_id from meal_plans where id = meal_plan_id)) with check (auth.uid() = (select user_id from meal_plans where id = meal_plan_id));

create policy "users_can_access_feedback_for_own_plans_delete" on feedback
    for delete using (auth.uid() = (select user_id from meal_plans where id = meal_plan_id));

-- analytics_events table does not have RLS enabled (admin access for analytics)
-- This allows for future admin policies if needed
