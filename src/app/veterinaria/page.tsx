import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import CasoCard from "@/components/veterinaria/CasoCard";
import EstadoBadge from "@/components/EstadoBadge";
import AvisoSupabase from "@/components/auth/AvisoSupabase";
import { Mensaje } from "@/components/auth/campos";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import { formatearCLP } from "@/lib/donaciones";
import {
  casosPendientesDemo,
  casosActivosDemo,
  type CasoVet,
} from "@/lib/mock/casos";
import type { CampanaEstado } from "@/types";

async function obtenerCasos(
  vetId: string,
  estado: CampanaEstado
): Promise<CasoVet[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("campanas")
      .select(
        "id, titulo, descripcion, monto_meta, estado, mascotas!inner(nombre, especie)"
      )
      .eq("veterinaria_id", vetId)
      .eq("estado", estado)
      .order("created_at", { ascending: true });

    const filas = (data ?? []) as Array<{
      id: string;
      titulo: string;
      descripcion: string | null;
      monto_meta: number;
      estado: CampanaEstado;
      mascotas: { nombre: string; especie: string } | { nombre: string; especie: string }[];
    }>;

    return filas.map((f) => {
      const m = Array.isArray(f.mascotas) ? f.mascotas[0] : f.mascotas;
      return {
        id: f.id,
        titulo: f.titulo,
        descripcion: f.descripcion,
        monto_meta: f.monto_meta,
        estado: f.estado,
        mascota_nombre: m?.nombre ?? "",
        mascota_especie: m?.especie ?? "",
      };
    });
  } catch {
    return [];
  }
}

export default async function VeterinariaPanel() {
  const configurado = isSupabaseConfigured();
  const usuario = await getUsuarioActual();
  if (configurado && !usuario) redirect("/login");

  const esVet = !configurado || usuario?.role === "veterinaria";
  let verificada = true;
  let pendientes: CasoVet[] = [];
  let activos: CasoVet[] = [];

  if (!configurado) {
    pendientes = casosPendientesDemo;
    activos = casosActivosDemo;
  } else if (esVet && usuario) {
    const supabase = await createClient();
    const { data: vetData } = await supabase
      .from("veterinarias")
      .select("verificada")
      .eq("user_id", usuario.userId)
      .single();
    verificada = Boolean((vetData as { verificada: boolean } | null)?.verificada);
    if (verificada) {
      pendientes = await obtenerCasos(usuario.userId, "pendiente");
      activos = await obtenerCasos(usuario.userId, "activa");
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-extrabold text-dark">
            Panel de veterinaria
          </h1>
          {esVet &&
            (verificada ? (
              <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
                ✓ Verificada
              </span>
            ) : (
              <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                ⏳ Pendiente de verificación
              </span>
            ))}
        </div>

        <div className="mt-6 space-y-6">
          {configurado && !esVet ? (
            <Mensaje tipo="error">
              Esta sección es solo para veterinarias.
            </Mensaje>
          ) : !verificada ? (
            <Mensaje tipo="error">
              Tu veterinaria está pendiente de verificación por el equipo Milo.
              Cuando la aprobemos podrás confirmar casos y activar campañas.
            </Mensaje>
          ) : (
            <>
              {!configurado && <AvisoSupabase />}

              <section>
                <h2 className="font-heading text-xl font-bold text-dark">
                  Casos pendientes{" "}
                  <span className="text-sm font-normal text-muted">
                    ({pendientes.length})
                  </span>
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Sube el presupuesto y confirma para activar la campaña.
                </p>
                <div className="mt-4 space-y-4">
                  {pendientes.length === 0 ? (
                    <p className="rounded-2xl bg-white p-6 text-center text-muted ring-1 ring-black/5">
                      No tienes casos pendientes por ahora.
                    </p>
                  ) : (
                    pendientes.map((caso) => (
                      <CasoCard
                        key={caso.id}
                        caso={caso}
                        configurado={configurado}
                      />
                    ))
                  )}
                </div>
              </section>

              <section>
                <h2 className="font-heading text-xl font-bold text-dark">
                  Campañas activas{" "}
                  <span className="text-sm font-normal text-muted">
                    ({activos.length})
                  </span>
                </h2>
                <ul className="mt-4 space-y-3">
                  {activos.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                    >
                      <div>
                        <p className="font-heading font-bold text-dark">
                          {c.titulo}
                        </p>
                        <p className="text-sm text-muted">
                          {c.mascota_nombre} · meta {formatearCLP(c.monto_meta)}
                        </p>
                      </div>
                      <EstadoBadge estado={c.estado} />
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
