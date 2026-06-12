import { NextRequest, NextResponse } from "next/server";
import {
  obtenerDonacionPendiente,
  eliminarDonacionPendiente,
} from "@/lib/donaciones-store";
import { registrarAuditoria } from "@/lib/auditoria";

export const runtime = "nodejs";

/**
 * Retorno de Mercado Pago (Checkout Pro). MP redirige por GET con query params
 * (status / collection_status, external_reference, payment_id).
 */
export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams;
  const ref = q.get("external_reference");
  const status = q.get("status") ?? q.get("collection_status");

  const pendiente = ref ? obtenerDonacionPendiente(ref) : undefined;
  const campanaId = pendiente?.campanaId ?? "desconocida";

  const dest = new URL(`/campana/${campanaId}/resultado`, request.url);

  if (status === "approved") {
    dest.searchParams.set("estado", "aprobada");
    if (pendiente) {
      dest.searchParams.set("monto", String(pendiente.monto));
      // TODO(Supabase): marcar donación 'pagada' y sumar a monto_recaudado.
      await registrarAuditoria("donacion_registrada", {
        campanaId: pendiente.campanaId,
        detalle: {
          monto: pendiente.monto,
          comision: pendiente.comision,
          medio: "mercadopago",
        },
      });
    }
  } else if (status === "pending" || status === "in_process") {
    dest.searchParams.set("estado", "procesada");
  } else {
    dest.searchParams.set("estado", "rechazada");
  }

  if (ref) eliminarDonacionPendiente(ref);
  return NextResponse.redirect(dest, { status: 303 });
}
