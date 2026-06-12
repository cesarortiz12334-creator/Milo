import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AvisoLegal from "@/components/AvisoLegal";

const SECCIONES = [
  { t: "1. Qué son las cookies", d: "Pequeños archivos que se guardan en tu navegador para que la plataforma funcione. [Por completar.]" },
  { t: "2. Qué cookies usamos", d: "Solo cookies técnicas necesarias para la sesión y la seguridad. No usamos cookies de publicidad ni de rastreo de terceros. [Por completar.]" },
  { t: "3. Tu preferencia", d: "Al aceptar el banner guardamos tu confirmación en el almacenamiento local de tu navegador. Puedes borrarla limpiando los datos del sitio. [Por completar.]" },
  { t: "4. Contacto", d: "Dudas sobre cookies a través de nuestra página de contacto. [Por completar.]" },
];

export default function CookiesPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-heading text-3xl font-extrabold text-dark">
          Política de cookies
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
