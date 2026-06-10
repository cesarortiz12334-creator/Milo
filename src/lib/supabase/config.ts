/**
 * ¿Hay un proyecto Supabase real configurado? Mientras `.env.local` tenga los
 * valores placeholder, devuelve false; así la app no intenta llamadas de auth
 * contra una URL inválida (el middleware y la UI degradan con gracia).
 *
 * Solo usa variables NEXT_PUBLIC_*, por lo que sirve en cliente y servidor.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      !url.includes("TU-PROYECTO") &&
      !key.includes("tu-anon-key")
  );
}
