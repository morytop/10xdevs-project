import { z } from "zod";

import { Constants } from "@/db/database.types";

const { health_goal_enum, diet_type_enum } = Constants.public.Enums;

const allergiesSchema = z
  .array(z.string().trim().min(1, "Pole nie może być puste"))
  .max(10, "Możesz wybrać maksymalnie 10 alergii");

const dislikedProductsSchema = z
  .array(z.string().trim().min(1, "Pole nie może być puste"))
  .max(20, "Możesz dodać maksymalnie 20 produktów nielubanych");

const activityLevelSchema = z
  .number({ invalid_type_error: "Poziom aktywności musi być liczbą całkowitą" })
  .int("Poziom aktywności musi być liczbą całkowitą")
  .min(1, "Poziom aktywności musi być od 1 do 5")
  .max(5, "Poziom aktywności musi być od 1 do 5");

export const CreatePreferencesSchema = z.object({
  health_goal: z.enum(health_goal_enum, {
    errorMap: () => ({ message: "Pole 'cel zdrowotny' jest wymagane" }),
  }),
  diet_type: z.enum(diet_type_enum, {
    errorMap: () => ({ message: "Pole 'typ diety' jest wymagane" }),
  }),
  activity_level: activityLevelSchema,
  allergies: allergiesSchema.optional().nullable(),
  disliked_products: dislikedProductsSchema.optional().nullable(),
});

/**
 * Frontend form schema - validates form data with empty states
 * Converts empty strings to enum values only on valid input
 */
export const PreferencesFormSchema = z.object({
  health_goal: z.union([z.enum(health_goal_enum), z.literal("")]).refine((val) => val !== "", {
    message: "Pole 'cel zdrowotny' jest wymagane",
  }),
  diet_type: z.union([z.enum(diet_type_enum), z.literal("")]).refine((val) => val !== "", {
    message: "Pole 'typ diety' jest wymagane",
  }),
  activity_level: z
    .number({
      required_error: "Pole 'poziom aktywności' jest wymagane",
      invalid_type_error: "Poziom aktywności musi być liczbą",
    })
    .int("Poziom aktywności musi być liczbą całkowitą")
    .min(1, "Poziom aktywności musi być od 1 do 5")
    .max(5, "Poziom aktywności musi być od 1 do 5")
    .nullable()
    .refine((val) => val !== null, {
      message: "Pole 'poziom aktywności' jest wymagane",
    }),
  allergies: allergiesSchema.default([]),
  disliked_products: dislikedProductsSchema.default([]),
});

export const UpdatePreferencesSchema = z
  .object({
    health_goal: z
      .enum(health_goal_enum, {
        errorMap: () => ({ message: "Nieprawidłowa wartość celu zdrowotnego" }),
      })
      .optional(),
    diet_type: z
      .enum(diet_type_enum, {
        errorMap: () => ({ message: "Nieprawidłowa wartość typu diety" }),
      })
      .optional(),
    activity_level: activityLevelSchema.optional(),
    allergies: z.union([allergiesSchema, z.null()]).optional(),
    disliked_products: z.union([dislikedProductsSchema, z.null()]).optional(),
  })
  .refine((value) => Object.values(value).some((val) => val !== undefined), {
    message: "Aktualizacja preferencji musi zawierać co najmniej jedno pole",
    path: [],
  });

export type CreatePreferencesInput = z.infer<typeof CreatePreferencesSchema>;
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;
export type PreferencesFormInput = z.infer<typeof PreferencesFormSchema>;
