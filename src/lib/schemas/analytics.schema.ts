import { z } from "zod";

import { Constants } from "@/db/database.types";

const { action_type_enum } = Constants.public.Enums;

/**
 * Schema dla logowania zdarzeń analitycznych (POST /api/analytics/events)
 *
 * Uwaga: user_id i timestamp są generowane po stronie serwera i nie są
 * częścią schematu walidacji
 */
export const logAnalyticsEventSchema = z.object({
  action_type: z.enum(action_type_enum, {
    errorMap: () => ({ message: "Nieprawidłowy typ akcji" }),
  }),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export type LogAnalyticsEventInput = z.infer<typeof logAnalyticsEventSchema>;
