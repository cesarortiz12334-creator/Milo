"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  validarArchivo,
  verificarContenidoArchivo,
  TIPOS_PDF,
  MAX_MB,
} from "@/lib/uploads";
import { campanaIdSchema, parsearFormData } from "@/lib/validaciones";
import { notificarCampanaActiva } from "@/lib/resend/emails";
import { registrarAuditoria } from "@/lib/auditoria";

export interface CasoState {
  error?: string;
  message?: string;
}

export async function confirmarCaso(
  _prev: CasoState,
  formData: FormData
): Promise<CasoState> {
  if (!isSupabaseConfigured()) {
    return { error: "Conecta un proyecto Supabase para confirmar casos (modo demo)." };
  }

  const parsed = parsearFormData(campanaIdSchema, formData);
  if (!parsed.ok) return { error: parsed.error };
  const campanaId = parsed.data.campana_id;

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
    return { error: "Tu veterinaria aún no está verificada por el equipo Milo." };
  }

  // Presupuesto: tipo, tamaño y CONTENIDO real (PDF sin JavaScript embebido).
  const presupuesto = formData.get("presupuesto");
  if (!(presupuesto instanceof File) || presupuesto.size === 0) {
    return { error: "Adjunta el presupuesto en PDF." };
  }
  const errTipo = validarArchivo(presupuesto, { tipos: TIPOS_PDF, maxMB: MAX_MB });
  if (errTipo) return { error: errTipo };
  const errContenido = await verificarContenidoArchivo(presupuesto, TIPOS_PDF);
  if (errContenido) return { error: errContenido };

  // Sube al bucket privado 'documentos' (carpeta de la vet).
  const ruta = `${user.id}/${campanaId}/${crypto.randomUUID()}-${presupuesto.name}`;
  const { error: upErr } = await supabase.storage
    .from("documentos")
    .upload(ruta, presupuesto, { contentType: presupuesto.type });
  if (upErr) {
    return { error: "No pudimos subir el presupuesto. Intenta de nuevo." };
  }

  // Activa la campaña (RLS exige veterinaria_id = auth.uid; solo si 'pendiente').
  const { error: cErr } = await supabase
    .from("campanas")
    .update({ estado: "activa", presupuesto_url: ruta })
    .eq("id", campanaId)
    .eq("veterinaria_id", user.id)
    .eq("estado", "pendiente");
  if (cErr) return { error: "No pudimos confirmar el caso. Intenta de nuevo." };

  await registrarAuditoria("caso_confirmado", {
    actorId: user.id,
    campanaId,
  });

  try {
    await notificarCampanaActiva(campanaId);
  } catch {
    // El email es best-effort.
  }

  revalidatePath("/veterinaria");
  return { message: "Caso confirmado: la campaña ya está activa. 🎉" };
}
