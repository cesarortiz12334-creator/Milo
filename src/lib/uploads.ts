/**
 * Validación de archivos subidos (ver CLAUDE.md):
 * imágenes JPG/PNG y documentos PDF, máximo 5MB. Sin dependencias de servidor,
 * por lo que el cliente puede validar antes de enviar.
 */
export const TIPOS_IMAGEN = ["image/jpeg", "image/png"];
export const TIPOS_PDF = ["application/pdf"];
export const TIPOS_DOCUMENTO = ["application/pdf", "image/jpeg", "image/png"];
export const MAX_MB = 5;

const ETIQUETA: Record<string, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "application/pdf": "PDF",
};

export function validarArchivo(
  file: File,
  opts: { tipos: string[]; maxMB: number }
): string | null {
  if (!opts.tipos.includes(file.type)) {
    const permitidos = opts.tipos.map((t) => ETIQUETA[t] ?? t).join(", ");
    return `Tipo de archivo no permitido. Usa ${permitidos}.`;
  }
  if (file.size > opts.maxMB * 1024 * 1024) {
    return `El archivo supera el máximo de ${opts.maxMB} MB.`;
  }
  return null;
}

/** Detecta el tipo REAL por los magic bytes (no confía en la extensión/MIME). */
function detectarTipoReal(b: Uint8Array): string | null {
  if (b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46)
    return "application/pdf"; // %PDF
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)
    return "image/jpeg";
  if (
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47
  )
    return "image/png"; // \x89PNG
  return null;
}

/** Heurística: ¿el PDF trae JavaScript/acciones embebidas? (anti-fraude). */
function pdfTieneJavaScript(b: Uint8Array): boolean {
  const texto = new TextDecoder("latin1").decode(b);
  return /\/JavaScript\b/.test(texto) || /\/JS\b/.test(texto) || /\/OpenAction\b/.test(texto) || /\/AA\b/.test(texto);
}

/**
 * Verificación profunda del CONTENIDO del archivo en el servidor:
 *  - el tipo real (magic bytes) debe estar dentro de los permitidos,
 *  - los PDF con JavaScript embebido se rechazan.
 * Llamar SIEMPRE en el servidor además de `validarArchivo`.
 */
export async function verificarContenidoArchivo(
  file: File,
  tiposPermitidos: string[]
): Promise<string | null> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const tipoReal = detectarTipoReal(bytes);
  if (!tipoReal || !tiposPermitidos.includes(tipoReal)) {
    return "El contenido del archivo no corresponde a un PDF/JPG/PNG válido.";
  }
  if (tipoReal === "application/pdf" && pdfTieneJavaScript(bytes)) {
    return "El PDF contiene JavaScript embebido y fue rechazado por seguridad.";
  }
  return null;
}
