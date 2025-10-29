-- Migration: Disable RLS policies for user_preferences, meal_plans, and feedback tables
-- Created: 2025-10-26 17:35:21 UTC
-- Purpose: Removes all row level security policies from user data tables
-- Affected tables: user_preferences, meal_plans, feedback
-- Special considerations: Disables user access restrictions for development/admin purposes

-- ========================================
-- DISABLE POLICIES FOR USER_PREFERENCES
-- ========================================

drop policy if exists "users_can_access_own_preferences_select" on user_preferences;
drop policy if exists "users_can_access_own_preferences_insert" on user_preferences;
drop policy if exists "users_can_access_own_preferences_update" on user_preferences;
drop policy if exists "users_can_access_own_preferences_delete" on user_preferences;

-- ========================================
-- DISABLE POLICIES FOR MEAL_PLANS
-- ========================================

drop policy if exists "users_can_access_own_meal_plans_select" on meal_plans;
drop policy if exists "users_can_access_own_meal_plans_insert" on meal_plans;
drop policy if exists "users_can_access_own_meal_plans_update" on meal_plans;
drop policy if exists "users_can_access_own_meal_plans_delete" on meal_plans;

-- ========================================
-- DISABLE POLICIES FOR FEEDBACK
-- ========================================

drop policy if exists "users_can_access_feedback_for_own_plans_select" on feedback;
drop policy if exists "users_can_access_feedback_for_own_plans_insert" on feedback;
drop policy if exists "users_can_access_feedback_for_own_plans_update" on feedback;
drop policy if exists "users_can_access_feedback_for_own_plans_delete" on feedback;
