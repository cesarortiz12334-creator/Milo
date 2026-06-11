"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { reporteSchema, parsearFormData } from "@/lib/validaciones";
import { ipActual } from "@/lib/seguridad";
import { rateLimit, HORA } from "@/lib/rate-limit";

export interface ReporteState {
  error?: string;
  message?: string;
}

const EXITO: ReporteState = {
  message: "Gracias por reportar. Revisaremos este caso en menos de 24 horas.",
};

export async function reportarCampana(
  _prev: ReporteState,
  formData: FormData
): Promise<ReporteState> {
  const parsed = parsearFormData(reporteSchema, formData);
  if (!parsed.ok) return { error: parsed.error };
  const { campana_id, razon, descripcion } = parsed.data;

  const ip = await ipActual();
  if (!rateLimit(`reporte:${ip}`, 5, HORA).ok) {
    return { error: "Has enviado demasiados reportes. Intenta más tarde." };
  }

  // En modo demo no persistimos, pero igual confirmamos al usuario.
  if (!isSupabaseConfigured()) return EXITO;

  try {
    const supabase = await createClient();
    await supabase.from("reportes").insert({
      campana_id,
      razon,
      descripcion: descripcion || null,
      ip,
    });
  } catch {
    // Best-effort: no exponemos detalles técnicos al usuario.
  }
  return EXITO;
}
