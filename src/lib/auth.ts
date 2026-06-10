import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { UserRole } from "@/types";

export interface SesionActual {
  userId: string;
  email: string | null;
  role: UserRole | null;
}

/**
 * Devuelve la sesión actual (usuario + rol) leída en el servidor, o null si no
 * hay sesión o Supabase no está configurado. No lanza: degrada a null.
 */
export async function getUsuarioActual(): Promise<SesionActual | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    const perfil = data as { role: UserRole } | null;

    return {
      userId: user.id,
      email: user.email ?? null,
      role: perfil?.role ?? null,
    };
  } catch {
    return null;
  }
}
