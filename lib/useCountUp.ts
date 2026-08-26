import { useEffect, useState } from "react";

const PASOS = 20;

/** Anima un número entero de 0 hasta `target` con una curva ease-out. */
export function useCountUp(target: number, durationMs = 900): number {
  const [valor, setValor] = useState(0);

  // Reiniciar a 0 cuando cambia el objetivo: se hace durante el render (no en el
  // efecto) para no disparar el lint de "setState síncrono dentro de un efecto".
  // Usa estado (no ref) para el valor anterior porque los refs no se pueden leer
  // durante el render.
  const [targetAnterior, setTargetAnterior] = useState(target);
  if (targetAnterior !== target) {
    setTargetAnterior(target);
    setValor(0);
  }

  useEffect(() => {
    if (target === 0) return;

    let paso = 0;
    const intervalo = setInterval(() => {
      paso += 1;
      const progreso = Math.min(paso / PASOS, 1);
      const suavizado = 1 - Math.pow(1 - progreso, 3);
      setValor(Math.round(target * suavizado));
      if (paso >= PASOS) clearInterval(intervalo);
    }, durationMs / PASOS);

    return () => clearInterval(intervalo);
  }, [target, durationMs]);

  return valor;
}
