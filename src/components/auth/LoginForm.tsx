import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/useAuth";
import { LoginFormSchema, type LoginFormData } from "@/lib/schemas/auth.schema";

/**
 * LoginForm Component
 *
 * Main interactive login form. Manages form state, client-side validation,
 * Supabase Auth communication, and error handling.
 * Component is fully accessible and responsive.
 */
export function LoginForm() {
  const { mutate, isLoading, error } = useLogin();
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginFormSchema),
    mode: "onChange",
  });

  const watchedEmail = watch("email");
  const watchedPassword = watch("password");

  const onSubmit = (data: LoginFormData) => {
    mutate(data);
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const isSubmitDisabled = isLoading || !watchedEmail || !watchedPassword || !isValid;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="bg-white shadow-lg rounded-lg p-8">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Zaloguj się</h1>
        <p className="text-gray-600">Wpisz swoje dane, aby uzyskać dostęp do konta</p>
      </div>

      {/* General Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md" role="alert">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Form Section */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </Label>
          <Input
            type="email"
            id="email"
            autoComplete="email"
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-red-600" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Hasło
          </Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              aria-required="true"
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
            <p id="password-error" className="text-sm text-red-600" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitDisabled} className="w-full">
          {isLoading ? "Logowanie..." : "Zaloguj się"}
        </Button>
      </form>

      {/* Password Reset Link */}
      <div className="mt-4 text-center">
        <a href="/reset-password" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
          Nie pamiętam hasła
        </a>
      </div>

      {/* Register Link */}
      <div className="mt-6 text-center text-sm text-gray-600">
        Nie masz konta?{" "}
        <a href="/register" className="text-blue-600 hover:text-blue-500 font-medium">
          Zarejestruj się
        </a>
      </div>
    </div>
  );
}
