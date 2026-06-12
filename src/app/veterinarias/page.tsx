import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import VeterinariasBuscador from "@/components/veterinarias/VeterinariasBuscador";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  veterinariasPublicasMock,
  type VeterinariaPublica,
} from "@/lib/mock/veterinarias-publicas";

async function obtenerVeterinarias(): Promise<VeterinariaPublica[]> {
  if (!isSupabaseConfigured()) return veterinariasPublicasMock;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("veterinarias")
      .select("user_id, nombre, direccion, telefono")
      .eq("verificada", true)
      .order("nombre");
    const filas = (data ?? []) as {
      user_id: string;
      nombre: string;
      direccion: string | null;
      telefono: string | null;
    }[];
    // Nota: comuna y contadores se enriquecerán cuando existan en el modelo.
    return filas.map((f) => ({
      id: f.user_id,
      nombre: f.nombre,
      direccion: f.direccion ?? "",
      comuna: "",
      telefono: f.telefono ?? "",
      campanas_activas: 0,
      mascotas_ayudadas: 0,
    }));
  } catch {
    return [];
  }
}

export default async function VeterinariasPage() {
  const veterinarias = await obtenerVeterinarias();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-extrabold text-dark sm:text-4xl">
              Veterinarias verificadas
            </h1>
            <p className="mt-2 text-muted">
              Clínicas que pasaron la verificación del equipo MiloFund.
            </p>
          </div>
          <Link
            href="/registro/veterinaria"
            className="rounded-full bg-primary px-5 py-2.5 font-heading text-sm font-bold text-white transition hover:bg-primary/90"
          >
            Registra tu clínica en MiloFund
          </Link>
        </div>

        <VeterinariasBuscador veterinarias={veterinarias} />
      </main>
      <SiteFooter />
    </div>
  );
}
