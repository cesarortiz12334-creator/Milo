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
  searchParams: Promise<{ error?: string; cu?: string; expirada?: string }>;
}) {
  const { error, cu, expirada } = await searchParams;
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
      {cu === "no_configurado" && (
        <Mensaje tipo="error">
          Clave Única aún no está configurada (faltan credenciales de Gobierno
          Digital).
        </Mensaje>
      )}
      {cu === "error" && (
        <Mensaje tipo="error">
          Hubo un problema con Clave Única. Intenta nuevamente.
        </Mensaje>
      )}

      <LoginForm configurado={configurado} />

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-black/10" />o
        <span className="h-px flex-1 bg-black/10" />
      </div>

      <GoogleButton configurado={configurado} />

      <div className="rounded-xl border border-black/10 p-3 text-center">
        <a
          href="/api/auth/clave-unica/inicio"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-dark px-4 py-2.5 text-sm font-bold text-white transition hover:bg-dark/90"
        >
          <span aria-hidden="true">🪪</span> Ingresar con Clave Única
        </a>
        <p className="mt-2 text-xs text-muted">
          Si eres <strong>solicitante</strong>, ingresa con Clave Única.
        </p>
      </div>

      <p className="text-center text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-semibold text-primary">
          Regístrate
        </Link>
      </p>
    </AuthShell>
  );
}
