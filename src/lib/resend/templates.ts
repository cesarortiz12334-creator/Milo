import { formatearCLP } from "@/lib/donaciones";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export interface EmailRenderizado {
  subject: string;
  html: string;
}

/** Escapa texto dinámico para interpolarlo de forma segura en el HTML. */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function layout({
  titulo,
  cuerpo,
  cta,
}: {
  titulo: string;
  cuerpo: string;
  cta?: { texto: string; url: string };
}): string {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#FFFBF5;font-family:Arial,Helvetica,sans-serif;color:#1C1917;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <div style="font-size:24px;font-weight:800;color:#F97316;">Milo</div>
      <div style="background:#ffffff;border-radius:16px;padding:24px;margin-top:16px;border:1px solid rgba(0,0,0,0.05);">
        <h1 style="font-size:20px;margin:0 0 12px;color:#1C1917;">${titulo}</h1>
        <div style="font-size:15px;line-height:1.6;color:#1C1917;">${cuerpo}</div>
        ${
          cta
            ? `<a href="${cta.url}" style="display:inline-block;margin-top:20px;background:#F97316;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:9999px;">${esc(
                cta.texto
              )}</a>`
            : ""
        }
      </div>
      <p style="font-size:12px;color:#78716C;margin-top:16px;text-align:center;">
        Milo · Financiamiento colectivo veterinario
      </p>
    </div>
  </body>
</html>`;
}

export function tplCasoPendiente(d: {
  vetNombre: string;
  mascotaNombre: string;
  titulo: string;
  montoMeta: number;
}): EmailRenderizado {
  return {
    subject: `Nuevo caso para revisar: ${d.mascotaNombre}`,
    html: layout({
      titulo: "Tienes un nuevo caso pendiente",
      cuerpo: `Hola ${esc(d.vetNombre) || "equipo"},<br/><br/>Un solicitante creó la campaña <strong>${esc(
        d.titulo
      )}</strong> para <strong>${esc(
        d.mascotaNombre
      )}</strong> y te seleccionó como veterinaria. Sube el presupuesto y confirma el caso para activarla.<br/><br/>Meta solicitada: <strong>${formatearCLP(
        d.montoMeta
      )}</strong>.`,
      cta: { texto: "Ir a mi panel", url: `${SITE}/veterinaria` },
    }),
  };
}

export function tplCampanaActiva(d: {
  mascotaNombre: string;
  titulo: string;
  campanaId: string;
}): EmailRenderizado {
  return {
    subject: `¡La campaña de ${d.mascotaNombre} ya está activa!`,
    html: layout({
      titulo: "Tu campaña ya está activa 🎉",
      cuerpo: `La veterinaria confirmó el caso de <strong>${esc(
        d.mascotaNombre
      )}</strong>. La campaña <strong>${esc(
        d.titulo
      )}</strong> ya es pública y puede recibir donaciones. ¡Compártela con tu comunidad!`,
      cta: { texto: "Ver mi campaña", url: `${SITE}/campana/${d.campanaId}` },
    }),
  };
}

export function tplCampanaExitosa(d: {
  mascotaNombre: string;
  titulo: string;
  montoRecaudado: number;
}): EmailRenderizado {
  return {
    subject: `¡Lo lograste! La campaña de ${d.mascotaNombre} se financió`,
    html: layout({
      titulo: "¡Meta alcanzada! 🎉",
      cuerpo: `La campaña <strong>${esc(
        d.titulo
      )}</strong> superó el 70% de su meta y se cerró como <strong>exitosa</strong>, recaudando <strong>${formatearCLP(
        d.montoRecaudado
      )}</strong>. Coordinaremos la transferencia de los fondos con la veterinaria para que <strong>${esc(
        d.mascotaNombre
      )}</strong> reciba su atención.`,
    }),
  };
}

export function tplCampanaNoFinanciada(d: {
  mascotaNombre: string;
  titulo: string;
  campanaId: string;
}): EmailRenderizado {
  return {
    subject: `La campaña de ${d.mascotaNombre} cerró sin alcanzar la meta`,
    html: layout({
      titulo: "La campaña no alcanzó su meta",
      cuerpo: `La campaña <strong>${esc(
        d.titulo
      )}</strong> no llegó al 70% de la meta dentro del plazo. Tu aporte está protegido: puedes <strong>redirigirlo a otra campaña</strong>, dejarlo como <strong>crédito Milo</strong>, o pedir la <strong>devolución en efectivo</strong> dentro de las próximas 72 horas.`,
      cta: { texto: "Ver mis opciones", url: `${SITE}/campana/${d.campanaId}` },
    }),
  };
}

export function tplFondosTransferidos(d: {
  mascotaNombre: string;
  veterinariaNombre: string;
  montoRecaudado: number;
  campanaId: string;
}): EmailRenderizado {
  return {
    subject: `Los fondos para ${d.mascotaNombre} ya fueron transferidos 💛`,
    html: layout({
      titulo: "¡Tu aporte llegó a destino!",
      cuerpo: `Gracias a ti y a la comunidad, la campaña de <strong>${esc(
        d.mascotaNombre
      )}</strong> se financió y los fondos ya fueron transferidos a <strong>${esc(
        d.veterinariaNombre
      )}</strong>.<br/><br/>Total recaudado: <strong>${formatearCLP(
        d.montoRecaudado
      )}</strong>. Pronto el dueño podría subir una foto de la recuperación.`,
      cta: { texto: "Ver la campaña", url: `${SITE}/campana/${d.campanaId}` },
    }),
  };
}

export function tplActualizacionRecuperacion(d: {
  mascotaNombre: string;
  mensaje: string;
  fotoUrl: string | null;
  campanaId: string;
}): EmailRenderizado {
  const foto = d.fotoUrl
    ? `<img src="${d.fotoUrl}" alt="Foto de ${esc(
        d.mascotaNombre
      )}" style="width:100%;max-width:480px;border-radius:12px;margin-top:8px" />`
    : "";
  return {
    subject: `¡${d.mascotaNombre} está bien gracias a ti! 🐾`,
    html: layout({
      titulo: `Una actualización de ${esc(d.mascotaNombre)} 🐾`,
      cuerpo: `${esc(d.mensaje)}<br/>${foto}`,
      cta: { texto: "Ver la campaña", url: `${SITE}/campana/${d.campanaId}` },
    }),
  };
}

export function tplDonacionRecibida(d: {
  donanteNombre: string;
  mascotaNombre: string;
  monto: number;
  comision: number;
  neto: number;
  campanaId: string;
}): EmailRenderizado {
  return {
    subject: `Gracias por tu donación a ${d.mascotaNombre}`,
    html: layout({
      titulo: "¡Gracias por tu aporte! 💛",
      cuerpo: `Hola ${esc(d.donanteNombre) || "amig@"},<br/><br/>Confirmamos tu donación para <strong>${esc(
        d.mascotaNombre
      )}</strong>:<br/><br/>
      Tu donación: <strong>${formatearCLP(d.monto)}</strong><br/>
      Comisión Milo (6% IVA incl.): ${formatearCLP(d.comision)}<br/>
      La campaña recibe: <strong>${formatearCLP(d.neto)}</strong><br/><br/>
      Te enviaremos el certificado cuando la campaña cierre.`,
      cta: { texto: "Ver la campaña", url: `${SITE}/campana/${d.campanaId}` },
    }),
  };
}
