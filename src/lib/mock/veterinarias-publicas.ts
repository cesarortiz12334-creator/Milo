export interface VeterinariaPublica {
  id: string;
  nombre: string;
  direccion: string;
  comuna: string;
  telefono: string;
  campanas_activas: number;
  mascotas_ayudadas: number;
}

/** Veterinarias verificadas de ejemplo para la página pública (demo). */
export const veterinariasPublicasMock: VeterinariaPublica[] = [
  {
    id: "vet-patitas",
    nombre: "Clínica Veterinaria Patitas",
    direccion: "Av. Providencia 1234",
    comuna: "Providencia",
    telefono: "+56 2 2345 6789",
    campanas_activas: 3,
    mascotas_ayudadas: 18,
  },
  {
    id: "vet-aromos",
    nombre: "Veterinaria Los Aromos",
    direccion: "Apoquindo 5678",
    comuna: "Las Condes",
    telefono: "+56 2 2987 6543",
    campanas_activas: 2,
    mascotas_ayudadas: 11,
  },
  {
    id: "vet-sur",
    nombre: "Hospital Veterinario Sur",
    direccion: "Irarrázaval 3210",
    comuna: "Ñuñoa",
    telefono: "+56 2 2456 7890",
    campanas_activas: 4,
    mascotas_ayudadas: 27,
  },
  {
    id: "vet-maipu",
    nombre: "Clínica Animal Care",
    direccion: "Av. Pajaritos 2468",
    comuna: "Maipú",
    telefono: "+56 2 2678 1234",
    campanas_activas: 1,
    mascotas_ayudadas: 7,
  },
  {
    id: "vet-centro",
    nombre: "Veterinaria San Francisco",
    direccion: "Av. Libertador B. O'Higgins 1357",
    comuna: "Santiago Centro",
    telefono: "+56 2 2321 0987",
    campanas_activas: 2,
    mascotas_ayudadas: 14,
  },
];
