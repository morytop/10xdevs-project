/**
 * Logo component for the application
 * Used in public navigation and other layout components
 */
export function Logo() {
  return (
    <a
      href="/"
      className="flex items-center gap-2 text-xl font-bold text-foreground hover:opacity-80 transition-opacity"
      aria-label="AI Meal Planner - strona główna"
    >
      <span className="text-2xl">🍽️</span>
      <span>AI Meal Planner</span>
    </a>
  );
}
