import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const SECCIONES = [
  { t: "1. Qué datos recopilamos", d: "Email, nombre, RUT (hasheado), datos de la Cartola RSH y de las campañas. Nunca almacenamos datos de tarjetas (los procesa Transbank). [Por completar.]" },
  { t: "2. Para qué los usamos", d: "Para verificar elegibilidad, operar las campañas, procesar donaciones y enviar notificaciones. [Por completar.]" },
  { t: "3. Datos sensibles", d: "El RUT se guarda hasheado y el tramo RSH nunca se expone públicamente. Los documentos viven en almacenamiento privado. [Por completar.]" },
  { t: "4. Con quién los compartimos", d: "Con la veterinaria del caso (datos mínimos) y proveedores de pago/email. No vendemos datos. [Por completar.]" },
  { t: "5. Tus derechos", d: "Puedes solicitar acceso, rectificación o eliminación de tus datos escribiendo a hola@milo.cl. [Por completar según la Ley 19.628 / normativa vigente.]" },
  { t: "6. Cookies", d: "Usamos cookies necesarias para la sesión. [Por completar.]" },
  { t: "7. Contacto", d: "Dudas de privacidad a hola@milo.cl. [Por completar.]" },
];

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-heading text-3xl font-extrabold text-dark">
          Política de privacidad
        </h1>
        <p className="mt-2 text-sm text-muted">
          Última actualización: [fecha]. Borrador — debe revisarlo un abogado antes
          de publicar.
        </p>
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
