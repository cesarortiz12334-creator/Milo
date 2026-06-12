import { MercadoPagoConfig, Preference } from "mercadopago";

/**
 * Configuración base de Mercado Pago (Checkout Pro).
 * Usa un ACCESS TOKEN de prueba (sandbox) primero. Solo código de servidor.
 */
export function isMercadoPagoConfigured(): boolean {
  const t = process.env.MERCADOPAGO_ACCESS_TOKEN;
  return Boolean(t && !t.includes("tu-access-token"));
}

export function getPreferenceClient(): Preference {
  const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  });
  return new Preference(client);
}
