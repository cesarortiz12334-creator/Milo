import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import EstadoBadge from "@/components/EstadoBadge";
import AvisoSupabase from "@/components/auth/AvisoSupabase";
import { Mensaje } from "@/components/auth/campos";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { formatearCLP } from "@/lib/donaciones";
import type { CampanaEstado } from "@/types";

interface FilaCampana {
  id: string;
  titulo: string;
  estado: CampanaEstado;
  monto_meta: number;
  monto_recaudado: number;
  mascota_nombre: string;
}

const DEMO: FilaCampana[] = [
  {
    id: "demo-1",
    titulo: "Cirugía de cadera para Pelusa",
    estado: "activa",
    monto_meta: 850000,
    monto_recaudado: 620000,
    mascota_nombre: "Pelusa",
  },
  {
    id: "demo-2",
    titulo: "Operación dental para Rocco",
    estado: "pendiente",
    monto_meta: 380000,
    monto_recaudado: 0,
    mascota_nombre: "Rocco",
  },
];

async function obtenerMisCampanas(userId: string): Promise<FilaCampana[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("campanas")
      .select(
        "id, titulo, estado, monto_meta, monto_recaudado, mascotas!inner(nombre, solicitante_id)"
      )
      .eq("mascotas.solicitante_id", userId)
      .order("created_at", { ascending: false });

    const filas = (data ?? []) as Array<{
      id: string;
      titulo: string;
      estado: CampanaEstado;
      monto_meta: number;
      monto_recaudado: number;
      mascotas: { nombre: string } | { nombre: string }[];
    }>;

    return filas.map((f) => {
      const m = Array.isArray(f.mascotas) ? f.mascotas[0] : f.mascotas;
      return {
        id: f.id,
        titulo: f.titulo,
        estado: f.estado,
        monto_meta: f.monto_meta,
        monto_recaudado: f.monto_recaudado,
        mascota_nombre: m?.nombre ?? "",
      };
    });
  } catch {
    return [];
  }
}

export default async function MisCampanasPage({
  searchParams,
}: {
  searchParams: Promise<{ creada?: string; revision?: string }>;
}) {
  const { creada, revision } = await searchParams;
  const configurado = isSupabaseConfigured();

  let campanas: FilaCampana[];
  if (!configurado) {
    campanas = DEMO;
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    campanas = await obtenerMisCampanas(user.id);
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl font-extrabold text-dark">
            Mis campañas
          </h1>
          <Link
            href="/campanas/nueva"
            className="rounded-full bg-primary px-4 py-2 font-heading text-sm font-bold text-white transition hover:bg-primary/90"
          >
            Crear campaña
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          {creada && (
            <Mensaje tipo="ok">
              ¡Campaña creada! Queda pendiente hasta que la veterinaria confirme
              el caso.
              {revision
                ? " Como supera $200.000, además pasará por revisión del equipo Milo antes de publicarse."
                : ""}
            </Mensaje>
          )}
          {!configurado && <AvisoSupabase />}

          {campanas.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-muted ring-1 ring-black/5">
              Aún no tienes campañas.{" "}
              <Link href="/campanas/nueva" className="font-semibold text-primary">
                Crea la primera
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-3">
              {campanas.map((c) => {
                const progreso = Math.min(
                  100,
                  Math.round((c.monto_recaudado / c.monto_meta) * 100)
                );
                return (
                  <li
                    key={c.id}
                    className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-heading font-bold text-dark">
                          {c.titulo}
                        </h2>
                        <p className="text-sm text-muted">{c.mascota_nombre}</p>
                      </div>
                      <EstadoBadge estado={c.estado} />
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-primary-soft/50">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${progreso}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-sm text-muted">
                      {formatearCLP(c.monto_recaudado)} de{" "}
                      {formatearCLP(c.monto_meta)} · {progreso}%
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
