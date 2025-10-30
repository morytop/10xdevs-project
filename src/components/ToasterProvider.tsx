import { Toaster } from "sonner";

/**
 * Toaster provider component for toast notifications
 * Mounted globally to handle all toast messages
 */
export function ToasterProvider() {
  return <Toaster position="top-center" richColors />;
}
