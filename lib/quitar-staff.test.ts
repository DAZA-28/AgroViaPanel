import { describe, expect, it, vi } from "vitest";
import { quitarStaff, type QuitarStaffDeps } from "./quitar-staff";

function crearDeps(overrides: Partial<QuitarStaffDeps> = {}): QuitarStaffDeps {
  return {
    deleteStaffRow: vi.fn(async () => null),
    ...overrides,
  };
}

describe("quitarStaff", () => {
  it("borra la fila de staff cuando el id no es el del que llama", async () => {
    const deps = crearDeps();

    const resultado = await quitarStaff(deps, { idAQuitar: 2, callerId: 1 });

    expect(resultado).toEqual({ ok: true });
    expect(deps.deleteStaffRow).toHaveBeenCalledWith(2);
  });

  it("no permite que alguien se quite a sí mismo", async () => {
    const deps = crearDeps();

    const resultado = await quitarStaff(deps, { idAQuitar: 1, callerId: 1 });

    expect(resultado).toEqual({ ok: false, error: "No podés quitarte a vos mismo del equipo." });
    expect(deps.deleteStaffRow).not.toHaveBeenCalled();
  });

  it("propaga el error si falla el borrado", async () => {
    const deps = crearDeps({
      deleteStaffRow: vi.fn(async () => ({ error: "no encontrado" })),
    });

    const resultado = await quitarStaff(deps, { idAQuitar: 5, callerId: 1 });

    expect(resultado).toEqual({ ok: false, error: "no encontrado" });
  });
});
