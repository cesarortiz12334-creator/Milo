import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import RecuperarForm from "@/components/auth/RecuperarForm";
import AvisoSupabase from "@/components/auth/AvisoSupabase";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecuperarContrasenaPage() {
  const configurado = isSupabaseConfigured();

  return (
    <AuthShell
      titulo="Recuperar contraseña"
      subtitulo="Te enviaremos un enlace para crear una nueva."
    >
      {!configurado && <AvisoSupabase />}

      <RecuperarForm configurado={configurado} />

      <p className="text-center text-sm text-muted">
        ¿La recordaste?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Ingresar
        </Link>
      </p>
    </AuthShell>
  );
}
