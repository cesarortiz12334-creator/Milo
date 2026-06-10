import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import RegistroSolicitanteForm from "@/components/auth/RegistroSolicitanteForm";
import AvisoSupabase from "@/components/auth/AvisoSupabase";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function RegistroSolicitantePage() {
  const configurado = isSupabaseConfigured();

  return (
    <AuthShell
      titulo="Crear cuenta de solicitante"
      subtitulo="Para pedir ayuda para la atención de tu mascota."
    >
      {!configurado && <AvisoSupabase />}

      <div className="rounded-xl border border-primary/30 bg-primary-soft/30 p-3 text-sm text-dark">
        Al crear una campaña te pediremos tu <strong>Cartola Hogar del RSH</strong>{" "}
        en PDF (la descargas gratis en <strong>ventanillaunicasocial.gob.cl</strong>{" "}
        con tu Clave Única). El RUT que registres debe coincidir con el de la cartola.
      </div>

      <RegistroSolicitanteForm configurado={configurado} />

      <p className="text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Ingresar
        </Link>
      </p>
    </AuthShell>
  );
}
