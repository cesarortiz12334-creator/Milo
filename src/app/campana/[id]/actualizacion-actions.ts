"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { actualizacionSchema, parsearFormData } from "@/lib/validaciones";
import {
  validarArchivo,
  verificarContenidoArchivo,
  TIPOS_IMAGEN,
  MAX_MB,
} from "@/lib/uploads";
import { notificarActualizacion } from "@/lib/resend/emails";

export interface ActualizacionState {
  error?: string;
  message?: string;
}

/**
 * El solicitante dueño de la campaña publica una actualización (mensaje + foto
 * de recuperación). Avisa a los donantes por email (F3).
 */
export async function publicarActualizacion(
  _prev: ActualizacionState,
  formData: FormData
): Promise<ActualizacionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Conecta un proyecto Supabase para publicar actualizaciones (modo demo)." };
  }

  const parsed = parsearFormData(actualizacionSchema, formData);
  if (!parsed.ok) return { error: parsed.error };
  const { campana_id, mensaje } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión." };

  // Solo el solicitante dueño de la campaña puede publicar.
  const { data: cData } = await supabase
    .from("campanas")
    .select("mascota_id")
    .eq("id", campana_id)
    .single();
  const c = cData as { mascota_id: string } | null;
  if (!c) return { error: "Campaña no encontrada." };

  const { data: mData } = await supabase
    .from("mascotas")
    .select("solicitante_id")
    .eq("id", c.mascota_id)
    .single();
  const m = mData as { solicitante_id: string } | null;
  if (!m || m.solicitante_id !== user.id) {
    return { error: "Solo el dueño de la campaña puede publicar actualizaciones." };
  }

  // Foto de recuperación (opcional): tipo, tamaño y contenido real.
  let fotoUrl: string | null = null;
  const foto = formData.get("foto");
  if (foto instanceof File && foto.size > 0) {
    const e1 = validarArchivo(foto, { tipos: TIPOS_IMAGEN, maxMB: MAX_MB });
    if (e1) return { error: e1 };
    const e2 = await verificarContenidoArchivo(foto, TIPOS_IMAGEN);
    if (e2) return { error: e2 };
    const ruta = `${user.id}/actualizaciones/${crypto.randomUUID()}-${foto.name}`;
    const { error: up } = await supabase.storage
      .from("mascotas")
      .upload(ruta, foto, { contentType: foto.type });
    if (up) return { error: "No pudimos subir la foto. Intenta de nuevo." };
    fotoUrl = supabase.storage.from("mascotas").getPublicUrl(ruta).data.publicUrl;
  }

  const { error: insErr } = await supabase
    .from("actualizaciones")
    .insert({ campana_id, mensaje, foto_url: fotoUrl });
  if (insErr) return { error: "No pudimos publicar la actualización." };

  try {
    await notificarActualizacion(campana_id, mensaje, fotoUrl);
  } catch {
    // El email es best-effort.
  }

  revalidatePath(`/campana/${campana_id}`);
  return { message: "¡Actualización publicada! Avisamos a tus donantes. 🐾" };
}
