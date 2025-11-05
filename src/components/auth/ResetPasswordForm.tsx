import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useResetPassword } from "@/hooks/useAuth";
import { ResetPasswordFormSchema, type ResetPasswordFormData } from "@/lib/schemas/auth.schema";

/**
 * ResetPasswordForm Component
 *
 * Interactive password reset form. Manages email validation,
 * communication with Supabase Auth, and displaying success/error messages.
 * For security reasons, always displays generic success message.
 */
export default function ResetPasswordForm() {
  const { mutate, isLoading, error, isSuccess } = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordFormSchema),
    mode: "onChange",
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    mutate(data);
  };

  // ============================================================================
  // RENDER - SUCCESS STATE
  // ============================================================================

  if (isSuccess) {
    return (
      <div className="space-y-6 bg-white shadow-lg rounded-lg p-8">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Jeśli konto z tym adresem istnieje, wyślemy link do resetowania hasła. Sprawdź swoją skrzynkę email
            (włącznie ze spamem).
          </AlertDescription>
        </Alert>

        <div className="text-center">
          <a href="/login" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
            Wróć do logowania
          </a>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - FORM STATE
  // ============================================================================

  return (
    <div className="space-y-6 bg-white shadow-lg rounded-lg p-8">
      {/* API Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Adres email <span className="text-red-600">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="twoj@email.com"
            disabled={isLoading}
            required
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="text-sm text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || !isValid}>
          {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
        </Button>
      </form>

      {/* Back to login link */}
      <div className="text-center">
        <a href="/login" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
          Wróć do logowania
        </a>
      </div>
    </div>
  );
}
