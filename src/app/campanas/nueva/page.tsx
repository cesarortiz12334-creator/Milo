import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import NuevaCampanaForm from "@/components/campanas/NuevaCampanaForm";
import AvisoSupabase from "@/components/auth/AvisoSupabase";
import { Mensaje } from "@/components/auth/campos";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth";
import {
  veterinariasMock,
  type VeterinariaOpcion,
} from "@/lib/mock/veterinarias";

async function obtenerVeterinarias(): Promise<VeterinariaOpcion[]> {
  if (!isSupabaseConfigured()) return veterinariasMock;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("veterinarias")
      .select("user_id, nombre")
      .eq("verificada", true)
      .order("nombre");
    const filas = (data ?? []) as { user_id: string; nombre: string }[];
    return filas.map((f) => ({ id: f.user_id, nombre: f.nombre }));
  } catch {
    return [];
  }
}

export default async function NuevaCampanaPage() {
  const configurado = isSupabaseConfigured();
  const usuario = await getUsuarioActual();

  // Con Supabase activo, exigimos sesión; el rol se valida abajo y en la action.
  if (configurado && !usuario) redirect("/login");

  const puedeCrear = !configurado || usuario?.role === "solicitante";
  const veterinarias = await obtenerVeterinarias();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-heading text-3xl font-extrabold text-dark">
          Crear campaña
        </h1>
        <p className="mt-1 text-muted">
          Cuéntanos sobre tu mascota y elige la veterinaria que la atenderá.
        </p>

        <div className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          {!configurado && <AvisoSupabase />}
          {configurado && !puedeCrear ? (
            <Mensaje tipo="error">
              Solo los solicitantes verificados con Clave Única pueden crear
              campañas.
            </Mensaje>
          ) : (
            <NuevaCampanaForm
              veterinarias={veterinarias}
              configurado={configurado}
            />
          )}
        </div>
      </main>
    </div>
  );
}
