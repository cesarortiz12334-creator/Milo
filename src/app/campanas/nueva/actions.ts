"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  validarArchivo,
  verificarContenidoArchivo,
  TIPOS_IMAGEN,
  MAX_MB,
} from "@/lib/uploads";
import { crearCampanaSchema, parsearFormData } from "@/lib/validaciones";
import { ipActual } from "@/lib/seguridad";
import { rateLimit, DIA } from "@/lib/rate-limit";
import { notificarCasoPendiente } from "@/lib/resend/emails";
import { registrarAuditoria } from "@/lib/auditoria";

export interface CampanaState {
  error?: string;
  message?: string;
}

export async function crearCampana(
  _prev: CampanaState,
  formData: FormData
): Promise<CampanaState> {
  if (!isSupabaseConfigured()) {
    return { error: "Conecta un proyecto Supabase para crear campañas (modo demo)." };
  }

  // Rate limit anti-fraude: máx. 3 campañas por IP cada 24h.
  const ip = await ipActual();
  if (!rateLimit(`crear-campana:${ip}`, 3, DIA).ok) {
    return { error: "Has creado demasiadas campañas hoy. Intenta mañana." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Debes iniciar sesión con Clave Única para crear una campaña." };
  }

  // --- Anti-fraude: rol solicitante + RSH verificado y tramo <= 40% ---
  const { data: solData } = await supabase
    .from("solicitantes")
    .select("rsh_tramo, rsh_verificado_at")
    .eq("user_id", user.id)
    .single();
  const solicitante = solData as
    | { rsh_tramo: number | null; rsh_verificado_at: string | null }
    | null;

  if (!solicitante) return { error: "Solo los solicitantes pueden crear campañas." };
  if (!solicitante.rsh_verificado_at) {
    return { error: "Tu Registro Social de Hogares aún no está verificado con Clave Única." };
  }
  if (solicitante.rsh_tramo == null || solicitante.rsh_tramo > 40) {
    return { error: "Tu tramo RSH debe ser 40% o inferior para crear una campaña." };
  }

  // --- Validación de inputs (server-side, Zod) ---
  const parsed = parsearFormData(crearCampanaSchema, formData);
  if (!parsed.ok) return { error: parsed.error };
  const d = parsed.data;

  // --- Anti-fraude: máx. 1 campaña activa/pendiente por solicitante ---
  const { data: misMascotas } = await supabase
    .from("mascotas")
    .select("id")
    .eq("solicitante_id", user.id);
  const idsMascotas = ((misMascotas as { id: string }[] | null) ?? []).map((m) => m.id);
  if (idsMascotas.length > 0) {
    const { count } = await supabase
      .from("campanas")
      .select("id", { count: "exact", head: true })
      .in("mascota_id", idsMascotas)
      .in("estado", ["pendiente", "activa"]);
    if ((count ?? 0) >= 1) {
      return { error: "Ya tienes una campaña activa o pendiente. Solo puedes tener una a la vez." };
    }
  }

  // --- Foto de la mascota (opcional). Validación de tipo, tamaño y CONTENIDO. ---
  let fotoUrl: string | null = null;
  const foto = formData.get("foto");
  if (foto instanceof File && foto.size > 0) {
    const errTipo = validarArchivo(foto, { tipos: TIPOS_IMAGEN, maxMB: MAX_MB });
    if (errTipo) return { error: errTipo };
    const errContenido = await verificarContenidoArchivo(foto, TIPOS_IMAGEN);
    if (errContenido) return { error: errContenido };

    const ruta = `${user.id}/${crypto.randomUUID()}-${foto.name}`;
    const { error: upErr } = await supabase.storage
      .from("mascotas")
      .upload(ruta, foto, { contentType: foto.type });
    if (upErr) return { error: "No pudimos subir la foto. Intenta de nuevo." };
    const { data: pub } = supabase.storage.from("mascotas").getPublicUrl(ruta);
    fotoUrl = pub.publicUrl;
  }

  // --- Inserta mascota (RLS exige solicitante_id = auth.uid) ---
  const { data: mascotaData, error: mErr } = await supabase
    .from("mascotas")
    .insert({
      solicitante_id: user.id,
      nombre: d.nombre,
      especie: d.especie,
      raza: d.raza || null,
      foto_url: fotoUrl,
      descripcion: d.descripcion_mascota || null,
    })
    .select("id")
    .single();
  const mascota = mascotaData as { id: string } | null;
  if (mErr || !mascota) {
    return { error: "No pudimos guardar la mascota. Intenta de nuevo." };
  }

  // --- Inserta campaña en estado 'pendiente' (la vet debe confirmar) ---
  const { data: campData, error: cErr } = await supabase
    .from("campanas")
    .insert({
      mascota_id: mascota.id,
      veterinaria_id: d.veterinaria_id,
      titulo: d.titulo,
      descripcion: d.descripcion_campana || null,
      monto_meta: d.monto_meta,
      estado: "pendiente",
      fecha_limite: d.fecha_limite || null,
    })
    .select("id")
    .single();
  if (cErr) return { error: "No pudimos crear la campaña. Intenta de nuevo." };

  const nuevaCampana = campData as { id: string } | null;
  if (nuevaCampana) {
    await registrarAuditoria("campana_creada", {
      actorId: user.id,
      campanaId: nuevaCampana.id,
      detalle: { monto_meta: d.monto_meta },
    });
    try {
      await notificarCasoPendiente(nuevaCampana.id);
    } catch {
      // El email es best-effort; no bloquea la creación.
    }
  }

  redirect("/mis-campanas?creada=1");
}
