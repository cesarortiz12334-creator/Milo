import { createAdminClient } from "@/lib/supabase/admin";
import { evaluarCierre } from "@/lib/cierre";
import { notificarCierre } from "@/lib/resend/emails";
import { registrarAuditoria } from "@/lib/auditoria";

export interface ResultadoCierre {
  procesadas: number;
  exitosas: number;
  noFinanciadas: number;
}

/**
 * Cierra las campañas 'activa' cuya fecha_limite ya pasó, aplicando la regla
 * del 70%. Usa service role (omite RLS). Pensado para ejecutarse por cron.
 */
export async function cerrarCampanasVencidas(): Promise<ResultadoCierre> {
  const supabase = createAdminClient();
  const ahora = new Date().toISOString();

  const { data } = await supabase
    .from("campanas")
    .select("id, monto_meta, monto_recaudado")
    .eq("estado", "activa")
    .lte("fecha_limite", ahora);

  const campanas = (data ?? []) as Array<{
    id: string;
    monto_meta: number;
    monto_recaudado: number;
  }>;

  let exitosas = 0;
  let noFinanciadas = 0;

  for (const c of campanas) {
    const nuevoEstado = evaluarCierre(c.monto_recaudado, c.monto_meta);

    await supabase
      .from("campanas")
      .update({ estado: nuevoEstado, cerrada_at: ahora })
      .eq("id", c.id);

    if (nuevoEstado === "exitosa") {
      exitosas++;
      // TODO(back-office): transferir los fondos recaudados a la veterinaria.
    } else {
      noFinanciadas++;
      // Las donaciones pagadas pasan a crédito Milo por defecto; el donante
      // puede pedir devolución en efectivo dentro de 72h (OpcionesDevolucion).
      await supabase
        .from("donaciones")
        .update({ credito_milo: true })
        .eq("campana_id", c.id)
        .eq("estado", "pagada");
    }

    await registrarAuditoria("campana_cerrada", {
      campanaId: c.id,
      detalle: {
        estado: nuevoEstado,
        recaudado: c.monto_recaudado,
        meta: c.monto_meta,
      },
    });

    // Notifica el cierre (best-effort, no rompe el batch).
    try {
      await notificarCierre(c.id, nuevoEstado);
    } catch {
      // continuar con las demás campañas
    }
  }

  return { procesadas: campanas.length, exitosas, noFinanciadas };
}
