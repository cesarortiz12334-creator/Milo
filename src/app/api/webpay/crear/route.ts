import { NextRequest } from "next/server";
import { getWebpayTransaction } from "@/lib/transbank/webpay";
import { calcularComision } from "@/lib/donaciones";
import { guardarDonacionPendiente } from "@/lib/donaciones-store";
import { donacionSchema, parsearFormData } from "@/lib/validaciones";
import { mismoOrigen, ipDesdeHeaders } from "@/lib/seguridad";
import { rateLimit, HORA } from "@/lib/rate-limit";

// El SDK de Transbank usa Node (axios), no edge.
export const runtime = "nodejs";

/** Webpay exige un buyOrder único, alfanumérico, de máximo 26 caracteres. */
function nuevoBuyOrder(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `milo${ts}${rand}`.slice(0, 26);
}

export async function POST(request: NextRequest) {
  // Anti-CSRF: solo desde el mismo origen.
  if (!mismoOrigen(request)) {
    return new Response("Origen no permitido.", { status: 403 });
  }

  // Rate limit: máx. 10 donaciones por IP cada hora.
  const ip = ipDesdeHeaders(request.headers);
  if (!rateLimit(`donar:${ip}`, 10, HORA).ok) {
    return new Response("Demasiados intentos de donación. Intenta más tarde.", {
      status: 429,
    });
  }

  const form = await request.formData();
  const parsed = parsearFormData(donacionSchema, form);
  if (!parsed.ok) {
    return new Response(parsed.error, { status: 400 });
  }
  const { campana_id: campanaId, monto } = parsed.data;

  const comision = calcularComision(monto);
  const buyOrder = nuevoBuyOrder();
  const sessionId = crypto.randomUUID();
  const returnUrl = new URL("/api/webpay/retorno", request.url).toString();

  try {
    const tx = getWebpayTransaction();
    const resp = await tx.create(buyOrder, sessionId, monto, returnUrl);

    // TODO(Supabase): persistir la donación en la tabla `donaciones` en lugar del
    // store en memoria. Insert: { campana_id, donante_id (si hay sesión), monto,
    // comision, estado: 'pendiente', tbk_token: resp.token }. La columna tbk_token
    // permite recuperarla en el retorno y da idempotencia (ponle índice único).
    guardarDonacionPendiente({
      token: resp.token,
      buyOrder,
      campanaId,
      monto,
      comision,
      creadaEn: Date.now(),
    });

    // Webpay requiere POST de `token_ws` a `resp.url`: form que se auto-envía.
    const html = `<!doctype html>
<html lang="es">
  <head><meta charset="utf-8" /><title>Redirigiendo a Webpay…</title></head>
  <body style="font-family:system-ui;text-align:center;padding:3rem;color:#1C1917;background:#FFFBF5">
    <form action="${resp.url}" method="POST">
      <input type="hidden" name="token_ws" value="${resp.token}" />
      <noscript><button type="submit">Continuar a Webpay</button></noscript>
    </form>
    <p>Redirigiendo a Webpay…</p>
    <script>document.forms[0].submit();</script>
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
