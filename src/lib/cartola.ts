import { extractText, getDocumentProxy, getMeta } from "unpdf";
import { extraerRut, hashRut } from "@/lib/rut";

/**
 * Validación server-side de la Cartola Hogar del RSH (PDF).
 *
 * ⚠️⚠️ CALIBRAR CON CARTOLAS REALES ⚠️⚠️
 * No se tuvo un PDF de cartola de muestra al construir esto. Los patrones de
 * extracción (RUT, fecha de emisión, tramo) y la firma del PDF (Producer/Creator)
 * son SUPUESTOS razonables que DEBEN verificarse y ajustarse contra cartolas
 * reales antes de producción. Idealmente, además, verificar el código/QR de la
 * cartola contra el sistema del Estado (la validación más robusta).
 */

// Editores comunes: si el PDF fue generado/guardado por uno de estos, se asume
// editado. Heurística spoofable; lo ideal es migrar a una ALLOWLIST del Producer
// real del software del Estado una vez conocido.
const EDITORES_PROHIBIDOS = [
  /acrobat/i,
  /microsoft word/i,
  /\bword\b/i,
  /libreoffice/i,
  /openoffice/i,
  /\bpages\b/i,
  /photoshop/i,
  /illustrator/i,
  /canva/i,
  /google docs/i,
];
const DIAS_VIGENCIA = 90;
const TRAMO_MAXIMO = 40;

export interface ResultadoCartola {
  ok: boolean;
  error?: string;
  datos?: { rutExtraido: string; tramo: number; fechaEmision: string };
}

export async function validarCartola(
  file: File,
  rutHashRegistrado: string
): Promise<ResultadoCartola> {
  let texto = "";
  let producer = "";
  let creator = "";
  let creationDate: Date | null = null;

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(bytes);
    const res = await extractText(pdf, { mergePages: true });
    texto = res.text;
    const meta = await getMeta(pdf, { parseDates: true });
    producer = String(meta.info?.Producer ?? "");
    creator = String(meta.info?.Creator ?? "");
    const cd = meta.info?.CreationDate;
    creationDate = cd instanceof Date ? cd : null;
  } catch {
    return {
      ok: false,
      error: "No pudimos leer el PDF de la cartola. Sube el archivo original sin modificar.",
    };
  }

  // 1. Anti-edición: el PDF no debe venir de un editor común.
  if (EDITORES_PROHIBIDOS.some((re) => re.test(`${producer} ${creator}`))) {
    return {
      ok: false,
      error:
        "La cartola parece editada. Sube el PDF original descargado del Estado, sin abrirlo ni guardarlo en otro programa.",
    };
  }

  // 2. El RUT de la cartola debe coincidir con el del registro (comparando hashes).
  const rutExtraido = extraerRut(texto);
  if (!rutExtraido) {
    return {
      ok: false,
      error: "No pudimos leer el RUT en la cartola. Sube el PDF original (no una foto ni un escaneo).",
    };
  }
  if (hashRut(rutExtraido) !== rutHashRegistrado) {
    return { ok: false, error: "El RUT de la cartola no coincide con el RUT de tu registro." };
  }

  // 3. Vigencia: emitida hace menos de 90 días.
  const fechaEmision = extraerFechaEmision(texto) ?? creationDate;
  if (!fechaEmision) {
    return { ok: false, error: "No pudimos leer la fecha de emisión de la cartola." };
  }
  const dias = (Date.now() - fechaEmision.getTime()) / (1000 * 60 * 60 * 24);
  if (dias > DIAS_VIGENCIA) {
    return {
      ok: false,
      error: "Tu cartola está vencida, descarga una nueva en chileatiende.gob.cl",
    };
  }

  // 4. Tramo del RSH <= 40%.
  const tramo = extraerTramo(texto);
  if (tramo == null) {
    return {
      ok: false,
      error: "No pudimos leer el tramo del Registro Social de Hogares en la cartola.",
    };
  }
  if (tramo > TRAMO_MAXIMO) {
    return {
      ok: false,
      error: `Tu tramo RSH es ${tramo}%. Para crear una campaña debe ser ${TRAMO_MAXIMO}% o inferior.`,
    };
  }

  return {
    ok: true,
    datos: {
      rutExtraido,
      tramo,
      fechaEmision: fechaEmision.toISOString().slice(0, 10),
    },
  };
}

// ── Extractores (CALIBRAR con cartolas reales) ──────────────────────────────

function extraerFechaEmision(texto: string): Date | null {
  // Supone "...emisión: DD/MM/AAAA" o "DD-MM-AAAA".
  const m = texto.match(/emisi[oó]n[:\s]*(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/i);
  if (m) {
    const fecha = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return isNaN(fecha.getTime()) ? null : fecha;
  }
  return null;
}

function extraerTramo(texto: string): number | null {
  // Supone un porcentaje cerca de "tramo" o "calificación socioeconómica".
  const m = texto.match(
    /(?:tramo|calificaci[oó]n socioecon[oó]mica)[^%\d]{0,40}(\d{1,3})\s*%/i
  );
  if (m) return Number(m[1]);
  const m2 = texto.match(/(\d{1,3})\s*%/);
  return m2 ? Number(m2[1]) : null;
}
