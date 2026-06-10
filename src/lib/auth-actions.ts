"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface AuthState {
  error?: string;
  message?: string;
}

const NO_CONFIGURADO: AuthState = {
  error:
    "El login todavía no está activo: falta conectar un proyecto Supabase (.env.local).",
};

function validarCredenciales(email: string, password: string): string | null {
  if (!email || !email.includes("@")) return "Ingresa un correo válido.";
  if (password.length < 6)
    return "La contraseña debe tener al menos 6 caracteres.";
  return null;
}

export async function iniciarSesion(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NO_CONFIGURADO;

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
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

  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const errMsg = validarCredenciales(email, password);
  if (errMsg) return { error: errMsg };

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

  return {
    message: "¡Listo! Te enviamos un correo para confirmar tu cuenta.",
  };
}

export async function registrarVeterinaria(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NO_CONFIGURADO;

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const rut = String(formData.get("rut") ?? "").trim();
  const direccion = String(formData.get("direccion") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();

  const errMsg = validarCredenciales(email, password);
  if (errMsg) return { error: errMsg };
  if (!nombre || !rut)
    return { error: "El nombre de la clínica y el RUT son obligatorios." };

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
