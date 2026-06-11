export interface TransferenciaPublica {
  campana_id: string;
  mascota_nombre: string;
  mascota_especie: string;
  veterinaria_nombre: string;
  monto: number;
  fecha: string; // ISO
}

export interface EstadisticasTransparencia {
  total_donado: number;
  mascotas_recuperadas: number;
  campanas_exitosas: number;
  campanas_no_financiadas: number;
  porcentaje_a_vet: number; // 95
  dias_promedio_transferencia: number;
}

export const estadisticasMock: EstadisticasTransparencia = {
  total_donado: 18_450_000,
  mascotas_recuperadas: 63,
  campanas_exitosas: 58,
  campanas_no_financiadas: 9,
  porcentaje_a_vet: 95,
  dias_promedio_transferencia: 3,
};

function hace(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString();
}

export const transferenciasMock: TransferenciaPublica[] = [
  {
    campana_id: "t-1",
    mascota_nombre: "Lola",
    mascota_especie: "perro",
    veterinaria_nombre: "Clínica Veterinaria Patitas",
    monto: 615000,
    fecha: hace(2),
  },
  {
    campana_id: "t-2",
    mascota_nombre: "Michi",
    mascota_especie: "gato",
    veterinaria_nombre: "Hospital Veterinario Sur",
    monto: 480000,
    fecha: hace(6),
  },
  {
    campana_id: "t-3",
    mascota_nombre: "Toby",
    mascota_especie: "perro",
    veterinaria_nombre: "Veterinaria Los Aromos",
    monto: 1250000,
    fecha: hace(11),
  },
  {
    campana_id: "t-4",
    mascota_nombre: "Rocco",
    mascota_especie: "perro",
    veterinaria_nombre: "Clínica Veterinaria Patitas",
    monto: 380000,
    fecha: hace(15),
  },
  {
    campana_id: "t-5",
    mascota_nombre: "Nina",
    mascota_especie: "gato",
    veterinaria_nombre: "Hospital Veterinario Sur",
    monto: 230000,
    fecha: hace(20),
  },
];
