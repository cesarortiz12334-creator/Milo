import { NextRequest } from "next/server";
import { getWebpayTransaction } from "@/lib/transbank/webpay";
import { calcularComision, MONTO_MINIMO } from "@/lib/donaciones";
import { guardarDonacionPendiente } from "@/lib/donaciones-store";

// El SDK de Transbank usa Node (axios), no edge.
export const runtime = "nodejs";

/** Webpay exige un buyOrder único, alfanumérico, de máximo 26 caracteres. */
function nuevoBuyOrder(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `milo${ts}${rand}`.slice(0, 26);
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const campanaId = String(form.get("campana_id") ?? "");
  const monto = parseInt(String(form.get("monto") ?? ""), 10);

  if (!campanaId || !Number.isFinite(monto) || monto < MONTO_MINIMO) {
    return new Response("Solicitud de donación inválida.", { status: 400 });
  }

  const comision = calcularComision(monto);
  const buyOrder = nuevoBuyOrder();
  const sessionId = crypto.randomUUID();
  const returnUrl = new URL("/api/webpay/retorno", request.url).toString();

  try {
    const tx = getWebpayTransaction();
    const resp = await tx.create(buyOrder, sessionId, monto, returnUrl);

    // TODO(Supabase): reemplazar por insert en `donaciones` (estado 'pendiente',
    // tbk_token = resp.token) usando service role.
    guardarDonacionPendiente({
      token: resp.token,
      buyOrder,
      campanaId,
      monto,
      comision,
      creadaEn: Date.now(),
    });

    // Webpay requiere un POST de `token_ws` a `resp.url`: devolvemos un form
    // que se auto-envía. (resp.url y resp.token provienen de Transbank.)
    const html = `<!doctype html>
<html lang="es">
  <head><meta charset="utf-8" /><title>Redirigiendo a Webpay…</title></head>
  <body onload="document.forms[0].submit()" style="font-family:system-ui;text-align:center;padding:3rem;color:#1C1917;background:#FFFBF5">
    <form action="${resp.url}" method="POST">
      <input type="hidden" name="token_ws" value="${resp.token}" />
      <noscript><button type="submit">Continuar a Webpay</button></noscript>
    </form>
    <p>Redirigiendo a Webpay…</p>
  </body>
</html>`;

    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("Error creando transacción Webpay:", err);
    return new Response(
      "No se pudo iniciar el pago con Webpay. Intenta nuevamente.",
      { status: 502 }
    );
  }
}
