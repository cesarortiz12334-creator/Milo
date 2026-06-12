"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { perfilSchema, nuevaPasswordSchema, parsearFormData } from "@/lib/validaciones";

export interface PerfilState {
  error?: string;
  message?: string;
}

const NO_CONFIG: PerfilState = {
  error: "Conecta un proyecto Supabase para editar tu perfil (modo demo).",
};

/** Actualiza nombre, teléfono y (según rol) la dirección del usuario logueado. */
export async function actualizarPerfil(
  _prev: PerfilState,
  formData: FormData
): Promise<PerfilState> {
  if (!isSupabaseConfigured()) return NO_CONFIG;

  const parsed = parsearFormData(perfilSchema, formData);
  if (!parsed.ok) return { error: parsed.error };
  const { nombre, telefono, calle, comuna, region } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión para editar tu perfil." };

  const { error: eUser } = await supabase
    .from("users")
    .update({ nombre, telefono })
    .eq("id", user.id);
  if (eUser) return { error: "No pudimos guardar tus datos. Intenta de nuevo." };

  // Dirección según rol.
  const { data: perfil } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (perfil as { role: string } | null)?.role;

  if (role === "solicitante") {
    await supabase
      .from("solicitantes")
      .update({ calle, comuna, region })
      .eq("user_id", user.id);
  } else if (role === "veterinaria") {
    await supabase
      .from("veterinarias")
      .update({ direccion: calle, comuna, region })
      .eq("user_id", user.id);
  }

  revalidatePath("/perfil");
  return { message: "¡Listo! Tus datos quedaron actualizados." };
}

/** Cambia la contraseña del usuario logueado (sin cerrar la sesión). */
export async function cambiarPassword(
  _prev: PerfilState,
  formData: FormData
): Promise<PerfilState> {
  if (!isSupabaseConfigured()) return NO_CONFIG;

  const parsed = parsearFormData(nuevaPasswordSchema, formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "No pudimos cambiar tu contraseña. Intenta de nuevo." };

  return { message: "Tu contraseña se actualizó correctamente." };
}
