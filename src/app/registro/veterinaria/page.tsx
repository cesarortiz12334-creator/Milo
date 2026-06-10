import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import RegistroVeterinariaForm from "@/components/auth/RegistroVeterinariaForm";
import AvisoSupabase from "@/components/auth/AvisoSupabase";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function RegistroVeterinariaPage() {
  const configurado = isSupabaseConfigured();

  return (
    <AuthShell
      titulo="Registrar veterinaria"
      subtitulo="Suma tu clínica a la red de Milo."
    >
      {!configurado && <AvisoSupabase />}

      <div className="rounded-xl border border-success/30 bg-success-soft/60 p-3 text-sm text-dark">
        <strong>Verificación manual:</strong> tras registrarte, el equipo Milo
        revisa los datos de tu clínica antes de activarla. Recién entonces podrás
        confirmar casos y publicar campañas.
      </div>

      <RegistroVeterinariaForm configurado={configurado} />

      <p className="text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Ingresar
        </Link>
      </p>
    </AuthShell>
  );
}
