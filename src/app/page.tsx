import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import CampanaCard from "@/components/CampanaCard";
import { campanasMock } from "@/lib/mock/campanas";

export default function Home() {
  const campanas = campanasMock.filter((c) => c.estado === "activa");

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-6 pt-12 text-center sm:pt-16">
        <h1 className="font-heading text-3xl font-extrabold leading-tight text-dark sm:text-5xl">
          Cada mascota merece una <span className="text-primary">segunda oportunidad</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted sm:text-lg">
          Milo conecta a familias que necesitan ayuda con veterinarias verificadas
          y donantes que quieren marcar la diferencia. Transparente, seguro y con el
          animal siempre como protagonista.
        </p>
      </section>

      {/* Feed de campañas activas */}
      <main className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-heading text-xl font-bold text-dark sm:text-2xl">
            Campañas activas
          </h2>
          <span className="text-sm text-muted">
            {campanas.length} {campanas.length === 1 ? "campaña" : "campañas"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campanas.map((campana) => (
            <CampanaCard key={campana.id} campana={campana} />
          ))}
        </div>
      </main>

      {/* Teaser historias de éxito */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-2xl bg-success-soft/50 p-8 text-center">
          <p className="font-heading text-xl font-bold text-dark">
            ¿Quieres ver finales felices?
          </p>
          <p className="mx-auto mt-1 max-w-lg text-sm text-muted">
            Conoce a las mascotas que ya se recuperaron gracias a la comunidad de
            Milo.
          </p>
          <Link
            href="/exitos"
            className="mt-4 inline-block rounded-full bg-success px-5 py-2.5 font-heading text-sm font-bold text-white transition hover:bg-success/90"
          >
            Ver historias de éxito →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 bg-white/50">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-muted">
          <p>
            Milo cobra una comisión del <strong className="text-dark">5%</strong> que
            se muestra siempre antes de confirmar tu donación.
          </p>
          <p className="mt-2">
            Pagos procesados de forma segura con Transbank Webpay Plus.
          </p>
        </div>
      </footer>
    </div>
  );
}
