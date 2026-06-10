import type { CampanaEstado } from "@/types";

/**
 * Regla del 70% (lógica de negocio crítica, ver CLAUDE.md).
 * Al cerrar una campaña (fecha_limite alcanzada):
 *   - recaudado >= 70% de la meta  → 'exitosa' (transferir fondos a la vet)
 *   - recaudado <  70% de la meta  → 'no_financiada' (opciones para el donante)
 * La devolución en efectivo solo está disponible dentro de 72h del cierre.
 */
export const PORCENTAJE_MINIMO = 0.7;
export const HORAS_DEVOLUCION = 72;

export function porcentajeFinanciado(recaudado: number, meta: number): number {
  if (meta <= 0) return 0;
  return Math.round((recaudado / meta) * 100);
}

export function evaluarCierre(
  recaudado: number,
  meta: number
): Extract<CampanaEstado, "exitosa" | "no_financiada"> {
  return recaudado >= meta * PORCENTAJE_MINIMO ? "exitosa" : "no_financiada";
}

export function limiteDevolucion(cerradaEn: string | Date): Date {
  const base = new Date(cerradaEn);
  return new Date(base.getTime() + HORAS_DEVOLUCION * 60 * 60 * 1000);
}

export function ventanaDevolucionVigente(
  cerradaEn: string | Date | null,
  ahora: Date = new Date()
): boolean {
  if (!cerradaEn) return false;
  return ahora.getTime() < limiteDevolucion(cerradaEn).getTime();
}

export function horasRestantesDevolucion(
  cerradaEn: string | Date | null,
  ahora: Date = new Date()
): number {
  if (!cerradaEn) return 0;
  const ms = limiteDevolucion(cerradaEn).getTime() - ahora.getTime();
  return Math.max(0, Math.ceil(ms / (60 * 60 * 1000)));
}
