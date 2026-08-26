export type QuitarStaffDeps = {
  deleteStaffRow: (id: number) => Promise<{ error: string } | null>;
};

export type QuitarStaffInput = { idAQuitar: number; callerId: number };

export type QuitarStaffResult = { ok: true } | { ok: false; error: string };

export async function quitarStaff(deps: QuitarStaffDeps, input: QuitarStaffInput): Promise<QuitarStaffResult> {
  if (input.idAQuitar === input.callerId) {
    return { ok: false, error: "No podés quitarte a vos mismo del equipo." };
  }

  const error = await deps.deleteStaffRow(input.idAQuitar);
  if (error) {
    return { ok: false, error: error.error };
  }

  return { ok: true };
}
