import type { ReactNode } from "react";

interface FormSectionProps {
  title: string;
  subtitle?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

/**
 * Form section wrapper component
 * Provides consistent layout and styling for each form section
 * Displays title, optional subtitle, required indicator, and error messages
 */
export function FormSection({ title, subtitle, required, error, children }: FormSectionProps) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-semibold">
        {title}
        {required && <span className="text-red-500"> *</span>}
      </legend>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      {children}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </fieldset>
  );
}
