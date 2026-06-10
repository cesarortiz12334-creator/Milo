import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import GoogleButton from "@/components/auth/GoogleButton";
import AvisoSupabase from "@/components/auth/AvisoSupabase";
import { Mensaje } from "@/components/auth/campos";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; expirada?: string }>;
}) {
  const { error, expirada } = await searchParams;
  const configurado = isSupabaseConfigured();

  return (
    <AuthShell titulo="Ingresar a Milo" subtitulo="Qué bueno verte de vuelta.">
      {!configurado && <AvisoSupabase />}
      {expirada && (
        <Mensaje tipo="error">
          Tu sesión se cerró por inactividad. Vuelve a ingresar.
        </Mensaje>
      )}
      {error === "auth" && (
        <Mensaje tipo="error">
          No pudimos completar el inicio de sesión. Intenta de nuevo.
        </Mensaje>
      )}

      <LoginForm configurado={configurado} />

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-black/10" />o
        <span className="h-px flex-1 bg-black/10" />
      </div>

      <GoogleButton configurado={configurado} />

      <p className="text-center text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-semibold text-primary">
          Regístrate
        </Link>
      </p>
    </AuthShell>
  );
}
