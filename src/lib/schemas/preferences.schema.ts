import { z } from "zod";

import { Constants } from "@/db/database.types";

const { health_goal_enum, diet_type_enum } = Constants.public.Enums;

export const CreatePreferencesSchema = z.object({
  health_goal: z.enum(health_goal_enum, {
    errorMap: () => ({ message: "Pole 'cel zdrowotny' jest wymagane" }),
  }),
  diet_type: z.enum(diet_type_enum, {
    errorMap: () => ({ message: "Pole 'typ diety' jest wymagane" }),
  }),
  activity_level: z
    .number({ invalid_type_error: "Poziom aktywności musi być liczbą całkowitą" })
    .int("Poziom aktywności musi być liczbą całkowitą")
    .min(1, "Poziom aktywności musi być od 1 do 5")
    .max(5, "Poziom aktywności musi być od 1 do 5"),
  allergies: z
    .array(z.string().trim().min(1, "Pole nie może być puste"))
    .max(10, "Możesz wybrać maksymalnie 10 alergii")
    .optional()
    .nullable(),
  disliked_products: z
    .array(z.string().trim().min(1, "Pole nie może być puste"))
    .max(20, "Możesz dodać maksymalnie 20 produktów nielubanych")
    .optional()
    .nullable(),
});

export type CreatePreferencesInput = z.infer<typeof CreatePreferencesSchema>;
