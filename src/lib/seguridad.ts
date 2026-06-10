import { headers } from "next/headers";

/** IP del cliente a partir de las cabeceras de proxy (Vercel/Nginx). */
export function ipDesdeHeaders(h: Headers): string {
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "desconocida";
}

/** IP del cliente dentro de un Server Action (usa next/headers). */
export async function ipActual(): Promise<string> {
  return ipDesdeHeaders(await headers());
}

/**
 * Anti-CSRF básico para rutas que mutan estado: la request debe venir del mismo
 * host (el `Origin` coincide con el host de la propia petición). Las navegaciones
 * GET sin `Origin` se permiten; los POST cross-site se rechazan.
 */
export function mismoOrigen(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}
