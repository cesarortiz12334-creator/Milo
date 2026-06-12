import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AvisoLegal from "@/components/AvisoLegal";

const SECCIONES = [
  { t: "1. Aceptación de los términos", d: "Al usar MiloFund aceptas estos términos y condiciones. [Contenido legal por completar con asesoría jurídica.]" },
  { t: "2. Qué es MiloFund", d: "MiloFund es una plataforma de financiamiento colectivo para atención veterinaria. MiloFund actúa como intermediario entre solicitantes, veterinarias y donantes. [Por completar.]" },
  { t: "3. Comisión", d: "MiloFund retiene un 6% (IVA incluido) de cada donación, informado antes de confirmar el pago. [Por completar.]" },
  { t: "4. Donaciones y devoluciones", d: "Las donaciones se rigen por la regla del 70% y la política de devolución de 72 horas descrita en las Preguntas Frecuentes. [Por completar.]" },
  { t: "5. Verificación y fraude", d: "MiloFund verifica los casos pero no garantiza la veracidad absoluta. El uso fraudulento conlleva el bloqueo del RUT. [Por completar.]" },
  { t: "6. Responsabilidad", d: "[Limitación de responsabilidad por completar con asesoría jurídica.]" },
  { t: "7. Datos personales", d: "El tratamiento de datos se rige por la Política de Privacidad. [Por completar.]" },
  { t: "8. Cambios y contacto", d: "MiloFund puede actualizar estos términos. Dudas a hola@milofund.cl. [Por completar.]" },
];

export default function TerminosPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-heading text-3xl font-extrabold text-dark">
          Términos y condiciones
        </h1>
        <AvisoLegal />
        <div className="mt-8 space-y-6">
          {SECCIONES.map((s) => (
            <section key={s.t}>
              <h2 className="font-heading text-lg font-bold text-dark">{s.t}</h2>
              <p className="mt-1 text-sm leading-relaxed text-dark/90">{s.d}</p>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
