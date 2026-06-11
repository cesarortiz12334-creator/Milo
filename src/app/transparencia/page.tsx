import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { formatearCLP } from "@/lib/donaciones";
import {
  estadisticasMock,
  transferenciasMock,
  type EstadisticasTransparencia,
  type TransferenciaPublica,
} from "@/lib/mock/transparencia";

const fmtFecha = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

async function obtenerDatos(): Promise<{
  stats: EstadisticasTransparencia;
  transferencias: TransferenciaPublica[];
}> {
  if (!isSupabaseConfigured()) {
    return { stats: estadisticasMock, transferencias: transferenciasMock };
  }
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("transferencias_publicas")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(20);
    const transferencias = (data ?? []) as TransferenciaPublica[];
    const total = transferencias.reduce((s, t) => s + (t.monto ?? 0), 0);
    return {
      stats: {
        ...estadisticasMock,
        total_donado: total,
        campanas_exitosas: transferencias.length,
        mascotas_recuperadas: transferencias.length,
      },
      transferencias,
    };
  } catch {
    return { stats: estadisticasMock, transferencias: [] };
  }
}

function Numero({ valor, label }: { valor: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
      <p className="font-heading text-2xl font-extrabold text-primary sm:text-3xl">
        {valor}
      </p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}

export default async function TransparenciaPage() {
  const { stats, transferencias } = await obtenerDatos();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-center font-heading text-3xl font-extrabold text-dark sm:text-4xl">
          Transparencia
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted">
          En Milo cada peso es trazable. Esto es lo que ha logrado la comunidad.
        </p>

        {/* 1. Números */}
        <section className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Numero valor={formatearCLP(stats.total_donado)} label="Total donado" />
          <Numero valor={String(stats.mascotas_recuperadas)} label="Mascotas recuperadas" />
          <Numero valor={String(stats.campanas_exitosas)} label="Campañas exitosas" />
          <Numero valor={String(stats.campanas_no_financiadas)} label="Campañas no financiadas" />
          <Numero valor={`${stats.porcentaje_a_vet}%`} label="Promedio que llega a la vet" />
          <Numero valor={`${stats.dias_promedio_transferencia} días`} label="Tiempo promedio de transferencia" />
        </section>

        {/* 2. Flujo del dinero */}
        <section className="mt-12">
          <h2 className="text-center font-heading text-2xl font-extrabold text-dark">
            A dónde va tu dinero
          </h2>
          <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-3xl" aria-hidden="true">💛</p>
              <p className="mt-1 font-heading font-bold text-dark">Donante</p>
              <p className="text-sm text-muted">Aporta el 100%</p>
            </div>
            <div className="self-center text-2xl text-primary" aria-hidden="true">→</div>
            <div className="flex-1 rounded-2xl border border-primary/30 bg-primary-soft/30 p-5 text-center">
              <p className="text-3xl" aria-hidden="true">🟠</p>
              <p className="mt-1 font-heading font-bold text-dark">Milo</p>
              <p className="text-sm text-muted">5% para operar la plataforma</p>
            </div>
            <div className="self-center text-2xl text-primary" aria-hidden="true">→</div>
            <div className="flex-1 rounded-2xl border border-success/30 bg-success-soft/50 p-5 text-center">
              <p className="text-3xl" aria-hidden="true">🏥</p>
              <p className="mt-1 font-heading font-bold text-dark">Veterinaria verificada</p>
              <p className="text-sm text-muted">Recibe el 95%</p>
            </div>
          </div>
        </section>

        {/* 3. Cómo verificamos */}
        <section className="mt-12">
          <h2 className="text-center font-heading text-2xl font-extrabold text-dark">
            Cómo verificamos cada caso
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { i: "📄", t: "RSH tramo 40%", d: "El solicitante acredita su situación con la Cartola del RSH." },
              { i: "🏥", t: "Confirmación de la vet", d: "La veterinaria valida el caso y sube el presupuesto." },
              { i: "🔎", t: "Revisión manual > $200.000", d: "Las campañas de monto alto pasan por el equipo Milo." },
            ].map((s) => (
              <div key={s.t} className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
                <div className="text-3xl" aria-hidden="true">{s.i}</div>
                <p className="mt-2 font-heading font-bold text-dark">{s.t}</p>
                <p className="mt-1 text-sm text-muted">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Historial de transferencias */}
        <section className="mt-12">
          <h2 className="font-heading text-2xl font-extrabold text-dark">
            Historial de transferencias
          </h2>
          <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/5 text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mascota</th>
                  <th className="px-4 py-3 font-semibold">Veterinaria</th>
                  <th className="px-4 py-3 font-semibold">Monto</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {transferencias.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted">
                      Aún no hay transferencias para mostrar.
                    </td>
                  </tr>
                ) : (
                  transferencias.map((t) => (
                    <tr key={t.campana_id} className="border-b border-black/5 last:border-0">
                      <td className="px-4 py-3 font-semibold text-dark">{t.mascota_nombre}</td>
                      <td className="px-4 py-3 text-muted">{t.veterinaria_nombre}</td>
                      <td className="px-4 py-3 font-heading font-bold text-success">
                        {formatearCLP(t.monto)}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {t.fecha ? fmtFecha.format(new Date(t.fecha)) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Si algo sale mal */}
        <section className="mt-12 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="font-heading font-bold text-dark">🚩 Si una campaña es falsa</p>
            <p className="mt-1 text-sm text-muted">
              Repórtala con el botón en cada campaña. La revisamos en menos de 24h; si
              hay fraude, se cancela, se devuelve a los donantes y el RUT queda bloqueado.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="font-heading font-bold text-dark">↩️ Devoluciones</p>
            <p className="mt-1 text-sm text-muted">
              Si la campaña no se financia (&lt; 70%), puedes pedir devolución en
              efectivo dentro de 72 horas desde el cierre.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="font-heading font-bold text-dark">✉️ Contacto directo</p>
            <p className="mt-1 text-sm text-muted">
              ¿Dudas o algo no cuadra? Escríbenos a <strong>hola@milo.cl</strong> y el
              equipo te responde.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
