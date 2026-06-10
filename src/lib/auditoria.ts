import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";

/**
 * Log de auditoría inmutable (tabla `auditoria`, ver migración 006). Append-only:
 * la tabla bloquea UPDATE/DELETE por trigger. Se escribe con service role y nunca
 * incluye datos sensibles (RUT en claro, tramo RSH exacto, tokens, tarjetas).
 */
export type EventoAuditoria =
  | "campana_creada"
  | "caso_confirmado"
  | "donacion_registrada"
  | "campana_cerrada"
  | "fondos_transferidos"
  | "devolucion_solicitada";

export async function registrarAuditoria(
  evento: EventoAuditoria,
  datos: {
    actorId?: string | null;
    campanaId?: string | null;
    detalle?: Record<string, unknown>;
  } = {}
): Promise<void> {
  if (!isAdminConfigured()) return;
  try {
    const supabase = createAdminClient();
    await supabase.from("auditoria").insert({
      evento,
      actor_id: datos.actorId ?? null,
      campana_id: datos.campanaId ?? null,
      detalle: datos.detalle ?? {},
    });
  } catch {
    // Best-effort: no debe romper el flujo principal.
  }
}
