export interface VeterinariaOpcion {
  id: string;
  nombre: string;
}

/** Veterinarias verificadas de ejemplo para el selector mientras no hay BD. */
export const veterinariasMock: VeterinariaOpcion[] = [
  { id: "vet-patitas", nombre: "Clínica Veterinaria Patitas" },
  { id: "vet-sur", nombre: "Hospital Veterinario Sur" },
  { id: "vet-aromos", nombre: "Veterinaria Los Aromos" },
  { id: "vet-animalcare", nombre: "Clínica Animal Care" },
];
