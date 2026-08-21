import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffForUser } from "@/lib/staff";
import { EquipoTable } from "./EquipoTable";
import { InvitarForm } from "./InvitarForm";
import type { StaffRow } from "@/lib/types";

export default async function EquipoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login.html");

  const staff = await getStaffForUser(supabase, user.id);
  if (!staff || staff.rol !== "admin") redirect("/");

  const { data: equipo } = await supabase.from("staff_dashboard").select("*").order("nombre");

  return (
    <div>
      <div className="page-header">
        <h1>Equipo</h1>
        <p>Staff con acceso al panel de AgroVia.</p>
      </div>
      <InvitarForm />
      <EquipoTable equipoInicial={(equipo ?? []) as StaffRow[]} miPropioId={staff.id} />
    </div>
  );
}
