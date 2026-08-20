import type { SupabaseClient } from "@supabase/supabase-js";
import type { StaffRow } from "./types";

export async function getStaffForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<StaffRow | null> {
  const { data, error } = await supabase
    .from("staff_dashboard")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as StaffRow;
}
