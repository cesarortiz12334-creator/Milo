import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const PREGUNTAS = [
  {
    p: "¿Es seguro donar en Milo?",
    r: "Sí. Todos los pagos se procesan a través de Transbank Webpay, el sistema de pago más usado en Chile. Milo nunca almacena datos de tu tarjeta. Además, cada campaña es verificada por una veterinaria registrada antes de publicarse.",
  },
  {
    p: "¿Cómo verifican que el caso es real?",
    r: "Tenemos tres capas de verificación: el solicitante debe acreditar su situación socioeconómica con la Cartola del Registro Social de Hogares (RSH), la veterinaria debe confirmar el caso y subir el presupuesto oficial, y campañas sobre $200.000 pasan por revisión manual del equipo Milo antes de publicarse.",
  },
  {
    p: "¿Qué pasa si la campaña no llega al monto?",
    r: "Si se recauda el 70% o más, los fondos se transfieren igual a la veterinaria y el saldo restante se negocia directamente. Si se recauda menos del 70%, tú como donante puedes redirigir tu donación a otra campaña activa o convertirla en crédito Milo para usar en el futuro. Si lo prefieres, puedes solicitar devolución en efectivo dentro de 72 horas.",
  },
  {
    p: "¿Qué es el Registro Social de Hogares y por qué lo piden?",
    r: "El RSH es el sistema oficial del Estado de Chile que clasifica socioeconómicamente a los hogares. Solo aceptamos solicitudes de personas en el tramo 40% o inferior, que corresponde a la población más vulnerable del país. Lo pedimos para asegurarnos de que Milo llega a quienes más lo necesitan.",
  },
  {
    p: "¿Cuánto cobra Milo por donación?",
    r: "Milo retiene el 6% (IVA incluido) de cada donación para cubrir los costos operativos de la plataforma. Ese porcentaje siempre es visible antes de confirmar tu donación. El 94% restante va directamente a la veterinaria.",
  },
  {
    p: "¿Puedo pedir devolución de mi donación?",
    r: "Si la campaña no se financia (menos del 70% del monto), puedes solicitar devolución en efectivo dentro de 72 horas desde el cierre. Si la campaña fue exitosa, la donación ya fue transferida a la veterinaria y no es reversible.",
  },
  {
    p: "¿Cómo sé que los fondos llegaron a la veterinaria?",
    r: "Cuando la campaña cierra exitosamente, recibes un email confirmando la transferencia. Además, en nuestra página de Transparencia puedes ver el historial de todas las transferencias realizadas. El solicitante también puede subir una foto de su mascota recuperada que recibirás como notificación por email.",
  },
  {
    p: "¿Qué pasa si descubro que una campaña es falsa?",
    r: "Puedes reportarla directamente desde la página de la campaña usando el botón 'Reportar campaña'. El equipo Milo la revisará en menos de 24 horas. Si se confirma el fraude, la campaña se cancela, los fondos se devuelven a los donantes y el RUT del solicitante queda bloqueado permanentemente de la plataforma.",
  },
  {
    p: "¿Puedo donar desde el extranjero?",
    r: "Sí, siempre que tu tarjeta sea aceptada por Transbank Webpay. Los montos se procesan en pesos chilenos (CLP).",
  },
  {
    p: "¿Las veterinarias están verificadas?",
    r: "Sí. Cada veterinaria pasa por un proceso de verificación manual del equipo Milo antes de poder confirmar casos. Verificamos RUT, razón social y documentación vigente. Puedes ver todas las veterinarias verificadas en nuestra página de Veterinarias.",
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-center font-heading text-3xl font-extrabold text-dark sm:text-4xl">
          Preguntas frecuentes
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted">
          Todo lo que necesitas saber sobre cómo funciona Milo.
        </p>

        <div className="mt-10 space-y-3">
          {PREGUNTAS.map((q) => (
            <details
              key={q.p}
              className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-heading font-bold text-dark">
                {q.p}
                <span className="text-primary transition group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-dark/90">{q.r}</p>
            </details>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
