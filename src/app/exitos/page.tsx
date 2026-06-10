import SiteHeader from "@/components/SiteHeader";
import ExitoCard from "@/components/ExitoCard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { historiasMock, type HistoriaExito } from "@/lib/mock/exitos";

async function obtenerHistorias(): Promise<HistoriaExito[]> {
  if (!isSupabaseConfigured()) return historiasMock;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("campanas_publicas")
      .select(
        "id, titulo, monto_recaudado, mascota_nombre, mascota_especie, mascota_foto_url, veterinaria_nombre"
      )
      .eq("estado", "exitosa")
      .order("cerrada_at", { ascending: false });

    const filas = (data ?? []) as Array<{
      id: string;
      titulo: string;
      monto_recaudado: number;
      mascota_nombre: string;
      mascota_especie: string;
      mascota_foto_url: string | null;
      veterinaria_nombre: string;
    }>;
    if (filas.length === 0) return [];

    // Última actualización (mensaje/foto post-recuperación) por campaña.
    const ids = filas.map((f) => f.id);
    const { data: actData } = await supabase
      .from("actualizaciones")
      .select("campana_id, mensaje, foto_url, created_at")
      .in("campana_id", ids)
      .order("created_at", { ascending: false });
    const acts = (actData ?? []) as Array<{
      campana_id: string;
      mensaje: string;
      foto_url: string | null;
    }>;
    const ultima = new Map<string, { mensaje: string; foto_url: string | null }>();
    for (const a of acts) {
      if (!ultima.has(a.campana_id)) {
        ultima.set(a.campana_id, { mensaje: a.mensaje, foto_url: a.foto_url });
      }
    }

    return filas.map((f) => ({
      id: f.id,
      mascota_nombre: f.mascota_nombre,
      mascota_especie: f.mascota_especie,
      titulo: f.titulo,
      monto_recaudado: f.monto_recaudado,
      veterinaria_nombre: f.veterinaria_nombre,
      actualizacion: ultima.get(f.id)?.mensaje ?? null,
      foto_url: ultima.get(f.id)?.foto_url ?? f.mascota_foto_url ?? null,
    }));
  } catch {
    return [];
  }
}

export default async function ExitosPage() {
  const historias = await obtenerHistorias();

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-4 pb-6 pt-12 text-center sm:pt-16">
        <h1 className="font-heading text-3xl font-extrabold leading-tight text-dark sm:text-4xl">
          Historias de <span className="text-success">éxito</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted sm:text-lg">
          Cada una de estas mascotas recibió la atención que necesitaba gracias a
          la comunidad de Milo. Esto es lo que tu aporte hace posible.
        </p>
      </section>

      <main className="mx-auto max-w-6xl px-4 pb-20">
        {historias.length === 0 ? (
          <p className="rounded-2xl bg-white p-10 text-center text-muted ring-1 ring-black/5">
            Pronto verás aquí las primeras historias de éxito. 💛
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {historias.map((h) => (
              <ExitoCard key={h.id} historia={h} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
