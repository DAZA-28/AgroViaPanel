import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffForUser } from "@/lib/staff";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 403 });
  }

  const staff = await getStaffForUser(supabase, user.id);
  if (!staff || staff.rol !== "admin") {
    return NextResponse.json({ ok: false, error: "Solo un admin puede invitar personas." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const nombre = typeof (body as any).nombre === "string" ? (body as any).nombre.trim() : "";
  const email = typeof (body as any).email === "string" ? (body as any).email.trim() : "";

  if (!nombre || !email) {
    return NextResponse.json({ ok: false, error: "Nombre y email son obligatorios." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: invitado, error: errorInvitacion } = await admin.auth.admin.inviteUserByEmail(email);

  if (errorInvitacion || !invitado.user) {
    return NextResponse.json({ ok: false, error: errorInvitacion?.message ?? "No se pudo enviar la invitación." }, { status: 500 });
  }

  const { error: errorInsert } = await admin
    .from("staff_dashboard")
    .insert({ user_id: invitado.user.id, nombre, email, rol: "operador", activo: true });

  if (errorInsert) {
    return NextResponse.json({ ok: false, error: `Se envió la invitación pero no se pudo crear el registro de staff: ${errorInsert.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
