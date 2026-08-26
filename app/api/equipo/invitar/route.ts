import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffForUser } from "@/lib/staff";
import { invitarStaff } from "@/lib/invitar-staff";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 403 });
  }

  const staff = await getStaffForUser(supabase, user.id);
  if (!staff || !staff.activo || staff.rol !== "admin") {
    return NextResponse.json({ ok: false, error: "Solo un admin puede invitar personas." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const nombre = typeof b.nombre === "string" ? b.nombre.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";

  if (!nombre || !email) {
    return NextResponse.json({ ok: false, error: "Nombre y email son obligatorios." }, { status: 400 });
  }

  const admin = createAdminClient();

  const resultado = await invitarStaff(
    {
      inviteUser: async (correo) => {
        const { data, error } = await admin.auth.admin.inviteUserByEmail(correo);
        if (error || !data.user) {
          return { error: error?.message ?? "No se pudo enviar la invitación." };
        }
        return { userId: data.user.id };
      },
      insertStaff: async (row) => {
        const { error } = await admin.from("staff_dashboard").insert(row);
        return error ? { error: error.message } : null;
      },
      deleteUser: async (userId) => {
        await admin.auth.admin.deleteUser(userId);
      },
    },
    { nombre, email }
  );

  if (!resultado.ok) {
    return NextResponse.json({ ok: false, error: resultado.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
