import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import EstadoBadge from "@/components/EstadoBadge";
import PerfilForm from "@/components/perfil/PerfilForm";
import CambiarPasswordForm from "@/components/perfil/CambiarPasswordForm";
import { getUsuarioActual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatearCLP } from "@/lib/donaciones";
import type { CampanaEstado } from "@/types";

export const metadata: Metadata = { title: "Mi perfil" };

// Página protegida: debe evaluarse por-petición (sesión + datos del usuario).
export const dynamic = "force-dynamic";

const ROL_LABEL: Record<string, string> = {
  solicitante: "Solicitante",
  donante: "Donante",
  veterinaria: "Veterinaria",
};

const DONACION_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  pagada: "Pagada",
  rechazada: "Rechazada",
  reembolsada: "Reembolsada",
};

const card = "rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5";

type Donacion = {
  id: string;
  monto: number;
  estado: string;
  created_at: string;
  campana_id: string;
};
type Campana = {
  id: string;
  titulo: string;
  estado: CampanaEstado;
  monto_meta: number;
  monto_recaudado: number;
};

export default async function PerfilPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");

  const supabase = await createClient();

  const { data: uData } = await supabase
    .from("users")
    .select("nombre, email, telefono")
    .eq("id", usuario.userId)
    .single();
  const u = uData as { nombre: string | null; email: string | null; telefono: string | null } | null;

  let calle = "";
  let comuna = "";
  let region = "";
  if (usuario.role === "solicitante") {
    const { data } = await supabase
      .from("solicitantes")
      .select("calle, comuna, region")
      .eq("user_id", usuario.userId)
      .single();
    const s = data as { calle: string | null; comuna: string | null; region: string | null } | null;
    calle = s?.calle ?? "";
    comuna = s?.comuna ?? "";
    region = s?.region ?? "";
  } else if (usuario.role === "veterinaria") {
    const { data } = await supabase
      .from("veterinarias")
      .select("direccion, comuna, region")
      .eq("user_id", usuario.userId)
      .single();
    const v = data as { direccion: string | null; comuna: string | null; region: string | null } | null;
    calle = v?.direccion ?? "";
    comuna = v?.comuna ?? "";
    region = v?.region ?? "";
  }

  // Historial según rol.
  let donaciones: Donacion[] = [];
  let campanas: Campana[] = [];
  const titulos = new Map<string, string>();

  if (usuario.role === "donante") {
    const { data } = await supabase
      .from("donaciones")
      .select("id, monto, estado, created_at, campana_id")
      .eq("donante_id", usuario.userId)
      .order("created_at", { ascending: false })
      .limit(20);
    donaciones = (data as Donacion[] | null) ?? [];
    const ids = [...new Set(donaciones.map((d) => d.campana_id))];
    if (ids.length) {
      const { data: pubs } = await supabase
        .from("campanas_publicas")
        .select("id, titulo")
        .in("id", ids);
      for (const p of (pubs as { id: string; titulo: string }[] | null) ?? []) {
        titulos.set(p.id, p.titulo);
      }
    }
  } else if (usuario.role === "solicitante") {
    const { data: mas } = await supabase
      .from("mascotas")
      .select("id")
      .eq("solicitante_id", usuario.userId);
    const ids = ((mas as { id: string }[] | null) ?? []).map((m) => m.id);
    if (ids.length) {
      const { data } = await supabase
        .from("campanas")
        .select("id, titulo, estado, monto_meta, monto_recaudado")
        .in("mascota_id", ids)
        .order("created_at", { ascending: false });
      campanas = (data as Campana[] | null) ?? [];
    }
  }

  const display = u?.nombre || usuario.email || "Mi cuenta";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl space-y-8 px-4 py-8">
        <header>
          <h1 className="font-heading text-3xl font-extrabold text-dark">Mi perfil</h1>
          <p className="mt-1 text-muted">
            {display} · {usuario.role ? ROL_LABEL[usuario.role] : ""}
          </p>
        </header>

        {/* Datos */}
        <section className={card}>
          <h2 className="mb-4 font-heading text-lg font-bold text-dark">Mis datos</h2>
          <p className="mb-3 text-sm text-muted">
            Correo: <span className="font-semibold text-dark">{u?.email}</span>{" "}
            <span className="text-xs">(no se puede cambiar)</span>
          </p>
          <PerfilForm
            nombre={u?.nombre ?? ""}
            telefono={u?.telefono ?? ""}
            calle={calle}
            comuna={comuna}
            region={region}
            role={usuario.role}
          />
        </section>

        {/* Seguridad */}
        <section className={card}>
          <h2 className="mb-4 font-heading text-lg font-bold text-dark">Seguridad</h2>
          <CambiarPasswordForm />
        </section>

        {/* Historial */}
        <section className={card}>
          <h2 className="mb-4 font-heading text-lg font-bold text-dark">
            {usuario.role === "donante"
              ? "Mis donaciones"
              : usuario.role === "solicitante"
                ? "Mis campañas"
                : "Mi actividad"}
          </h2>

          {usuario.role === "donante" &&
            (donaciones.length === 0 ? (
              <p className="text-sm text-muted">
                Todavía no has hecho donaciones.{" "}
                <Link href="/" className="font-semibold text-primary">
                  Explora campañas
                </Link>
                .
              </p>
            ) : (
              <ul className="divide-y divide-black/5">
                {donaciones.map((d) => (
                  <li key={d.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-semibold text-dark">
                        {titulos.get(d.campana_id) ?? "Campaña"}
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(d.created_at).toLocaleDateString("es-CL")} ·{" "}
                        {DONACION_LABEL[d.estado] ?? d.estado}
                      </p>
                    </div>
                    <span className="font-heading font-bold text-dark">
                      {formatearCLP(d.monto)}
                    </span>
                  </li>
                ))}
              </ul>
            ))}

          {usuario.role === "solicitante" &&
            (campanas.length === 0 ? (
              <p className="text-sm text-muted">
                Aún no tienes campañas.{" "}
                <Link href="/campanas/nueva" className="font-semibold text-primary">
                  Crear una campaña
                </Link>
                .
              </p>
            ) : (
              <ul className="divide-y divide-black/5">
                {campanas.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link
                        href={`/campana/${c.id}`}
                        className="block truncate font-semibold text-dark hover:text-primary"
                      >
                        {c.titulo}
                      </Link>
                      <p className="text-xs text-muted">
                        {formatearCLP(c.monto_recaudado)} de {formatearCLP(c.monto_meta)}
                      </p>
                    </div>
                    <EstadoBadge estado={c.estado} />
                  </li>
                ))}
              </ul>
            ))}

          {usuario.role === "veterinaria" && (
            <p className="text-sm text-muted">
              Gestiona tus casos en{" "}
              <Link href="/veterinaria" className="font-semibold text-primary">
                Mi panel
              </Link>
              .
            </p>
          )}
        </section>

        {/* Cerrar sesión */}
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold text-dark transition hover:bg-black/5"
          >
            Cerrar sesión
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
