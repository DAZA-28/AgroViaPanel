import { describe, expect, it, vi } from "vitest";
import { getStaffForUser } from "./staff";

function fakeSupabase(row: unknown, error: unknown = null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: row, error }),
        }),
      }),
    }),
  } as any;
}

describe("getStaffForUser", () => {
  it("devuelve la fila de staff cuando existe", async () => {
    const supabase = fakeSupabase({ id: 1, user_id: "u1", rol: "admin", activo: true });
    const result = await getStaffForUser(supabase, "u1");
    expect(result?.rol).toBe("admin");
  });

  it("devuelve null cuando no hay fila de staff", async () => {
    const supabase = fakeSupabase(null);
    const result = await getStaffForUser(supabase, "u2");
    expect(result).toBeNull();
  });
});
