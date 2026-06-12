import { z } from "zod";
import { rutValido } from "@/lib/rut";
import { NOMBRES_REGIONES, comunaEnRegion, telefonoChilenoValido } from "@/lib/chile";

/**
 * Esquemas de validación server-side (Zod). NUNCA confiar solo en el frontend:
 * toda Server Action / route handler valida con estos esquemas.
 */

// Monto máximo razonable por campaña/donación (anti-fraude). CLP.
export const MONTO_MAX = 50_000_000;
export const MONTO_MIN_DONACION = 1000;
export const MONTO_MIN_META = 1000;

const email = z.string().trim().toLowerCase().email("Ingresa un correo válido.").max(255);
const passwordNuevo = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(200);
const opcional = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

// RUT chileno: formato + dígito verificador (módulo 11). Reutilizable.
const rut = z
  .string()
  .trim()
  .regex(
    /^\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]$/,
    "Ingresa un RUT válido (ej: 12.345.678-9)."
  )
  .refine(rutValido, "El RUT no es válido (revisa el dígito verificador).");

// Teléfono móvil chileno (+56 9 XXXX XXXX, con o sin separadores).
const telefono = z
  .string()
  .trim()
  .refine(telefonoChilenoValido, "Ingresa un teléfono chileno válido (ej: +56 9 1234 5678).");

const region = z
  .string()
  .trim()
  .min(1, "Selecciona tu región.")
  .refine((r) => NOMBRES_REGIONES.includes(r), "Selecciona una región válida.");

const comuna = z.string().trim().min(1, "Selecciona tu comuna.").max(80);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Ingresa tu contraseña.").max(200),
});

export const registroDonanteSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresa tu nombre completo.").max(120),
  rut,
  email,
  telefono,
  password: passwordNuevo,
});

export const registroSolicitanteSchema = z
  .object({
    nombre: z.string().trim().min(1, "Ingresa tu nombre completo.").max(120),
    rut,
    email,
    telefono,
    calle: z.string().trim().min(3, "Ingresa tu calle y número.").max(200),
    region,
    comuna,
    password: passwordNuevo,
  })
  .refine((d) => comunaEnRegion(d.comuna, d.region), {
    path: ["comuna"],
    message: "La comuna no corresponde a la región seleccionada.",
  });

export const registroVeterinariaSchema = z
  .object({
    nombre: z.string().trim().min(1, "La razón social es obligatoria.").max(160),
    rut,
    email,
    telefono,
    calle: z.string().trim().min(3, "Ingresa la dirección.").max(200),
    region,
    comuna,
    password: passwordNuevo,
  })
  .refine((d) => comunaEnRegion(d.comuna, d.region), {
    path: ["comuna"],
    message: "La comuna no corresponde a la región seleccionada.",
  });

// Recuperación de contraseña.
export const emailSoloSchema = z.object({ email });
export const nuevaPasswordSchema = z.object({ password: passwordNuevo });

// Edición de perfil (los campos de dirección solo aplican a solicitante/vet).
export const perfilSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresa tu nombre.").max(120),
  telefono,
  calle: opcional(200),
  comuna: opcional(80),
  region: opcional(60),
});

// Campo guiado de la descripción: obligatorio, mínimo 50 caracteres.
const guiado = (etiqueta: string) =>
  z
    .string()
    .trim()
    .min(50, `${etiqueta}: cuéntanos un poco más (mínimo 50 caracteres).`)
    .max(2000);

export const crearCampanaSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresa el nombre de la mascota.").max(80),
  especie: z.enum(["perro", "gato", "otro"], {
    message: "Selecciona una especie válida.",
  }),
  raza: opcional(80),
  titulo: z.string().trim().min(3, "El título es muy corto.").max(120),
  // Descripción enriquecida: 4 campos guiados que se combinan en una sola.
  que_paso: guiado("Qué le pasó"),
  diagnostico: guiado("Diagnóstico"),
  por_que_ayuda: guiado("Por qué necesitan ayuda"),
  algo_especial: guiado("Algo especial"),
  monto_meta: z.coerce
    .number()
    .int("El monto debe ser un número entero.")
    .min(MONTO_MIN_META, "La meta es demasiado baja.")
    .max(MONTO_MAX, "La meta supera el máximo permitido."),
  fecha_limite: opcional(40),
  veterinaria_id: z.string().trim().min(1, "Selecciona la veterinaria."),
});

export const donacionSchema = z.object({
  campana_id: z.string().trim().min(1).max(64),
  monto: z.coerce
    .number()
    .int("El monto debe ser un número entero.")
    .min(MONTO_MIN_DONACION, "El monto mínimo no se cumple.")
    .max(MONTO_MAX, "El monto supera el máximo permitido."),
});

export const campanaIdSchema = z.object({
  campana_id: z.string().trim().min(1).max(64),
});

export const RAZONES_REPORTE = [
  "Creo que es falsa",
  "El animal no existe",
  "Documentos sospechosos",
  "Otro",
] as const;

export const reporteSchema = z.object({
  campana_id: z.string().trim().min(1).max(64),
  razon: z.enum(RAZONES_REPORTE, { message: "Selecciona una razón." }),
  descripcion: opcional(2000),
});

export const actualizacionSchema = z.object({
  campana_id: z.string().trim().min(1).max(64),
  mensaje: z.string().trim().min(1, "Escribe un mensaje.").max(2000),
});

export const ASUNTOS_CONTACTO = [
  "Soy donante",
  "Soy solicitante",
  "Soy veterinaria",
  "Prensa",
  "Tengo un problema",
  "Otro",
] as const;

export const contactoSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresa tu nombre.").max(120),
  email,
  asunto: z.enum(ASUNTOS_CONTACTO, { message: "Selecciona un asunto." }),
  mensaje: z.string().trim().min(1, "Escribe tu mensaje.").max(5000),
});

export type ResultadoParseo<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Parsea un FormData con un esquema; devuelve el primer mensaje de error. */
export function parsearFormData<T extends z.ZodTypeAny>(
  schema: T,
  formData: FormData
): ResultadoParseo<z.infer<T>> {
  const obj: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) {
    // Ignora archivos (se validan aparte); solo campos de texto.
    if (typeof v === "string") obj[k] = v;
  }
  const res = schema.safeParse(obj);
  if (!res.success) {
    return { ok: false, error: res.error.issues[0]?.message ?? "Datos inválidos." };
  }
  return { ok: true, data: res.data };
}
