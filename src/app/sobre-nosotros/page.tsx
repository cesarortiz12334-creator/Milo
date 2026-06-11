import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const VALORES = [
  {
    i: "🔍",
    t: "Transparencia",
    d: "Cada peso es trazable. Publicamos el historial de transferencias.",
  },
  {
    i: "🤍",
    t: "Dignidad",
    d: "El animal es el protagonista, no la pobreza de su dueño.",
  },
  {
    i: "🛡️",
    t: "Confianza",
    d: "Verificamos cada caso antes de publicarlo.",
  },
];

const EQUIPO = [1, 2, 3];

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-center font-heading text-3xl font-extrabold text-dark sm:text-4xl">
          Sobre nosotros
        </h1>

        {/* Origen */}
        <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <div className="text-5xl" aria-hidden="true">
            🐶
          </div>
          <h2 className="mt-3 font-heading text-2xl font-extrabold text-dark">
            La historia de Milo
          </h2>
          <p className="mt-3 leading-relaxed text-dark/90">
            Milo es un dachshund real de dos meses que fue hospitalizado con
            parvovirus. En la clínica, su dueño vio a otra familia que no podía
            pagar la atención de su mascota y tuvo que irse sin ella. Esa
            experiencia —la impotencia de no poder ayudar— inspiró la creación de
            <strong> Milo, la plataforma</strong>: para que ninguna familia tenga
            que vivir lo mismo.
          </p>
        </section>

        {/* Misión */}
        <section className="mt-8 text-center">
          <h2 className="font-heading text-xl font-bold text-dark">Nuestra misión</h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted">
            Conectar a personas vulnerables con veterinarias y donantes para que
            ninguna mascota muera por falta de dinero.
          </p>
        </section>

        {/* Valores */}
        <section className="mt-10 grid gap-5 sm:grid-cols-3">
          {VALORES.map((v) => (
            <div
              key={v.t}
              className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/5"
            >
              <div className="text-3xl" aria-hidden="true">
                {v.i}
              </div>
              <p className="mt-2 font-heading font-bold text-dark">{v.t}</p>
              <p className="mt-1 text-sm text-muted">{v.d}</p>
            </div>
          ))}
        </section>

        {/* Equipo */}
        <section className="mt-12">
          <h2 className="text-center font-heading text-xl font-bold text-dark">
            El equipo
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {EQUIPO.map((n) => (
              <div
                key={n}
                className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/5"
              >
                <div className="mx-auto h-20 w-20 rounded-full bg-primary-soft" />
                <p className="mt-3 font-heading font-bold text-dark">Tu nombre aquí</p>
                <p className="text-sm text-muted">Rol del equipo</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12 rounded-2xl bg-success-soft/50 p-8 text-center">
          <h2 className="font-heading text-xl font-bold text-dark">Únete a Milo</h2>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/registro/solicitante"
              className="rounded-full bg-primary px-5 py-2.5 font-heading text-sm font-bold text-white transition hover:bg-primary/90"
            >
              Soy solicitante
            </Link>
            <Link
              href="/"
              className="rounded-full bg-success px-5 py-2.5 font-heading text-sm font-bold text-white transition hover:bg-success/90"
            >
              Quiero donar
            </Link>
            <Link
              href="/registro/veterinaria"
              className="rounded-full border border-black/10 bg-white px-5 py-2.5 font-heading text-sm font-bold text-dark transition hover:bg-black/[0.03]"
            >
              Soy veterinaria
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
