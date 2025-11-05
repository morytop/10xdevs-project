import { z } from "zod";

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

const emailSchema = z.string().trim().min(1, "Email jest wymagany").email("Podaj prawidłowy adres email");

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

const passwordSchema = z.string().trim().min(1, "Hasło jest wymagane").min(8, "Hasło musi mieć minimum 8 znaków");

// ============================================================================
// LOGIN FORM SCHEMA
// ============================================================================

/**
 * Schema for login form validation
 */
export const LoginFormSchema = z.object({
  email: emailSchema,
  password: z.string().trim().min(1, "Hasło jest wymagane"),
});

/**
 * Type inference for login form data
 */
export type LoginFormData = z.infer<typeof LoginFormSchema>;

// ============================================================================
// REGISTER FORM SCHEMA
// ============================================================================

/**
 * Schema for register form validation
 */
export const RegisterFormSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    passwordConfirmation: z.string().trim().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Hasła muszą być identyczne",
    path: ["passwordConfirmation"],
  });

/**
 * Type inference for register form data
 */
export type RegisterFormData = z.infer<typeof RegisterFormSchema>;

// ============================================================================
// RESET PASSWORD FORM SCHEMA
// ============================================================================

/**
 * Schema for reset password form validation
 */
export const ResetPasswordFormSchema = z.object({
  email: emailSchema,
});

/**
 * Type inference for reset password form data
 */
export type ResetPasswordFormData = z.infer<typeof ResetPasswordFormSchema>;

// ============================================================================
// UPDATE PASSWORD FORM SCHEMA
// ============================================================================

/**
 * Schema for update password form validation
 */
export const UpdatePasswordFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().trim().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

/**
 * Type inference for update password form data
 */
export type UpdatePasswordFormData = z.infer<typeof UpdatePasswordFormSchema>;

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

/**
 * Schema for login/register API response
 */
export const AuthResponseSchema = z.object({
  user: z
    .object({
      id: z.string(),
      email: z.string(),
    })
    .nullable(),
  session: z
    .object({
      access_token: z.string(),
      refresh_token: z.string(),
      expires_at: z.number(),
    })
    .nullable(),
  requiresConfirmation: z.boolean().optional(),
});

/**
 * Schema for reset password API response
 */
export const ResetPasswordResponseSchema = z.object({
  success: z.boolean(),
});

/**
 * Type inference for auth response
 */
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

/**
 * Type inference for reset password response
 */
export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;
