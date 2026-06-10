export interface HistoriaExito {
  id: string;
  mascota_nombre: string;
  mascota_especie: string;
  titulo: string;
  monto_recaudado: number;
  veterinaria_nombre: string;
  /** Mensaje de actualización post-recuperación (mostrar esperanza). */
  actualizacion: string | null;
  foto_url: string | null;
}

export const historiasMock: HistoriaExito[] = [
  {
    id: "exito-lola",
    mascota_nombre: "Lola",
    mascota_especie: "perro",
    titulo: "Operación de cadera",
    monto_recaudado: 615000,
    veterinaria_nombre: "Clínica Veterinaria Patitas",
    actualizacion: "¡Lola ya vuelve a correr en la plaza! Gracias a cada persona que aportó.",
    foto_url: null,
  },
  {
    id: "exito-michi",
    mascota_nombre: "Michi",
    mascota_especie: "gato",
    titulo: "Tratamiento renal",
    monto_recaudado: 480000,
    veterinaria_nombre: "Hospital Veterinario Sur",
    actualizacion: "Michi recuperó el apetito y volvió a su peso ideal. Está feliz en casa.",
    foto_url: null,
  },
  {
    id: "exito-toby",
    mascota_nombre: "Toby",
    mascota_especie: "perro",
    titulo: "Rehabilitación tras un atropello",
    monto_recaudado: 1250000,
    veterinaria_nombre: "Veterinaria Los Aromos",
    actualizacion: "Después de meses de kinesiología, Toby volvió a caminar sin ayuda 🐾",
    foto_url: null,
  },
  {
    id: "exito-nina",
    mascota_nombre: "Nina",
    mascota_especie: "gato",
    titulo: "Recuperación de gatita rescatada",
    monto_recaudado: 230000,
    veterinaria_nombre: "Hospital Veterinario Sur",
    actualizacion: "Nina no solo se recuperó: además encontró una familia que la adoptó.",
    foto_url: null,
  },
];
