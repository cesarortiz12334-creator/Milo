import type { CampanaPublica } from "@/types";

/**
 * Datos mock para el feed mientras no está conectado Supabase.
 * Tienen la misma forma que la vista pública `campanas_publicas`.
 * `fecha_limite` se calcula relativa a hoy para que "días restantes" tenga sentido.
 */
function enDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}

export const campanasMock: CampanaPublica[] = [
  {
    id: "mock-1",
    titulo: "Cirugía de cadera para Pelusa",
    descripcion:
      "Pelusa necesita una operación de cadera para volver a correr en el parque. Su familia no puede costearla sola.",
    monto_meta: 850000,
    monto_recaudado: 620000,
    estado: "activa",
    fecha_limite: enDias(12),
    created_at: enDias(-8),
    mascota_nombre: "Pelusa",
    mascota_especie: "perro",
    mascota_raza: "Quiltro",
    mascota_foto_url: null,
    veterinaria_nombre: "Clínica Veterinaria Patitas",
    veterinaria_verificada: true,
  },
  {
    id: "mock-2",
    titulo: "Tratamiento para la insuficiencia renal de Michi",
    descripcion:
      "Michi fue diagnosticado con problemas renales y necesita exámenes y medicamentos por tres meses.",
    monto_meta: 450000,
    monto_recaudado: 138000,
    estado: "activa",
    fecha_limite: enDias(20),
    created_at: enDias(-3),
    mascota_nombre: "Michi",
    mascota_especie: "gato",
    mascota_raza: "Doméstico común",
    mascota_foto_url: null,
    veterinaria_nombre: "Hospital Veterinario Sur",
    veterinaria_verificada: true,
  },
  {
    id: "mock-3",
    titulo: "Rehabilitación de Toby tras un atropello",
    descripcion:
      "Toby fue atropellado y necesita kinesiología y curaciones para volver a caminar bien.",
    monto_meta: 1200000,
    monto_recaudado: 1050000,
    estado: "activa",
    fecha_limite: enDias(5),
    created_at: enDias(-15),
    mascota_nombre: "Toby",
    mascota_especie: "perro",
    mascota_raza: "Labrador",
    mascota_foto_url: null,
    veterinaria_nombre: "Veterinaria Los Aromos",
    veterinaria_verificada: true,
  },
  {
    id: "mock-4",
    titulo: "Exámenes urgentes para Luna",
    descripcion:
      "Luna dejó de comer y el equipo veterinario necesita hacerle ecografía y exámenes de sangre.",
    monto_meta: 300000,
    monto_recaudado: 72000,
    estado: "activa",
    fecha_limite: enDias(18),
    created_at: enDias(-2),
    mascota_nombre: "Luna",
    mascota_especie: "gato",
    mascota_raza: null,
    mascota_foto_url: null,
    veterinaria_nombre: "Clínica Animal Care",
    veterinaria_verificada: true,
  },
  {
    id: "mock-5",
    titulo: "Operación dental para Rocco",
    descripcion:
      "Rocco tiene una infección dental severa que le impide comer. Necesita una limpieza y extracción.",
    monto_meta: 380000,
    monto_recaudado: 365000,
    estado: "activa",
    fecha_limite: enDias(9),
    created_at: enDias(-10),
    mascota_nombre: "Rocco",
    mascota_especie: "perro",
    mascota_raza: "Beagle",
    mascota_foto_url: null,
    veterinaria_nombre: "Clínica Veterinaria Patitas",
    veterinaria_verificada: true,
  },
  {
    id: "mock-6",
    titulo: "Cuidados para Nina, gatita rescatada",
    descripcion:
      "Nina fue rescatada de la calle con desnutrición. Necesita desparasitación, vacunas y control.",
    monto_meta: 220000,
    monto_recaudado: 41000,
    estado: "activa",
    fecha_limite: enDias(25),
    created_at: enDias(-1),
    mascota_nombre: "Nina",
    mascota_especie: "gato",
    mascota_raza: "Doméstico común",
    mascota_foto_url: null,
    veterinaria_nombre: "Hospital Veterinario Sur",
    veterinaria_verificada: true,
  },
  {
    id: "mock-exitosa",
    titulo: "¡Operación de Lola financiada!",
    descripcion:
      "Gracias a la comunidad, Lola alcanzó su meta y ya fue operada con éxito.",
    monto_meta: 600000,
    monto_recaudado: 615000,
    estado: "exitosa",
    fecha_limite: enDias(-2),
    cerrada_at: enDias(-2),
    created_at: enDias(-30),
    mascota_nombre: "Lola",
    mascota_especie: "perro",
    mascota_raza: "Quiltro",
    mascota_foto_url: null,
    veterinaria_nombre: "Clínica Veterinaria Patitas",
    veterinaria_verificada: true,
  },
  {
    id: "mock-nofin",
    titulo: "Tratamiento de Peluso",
    descripcion:
      "La campaña no alcanzó el 70% de la meta dentro del plazo.",
    monto_meta: 800000,
    monto_recaudado: 240000,
    estado: "no_financiada",
    fecha_limite: enDias(-1),
    // Cerrada hace ~10h → aún dentro de la ventana de 72h para devolución.
    cerrada_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    created_at: enDias(-25),
    mascota_nombre: "Peluso",
    mascota_especie: "gato",
    mascota_raza: null,
    mascota_foto_url: null,
    veterinaria_nombre: "Hospital Veterinario Sur",
    veterinaria_verificada: true,
  },
];

export function getCampanaMockById(id: string): CampanaPublica | undefined {
  return campanasMock.find((c) => c.id === id);
}
