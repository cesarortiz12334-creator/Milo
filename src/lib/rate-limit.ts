/**
 * Rate limiter de ventana fija, en memoria.
 *
 * ⚠️ Es POR INSTANCIA: en un entorno serverless con varias instancias (Vercel)
 * no es un límite global. Para producción real, reemplazar el `store` por un
 * backend compartido (Upstash Redis / Vercel KV). La interfaz `rateLimit()` no
 * cambiaría.
 */
interface Registro {
  count: number;
  resetEn: number;
}

type Store = Map<string, Registro>;
type GlobalConStore = typeof globalThis & { __miloRateLimit?: Store };

const g = globalThis as GlobalConStore;
const store: Store = g.__miloRateLimit ?? new Map();
g.__miloRateLimit = store;

export interface ResultadoRate {
  ok: boolean;
  restante: number;
  resetEn: number;
}

export function rateLimit(
  clave: string,
  limite: number,
  ventanaMs: number
): ResultadoRate {
  const ahora = Date.now();
  const reg = store.get(clave);

  if (!reg || ahora > reg.resetEn) {
    store.set(clave, { count: 1, resetEn: ahora + ventanaMs });
    return { ok: true, restante: limite - 1, resetEn: ahora + ventanaMs };
  }
  if (reg.count >= limite) {
    return { ok: false, restante: 0, resetEn: reg.resetEn };
  }
  reg.count += 1;
  return { ok: true, restante: limite - reg.count, resetEn: reg.resetEn };
}

// Ventanas de tiempo útiles (ms).
export const MINUTO = 60_000;
export const HORA = 60 * MINUTO;
export const DIA = 24 * HORA;
