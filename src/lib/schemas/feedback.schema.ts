import { z } from "zod";

import { Constants } from "@/db/database.types";

const { rating_enum } = Constants.public.Enums;

/**
 * Schema dla tworzenia feedbacku (POST /api/feedback)
 */
export const createFeedbackSchema = z.object({
  rating: z.enum(rating_enum, {
    errorMap: () => ({ message: "Ocena jest wymagana i musi być THUMBS_UP lub THUMBS_DOWN" }),
  }),
  comment: z
    .string()
    .max(500, { message: "Komentarz może mieć maksymalnie 500 znaków" })
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
});

/**
 * Schema dla aktualizacji feedbacku (PUT /api/feedback/:id)
 * Co najmniej jedno pole musi być podane
 */
export const updateFeedbackSchema = z
  .object({
    rating: z.enum(rating_enum).optional(),
    comment: z
      .string()
      .max(500, { message: "Komentarz może mieć maksymalnie 500 znaków" })
      .optional()
      .or(z.literal(""))
      .transform((val) => (val === "" ? undefined : val)),
  })
  .refine((data) => data.rating !== undefined || data.comment !== undefined, {
    message: "Co najmniej jedno pole (rating lub comment) musi być podane",
  });

/**
 * Schema dla UUID w URL params
 */
export const feedbackIdSchema = z.string().uuid({
  message: "Nieprawidłowy format ID opinii",
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;
