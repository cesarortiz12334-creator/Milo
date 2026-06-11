import Link from "next/link";
import { getUsuarioActual } from "@/lib/auth";

export default async function SiteHeader() {
  const usuario = await getUsuarioActual();

  return (
    <header className="sticky top-0 z-10 border-b border-black/5 bg-warm-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-heading text-2xl font-extrabold text-primary">
          Milo
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/como-funciona"
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-dark transition hover:bg-primary-soft/40 lg:inline-block"
          >
            Cómo funciona
          </Link>
          <Link
            href="/veterinarias"
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-dark transition hover:bg-primary-soft/40 lg:inline-block"
          >
            Veterinarias
          </Link>
          <Link
            href="/transparencia"
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-dark transition hover:bg-primary-soft/40 lg:inline-block"
          >
            Transparencia
          </Link>
          <Link
            href="/exitos"
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-dark transition hover:bg-primary-soft/40 sm:inline-block"
          >
            Historias
          </Link>
          {usuario ? (
            <>
              {usuario.role === "solicitante" && (
                <Link
                  href="/mis-campanas"
                  className="hidden rounded-full px-4 py-2 text-sm font-semibold text-dark transition hover:bg-primary-soft/40 sm:inline-block"
                >
                  Mis campañas
                </Link>
              )}
              {usuario.role === "veterinaria" && (
                <Link
                  href="/veterinaria"
                  className="hidden rounded-full px-4 py-2 text-sm font-semibold text-dark transition hover:bg-primary-soft/40 sm:inline-block"
                >
                  Mi panel
                </Link>
              )}
              <span className="hidden text-sm text-muted sm:inline">
                {usuario.email}
              </span>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-dark transition hover:bg-primary-soft/40"
                >
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-dark transition hover:bg-primary-soft/40"
              >
                Ingresar
              </Link>
              <Link
                href="/registro"
                className="rounded-full bg-primary px-4 py-2 font-heading text-sm font-bold text-white transition hover:bg-primary/90"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
