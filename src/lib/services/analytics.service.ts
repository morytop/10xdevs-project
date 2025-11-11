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

  const sanitizedMetadata = sanitizeMetadata(metadata);

  try {
    await supabase.from("analytics_events").insert({
      user_id: userId,
      action_type: actionType,
      timestamp: new Date().toISOString(),
      metadata: sanitizedMetadata,
    });
  } catch {
    // Ignore analytics errors
  }
}

function sanitizeMetadata(metadata: AnalyticsMetadata | undefined) {
  if (metadata === undefined || metadata === null) {
    return null;
  }

  if (Array.isArray(metadata)) {
    return metadata.length > 0 ? metadata : null;
  }

  if (typeof metadata === "object") {
    const entries = Object.entries(metadata).filter(([, value]) => value !== undefined);

    if (entries.length === 0) {
      return null;
    }

    return Object.fromEntries(entries);
  }

  return metadata;
}
