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

  // Trae el caso (asignado a esta vet y pendiente) para decidir si requiere
  // revisión manual del equipo Milo antes de publicarse.
  const { data: campData } = await supabase
    .from("campanas")
    .select("requiere_revision_manual, revision_manual_aprobada")
    .eq("id", campanaId)
    .eq("veterinaria_id", user.id)
    .eq("estado", "pendiente")
    .single();
  const camp = campData as
    | { requiere_revision_manual: boolean; revision_manual_aprobada: boolean }
    | null;
  if (!camp) return { error: "No encontramos el caso o ya fue procesado." };

  // Presupuesto: tipo, tamaño y CONTENIDO real (PDF sin JavaScript embebido).
  const presupuesto = formData.get("presupuesto");
  if (!(presupuesto instanceof File) || presupuesto.size === 0) {
    return { error: "Adjunta el presupuesto en PDF." };
  }
  const errTipo = validarArchivo(presupuesto, { tipos: TIPOS_PDF, maxMB: MAX_MB });
  if (errTipo) return { error: errTipo };
  const errContenido = await verificarContenidoArchivo(presupuesto, TIPOS_PDF);
  if (errContenido) return { error: errContenido };

  const ruta = `${user.id}/${campanaId}/${crypto.randomUUID()}-${presupuesto.name}`;
  const { error: upErr } = await supabase.storage
    .from("documentos")
    .upload(ruta, presupuesto, { contentType: presupuesto.type });
  if (upErr) {
    return { error: "No pudimos subir el presupuesto. Intenta de nuevo." };
  }

  // Si requiere revisión manual y aún no está aprobada, NO se publica: queda
  // pendiente con la confirmación de la vet registrada (vet_confirmo_at).
  const bloqueadaPorRevision =
    camp.requiere_revision_manual && !camp.revision_manual_aprobada;
  const nuevoEstado = bloqueadaPorRevision ? "pendiente" : "activa";

  const { error: cErr } = await supabase
    .from("campanas")
    .update({
      estado: nuevoEstado,
      presupuesto_url: ruta,
      vet_confirmo_at: new Date().toISOString(),
    })
    .eq("id", campanaId)
    .eq("veterinaria_id", user.id)
    .eq("estado", "pendiente");
  if (cErr) return { error: "No pudimos confirmar el caso. Intenta de nuevo." };

  await registrarAuditoria("caso_confirmado", {
    actorId: user.id,
    campanaId,
    detalle: { revision_manual: bloqueadaPorRevision },
  });

  if (!bloqueadaPorRevision) {
    try {
      await notificarCampanaActiva(campanaId);
    } catch {
      // El email es best-effort.
    }
  }

  revalidatePath("/veterinaria");
  return {
    message: bloqueadaPorRevision
      ? "Caso confirmado. Como la campaña supera $200.000, queda en revisión del equipo Milo antes de publicarse."
      : "Caso confirmado: la campaña ya está activa. 🎉",
  };
}
