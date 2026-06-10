import type { CampanaEstado } from "@/types";

/** Caso visto desde la veterinaria (sin datos personales del solicitante). */
export interface CasoVet {
  id: string;
  titulo: string;
  descripcion: string | null;
  monto_meta: number;
  estado: CampanaEstado;
  mascota_nombre: string;
  mascota_especie: string;
}

export const casosPendientesDemo: CasoVet[] = [
  {
    id: "demo-caso-1",
    titulo: "Fractura de pata de Simba",
    descripcion:
      "Simba se cayó y necesita radiografías, cirugía y reposo controlado.",
    monto_meta: 540000,
    estado: "pendiente",
    mascota_nombre: "Simba",
    mascota_especie: "gato",
  },
  {
    id: "demo-caso-2",
    titulo: "Tratamiento dermatológico de Max",
    descripcion:
      "Max tiene una dermatitis severa; requiere exámenes y medicamentos por 2 meses.",
    monto_meta: 290000,
    estado: "pendiente",
    mascota_nombre: "Max",
    mascota_especie: "perro",
  },
];

export const casosActivosDemo: CasoVet[] = [
  {
    id: "demo-caso-3",
    titulo: "Cirugía de cadera para Pelusa",
    descripcion: null,
    monto_meta: 850000,
    estado: "activa",
    mascota_nombre: "Pelusa",
    mascota_especie: "perro",
  },
];
