import { Clock, Target, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface BenefitCardProps {
  /** Nazwa ikony z lucide-react (np. "Clock", "Target", "Sparkles") */
  icon: "Clock" | "Target" | "Sparkles";
  /** Tytuł korzyści */
  title: string;
  /** Opis korzyści */
  description: string;
}

// Map of icon names to components (only import what we need)
const iconMap: Record<BenefitCardProps["icon"], LucideIcon> = {
  Clock,
  Target,
  Sparkles,
};

/**
 * Card component displaying a single benefit with icon, title, and description
 * Used in the Benefits section of the landing page
 */
export function BenefitCard({ icon, title, description }: BenefitCardProps) {
  const IconComponent = iconMap[icon];

  return (
    <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
      <div className="mb-4 p-3 rounded-full bg-primary/10 text-primary" aria-hidden="true">
        {IconComponent && <IconComponent className="h-8 w-8" />}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
