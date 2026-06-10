import Link from "next/link";
import type { CampanaPublica } from "@/types";
import { emojiEspecie } from "@/lib/especie";

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

function diasRestantes(fechaLimite: string | null): number | null {
  if (!fechaLimite) return null;
  const ms = new Date(fechaLimite).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/** Gradiente cálido de fondo según especie (placeholder hasta tener foto real). */
function gradienteEspecie(especie: string): string {
  return especie.toLowerCase().includes("perro")
    ? "from-primary-soft to-warm-white"
    : "from-primary-soft to-success-soft";
}

export default function CampanaCard({ campana }: { campana: CampanaPublica }) {
  const progreso = Math.min(
    100,
    Math.round((campana.monto_recaudado / campana.monto_meta) * 100)
  );
  // El 70% es el umbral de financiamiento (regla de negocio): lo marcamos en verde.
  const financiada = progreso >= 70;
  const dias = diasRestantes(campana.fecha_limite);
  const emoji = emojiEspecie(campana.mascota_especie);
  const gradient = gradienteEspecie(campana.mascota_especie);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
      {/* Foto de la mascota (protagonista). Placeholder cálido por ahora. */}
      <div
        className={`relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br ${gradient}`}
      >
        {campana.mascota_foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={campana.mascota_foto_url}
            alt={`Foto de ${campana.mascota_nombre}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-6xl" aria-hidden="true">
            {emoji}
          </span>
        )}
        {dias !== null && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-dark shadow-sm">
            {dias === 0 ? "Último día" : `${dias} días`}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-heading text-lg font-extrabold leading-tight text-dark">
            {campana.mascota_nombre}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{campana.titulo}</p>
        </div>

        {/* Barra de progreso */}
        <div className="mt-auto">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-primary-soft/50">
            <div
              className={`h-full rounded-full transition-all ${
                financiada ? "bg-success" : "bg-primary"
              }`}
              style={{ width: `${progreso}%` }}
              role="progressbar"
              aria-valuenow={progreso}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progreso}% recaudado`}
            />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-heading text-sm font-bold text-dark">
              {clp.format(campana.monto_recaudado)}
            </span>
            <span className="text-xs text-muted">
              de {clp.format(campana.monto_meta)} · {progreso}%
            </span>
          </div>
        </div>

        {/* Veterinaria */}
        <p className="flex items-center gap-1 text-xs text-muted">
          <span aria-hidden="true">🏥</span>
          {campana.veterinaria_nombre}
          {campana.veterinaria_verificada && (
            <span
              className="ml-0.5 text-success"
              title="Veterinaria verificada"
              aria-label="Veterinaria verificada"
            >
              ✓
            </span>
          )}
        </p>

        {/* Acción principal */}
        <Link
          href={`/campana/${campana.id}`}
          className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 font-heading text-sm font-bold text-white transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Donar
        </Link>
      </div>
    </article>
  );
}
