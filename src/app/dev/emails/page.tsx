import { notFound } from "next/navigation";
import {
  tplCasoPendiente,
  tplCampanaActiva,
  tplCampanaExitosa,
  tplCampanaNoFinanciada,
  tplDonacionRecibida,
  type EmailRenderizado,
} from "@/lib/resend/templates";

/**
 * Galería de vista previa de los emails transaccionales (solo desarrollo).
 * Cada email se renderiza aislado en un iframe.
 */
export default function DevEmailsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const muestras: EmailRenderizado[] = [
    tplCasoPendiente({
      vetNombre: "Clínica Veterinaria Patitas",
      mascotaNombre: "Simba",
      titulo: "Fractura de pata de Simba",
      montoMeta: 540000,
    }),
    tplCampanaActiva({
      mascotaNombre: "Pelusa",
      titulo: "Cirugía de cadera para Pelusa",
      campanaId: "mock-1",
    }),
    tplDonacionRecibida({
      donanteNombre: "Camila",
      mascotaNombre: "Pelusa",
      monto: 10000,
      comision: 500,
      neto: 9500,
      campanaId: "mock-1",
    }),
    tplCampanaExitosa({
      mascotaNombre: "Lola",
      titulo: "¡Operación de Lola financiada!",
      montoRecaudado: 615000,
    }),
    tplCampanaNoFinanciada({
      mascotaNombre: "Peluso",
      titulo: "Tratamiento de Peluso",
      campanaId: "mock-nofin",
    }),
  ];

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-heading text-3xl font-extrabold text-dark">
          Vista previa de emails
        </h1>
        <p className="mt-1 text-muted">
          Plantillas transaccionales (Resend). Solo visible en desarrollo.
        </p>

        <div className="mt-8 space-y-8">
          {muestras.map((m, i) => (
            <section key={i}>
              <h2 className="font-heading font-bold text-dark">
                Asunto: {m.subject}
              </h2>
              <iframe
                title={m.subject}
                srcDoc={m.html}
                className="mt-2 h-[420px] w-full rounded-xl border border-black/10"
              />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
