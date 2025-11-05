import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useUpdatePassword, useRecoverySession } from "@/hooks/useAuth";
import { UpdatePasswordFormSchema, type UpdatePasswordFormData } from "@/lib/schemas/auth.schema";

/**
 * UpdatePasswordForm Component
 *
 * Form for setting a new password after clicking the reset link.
 * Validates recovery token from Supabase, verifies password correctness
 * and updates user password.
 */
export default function UpdatePasswordForm() {
  const { mutate, isLoading, error, isSuccess } = useUpdatePassword();
  const { isLoading: isCheckingToken, error: tokenError, isValid: isTokenValid } = useRecoverySession();

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(UpdatePasswordFormSchema),
    mode: "onChange",
  });

  const watchedPassword = watch("password");
  const watchedConfirmPassword = watch("confirmPassword");

  const onSubmit = (data: UpdatePasswordFormData) => {
    mutate(data);
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const isSubmitDisabled = isLoading || !watchedPassword || !watchedConfirmPassword || !isValid;

  // ============================================================================
  // RENDER - LOADING STATE (checking token)
  // ============================================================================

  if (isCheckingToken) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <p className="text-gray-600">Weryfikowanie linku...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - INVALID TOKEN STATE
  // ============================================================================

  if (isTokenValid === false) {
    return (
      <div className="space-y-6 bg-white shadow-lg rounded-lg p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{tokenError || "Link resetujący wygasł lub jest nieprawidłowy."}</AlertDescription>
        </Alert>

        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">Poproś o nowy link do resetowania hasła.</p>
          <div className="flex flex-col gap-2">
            <a href="/reset-password" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
              Wyślij nowy link
            </a>
            <a href="/login" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
              Wróć do logowania
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - SUCCESS STATE
  // ============================================================================

  if (isSuccess) {
    return (
      <div className="space-y-6 bg-white shadow-lg rounded-lg p-8">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Hasło zostało pomyślnie zmienione! Za chwilę zostaniesz przekierowany do logowania.
          </AlertDescription>
        </Alert>

        <div className="text-center">
          <a href="/login" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
            Przejdź do logowania
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
        {/* New Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Nowe hasło <span className="text-red-600">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Co najmniej 8 znaków"
              disabled={isLoading}
              required
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={errors.password ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"}
              {...register("password")}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
              aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" role="alert" className="text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
            Potwierdź hasło <span className="text-red-600">*</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Wprowadź hasło ponownie"
              disabled={isLoading}
              required
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
              className={errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
              aria-label={showConfirmPassword ? "Ukryj hasło" : "Pokaż hasło"}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p id="confirm-password-error" role="alert" className="text-sm text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
          {isLoading ? "Aktualizowanie..." : "Ustaw nowe hasło"}
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
