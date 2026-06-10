"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { validarArchivo, TIPOS_PDF, MAX_MB } from "@/lib/uploads";
import { notificarCampanaActiva } from "@/lib/resend/emails";

export interface CasoState {
  error?: string;
  message?: string;
}

/**
 * La veterinaria confirma un caso: sube el presupuesto (PDF, bucket privado) y
 * activa la campaña (pendiente → activa). Anti-fraude: solo una veterinaria
 * VERIFICADA y vinculada a la campaña puede hacerlo.
 */
export async function confirmarCaso(
  _prev: CasoState,
  formData: FormData
): Promise<CasoState> {
  if (!isSupabaseConfigured()) {
    return { error: "Conecta un proyecto Supabase para confirmar casos (modo demo)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { data: vetData } = await supabase
    .from("veterinarias")
    .select("verificada")
    .eq("user_id", user.id)
    .single();
  const vet = vetData as { verificada: boolean } | null;

  if (!vet) return { error: "Solo las veterinarias pueden confirmar casos." };
  if (!vet.verificada) {
    return {
      error: "Tu veterinaria aún no está verificada por el equipo Milo.",
    };
  }

  const campanaId = String(formData.get("campana_id") ?? "");
  const presupuesto = formData.get("presupuesto");
  if (!campanaId) return { error: "Campaña inválida." };
  if (!(presupuesto instanceof File) || presupuesto.size === 0) {
    return { error: "Adjunta el presupuesto en PDF." };
  }
  const err = validarArchivo(presupuesto, { tipos: TIPOS_PDF, maxMB: MAX_MB });
  if (err) return { error: err };

  // Sube el presupuesto al bucket privado 'documentos' en la carpeta de la vet.
  const ruta = `${user.id}/${campanaId}/${crypto.randomUUID()}-${presupuesto.name}`;
  const { error: upErr } = await supabase.storage
    .from("documentos")
    .upload(ruta, presupuesto, { contentType: presupuesto.type });
  if (upErr) {
    return { error: "No pudimos subir el presupuesto. Intenta de nuevo." };
  }

  // Activa la campaña. RLS exige veterinaria_id = auth.uid(); además acotamos a
  // estado 'pendiente' para no reactivar/alterar otras.
  const { error: cErr } = await supabase
    .from("campanas")
    .update({ estado: "activa", presupuesto_url: ruta })
    .eq("id", campanaId)
    .eq("veterinaria_id", user.id)
    .eq("estado", "pendiente");
  if (cErr) return { error: "No pudimos confirmar el caso. Intenta de nuevo." };

  // Notifica al solicitante que su campaña ya está activa (best-effort).
  try {
    await notificarCampanaActiva(campanaId);
  } catch {
    // No bloquea la confirmación si el email falla.
  }

  revalidatePath("/veterinaria");
  return { message: "Caso confirmado: la campaña ya está activa. 🎉" };
}
