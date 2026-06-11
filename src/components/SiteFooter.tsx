import Link from "next/link";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/como-funciona", label: "Cómo funciona" },
  { href: "/veterinarias", label: "Veterinarias" },
  { href: "/exitos", label: "Historias de éxito" },
  { href: "/transparencia", label: "Transparencia" },
];

const REDES = [
  { label: "Instagram", icono: "📷" },
  { label: "Facebook", icono: "👍" },
  { label: "TikTok", icono: "🎵" },
  { label: "LinkedIn", icono: "💼" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-black/5 bg-white/60">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-heading text-xl font-extrabold text-primary">Milo</p>
            <p className="mt-2 text-sm text-muted">
              Financiamiento colectivo para la atención veterinaria de mascotas de
              familias vulnerables.
            </p>
            <p className="mt-2 text-sm text-muted">
              Comisión 5% siempre visible · Pagos con Transbank Webpay.
            </p>
          </div>

          <div>
            <p className="font-heading text-sm font-bold text-dark">Navegación</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="text-muted transition hover:text-primary">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-heading text-sm font-bold text-dark">Legal</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              <li>
                <Link href="/terminos" className="text-muted transition hover:text-primary">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="text-muted transition hover:text-primary">
                  Política de privacidad
                </Link>
              </li>
            </ul>
            <p className="mt-4 font-heading text-sm font-bold text-dark">Síguenos</p>
            <div className="mt-2 flex gap-3">
              {REDES.map((r) => (
                <a
                  key={r.label}
                  href="#"
                  aria-label={r.label}
                  title={r.label}
                  className="text-lg transition hover:opacity-70"
                >
                  <span aria-hidden="true">{r.icono}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-8 border-t border-black/5 pt-6 text-center text-sm text-muted">
          Milo © 2026 — Hecho en Chile con amor 🐾
        </p>
      </div>
    </footer>
  );
}
