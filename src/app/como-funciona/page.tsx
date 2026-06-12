import { Fragment } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const FLUJOS = [
  {
    rol: "Para solicitantes",
    pasos: [
      { i: "📧", t: "Regístrate con tu email", d: "Crea tu cuenta entregando tu RUT." },
      { i: "📄", t: "Sube tu Cartola RSH", d: "Validamos tu situación automáticamente (tramo ≤ 40%)." },
      { i: "🏥", t: "Tu vet confirma el caso", d: "La veterinaria sube el presupuesto y aprueba." },
      { i: "💛", t: "La comunidad dona", d: "Al cerrar, los fondos van directo a la veterinaria." },
    ],
    cta: { href: "/registro/solicitante", label: "Crear mi cuenta" },
  },
  {
    rol: "Para donantes",
    pasos: [
      { i: "🐾", t: "Elige una campaña que te mueva", d: "Encuentra una mascota que necesite ayuda." },
      { i: "🔒", t: "Dona de forma segura", d: "Comisión del 6% (IVA incl.) siempre visible antes de pagar." },
      { i: "📬", t: "Recibe actualizaciones por email", d: "Te contamos cómo evoluciona la mascota." },
    ],
    cta: { href: "/", label: "Ver campañas" },
  },
  {
    rol: "Para veterinarias",
    pasos: [
      { i: "✅", t: "Regístrate y pasa la verificación", d: "El equipo MiloFund valida tu clínica." },
      { i: "📋", t: "Confirma casos de tus pacientes", d: "Sube el presupuesto oficial y aprueba." },
      { i: "🏦", t: "Recibe los fondos directamente", d: "En tu cuenta, al cerrar la campaña." },
    ],
    cta: { href: "/registro/veterinaria", label: "Registrar mi clínica" },
  },
];

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-center font-heading text-3xl font-extrabold text-dark sm:text-4xl">
          Cómo funciona MiloFund
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted">
          Tres formas de ser parte. Elige la tuya.
        </p>

        <div className="mt-12 space-y-16">
          {FLUJOS.map((f) => (
            <section key={f.rol}>
              <h2 className="font-heading text-2xl font-extrabold text-dark">{f.rol}</h2>
              <div className="mt-6 flex flex-col items-stretch gap-3 md:flex-row md:items-center">
                {f.pasos.map((p, idx) => (
                  <Fragment key={p.t}>
                    <div className="flex-1 rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
                      <div className="text-3xl" aria-hidden="true">
                        {p.i}
                      </div>
                      <p className="mt-2 font-heading font-bold text-dark">{p.t}</p>
                      <p className="mt-1 text-sm text-muted">{p.d}</p>
                    </div>
                    {idx < f.pasos.length - 1 && (
                      <div className="self-center text-2xl text-primary" aria-hidden="true">
                        →
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
              <div className="mt-6">
                <Link
                  href={f.cta.href}
                  className="inline-block rounded-full bg-primary px-5 py-2.5 font-heading text-sm font-bold text-white transition hover:bg-primary/90"
                >
                  {f.cta.label}
                </Link>
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
