/**
 * ⚠️ TEMPORAL — almacén en memoria que mapea el token de Webpay con la donación
 * pendiente mientras el usuario paga. Se pierde si se reinicia el servidor.
 *
 * Cuando Supabase esté conectado (módulo posterior), REEMPLAZAR el interior de
 * este módulo por la tabla `donaciones` (que ya tiene la columna `tbk_token`):
 *   - al crear  → insert con estado 'pendiente' y tbk_token = token
 *   - en retorno → buscar por tbk_token y actualizar estado (con service role)
 * La interfaz pública (guardar/obtener/eliminar) no debería cambiar.
 *
 * Se cuelga de `globalThis` para sobrevivir al hot-reload de Next en desarrollo.
 */
export interface DonacionPendiente {
  token: string;
  buyOrder: string;
  campanaId: string;
  monto: number;
  comision: number;
  creadaEn: number;
}

type Store = Map<string, DonacionPendiente>;
type GlobalConStore = typeof globalThis & { __miloDonaciones?: Store };

const g = globalThis as GlobalConStore;
const store: Store = g.__miloDonaciones ?? new Map();
g.__miloDonaciones = store;

export function guardarDonacionPendiente(d: DonacionPendiente): void {
  store.set(d.token, d);
}

export function obtenerDonacionPendiente(
  token: string
): DonacionPendiente | undefined {
  return store.get(token);
}

export function eliminarDonacionPendiente(token: string): void {
  store.delete(token);
}
