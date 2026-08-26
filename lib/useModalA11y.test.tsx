import { describe, expect, it, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { useModalA11y } from "./useModalA11y";

function Harness({ onClose }: { onClose: () => void }) {
  const ref = useModalA11y<HTMLDivElement>(onClose);
  return (
    <div ref={ref} tabIndex={-1}>
      <button>Primero</button>
      <button>Segundo</button>
    </div>
  );
}

describe("useModalA11y", () => {
  it("mueve el foco al primer elemento enfocable al montar", () => {
    render(<Harness onClose={vi.fn()} />);
    expect(document.activeElement).toBe(screen.getByText("Primero"));
  });

  it("Escape llama a onClose", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Tab desde el último elemento enfocable vuelve al primero", () => {
    render(<Harness onClose={vi.fn()} />);
    const primero = screen.getByText("Primero");
    const segundo = screen.getByText("Segundo");
    segundo.focus();

    fireEvent.keyDown(document, { key: "Tab" });

    expect(document.activeElement).toBe(primero);
  });

  it("Shift+Tab desde el primer elemento va al último", () => {
    render(<Harness onClose={vi.fn()} />);
    const primero = screen.getByText("Primero");
    const segundo = screen.getByText("Segundo");
    primero.focus();

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(segundo);
  });
});
