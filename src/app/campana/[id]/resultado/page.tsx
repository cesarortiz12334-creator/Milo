import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { getCampanaMockById } from "@/lib/mock/campanas";
import { formatearCLP } from "@/lib/donaciones";

type Estado = "aprobada" | "rechazada" | "anulada" | "error" | "desconocido";

const CONTENIDO: Record<
  Estado,
  { emoji: string; titulo: string; mensaje: string; color: string }
> = {
  aprobada: {
    emoji: "🎉",
    titulo: "¡Gracias por tu donación!",
    mensaje:
      "Tu aporte fue confirmado por Webpay. Recibirás tu certificado por correo.",
    color: "text-success",
  },
  rechazada: {
    emoji: "😔",
    titulo: "Tu pago fue rechazado",
    mensaje:
      "Webpay no autorizó la transacción. Puedes intentar con otro medio de pago.",
    color: "text-primary",
  },
  anulada: {
    emoji: "🚫",
    titulo: "Donación cancelada",
    mensaje: "Cancelaste el pago en Webpay. No se realizó ningún cobro.",
    color: "text-muted",
  },
  error: {
    emoji: "⚠️",
    titulo: "Hubo un problema",
    mensaje:
      "No pudimos confirmar la transacción. Si se te cobró, contáctanos y lo revisaremos.",
    color: "text-primary",
  },
  desconocido: {
    emoji: "❔",
    titulo: "Estado desconocido",
    mensaje: "No pudimos determinar el resultado de tu donación.",
    color: "text-muted",
  },
};

export default async function ResultadoDonacion({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ estado?: string; monto?: string }>;
}) {
  const { id } = await params;
  const { estado, monto } = await searchParams;

  const esConocido = (v?: string): v is Exclude<Estado, "desconocido"> =>
    v === "aprobada" ||
    v === "rechazada" ||
    v === "anulada" ||
    v === "error";
  const key: Estado = esConocido(estado) ? estado : "desconocido";
  const info = CONTENIDO[key];

  const campana = getCampanaMockById(id);
  const montoNum = monto ? parseInt(monto, 10) : NaN;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-6xl" aria-hidden="true">
          {info.emoji}
        </div>
        <h1 className={`mt-4 font-heading text-2xl font-extrabold ${info.color}`}>
          {info.titulo}
        </h1>
        <p className="mt-2 text-muted">{info.mensaje}</p>

        {key === "aprobada" && Number.isFinite(montoNum) && (
          <p className="mt-4 font-heading text-lg font-bold text-dark">
            Donaste {formatearCLP(montoNum)}
            {campana ? ` a la campaña de ${campana.mascota_nombre}` : ""}.
          </p>
        )}

        <div className="mt-8 flex flex-col items-center gap-3">
          {campana && (
            <Link
              href={`/campana/${campana.id}`}
              className="inline-flex w-full max-w-xs items-center justify-center rounded-full bg-primary px-4 py-2.5 font-heading text-sm font-bold text-white transition hover:bg-primary/90"
            >
              Volver a la campaña
            </Link>
          )}
          <Link
            href="/"
            className="text-sm font-semibold text-muted transition hover:text-primary"
          >
            Ver otras campañas
          </Link>
        </div>
      </main>
    </div>
  );
}
