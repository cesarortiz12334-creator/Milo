import { Resend } from "resend";

/** ¿Hay una API key real de Resend configurada? */
export function isResendConfigured(): boolean {
  const key = process.env.RESEND_API_KEY;
  return Boolean(key && !key.includes("tu-resend-api-key"));
}

const FROM = process.env.MILO_FROM_EMAIL ?? "MiloFund <hola@milofund.cl>";

/**
 * Envía un email transaccional. En modo demo (sin RESEND_API_KEY) no envía:
 * registra en consola y devuelve false. Nunca lanza: las notificaciones son
 * best-effort y no deben romper el flujo principal.
 */
export async function enviarEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!isResendConfigured()) {
    console.info(
      "[email demo] Resend no configurado:",
      opts.subject,
      "→",
      opts.to
    );
    return false;
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return true;
  } catch (err) {
    console.error("Error enviando email:", err);
    return false;
  }
}
