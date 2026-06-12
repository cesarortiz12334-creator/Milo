import { NextRequest } from "next/server";
import { isMercadoPagoConfigured, getPreferenceClient } from "@/lib/mercadopago";
import { calcularComision } from "@/lib/donaciones";
import { guardarDonacionPendiente } from "@/lib/donaciones-store";
import { donacionSchema, parsearFormData } from "@/lib/validaciones";
import { mismoOrigen, ipDesdeHeaders } from "@/lib/seguridad";
import { rateLimit, HORA } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // Anti-CSRF + rate limit (compartido con Webpay: 10 donaciones/hora/IP).
  if (!mismoOrigen(request)) {
    return new Response("Origen no permitido.", { status: 403 });
  }
  const ip = ipDesdeHeaders(request.headers);
  if (!rateLimit(`donar:${ip}`, 10, HORA).ok) {
    return new Response("Demasiados intentos de donación. Intenta más tarde.", {
      status: 429,
    });
  }

  const form = await request.formData();
  const parsed = parsearFormData(donacionSchema, form);
  if (!parsed.ok) return new Response(parsed.error, { status: 400 });
  const { campana_id: campanaId, monto } = parsed.data;

  if (!isMercadoPagoConfigured()) {
    return new Response(
      "Mercado Pago aún no está configurado. Usa Webpay o vuelve más tarde.",
      { status: 503 }
    );
  }

  const comision = calcularComision(monto);
  const ref = crypto.randomUUID();
  const origin = new URL(request.url).origin;

  try {
    const preference = getPreferenceClient();
    const result = await preference.create({
      body: {
        items: [
          {
            id: campanaId,
            title: "Donación MiloFund",
            quantity: 1,
            unit_price: monto,
            currency_id: "CLP",
          },
        ],
        external_reference: ref,
        back_urls: {
          success: `${origin}/api/mercadopago/retorno`,
          failure: `${origin}/api/mercadopago/retorno`,
          pending: `${origin}/api/mercadopago/retorno`,
        },
        auto_return: "approved",
        metadata: { campana_id: campanaId },
      },
    });

    // TODO(Supabase): persistir en `donaciones` igual que Webpay (tbk_token →
    // external_reference). Por ahora, store temporal en memoria.
    guardarDonacionPendiente({
      token: ref,
      buyOrder: ref,
      campanaId,
      monto,
      comision,
      creadaEn: Date.now(),
    });

    const url = result.init_point ?? result.sandbox_init_point;
    if (!url) {
      return new Response("No pudimos iniciar el pago.", { status: 502 });
    }
    return Response.redirect(url, 303);
  } catch (err) {
    console.error("Error creando preferencia Mercado Pago:", err);
    return new Response("No se pudo iniciar el pago con Mercado Pago.", {
      status: 502,
    });
  }
}
