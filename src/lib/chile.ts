/**
 * Datos geográficos de Chile (16 regiones y sus comunas) y helpers de validación
 * para teléfono chileno. Se usa en el registro de solicitantes (selectores
 * Región → Comuna) y en validaciones server-side.
 */

export interface Region {
  nombre: string;
  comunas: string[];
}

export const REGIONES: Region[] = [
  {
    nombre: "Arica y Parinacota",
    comunas: ["Arica", "Camarones", "General Lagos", "Putre"],
  },
  {
    nombre: "Tarapacá",
    comunas: [
      "Alto Hospicio", "Camiña", "Colchane", "Huara", "Iquique", "Pica",
      "Pozo Almonte",
    ],
  },
  {
    nombre: "Antofagasta",
    comunas: [
      "Antofagasta", "Calama", "María Elena", "Mejillones", "Ollagüe",
      "San Pedro de Atacama", "Sierra Gorda", "Taltal", "Tocopilla",
    ],
  },
  {
    nombre: "Atacama",
    comunas: [
      "Alto del Carmen", "Caldera", "Chañaral", "Copiapó", "Diego de Almagro",
      "Freirina", "Huasco", "Tierra Amarilla", "Vallenar",
    ],
  },
  {
    nombre: "Coquimbo",
    comunas: [
      "Andacollo", "Canela", "Combarbalá", "Coquimbo", "Illapel",
      "La Higuera", "La Serena", "Los Vilos", "Monte Patria", "Ovalle",
      "Paihuano", "Punitaqui", "Río Hurtado", "Salamanca", "Vicuña",
    ],
  },
  {
    nombre: "Valparaíso",
    comunas: [
      "Algarrobo", "Cabildo", "Calera", "Calle Larga", "Cartagena",
      "Casablanca", "Catemu", "Concón", "El Quisco", "El Tabo", "Hijuelas",
      "Isla de Pascua", "Juan Fernández", "La Cruz", "La Ligua", "Llaillay",
      "Limache", "Los Andes", "Nogales", "Olmué", "Panquehue", "Papudo",
      "Petorca", "Puchuncaví", "Putaendo", "Quillota", "Quilpué", "Quintero",
      "Rinconada", "San Antonio", "San Esteban", "San Felipe", "Santa María",
      "Santo Domingo", "Valparaíso", "Villa Alemana", "Viña del Mar", "Zapallar",
    ],
  },
  {
    nombre: "Metropolitana de Santiago",
    comunas: [
      "Alhué", "Buin", "Calera de Tango", "Cerrillos", "Cerro Navia",
      "Colina", "Conchalí", "Curacaví", "El Bosque", "El Monte",
      "Estación Central", "Huechuraba", "Independencia", "Isla de Maipo",
      "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina",
      "Lampa", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul",
      "Maipú", "María Pinto", "Melipilla", "Ñuñoa", "Padre Hurtado", "Paine",
      "Pedro Aguirre Cerda", "Peñaflor", "Peñalolén", "Pirque", "Providencia",
      "Pudahuel", "Puente Alto", "Quilicura", "Quinta Normal", "Recoleta",
      "Renca", "San Bernardo", "San Joaquín", "San José de Maipo", "San Miguel",
      "San Pedro", "San Ramón", "Santiago", "Talagante", "Tiltil", "Vitacura",
    ],
  },
  {
    nombre: "Libertador General Bernardo O'Higgins",
    comunas: [
      "Chépica", "Chimbarongo", "Codegua", "Coinco", "Coltauco", "Doñihue",
      "Graneros", "La Estrella", "Las Cabras", "Litueche", "Lolol", "Machalí",
      "Malloa", "Marchihue", "Mostazal", "Nancagua", "Navidad", "Olivar",
      "Palmilla", "Paredones", "Peralillo", "Peumo", "Pichidegua", "Pichilemu",
      "Placilla", "Pumanque", "Quinta de Tilcoco", "Rancagua", "Rengo",
      "Requínoa", "San Fernando", "San Vicente", "Santa Cruz",
    ],
  },
  {
    nombre: "Maule",
    comunas: [
      "Cauquenes", "Chanco", "Colbún", "Constitución", "Curepto", "Curicó",
      "Empedrado", "Hualañé", "Licantén", "Linares", "Longaví", "Maule",
      "Molina", "Parral", "Pelarco", "Pelluhue", "Pencahue", "Rauco", "Retiro",
      "Río Claro", "Romeral", "Sagrada Familia", "San Clemente", "San Javier",
      "San Rafael", "Talca", "Teno", "Vichuquén", "Villa Alegre", "Yerbas Buenas",
    ],
  },
  {
    nombre: "Ñuble",
    comunas: [
      "Bulnes", "Chillán", "Chillán Viejo", "Cobquecura", "Coelemu", "Coihueco",
      "El Carmen", "Ninhue", "Ñiquén", "Pemuco", "Pinto", "Portezuelo",
      "Quillón", "Quirihue", "Ránquil", "San Carlos", "San Fabián",
      "San Ignacio", "San Nicolás", "Treguaco", "Yungay",
    ],
  },
  {
    nombre: "Biobío",
    comunas: [
      "Alto Biobío", "Antuco", "Arauco", "Cabrero", "Cañete", "Chiguayante",
      "Concepción", "Contulmo", "Coronel", "Curanilahue", "Florida", "Hualpén",
      "Hualqui", "Laja", "Lebu", "Los Álamos", "Los Ángeles", "Lota", "Mulchén",
      "Nacimiento", "Negrete", "Penco", "Quilaco", "Quilleco", "San Pedro de la Paz",
      "San Rosendo", "Santa Bárbara", "Santa Juana", "Talcahuano", "Tirúa",
      "Tomé", "Tucapel", "Yumbel",
    ],
  },
  {
    nombre: "La Araucanía",
    comunas: [
      "Angol", "Carahue", "Cholchol", "Collipulli", "Cunco", "Curacautín",
      "Curarrehue", "Ercilla", "Freire", "Galvarino", "Gorbea", "Lautaro",
      "Loncoche", "Lonquimay", "Los Sauces", "Lumaco", "Melipeuco",
      "Nueva Imperial", "Padre Las Casas", "Perquenco", "Pitrufquén", "Pucón",
      "Purén", "Renaico", "Saavedra", "Temuco", "Teodoro Schmidt", "Toltén",
      "Traiguén", "Victoria", "Vilcún", "Villarrica",
    ],
  },
  {
    nombre: "Los Ríos",
    comunas: [
      "Corral", "Futrono", "La Unión", "Lago Ranco", "Lanco", "Los Lagos",
      "Máfil", "Mariquina", "Paillaco", "Panguipulli", "Río Bueno", "Valdivia",
    ],
  },
  {
    nombre: "Los Lagos",
    comunas: [
      "Ancud", "Calbuco", "Castro", "Chaitén", "Chonchi", "Cochamó",
      "Curaco de Vélez", "Dalcahue", "Fresia", "Frutillar", "Futaleufú",
      "Hualaihué", "Llanquihue", "Los Muermos", "Maullín", "Osorno", "Palena",
      "Puerto Montt", "Puerto Octay", "Puerto Varas", "Puqueldón", "Purranque",
      "Puyehue", "Queilén", "Quellón", "Quemchi", "Quinchao", "Río Negro",
      "San Juan de la Costa", "San Pablo",
    ],
  },
  {
    nombre: "Aysén del General Carlos Ibáñez del Campo",
    comunas: [
      "Aysén", "Chile Chico", "Cisnes", "Cochrane", "Coyhaique", "Guaitecas",
      "Lago Verde", "O'Higgins", "Río Ibáñez", "Tortel",
    ],
  },
  {
    nombre: "Magallanes y de la Antártica Chilena",
    comunas: [
      "Antártica", "Cabo de Hornos", "Laguna Blanca", "Natales", "Porvenir",
      "Primavera", "Punta Arenas", "Río Verde", "San Gregorio", "Timaukel",
      "Torres del Paine",
    ],
  },
];

/** Nombres de todas las regiones (para selectores y validación). */
export const NOMBRES_REGIONES: string[] = REGIONES.map((r) => r.nombre);

/** Set con todas las comunas del país (para validación rápida). */
export const TODAS_LAS_COMUNAS: Set<string> = new Set(
  REGIONES.flatMap((r) => r.comunas)
);

/** Devuelve las comunas de una región (o [] si la región no existe). */
export function comunasDeRegion(region: string): string[] {
  return REGIONES.find((r) => r.nombre === region)?.comunas ?? [];
}

/** True si la comuna pertenece a la región indicada. */
export function comunaEnRegion(comuna: string, region: string): boolean {
  return comunasDeRegion(region).includes(comuna);
}

/**
 * Valida un teléfono móvil chileno. Acepta con o sin código país y con
 * separadores: +56 9 1234 5678, 56912345678, 9 1234 5678, 912345678.
 */
export function telefonoChilenoValido(input: string): boolean {
  const d = input.replace(/\D/g, "");
  return /^9\d{8}$/.test(d) || /^569\d{8}$/.test(d);
}

/** Normaliza a formato visible "+56 9 1234 5678". Si no es válido, devuelve el original. */
export function formatearTelefono(input: string): string {
  const d = input.replace(/\D/g, "");
  const core = d.startsWith("569") ? d.slice(2) : d; // -> 9XXXXXXXX
  if (/^9\d{8}$/.test(core)) {
    return `+56 9 ${core.slice(1, 5)} ${core.slice(5)}`;
  }
  return input;
}
