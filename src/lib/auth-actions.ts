"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  loginSchema,
  registroDonanteSchema,
  registroSolicitanteSchema,
  registroVeterinariaSchema,
  parsearFormData,
} from "@/lib/validaciones";
import { rutValido, hashRut } from "@/lib/rut";
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
  const { nombre, email, password } = parsed.data;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: "donante", nombre } },
    });
    if (error) return { error: error.message };
    if (data.session) redirect("/");
  } catch {
    return { error: "No pudimos crear tu cuenta. Intenta de nuevo." };
  }

  return { message: "¡Listo! Te enviamos un correo para confirmar tu cuenta." };
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
  const { nombre, email, password, rut } = parsed.data;

  if (!rutValido(rut)) {
    return { error: "El RUT no es válido (revisa el dígito verificador)." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Solo se envía el RUT HASHEADO; el RUT en claro nunca se guarda en auth.
      options: { data: { role: "solicitante", nombre, rut_hash: hashRut(rut) } },
    });
    if (error) return { error: error.message };
    if (data.session) redirect("/");
  } catch {
    return { error: "No pudimos crear tu cuenta. Intenta de nuevo." };
  }

  return { message: "¡Listo! Te enviamos un correo para confirmar tu cuenta." };
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
  const { email, password, nombre, rut, direccion, telefono } = parsed.data;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "veterinaria", nombre, rut, direccion, telefono },
      },
    });
    if (error) return { error: error.message };
    if (data.session)
      return {
        message:
          "Cuenta creada. Tu veterinaria queda pendiente de verificación por el equipo Milo.",
      };
  } catch {
    return { error: "No pudimos crear tu cuenta. Intenta de nuevo." };
  }

  return {
    message:
      "Cuenta creada. Confirma tu correo; luego el equipo Milo verificará tu veterinaria antes de activarla.",
  };
}
