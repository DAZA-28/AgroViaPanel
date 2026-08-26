import { describe, expect, it, vi } from "vitest";
import { invitarStaff, type InvitarStaffDeps } from "./invitar-staff";

function crearDeps(overrides: Partial<InvitarStaffDeps> = {}): InvitarStaffDeps {
  return {
    inviteUser: vi.fn(async () => ({ userId: "user-1" })),
    insertStaff: vi.fn(async () => null),
    deleteUser: vi.fn(async () => {}),
    ...overrides,
  };
}

describe("invitarStaff", () => {
  it("invita y crea el registro de staff cuando todo sale bien", async () => {
    const deps = crearDeps();

    const resultado = await invitarStaff(deps, { nombre: "Ana", email: "ana@example.com" });

    expect(resultado).toEqual({ ok: true });
    expect(deps.insertStaff).toHaveBeenCalledWith({
      user_id: "user-1",
      nombre: "Ana",
      email: "ana@example.com",
      rol: "operador",
      activo: true,
    });
    expect(deps.deleteUser).not.toHaveBeenCalled();
  });

  it("si falla la invitación, no intenta insertar ni borrar nada", async () => {
    const deps = crearDeps({
      inviteUser: vi.fn(async () => ({ error: "correo inválido" })),
    });

    const resultado = await invitarStaff(deps, { nombre: "Ana", email: "mal" });

    expect(resultado).toEqual({ ok: false, error: "correo inválido" });
    expect(deps.insertStaff).not.toHaveBeenCalled();
    expect(deps.deleteUser).not.toHaveBeenCalled();
  });

  it("si falla el insert de staff, hace rollback del usuario de Auth ya creado", async () => {
    const deps = crearDeps({
      insertStaff: vi.fn(async () => ({ error: "columna rol inválida" })),
    });

    const resultado = await invitarStaff(deps, { nombre: "Ana", email: "ana@example.com" });

    expect(resultado).toEqual({
      ok: false,
      error: "Se envió la invitación pero no se pudo crear el registro de staff: columna rol inválida",
    });
    expect(deps.deleteUser).toHaveBeenCalledWith("user-1");
  });
});
