import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { isResendConfigured, enviarEmail } from "./client";
import {
  tplCasoPendiente,
  tplCampanaActiva,
  tplCampanaExitosa,
  tplCampanaNoFinanciada,
  tplFondosTransferidos,
  tplActualizacionRecuperacion,
} from "./templates";
import type { CampanaEstado } from "@/types";

/**
 * Notificaciones transaccionales. Best-effort: si Resend o el service role no
 * están configurados, no hacen nada. Hacen las búsquedas de email con service
 * role (operación privilegiada de back-office).
 */
function activo(): boolean {
  return isResendConfigured() && isAdminConfigured();
}

async function emailDe(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .single();
  return (data as { email: string } | null)?.email ?? null;
}

/** A la veterinaria: tiene un nuevo caso pendiente por confirmar. */
export async function notificarCasoPendiente(campanaId: string): Promise<void> {
  if (!activo()) return;
  const supabase = createAdminClient();

  const { data: cData } = await supabase
    .from("campanas")
    .select("titulo, monto_meta, mascota_id, veterinaria_id")
    .eq("id", campanaId)
    .single();
  const c = cData as {
    titulo: string;
    monto_meta: number;
    mascota_id: string;
    veterinaria_id: string;
  } | null;
  if (!c) return;

  const email = await emailDe(supabase, c.veterinaria_id);
  if (!email) return;

  const { data: mData } = await supabase
    .from("mascotas")
    .select("nombre")
    .eq("id", c.mascota_id)
    .single();
  const { data: vData } = await supabase
    .from("veterinarias")
    .select("nombre")
    .eq("user_id", c.veterinaria_id)
    .single();

  const { subject, html } = tplCasoPendiente({
    vetNombre: (vData as { nombre: string } | null)?.nombre ?? "",
    mascotaNombre: (mData as { nombre: string } | null)?.nombre ?? "",
    titulo: c.titulo,
    montoMeta: c.monto_meta,
  });
  await enviarEmail({ to: email, subject, html });
}

/** Al solicitante: su campaña fue confirmada y ya está activa. */
export async function notificarCampanaActiva(campanaId: string): Promise<void> {
  if (!activo()) return;
  const supabase = createAdminClient();

  const { data: cData } = await supabase
    .from("campanas")
    .select("titulo, mascota_id")
    .eq("id", campanaId)
    .single();
  const c = cData as { titulo: string; mascota_id: string } | null;
  if (!c) return;

  const { data: mData } = await supabase
    .from("mascotas")
    .select("nombre, solicitante_id")
    .eq("id", c.mascota_id)
    .single();
  const m = mData as { nombre: string; solicitante_id: string } | null;
  if (!m) return;

  const email = await emailDe(supabase, m.solicitante_id);
  if (!email) return;

  const { subject, html } = tplCampanaActiva({
    mascotaNombre: m.nombre,
    titulo: c.titulo,
    campanaId,
  });
  await enviarEmail({ to: email, subject, html });
}

/** Emails de los donantes con donación pagada de una campaña (sin repetir). */
async function emailsDonantes(
  supabase: ReturnType<typeof createAdminClient>,
  campanaId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("donaciones")
    .select("donante_id")
    .eq("campana_id", campanaId)
    .eq("estado", "pagada");
  const filas = (data ?? []) as { donante_id: string | null }[];
  const ids = [
    ...new Set(filas.map((d) => d.donante_id).filter((x): x is string => !!x)),
  ];
  const emails: string[] = [];
  for (const id of ids) {
    const e = await emailDe(supabase, id);
    if (e) emails.push(e);
  }
  return emails;
}

/**
 * Al cerrar (regla del 70%):
 *  - exitosa → avisa al solicitante y a los donantes (fondos transferidos, F2).
 *  - no_financiada → avisa a los donantes con sus opciones de devolución.
 */
export async function notificarCierre(
  campanaId: string,
  estado: Extract<CampanaEstado, "exitosa" | "no_financiada">
): Promise<void> {
  if (!activo()) return;
  const supabase = createAdminClient();

  const { data: cData } = await supabase
    .from("campanas")
    .select("titulo, monto_recaudado, mascota_id, veterinaria_id")
    .eq("id", campanaId)
    .single();
  const c = cData as {
    titulo: string;
    monto_recaudado: number;
    mascota_id: string;
    veterinaria_id: string;
  } | null;
  if (!c) return;

  const { data: mData } = await supabase
    .from("mascotas")
    .select("nombre, solicitante_id")
    .eq("id", c.mascota_id)
    .single();
  const m = mData as { nombre: string; solicitante_id: string } | null;
  if (!m) return;

  if (estado === "exitosa") {
    const emailSol = await emailDe(supabase, m.solicitante_id);
    if (emailSol) {
      const { subject, html } = tplCampanaExitosa({
        mascotaNombre: m.nombre,
        titulo: c.titulo,
        montoRecaudado: c.monto_recaudado,
      });
      await enviarEmail({ to: emailSol, subject, html });
    }

    // F2: a los donantes, los fondos ya fueron transferidos a la veterinaria.
    const { data: vData } = await supabase
      .from("veterinarias")
      .select("nombre")
      .eq("user_id", c.veterinaria_id)
      .single();
    const vetNombre =
      (vData as { nombre: string } | null)?.nombre ?? "la veterinaria";
    const tpl = tplFondosTransferidos({
      mascotaNombre: m.nombre,
      veterinariaNombre: vetNombre,
      montoRecaudado: c.monto_recaudado,
      campanaId,
    });
    for (const email of await emailsDonantes(supabase, campanaId)) {
      await enviarEmail({ to: email, subject: tpl.subject, html: tpl.html });
    }
    return;
  }

  // no_financiada: avisar a cada donante con sus opciones.
  const tpl = tplCampanaNoFinanciada({
    mascotaNombre: m.nombre,
    titulo: c.titulo,
    campanaId,
  });
  for (const email of await emailsDonantes(supabase, campanaId)) {
    await enviarEmail({ to: email, subject: tpl.subject, html: tpl.html });
  }
}

/**
 * F3: el solicitante publicó una actualización (foto/mensaje de recuperación).
 * Avisa a todos los donantes de la campaña.
 */
export async function notificarActualizacion(
  campanaId: string,
  mensaje: string,
  fotoUrl: string | null
): Promise<void> {
  if (!activo()) return;
  const supabase = createAdminClient();

  const { data: cData } = await supabase
    .from("campanas")
    .select("mascota_id")
    .eq("id", campanaId)
    .single();
  const c = cData as { mascota_id: string } | null;
  if (!c) return;

  const { data: mData } = await supabase
    .from("mascotas")
    .select("nombre")
    .eq("id", c.mascota_id)
    .single();
  const m = mData as { nombre: string } | null;
  if (!m) return;

  const tpl = tplActualizacionRecuperacion({
    mascotaNombre: m.nombre,
    mensaje,
    fotoUrl,
    campanaId,
  });
  for (const email of await emailsDonantes(supabase, campanaId)) {
    await enviarEmail({ to: email, subject: tpl.subject, html: tpl.html });
  }
}
