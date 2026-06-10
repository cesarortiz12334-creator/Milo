import { z } from "zod";

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
  .min(6, "La contraseña debe tener al menos 6 caracteres.")
  .max(200);
const opcional = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Ingresa tu contraseña.").max(200),
});

export const registroDonanteSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresa tu nombre.").max(120),
  email,
  password: passwordNuevo,
});

export const registroVeterinariaSchema = z.object({
  email,
  password: passwordNuevo,
  nombre: z.string().trim().min(1, "El nombre de la clínica es obligatorio.").max(160),
  rut: z.string().trim().min(3, "Ingresa el RUT.").max(20),
  direccion: opcional(200),
  telefono: opcional(30),
});

export const crearCampanaSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresa el nombre de la mascota.").max(80),
  especie: z.enum(["perro", "gato", "otro"], {
    message: "Selecciona una especie válida.",
  }),
  raza: opcional(80),
  descripcion_mascota: opcional(2000),
  titulo: z.string().trim().min(3, "El título es muy corto.").max(120),
  descripcion_campana: opcional(5000),
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
