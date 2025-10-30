import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { activityLevelOptions } from "@/lib/viewmodels/preferences.viewmodel";

interface ActivityLevelSelectProps {
  value: number | null;
  onChange: (value: number) => void;
  error?: string;
}

/**
 * Dropdown for selecting activity level (1-5)
 * Each option includes a label and description
 */
export function ActivityLevelSelect({ value, onChange, error }: ActivityLevelSelectProps) {
  return (
    <Select value={value?.toString() || ""} onValueChange={(v) => onChange(parseInt(v))}>
      <SelectTrigger aria-required="true" aria-invalid={!!error}>
        <SelectValue placeholder="Wybierz poziom aktywności..." />
      </SelectTrigger>
      <SelectContent>
        {activityLevelOptions.map((option) => (
          <SelectItem key={option.value} value={option.value.toString()}>
            <div>
              <div className="font-medium">
                {option.value} - {option.label}
              </div>
              <div className="text-sm text-muted-foreground">{option.description}</div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
