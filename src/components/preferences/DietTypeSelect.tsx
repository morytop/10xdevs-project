import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dietTypeOptions } from "@/lib/viewmodels/preferences.viewmodel";
import type { DietType } from "@/types";

interface DietTypeSelectProps {
  value: DietType | "";
  onChange: (value: DietType) => void;
  error?: string;
}

/**
 * Dropdown for selecting diet type
 * Uses Select component from shadcn/ui with 4 predefined options
 */
export function DietTypeSelect({ value, onChange, error }: DietTypeSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-required="true" aria-invalid={!!error}>
        <SelectValue placeholder="Wybierz typ diety..." />
      </SelectTrigger>
      <SelectContent>
        {dietTypeOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
