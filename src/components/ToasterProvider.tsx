import { Toaster } from "sonner";

import { type ReactNode } from "react";

/**
 * Toaster provider component for toast notifications
 * Mounted globally to handle all toast messages
 */
export function ToasterProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-center" richColors />
    </>
  );
}
