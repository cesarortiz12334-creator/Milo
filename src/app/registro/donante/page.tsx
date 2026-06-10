import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import RegistroDonanteForm from "@/components/auth/RegistroDonanteForm";
import GoogleButton from "@/components/auth/GoogleButton";
import AvisoSupabase from "@/components/auth/AvisoSupabase";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function RegistroDonantePage() {
  const configurado = isSupabaseConfigured();

  return (
    <AuthShell
      titulo="Crear cuenta de donante"
      subtitulo="Empieza a ayudar en minutos."
    >
      {!configurado && <AvisoSupabase />}

      <RegistroDonanteForm configurado={configurado} />

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-black/10" />o
        <span className="h-px flex-1 bg-black/10" />
      </div>

      <GoogleButton configurado={configurado} texto="Registrarme con Google" />

      <p className="text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Ingresar
        </Link>
      </p>
    </AuthShell>
  );
}
