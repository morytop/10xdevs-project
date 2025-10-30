import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { allergyOptions } from "@/lib/viewmodels/preferences.viewmodel";

interface AllergyCheckboxGroupProps {
  value: string[];
  onChange: (value: string[]) => void;
}

/**
 * Checkbox group for selecting allergies
 * Supports max 10 selections with "Other" option for custom input
 * Disables unchecked options when limit is reached
 */
export function AllergyCheckboxGroup({ value, onChange }: AllergyCheckboxGroupProps) {
  const [otherValue, setOtherValue] = useState("");
  const selectedCount = value.length;

  // Predefined allergy values
  const predefinedValues = allergyOptions.map((opt) => opt.value);

  // Check if custom "Inne" value exists (not in predefined list)
  const customOtherValue = value.find((v) => !predefinedValues.includes(v) && v !== "Inne");
  const hasOtherSelected = value.includes("Inne") || !!customOtherValue;

  const handleToggle = (allergyValue: string, checked: boolean | string) => {
    if (checked) {
      if (selectedCount < 10) {
        onChange([...value, allergyValue]);
      }
    } else {
      // Remove "Inne" or any custom value when unchecking
      if (allergyValue === "Inne") {
        const filtered = value.filter((v) => v !== "Inne" && predefinedValues.includes(v));
        onChange(filtered);
        setOtherValue("");
      } else {
        onChange(value.filter((v) => v !== allergyValue));
      }
    }
  };

  const handleOtherInput = (inputValue: string) => {
    setOtherValue(inputValue);
    // Replace "Inne" or previous custom value with the new input value
    const filtered = value.filter((v) => predefinedValues.includes(v) && v !== "Inne");
    const newValue = inputValue.trim() ? [...filtered, inputValue] : [...filtered, "Inne"];
    onChange(newValue);
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">{selectedCount}/10 wybranych</div>

      {allergyOptions.map((option) => (
        <div key={option.value} className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={option.value}
              checked={option.isOther ? hasOtherSelected : value.includes(option.value)}
              disabled={!value.includes(option.value) && selectedCount >= 10}
              onCheckedChange={(checked) => handleToggle(option.value, checked)}
            />
            <Label
              htmlFor={option.value}
              className={selectedCount >= 10 && !value.includes(option.value) ? "text-muted-foreground" : ""}
            >
              {option.label}
            </Label>
          </div>

          {option.isOther && hasOtherSelected && (
            <Input
              placeholder="Wpisz inną alergię..."
              value={otherValue || customOtherValue || ""}
              onChange={(e) => handleOtherInput(e.target.value)}
              className="ml-6"
            />
          )}
        </div>
      ))}

      {selectedCount >= 10 && (
        <p className="text-sm text-amber-600">Osiągnięto limit 10 alergii. Aby dodać nową, usuń istniejącą.</p>
      )}
    </div>
  );
}
