import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCountUp } from "./useCountUp";

describe("useCountUp", () => {
  it("empieza en 0 al montar", () => {
    const { result } = renderHook(() => useCountUp(28, 900));
    expect(result.current).toBe(0);
  });

  it("llega al valor objetivo cuando termina la duración", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCountUp(28, 900));

    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(result.current).toBe(28);
    vi.useRealTimers();
  });

  it("con objetivo 0 se queda en 0", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCountUp(0, 900));

    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(result.current).toBe(0);
    vi.useRealTimers();
  });
});
