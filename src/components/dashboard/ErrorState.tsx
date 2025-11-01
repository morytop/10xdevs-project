import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ErrorStateProps } from "@/lib/viewmodels/dashboard.viewmodel";

/**
 * Error state z możliwością retry
 * Może być renderowany samodzielnie lub nad istniejącym planem
 */
export function ErrorState({ message, onRetry, retryable = true }: ErrorStateProps) {
  return (
    <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <Alert variant="destructive" className="shadow-sm">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Wystąpił błąd</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>

      {retryable && (
        <div className="flex justify-center animate-in fade-in duration-700 delay-200">
          <Button onClick={onRetry} variant="outline" className="min-w-[160px]">
            Spróbuj ponownie
          </Button>
        </div>
      )}
    </div>
  );
}
