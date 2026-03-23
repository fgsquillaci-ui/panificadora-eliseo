import { supabase } from "@/integrations/supabase/client";

export async function logOrderAction(
  orderId: string,
  action: "created" | "status_change" | "edited",
  oldValue?: string | null,
  newValue?: string | null
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("order_history").insert({
    order_id: orderId,
    action,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
    user_id: user.id,
  } as any);
}

export async function logError(message: string, context?: Record<string, unknown>) {
  try {
    await supabase.from("error_logs").insert({
      message,
      context: context ?? {},
    } as any);
  } catch {
    console.error("[logError] failed to log:", message);
  }
}
