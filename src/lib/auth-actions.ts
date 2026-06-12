"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  loginSchema,
  registroDonanteSchema,
  registroSolicitanteSchema,
  registroVeterinariaSchema,
  emailSoloSchema,
  nuevaPasswordSchema,
  parsearFormData,
} from "@/lib/validaciones";
import { hashRut } from "@/lib/rut";
import { ipActual } from "@/lib/seguridad";
import { rateLimit, MINUTO } from "@/lib/rate-limit";

export interface AuthState {
  error?: string;
  message?: string;
}

const NO_CONFIGURADO: AuthState = {
  error:
    "El login todavía no está activo: falta conectar un proyecto Supabase (.env.local).",
};

// Mensaje de verificación de email (mismo texto para donante y solicitante).
const MSG_CONFIRMAR =
  "¡Listo! Te enviamos un correo de confirmación. Revisa tu bandeja de entrada y también la carpeta de spam. Una vez confirmado podrás iniciar sesión.";

export async function iniciarSesion(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NO_CONFIGURADO;

  // Rate limit: 5 intentos por IP cada 15 minutos.
  const ip = await ipActual();
  if (!rateLimit(`login:${ip}`, 5, 15 * MINUTO).ok) {
    return { error: "Demasiados intentos. Espera unos minutos e intenta de nuevo." };
  }

  const parsed = parsearFormData(loginSchema, formData);
  if (!parsed.ok) return { error: parsed.error };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    // Mensaje genérico: no revela si el correo existe (anti-enumeración).
    if (error) return { error: "Correo o contraseña incorrectos." };
  } catch {
    return { error: "No pudimos conectar con el servidor. Intenta de nuevo." };
  }

  redirect("/");
}

export async function registrarDonante(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NO_CONFIGURADO;

  const ip = await ipActual();
  if (!rateLimit(`registro:${ip}`, 5, 60 * MINUTO).ok) {
    return { error: "Demasiados intentos. Espera un momento." };
  }

  const parsed = parsearFormData(registroDonanteSchema, formData);
  if (!parsed.ok) return { error: parsed.error };
  const { nombre, email, password, rut, telefono } = parsed.data;

  let conSesion = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // El RUT del donante se guarda HASHEADO (rut_hash); nunca en claro.
      options: { data: { role: "donante", nombre, telefono, rut_hash: hashRut(rut) } },
    });
    if (error) return { error: error.message };
    conSesion = !!data.session;
  } catch {
    return { error: "No pudimos crear tu cuenta. Intenta de nuevo." };
  }

  // redirect() debe ir FUERA del try (lanza una excepción de control interna).
  if (conSesion) redirect("/");
  return { message: MSG_CONFIRMAR };
}

export async function registrarSolicitante(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NO_CONFIGURADO;

  const ip = await ipActual();
  if (!rateLimit(`registro:${ip}`, 5, 60 * MINUTO).ok) {
    return { error: "Demasiados intentos. Espera un momento." };
  }

  const parsed = parsearFormData(registroSolicitanteSchema, formData);
  if (!parsed.ok) return { error: parsed.error };
  const { nombre, email, password, rut, telefono, calle, comuna, region } =
    parsed.data;

  let conSesion = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Solo se envía el RUT HASHEADO; el RUT en claro nunca se guarda en auth.
      options: {
        data: {
          role: "solicitante",
          nombre,
          telefono,
          calle,
          comuna,
          region,
          rut_hash: hashRut(rut),
        },
      },
    });
    if (error) return { error: error.message };
    conSesion = !!data.session;
  } catch {
    return { error: "No pudimos crear tu cuenta. Intenta de nuevo." };
  }

  if (conSesion) redirect("/");
  return { message: MSG_CONFIRMAR };
}

export async function registrarVeterinaria(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NO_CONFIGURADO;

  const ip = await ipActual();
  if (!rateLimit(`registro:${ip}`, 5, 60 * MINUTO).ok) {
    return { error: "Demasiados intentos. Espera un momento." };
  }

  const parsed = parsearFormData(registroVeterinariaSchema, formData);
  if (!parsed.ok) return { error: parsed.error };
  const { email, password, nombre, rut, telefono, calle, comuna, region } =
    parsed.data;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "veterinaria", nombre, rut, telefono, calle, comuna, region },
      },
    });
    if (error) return { error: error.message };
    if (data.session)
      return {
        message:
          "Cuenta creada. Tu veterinaria queda pendiente de verificación por el equipo MiloFund.",
      };
  } catch {
    return { error: "No pudimos crear tu cuenta. Intenta de nuevo." };
  }

  return {
    message:
      "Cuenta creada. Confirma tu correo (revisa también spam); luego el equipo MiloFund verificará tu veterinaria antes de activarla.",
  };
}

/**
 * Paso 1 de "olvidé mi contraseña": envía el correo con el enlace de recuperación.
 * Respuesta SIEMPRE neutra (anti-enumeración de cuentas).
 */
export async function solicitarReset(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NO_CONFIGURADO;

  const ip = await ipActual();
  if (!rateLimit(`reset:${ip}`, 5, 60 * MINUTO).ok) {
    return { error: "Demasiados intentos. Espera un momento." };
  }

  const parsed = parsearFormData(emailSoloSchema, formData);
  if (!parsed.ok) return { error: parsed.error };

  try {
    const supabase = await createClient();
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${site}/auth/callback?next=/actualizar-contrasena`,
    });
  } catch {
    // No revelamos nada: la respuesta es neutra igual.
  }

  return {
    message:
      "Si tu email está registrado, recibirás las instrucciones en unos minutos. Revisa también tu carpeta de spam.",
  };
}

/**
 * Paso 2 de "olvidé mi contraseña": el usuario llega desde el enlace del correo
 * (ya con sesión de recuperación) y fija una nueva contraseña.
 */
export async function actualizarPassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NO_CONFIGURADO;

  const parsed = parsearFormData(nuevaPasswordSchema, formData);
  if (!parsed.ok) return { error: parsed.error };

  let ok = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: "El enlace expiró o no es válido. Pide uno nuevo." };
    }
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) return { error: "No pudimos actualizar tu contraseña. Intenta de nuevo." };
    ok = true;
  } catch {
    return { error: "No pudimos actualizar tu contraseña. Intenta de nuevo." };
  }

  if (ok) redirect("/login?reset=ok");
  return {};
}
