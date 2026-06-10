import { createHash } from "crypto";

/** Normaliza un RUT: quita puntos y espacios, minúsculas, conserva el guión. */
export function normalizarRut(rut: string): string {
  return rut.replace(/[.\s]/g, "").toLowerCase().trim();
}

/**
 * Hash SHA-256 del RUT normalizado. El RUT del solicitante se guarda hasheado
 * (rut_hash); el cruce cartola-vs-registro se hace comparando hashes.
 */
export function hashRut(rut: string): string {
  return createHash("sha256").update(normalizarRut(rut)).digest("hex");
}

/** Valida el formato y el dígito verificador (módulo 11) de un RUT chileno. */
export function rutValido(rut: string): boolean {
  const limpio = rut.replace(/[.\-\s]/g, "");
  if (!/^\d{7,8}[\dkK]$/.test(limpio)) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1).toLowerCase();
  let suma = 0;
  let mul = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const resto = 11 - (suma % 11);
  const dvCalc = resto === 11 ? "0" : resto === 10 ? "k" : String(resto);
  return dv === dvCalc;
}

/** Extrae el primer RUT que aparezca en un texto (con o sin puntos). */
export function extraerRut(texto: string): string | null {
  const m = texto.match(/\b\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\b/);
  return m ? m[0] : null;
}
