/**
 * Lógica de donaciones (no va en componentes).
 *
 * Interpretación de la comisión: el donante paga el monto que elige; Milo
 * retiene el 5% como comisión y la campaña recibe el resto (neto). El 5%
 * SIEMPRE debe mostrarse antes de confirmar (ver CLAUDE.md).
 */
export const COMISION_PCT = 0.05;
export const MONTOS_SUGERIDOS = [5000, 10000, 20000, 50000] as const;
export const MONTO_MINIMO = 1000;

/** Comisión de Milo (5% del monto donado), redondeada a peso entero. */
export function calcularComision(monto: number): number {
  return Math.round(monto * COMISION_PCT);
}

/** Monto neto que recibe la campaña (monto - comisión). */
export function calcularNeto(monto: number): number {
  return monto - calcularComision(monto);
}

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function formatearCLP(monto: number): string {
  return clp.format(monto);
}
