// Tipos globales de dominio para MiloFund.
// Reflejan el esquema de supabase/migrations/001_initial.sql.

export type UserRole = "solicitante" | "veterinaria" | "donante";

export type CampanaEstado =
  | "borrador"
  | "pendiente"
  | "activa"
  | "exitosa"
  | "no_financiada";

export type DonacionEstado =
  | "pendiente"
  | "pagada"
  | "rechazada"
  | "reembolsada";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Mascota {
  id: string;
  solicitante_id: string;
  nombre: string;
  especie: string;
  raza: string | null;
  foto_url: string | null;
  descripcion: string | null;
  created_at: string;
}

export interface Campana {
  id: string;
  mascota_id: string;
  veterinaria_id: string;
  titulo: string;
  descripcion: string | null;
  monto_meta: number;
  monto_recaudado: number;
  estado: CampanaEstado;
  fecha_limite: string | null;
  presupuesto_url: string | null;
  created_at: string;
}

/**
 * Fila de la vista pública `campanas_publicas`: SOLO columnas seguras.
 * Es lo único que el feed/anon debe consumir — nunca RUT, tramo RSH ni docs.
 */
export interface CampanaPublica {
  id: string;
  titulo: string;
  descripcion: string | null;
  monto_meta: number;
  monto_recaudado: number;
  estado: CampanaEstado;
  fecha_limite: string | null;
  cerrada_at?: string | null;
  created_at: string;
  mascota_nombre: string;
  mascota_especie: string;
  mascota_raza: string | null;
  mascota_foto_url: string | null;
  veterinaria_nombre: string;
  veterinaria_verificada: boolean;
}
