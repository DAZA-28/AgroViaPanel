export type InvitarStaffDeps = {
  inviteUser: (email: string) => Promise<{ userId: string } | { error: string }>;
  insertStaff: (row: {
    user_id: string;
    nombre: string;
    email: string;
    rol: string;
    activo: boolean;
  }) => Promise<{ error: string } | null>;
  deleteUser: (userId: string) => Promise<void>;
};

export type InvitarStaffInput = { nombre: string; email: string };

export type InvitarStaffResult = { ok: true } | { ok: false; error: string };

export async function invitarStaff(
  deps: InvitarStaffDeps,
  input: InvitarStaffInput
): Promise<InvitarStaffResult> {
  const invitado = await deps.inviteUser(input.email);
  if ("error" in invitado) {
    return { ok: false, error: invitado.error };
  }

  const errorInsert = await deps.insertStaff({
    user_id: invitado.userId,
    nombre: input.nombre,
    email: input.email,
    rol: "operador",
    activo: true,
  });

  if (errorInsert) {
    await deps.deleteUser(invitado.userId);
    return {
      ok: false,
      error: `Se envió la invitación pero no se pudo crear el registro de staff: ${errorInsert.error}`,
    };
  }

  return { ok: true };
}
