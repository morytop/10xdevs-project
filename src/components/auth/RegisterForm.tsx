import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@/hooks/useAuth";
import { RegisterFormSchema, type RegisterFormData } from "@/lib/schemas/auth.schema";

/**
 * RegisterForm component
 * Main registration form with validation, Supabase Auth integration,
 * and complete form state management
 */
export default function RegisterForm() {
  const { mutate, isLoading, error } = useRegister();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterFormSchema),
    mode: "onChange",
  });

  const watchedEmail = watch("email");
  const watchedPassword = watch("password");
  const watchedPasswordConfirmation = watch("passwordConfirmation");

  const onSubmit = (data: RegisterFormData) => {
    mutate(data);
  };

  const togglePasswordVisibility = (field: "password" | "passwordConfirmation") => {
    if (field === "password") {
      setShowPassword((prev) => !prev);
    } else {
      setShowPasswordConfirmation((prev) => !prev);
    }
  };

  const isSubmitDisabled = isLoading || !watchedEmail || !watchedPassword || !watchedPasswordConfirmation || !isValid;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="bg-white shadow-lg rounded-lg p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Zarejestruj się</h1>
        <p className="text-gray-600">Załóż konto i zacznij korzystać z AI Meal Planner</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </Label>
          <Input
            type="email"
            id="email"
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-red-600 mt-1" role="alert">
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
              aria-required="true"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : "password-helper"}
              className={errors.password ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("password")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p id="password-helper" className="text-sm text-gray-500">
            Minimum 8 znaków
          </p>
          {errors.password && (
            <p id="password-error" className="text-sm text-red-600 mt-1" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Password Confirmation Field */}
        <div className="space-y-2">
          <Label htmlFor="passwordConfirmation" className="text-sm font-medium text-gray-700">
            Powtórz hasło
          </Label>
          <div className="relative">
            <Input
              type={showPasswordConfirmation ? "text" : "password"}
              id="passwordConfirmation"
              aria-required="true"
              aria-invalid={!!errors.passwordConfirmation}
              aria-describedby={errors.passwordConfirmation ? "passwordConfirmation-error" : undefined}
              className={errors.passwordConfirmation ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"}
              {...register("passwordConfirmation")}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("passwordConfirmation")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label={showPasswordConfirmation ? "Ukryj hasło" : "Pokaż hasło"}
            >
              {showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.passwordConfirmation && (
            <p id="passwordConfirmation-error" className="text-sm text-red-600 mt-1" role="alert">
              {errors.passwordConfirmation.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitDisabled} className="w-full">
          {isLoading ? "Rejestracja..." : "Zarejestruj się"}
        </Button>
      </form>

      {/* Login Link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Masz już konto?{" "}
          <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Zaloguj się
          </a>
        </p>
      </div>
    </div>
  );
}
