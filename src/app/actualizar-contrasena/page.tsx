import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import ActualizarPasswordForm from "@/components/auth/ActualizarPasswordForm";
import AvisoSupabase from "@/components/auth/AvisoSupabase";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default function ActualizarContrasenaPage() {
  const configurado = isSupabaseConfigured();

  return (
    <AuthShell
      titulo="Crea tu nueva contraseña"
      subtitulo="Escribe una contraseña nueva (mínimo 8 caracteres)."
    >
      {!configurado && <AvisoSupabase />}

      <ActualizarPasswordForm configurado={configurado} />
    </AuthShell>
  );
}
