import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { healthGoalOptions } from "@/lib/viewmodels/preferences.viewmodel";
import type { HealthGoal } from "@/types";

interface HealthGoalSelectProps {
  value: HealthGoal | "";
  onChange: (value: HealthGoal) => void;
  error?: string;
}

/**
 * Dropdown for selecting health goal
 * Uses Select component from shadcn/ui with 5 predefined options
 */
export function HealthGoalSelect({ value, onChange, error }: HealthGoalSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-required="true" aria-invalid={!!error}>
        <SelectValue placeholder="Wybierz cel..." />
      </SelectTrigger>
      <SelectContent>
        {healthGoalOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
