"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  validarArchivo,
  verificarContenidoArchivo,
  TIPOS_IMAGEN,
  TIPOS_PDF,
  MAX_MB,
} from "@/lib/uploads";
import { crearCampanaSchema, parsearFormData } from "@/lib/validaciones";
import { validarCartola } from "@/lib/cartola";
import { ipActual } from "@/lib/seguridad";
import { rateLimit, DIA } from "@/lib/rate-limit";
import { notificarCasoPendiente } from "@/lib/resend/emails";
import { registrarAuditoria } from "@/lib/auditoria";

export interface CampanaState {
  error?: string;
  message?: string;
}

// Campañas por sobre este monto requieren revisión manual del equipo MiloFund.
const MONTO_REVISION_MANUAL = 200_000;

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
    return { error: "Debes iniciar sesión para crear una campaña." };
  }

  // El solicitante y su RUT registrado (hasheado) para cruzar con la cartola.
  const { data: solData } = await supabase
    .from("solicitantes")
    .select("rut_hash")
    .eq("user_id", user.id)
    .single();
  const solicitante = solData as { rut_hash: string | null } | null;
  if (!solicitante) return { error: "Solo los solicitantes pueden crear campañas." };
  if (!solicitante.rut_hash) {
    return { error: "Debes registrar tu RUT antes de crear una campaña." };
  }

  // Validación de inputs de texto (server-side, Zod).
  const parsed = parsearFormData(crearCampanaSchema, formData);
  if (!parsed.ok) return { error: parsed.error };
  const d = parsed.data;

  // Anti-fraude: máx. 1 campaña activa/pendiente por solicitante.
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

  // --- Cartola Hogar del RSH (PDF obligatorio) ---
  const cartola = formData.get("cartola");
  if (!(cartola instanceof File) || cartola.size === 0) {
    return { error: "Debes subir tu Cartola Hogar del RSH en PDF." };
  }
  const errTipo = validarArchivo(cartola, { tipos: TIPOS_PDF, maxMB: MAX_MB });
  if (errTipo) return { error: errTipo };
  const errContenido = await verificarContenidoArchivo(cartola, TIPOS_PDF);
  if (errContenido) return { error: errContenido };

  const valCartola = await validarCartola(cartola, solicitante.rut_hash);
  if (!valCartola.ok || !valCartola.datos) {
    await supabase
      .from("solicitantes")
      .update({ validacion_estado: "rechazada" })
      .eq("user_id", user.id);
    return { error: valCartola.error ?? "No pudimos validar tu cartola." };
  }

  // Guarda la cartola en el bucket privado y los datos validados del solicitante.
  const rutaCartola = `${user.id}/cartola/${crypto.randomUUID()}.pdf`;
  const { error: upCartola } = await supabase.storage
    .from("documentos")
    .upload(rutaCartola, cartola, { contentType: "application/pdf" });
  if (upCartola) {
    return { error: "No pudimos guardar tu cartola. Intenta de nuevo." };
  }
  await supabase
    .from("solicitantes")
    .update({
      cartola_pdf_url: rutaCartola,
      rut_extraido: valCartola.datos.rutExtraido,
      tramo_extraido: valCartola.datos.tramo,
      fecha_emision_cartola: valCartola.datos.fechaEmision,
      validacion_estado: "auto_aprobada",
    })
    .eq("user_id", user.id);

  // --- Fotos de la mascota (1 a 5, OBLIGATORIAS). Tipo, tamaño y contenido real. ---
  const fotos = formData
    .getAll("fotos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (fotos.length === 0) {
    return {
      error: "Debes subir al menos una foto de tu mascota para crear la campaña.",
    };
  }
  if (fotos.length > 5) {
    return { error: "Puedes subir un máximo de 5 fotos." };
  }
  const fotosUrls: string[] = [];
  for (const f of fotos) {
    const errFotoTipo = validarArchivo(f, { tipos: TIPOS_IMAGEN, maxMB: MAX_MB });
    if (errFotoTipo) return { error: errFotoTipo };
    const errFotoContenido = await verificarContenidoArchivo(f, TIPOS_IMAGEN);
    if (errFotoContenido) return { error: errFotoContenido };

    const ruta = `${user.id}/${crypto.randomUUID()}-${f.name}`;
    const { error: upErr } = await supabase.storage
      .from("mascotas")
      .upload(ruta, f, { contentType: f.type });
    if (upErr) return { error: "No pudimos subir las fotos. Intenta de nuevo." };
    fotosUrls.push(
      supabase.storage.from("mascotas").getPublicUrl(ruta).data.publicUrl
    );
  }
  const fotoUrl = fotosUrls[0];

  // Descripción enriquecida: combinamos los 4 campos guiados en una sola.
  const descripcionCompleta = [
    `¿Qué le pasó?\n${d.que_paso}`,
    `Diagnóstico de la veterinaria:\n${d.diagnostico}`,
    `¿Por qué necesitan ayuda?\n${d.por_que_ayuda}`,
    `Sobre ${d.nombre}:\n${d.algo_especial}`,
  ].join("\n\n");

  // Campañas > $200.000 → revisión manual del equipo MiloFund antes de publicarse.
  const requiereRevision = d.monto_meta > MONTO_REVISION_MANUAL;

  // Inserta mascota.
  const { data: mascotaData, error: mErr } = await supabase
    .from("mascotas")
    .insert({
      solicitante_id: user.id,
      nombre: d.nombre,
      especie: d.especie,
      raza: d.raza || null,
      foto_url: fotoUrl,
      fotos_urls: fotosUrls,
      descripcion: d.algo_especial,
    })
    .select("id")
    .single();
  const mascota = mascotaData as { id: string } | null;
  if (mErr || !mascota) {
    return { error: "No pudimos guardar la mascota. Intenta de nuevo." };
  }

  // Inserta campaña en 'pendiente' (la vet debe confirmar; y si supera el monto,
  // además requiere revisión manual de MiloFund).
  const { data: campData, error: cErr } = await supabase
    .from("campanas")
    .insert({
      mascota_id: mascota.id,
      veterinaria_id: d.veterinaria_id,
      titulo: d.titulo,
      descripcion: descripcionCompleta,
      monto_meta: d.monto_meta,
      estado: "pendiente",
      fecha_limite: d.fecha_limite || null,
      requiere_revision_manual: requiereRevision,
    })
    .select("id")
    .single();
  if (cErr) return { error: "No pudimos crear la campaña. Intenta de nuevo." };

  const nuevaCampana = campData as { id: string } | null;
  if (nuevaCampana) {
    await registrarAuditoria("campana_creada", {
      actorId: user.id,
      campanaId: nuevaCampana.id,
      detalle: {
        monto_meta: d.monto_meta,
        tramo: valCartola.datos.tramo,
        requiere_revision_manual: requiereRevision,
      },
    });
    try {
      await notificarCasoPendiente(nuevaCampana.id);
    } catch {
      // El email es best-effort.
    }
  }

  const msg = requiereRevision
    ? "/mis-campanas?creada=1&revision=1"
    : "/mis-campanas?creada=1";
  redirect(msg);
}
