-- Migration: Fix meal_plans check constraint to allow empty arrays
-- Created: 2025-10-29
-- Purpose: Allows empty meals array for 'pending' status in meal_plans table

-- Drop the old constraint
ALTER TABLE meal_plans DROP CONSTRAINT meal_plans_meals_check;

-- Recreate the validation function to allow empty arrays
CREATE OR REPLACE FUNCTION validate_meal_plan_structure(meals_data jsonb)
RETURNS boolean AS $$
BEGIN
    -- Check if meals_data is an array
    IF jsonb_typeof(meals_data) != 'array' THEN
        RETURN false;
    END IF;

    -- Allow empty array (for pending status)
    IF jsonb_array_length(meals_data) = 0 THEN
        RETURN true;
    END IF;

    -- Check each meal in the array has required structure
    RETURN NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(meals_data) AS meal
        WHERE NOT (
            meal ? 'name' AND
            meal ? 'ingredients' AND
            meal ? 'steps' AND
            meal ? 'time' AND
            jsonb_typeof(meal->'name') = 'string' AND
            jsonb_typeof(meal->'ingredients') = 'array' AND
            jsonb_typeof(meal->'steps') = 'array' AND
            jsonb_typeof(meal->'time') = 'number'
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add the constraint back with the updated validation function
ALTER TABLE meal_plans ADD CONSTRAINT meal_plans_meals_check 
    CHECK (validate_meal_plan_structure(meals));

