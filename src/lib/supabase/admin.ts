import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase con SERVICE ROLE (omite RLS). SOLO para código de servidor
 * privilegiado: cierre de campañas, back-office, Clave Única. NUNCA exponer la
 * service role key al cliente.
 */
export function isAdminConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(
    url &&
      key &&
      !url.includes("TU-PROYECTO") &&
      !key.includes("tu-service-role-key")
  );
}

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
