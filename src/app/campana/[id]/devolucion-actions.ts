"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ventanaDevolucionVigente } from "@/lib/cierre";

export interface DevolucionState {
  error?: string;
  message?: string;
}

/**
 * El donante solicita la devolución en efectivo de su aporte en una campaña
 * 'no_financiada'. Solo válido dentro de la ventana de 72h desde el cierre.
 */
export async function solicitarDevolucion(
  _prev: DevolucionState,
  formData: FormData
): Promise<DevolucionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Conecta un proyecto Supabase para procesar devoluciones (modo demo)." };
  }

  const campanaId = String(formData.get("campana_id") ?? "");
  if (!campanaId) return { error: "Campaña inválida." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión para pedir tu devolución." };

  const { data: campData } = await supabase
    .from("campanas")
    .select("estado, cerrada_at")
    .eq("id", campanaId)
    .single();
  const campana = campData as { estado: string; cerrada_at: string | null } | null;

  if (!campana || campana.estado !== "no_financiada") {
    return { error: "Esta campaña no admite devolución." };
  }
  if (!ventanaDevolucionVigente(campana.cerrada_at)) {
    return { error: "El plazo de 72 horas para la devolución en efectivo ya venció." };
  }

  const { data, error } = await supabase
    .from("donaciones")
    .update({ estado: "reembolsada", credito_milo: false })
    .eq("campana_id", campanaId)
    .eq("donante_id", user.id)
    .eq("estado", "pagada")
    .select("id");

  if (error) return { error: "No pudimos procesar tu devolución. Intenta de nuevo." };
  if (!data || data.length === 0) {
    return { error: "No encontramos una donación tuya pagada en esta campaña." };
  }

  return {
    message: "Solicitud registrada. Procesaremos tu reembolso a la brevedad.",
  };
}
