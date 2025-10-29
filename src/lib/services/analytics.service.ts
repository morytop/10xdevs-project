import type { Database } from "@/db/database.types";
import type { SupabaseClient } from "@/db/supabase.client";
import type { ActionType } from "@/types";

type AnalyticsMetadata = Database["public"]["Tables"]["analytics_events"]["Insert"]["metadata"];

export async function logAnalyticsEvent(
  supabase: SupabaseClient,
  userId: string,
  actionType: ActionType,
  metadata?: AnalyticsMetadata
) {
  if (!userId) {
    return;
  }

  try {
    await supabase.from("analytics_events").insert({
      user_id: userId,
      action_type: actionType,
      timestamp: new Date().toISOString(),
      metadata: metadata ?? null,
    });
  } catch (error) {
    console.error("Analytics logging failed:", error);
  }
}
