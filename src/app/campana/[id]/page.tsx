import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import DonacionForm from "@/components/DonacionForm";
import EstadoBadge from "@/components/EstadoBadge";
import OpcionesDevolucion from "@/components/campanas/OpcionesDevolucion";
import { getCampanaMockById } from "@/lib/mock/campanas";
import { formatearCLP } from "@/lib/donaciones";
import { emojiEspecie } from "@/lib/especie";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function diasRestantes(fechaLimite: string | null): number | null {
  if (!fechaLimite) return null;
  const ms = new Date(fechaLimite).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default async function CampanaDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // TODO(Supabase): reemplazar los datos mock por la campaña real. Para campañas
  // públicas (activa/exitosa) leer de la vista `campanas_publicas`; el donante
  // dueño de un aporte puede ver también la suya 'no_financiada' (RLS migración 005).
  const { id } = await params;
  const campana = getCampanaMockById(id);
  if (!campana) notFound();

  const progreso = Math.min(
    100,
    Math.round((campana.monto_recaudado / campana.monto_meta) * 100)
  );
  const financiada = progreso >= 70;
  const dias = diasRestantes(campana.fecha_limite);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/"
          className="text-sm font-semibold text-muted transition hover:text-primary"
        >
          ← Volver a campañas
        </Link>

        <div className="mt-4 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* Columna principal */}
          <div>
            <div className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary-soft to-success-soft">
              {campana.mascota_foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={campana.mascota_foto_url}
                  alt={`Foto de ${campana.mascota_nombre}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-8xl" aria-hidden="true">
                  {emojiEspecie(campana.mascota_especie)}
                </span>
              )}
            </div>

            <h1 className="mt-6 font-heading text-3xl font-extrabold text-dark">
              {campana.titulo}
            </h1>
            <p className="mt-1 text-muted">
              {campana.mascota_nombre}
              {campana.mascota_raza ? ` · ${campana.mascota_raza}` : ""} ·{" "}
              {campana.mascota_especie}
            </p>

            <p className="mt-1 flex items-center gap-1 text-sm text-muted">
              <span aria-hidden="true">🏥</span>
              {campana.veterinaria_nombre}
              {campana.veterinaria_verificada && (
                <span className="text-success" title="Veterinaria verificada">
                  ✓ verificada
                </span>
              )}
            </p>

            {campana.descripcion && (
              <p className="mt-4 whitespace-pre-line leading-relaxed text-dark/90">
                {campana.descripcion}
              </p>
            )}
          </div>

          {/* Columna lateral: progreso + donación */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="h-3 w-full overflow-hidden rounded-full bg-primary-soft/50">
                <div
                  className={`h-full rounded-full ${
                    financiada ? "bg-success" : "bg-primary"
                  }`}
                  style={{ width: `${progreso}%` }}
                  role="progressbar"
                  aria-valuenow={progreso}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-heading text-2xl font-extrabold text-dark">
                  {formatearCLP(campana.monto_recaudado)}
                </span>
                <span className="text-sm text-muted">{progreso}%</span>
              </div>
              <p className="mt-1 text-sm text-muted">
                de {formatearCLP(campana.monto_meta)} de meta
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <EstadoBadge estado={campana.estado} />
                {campana.estado === "activa" && dias !== null && (
                  <span className="text-sm font-semibold text-dark">
                    {dias === 0 ? "Último día" : `${dias} días restantes`}
                  </span>
                )}
              </div>
            </div>

            {campana.estado === "activa" && (
              <DonacionForm campanaId={campana.id} />
            )}

            {campana.estado === "exitosa" && (
              <div className="rounded-2xl border border-success/30 bg-success-soft/60 p-5 text-center">
                <p className="text-3xl" aria-hidden="true">
                  🎉
                </p>
                <p className="mt-2 font-heading font-bold text-dark">
                  ¡Campaña financiada!
                </p>
                <p className="mt-1 text-sm text-muted">
                  Gracias a la comunidad, {campana.mascota_nombre} recibirá su
                  atención.
                </p>
              </div>
            )}

            {campana.estado === "no_financiada" && (
              <OpcionesDevolucion
                campanaId={campana.id}
                cerradaEn={campana.cerrada_at ?? null}
                configurado={isSupabaseConfigured()}
              />
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
