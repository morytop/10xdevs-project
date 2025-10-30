import type { ReactNode } from "react";

interface StickyFormFooterProps {
  children: ReactNode;
}

/**
 * Sticky footer component that stays at the bottom of the viewport
 * Contains form submit button and other actions
 */
export function StickyFormFooter({ children }: StickyFormFooterProps) {
  return (
    <div className="sticky bottom-0 bg-background border-t py-4 mt-8">
      <div className="container max-w-2xl mx-auto flex justify-end">{children}</div>
    </div>
  );
}
