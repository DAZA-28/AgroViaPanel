import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffForUser } from "@/lib/staff";
import { EquipoTable } from "./EquipoTable";
import type { StaffRow } from "@/lib/types";

export default async function EquipoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const staff = await getStaffForUser(supabase, user.id);
  if (!staff || staff.rol !== "admin") redirect("/");

  const { data: equipo } = await supabase.from("staff_dashboard").select("*").order("nombre");

  return (
    <div>
      <h1 style={{ color: "var(--primary)" }}>Equipo</h1>
      <EquipoTable equipoInicial={(equipo ?? []) as StaffRow[]} miPropioId={staff.id} />
    </div>
  );
}
