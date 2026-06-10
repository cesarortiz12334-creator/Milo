import { NextRequest, NextResponse } from "next/server";
import { getWebpayTransaction } from "@/lib/transbank/webpay";
import {
  obtenerDonacionPendiente,
  eliminarDonacionPendiente,
} from "@/lib/donaciones-store";

export const runtime = "nodejs";

/**
 * Retorno de Webpay. Transbank puede volver con:
 *  - `token_ws`        → flujo normal: confirmar (commit) la transacción.
 *  - `TBK_TOKEN`       → el usuario anuló el pago (sin token_ws).
 *  - sin tokens        → timeout u otro error.
 * Llega por POST (flujo normal) o GET (anulación), así que cubrimos ambos.
 */
async function leerParams(request: NextRequest) {
  const query = new URL(request.url).searchParams;
  let body: URLSearchParams | null = null;
  if (request.method === "POST") {
    body = new URLSearchParams(await request.text());
  }
  const get = (k: string) => body?.get(k) ?? query.get(k);
  return {
    tokenWs: get("token_ws"),
    tbkToken: get("TBK_TOKEN"),
  };
}

async function manejar(request: NextRequest) {
  const { tokenWs, tbkToken } = await leerParams(request);
  const token = tokenWs ?? tbkToken ?? null;
  const pendiente = token ? obtenerDonacionPendiente(token) : undefined;
  const campanaId = pendiente?.campanaId ?? "desconocida";

  const redirigir = (estado: string, extra: Record<string, string> = {}) => {
    const dest = new URL(`/campana/${campanaId}/resultado`, request.url);
    dest.searchParams.set("estado", estado);
    for (const [k, v] of Object.entries(extra)) dest.searchParams.set(k, v);
    if (token) eliminarDonacionPendiente(token);
    return NextResponse.redirect(dest, { status: 303 });
  };

  // Anulada por el usuario o timeout (no hay token_ws para confirmar).
  if (!tokenWs) {
    return redirigir("anulada");
  }

  try {
    const tx = getWebpayTransaction();
    const resp = await tx.commit(tokenWs);
    const aprobada = resp.status === "AUTHORIZED" && resp.response_code === 0;

    // TODO(Supabase): actualizar `donaciones.estado` y sumar al
    // `campanas.monto_recaudado` con service role cuando esté aprobada.
    return redirigir(aprobada ? "aprobada" : "rechazada", {
      monto: String(pendiente?.monto ?? resp.amount ?? ""),
    });
  } catch (err) {
    console.error("Error confirmando transacción Webpay:", err);
    return redirigir("error");
  }
}

export async function GET(request: NextRequest) {
  return manejar(request);
}

export async function POST(request: NextRequest) {
  return manejar(request);
}
