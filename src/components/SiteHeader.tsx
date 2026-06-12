import Link from "next/link";
import { getUsuarioActual } from "@/lib/auth";
import UserMenu from "@/components/UserMenu";

export default async function SiteHeader() {
  const usuario = await getUsuarioActual();

  return (
    <header className="sticky top-0 z-10 border-b border-black/5 bg-warm-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-heading text-2xl font-extrabold text-primary">
          MiloFund
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/como-funciona"
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-dark transition hover:bg-primary-soft/40 lg:inline-block"
          >
            Cómo funciona
          </Link>
          <Link
            href="/faq"
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-dark transition hover:bg-primary-soft/40 lg:inline-block"
          >
            FAQ
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
            href="/contacto"
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-dark transition hover:bg-primary-soft/40 lg:inline-block"
          >
            Contacto
          </Link>
          <Link
            href="/exitos"
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-dark transition hover:bg-primary-soft/40 sm:inline-block"
          >
            Historias
          </Link>
          {usuario ? (
            <UserMenu
              nombre={usuario.nombre}
              email={usuario.email}
              role={usuario.role}
            />
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
