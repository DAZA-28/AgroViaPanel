import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffForUser } from "@/lib/staff";
import { quitarStaff } from "@/lib/quitar-staff";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 403 });
  }

  const staff = await getStaffForUser(supabase, user.id);
  if (!staff || !staff.activo || staff.rol !== "admin") {
    return NextResponse.json({ ok: false, error: "Solo un admin puede quitar personas del equipo." }, { status: 403 });
  }

  const { id } = await params;
  const idAQuitar = Number(id);
  if (!Number.isInteger(idAQuitar)) {
    return NextResponse.json({ ok: false, error: "Id inválido." }, { status: 400 });
  }

  const admin = createAdminClient();

  const resultado = await quitarStaff(
    {
      deleteStaffRow: async (rowId) => {
        const { error } = await admin.from("staff_dashboard").delete().eq("id", rowId);
        return error ? { error: error.message } : null;
      },
    },
    { idAQuitar, callerId: staff.id }
  );

  if (!resultado.ok) {
    return NextResponse.json({ ok: false, error: resultado.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
