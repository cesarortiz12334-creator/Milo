import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { isResendConfigured, enviarEmail } from "./client";
import {
  tplCasoPendiente,
  tplCampanaActiva,
  tplCampanaExitosa,
  tplCampanaNoFinanciada,
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

/**
 * Al cerrar: avisa a los donantes (y al solicitante si fue exitosa) según la
 * regla del 70%.
 */
export async function notificarCierre(
  campanaId: string,
  estado: Extract<CampanaEstado, "exitosa" | "no_financiada">
): Promise<void> {
  if (!activo()) return;
  const supabase = createAdminClient();

  const { data: cData } = await supabase
    .from("campanas")
    .select("titulo, monto_recaudado, mascota_id")
    .eq("id", campanaId)
    .single();
  const c = cData as {
    titulo: string;
    monto_recaudado: number;
    mascota_id: string;
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
    const email = await emailDe(supabase, m.solicitante_id);
    if (email) {
      const { subject, html } = tplCampanaExitosa({
        mascotaNombre: m.nombre,
        titulo: c.titulo,
        montoRecaudado: c.monto_recaudado,
      });
      await enviarEmail({ to: email, subject, html });
    }
    return;
  }

  // no_financiada: avisar a cada donante con sus opciones.
  const { data: dData } = await supabase
    .from("donaciones")
    .select("donante_id")
    .eq("campana_id", campanaId)
    .eq("estado", "pagada");
  const donaciones = (dData ?? []) as { donante_id: string | null }[];
  const donanteIds = [
    ...new Set(donaciones.map((d) => d.donante_id).filter((id): id is string => !!id)),
  ];

  const { subject, html } = tplCampanaNoFinanciada({
    mascotaNombre: m.nombre,
    titulo: c.titulo,
    campanaId,
  });

  for (const id of donanteIds) {
    const email = await emailDe(supabase, id);
    if (email) await enviarEmail({ to: email, subject, html });
  }
}
