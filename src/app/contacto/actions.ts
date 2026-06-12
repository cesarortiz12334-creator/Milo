"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { contactoSchema, parsearFormData } from "@/lib/validaciones";
import { ipActual } from "@/lib/seguridad";
import { rateLimit, HORA } from "@/lib/rate-limit";

export interface ContactoState {
  error?: string;
  message?: string;
}

const EXITO: ContactoState = {
  message: "Recibimos tu mensaje. Respondemos en menos de 48 horas hábiles.",
};

export async function enviarContacto(
  _prev: ContactoState,
  formData: FormData
): Promise<ContactoState> {
  const parsed = parsearFormData(contactoSchema, formData);
  if (!parsed.ok) return { error: parsed.error };

  const ip = await ipActual();
  if (!rateLimit(`contacto:${ip}`, 5, HORA).ok) {
    return { error: "Has enviado demasiados mensajes. Intenta más tarde." };
  }

  // NO se envía ningún email: solo se guarda en la base de datos.
  if (!isSupabaseConfigured()) return EXITO;
  try {
    const supabase = await createClient();
    await supabase.from("mensajes_contacto").insert(parsed.data);
  } catch {
    // Best-effort: no exponemos detalles técnicos.
  }
  return EXITO;
}
