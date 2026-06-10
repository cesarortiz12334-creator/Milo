"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { validarArchivo, TIPOS_IMAGEN, MAX_MB } from "@/lib/uploads";
import { notificarCasoPendiente } from "@/lib/resend/emails";

export interface CampanaState {
  error?: string;
  message?: string;
}

export async function crearCampana(
  _prev: CampanaState,
  formData: FormData
): Promise<CampanaState> {
  if (!isSupabaseConfigured()) {
    return {
      error: "Conecta un proyecto Supabase para crear campañas (modo demo).",
    };
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

  if (!solicitante) {
    return { error: "Solo los solicitantes pueden crear campañas." };
  }
  if (!solicitante.rsh_verificado_at) {
    return {
      error: "Tu Registro Social de Hogares aún no está verificado con Clave Única.",
    };
  }
  if (solicitante.rsh_tramo == null || solicitante.rsh_tramo > 40) {
    return {
      error: "Tu tramo RSH debe ser 40% o inferior para crear una campaña.",
    };
  }

  // --- Datos del formulario ---
  const nombre = String(formData.get("nombre") ?? "").trim();
  const especie = String(formData.get("especie") ?? "").trim();
  const raza = String(formData.get("raza") ?? "").trim();
  const descripcionMascota = String(
    formData.get("descripcion_mascota") ?? ""
  ).trim();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descripcionCampana = String(
    formData.get("descripcion_campana") ?? ""
  ).trim();
  const montoMeta = parseInt(String(formData.get("monto_meta") ?? ""), 10);
  const fechaLimite = String(formData.get("fecha_limite") ?? "").trim();
  const veterinariaId = String(formData.get("veterinaria_id") ?? "").trim();
  const foto = formData.get("foto");

  if (!nombre || !especie) {
    return { error: "El nombre y la especie de la mascota son obligatorios." };
  }
  if (!titulo) return { error: "Ponle un título a la campaña." };
  if (!Number.isFinite(montoMeta) || montoMeta <= 0) {
    return { error: "Ingresa una meta de recaudación válida." };
  }
  if (!veterinariaId) {
    return { error: "Selecciona la veterinaria que atenderá el caso." };
  }

  // --- Foto de la mascota (opcional). Bucket público "mascotas". ---
  let fotoUrl: string | null = null;
  if (foto instanceof File && foto.size > 0) {
    const err = validarArchivo(foto, { tipos: TIPOS_IMAGEN, maxMB: MAX_MB });
    if (err) return { error: err };

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
      nombre,
      especie,
      raza: raza || null,
      foto_url: fotoUrl,
      descripcion: descripcionMascota || null,
    })
    .select("id")
    .single();
  const mascota = mascotaData as { id: string } | null;
  if (mErr || !mascota) {
    return { error: "No pudimos guardar la mascota. Intenta de nuevo." };
  }

  // --- Inserta campaña en estado 'pendiente': la veterinaria debe confirmar
  //     el caso (anti-fraude) antes de que pase a 'activa'. ---
  const { data: campData, error: cErr } = await supabase
    .from("campanas")
    .insert({
      mascota_id: mascota.id,
      veterinaria_id: veterinariaId,
      titulo,
      descripcion: descripcionCampana || null,
      monto_meta: montoMeta,
      estado: "pendiente",
      fecha_limite: fechaLimite || null,
    })
    .select("id")
    .single();
  if (cErr) {
    return { error: "No pudimos crear la campaña. Intenta de nuevo." };
  }

  // Notifica a la veterinaria del nuevo caso (best-effort).
  const nuevaCampana = campData as { id: string } | null;
  if (nuevaCampana) {
    try {
      await notificarCasoPendiente(nuevaCampana.id);
    } catch {
      // No bloquea la creación si el email falla.
    }
  }

  redirect("/mis-campanas?creada=1");
}
