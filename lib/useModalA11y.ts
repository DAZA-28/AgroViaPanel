import { useEffect, useRef, type RefObject } from "react";

const SELECTOR_ENFOCABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Escape cierra el modal; Tab/Shift+Tab quedan atrapados dentro del panel; el
 * foco inicial entra al primer elemento enfocable del panel al montar.
 */
export function useModalA11y<T extends HTMLElement>(onClose: () => void): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    function getFocusable(): HTMLElement[] {
      return Array.from(node!.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLE));
    }

    const focusable = getFocusable();
    (focusable[0] ?? node).focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return ref;
}
