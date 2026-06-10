import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";

/**
 * Genera una URL firmada de corta duración para un documento privado del bucket
 * `documentos` (presupuestos, docs de verificación). Nunca se expone una URL
 * pública permanente de estos archivos. Solo para uso server-side (back-office).
 */
export async function urlFirmadaDocumento(
  path: string,
  segundos = 300
): Promise<string | null> {
  if (!isAdminConfigured()) return null;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.storage
      .from("documentos")
      .createSignedUrl(path, segundos);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}
