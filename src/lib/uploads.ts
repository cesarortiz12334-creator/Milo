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
