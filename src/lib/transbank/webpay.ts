import {
  WebpayPlus,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
} from "transbank-sdk";

/**
 * Devuelve una transacción de Webpay Plus lista para usar.
 *
 * - Entorno `integration` (sandbox, por defecto): usa SIEMPRE las credenciales
 *   oficiales de prueba de Transbank, así el flujo funciona sin cuenta.
 *   Tarjetas de prueba: https://www.transbankdevelopers.cl/documentacion/como_empezar#tarjetas-de-prueba
 * - Entorno `production`: usa TBK_COMMERCE_CODE / TBK_API_KEY (solo servidor).
 *
 * MiloFund NUNCA maneja datos de tarjeta: el pago ocurre 100% en Webpay.
 * Este helper solo debe importarse desde código de servidor (route handlers).
 */
export function getWebpayTransaction() {
  const isProduction = process.env.TBK_ENVIRONMENT === "production";

  if (isProduction) {
    const commerceCode = process.env.TBK_COMMERCE_CODE;
    const apiKey = process.env.TBK_API_KEY;
    if (!commerceCode || !apiKey) {
      throw new Error(
        "Faltan TBK_COMMERCE_CODE / TBK_API_KEY para el entorno de producción de Transbank."
      );
    }
    return WebpayPlus.Transaction.buildForProduction(commerceCode, apiKey);
  }

  return WebpayPlus.Transaction.buildForIntegration(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY
  );
}
