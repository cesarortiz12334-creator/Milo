import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "./config";

const INACTIVIDAD_MS = 30 * 60 * 1000; // 30 minutos

/**
 * CSP de producción. Usa `'unsafe-inline'` en script-src porque la app se
 * renderiza mayormente de forma estática (Next inyecta scripts inline para la
 * carga RSC y no se les puede poner un nonce por-request en HTML estático).
 * El resto de directivas son estrictas (frame-ancestors none, object-src none,
 * base-uri self, default-src self, connect/form acotados).
 *
 * Para una CSP 100% basada en nonce (sin 'unsafe-inline') habría que forzar
 * render dinámico en las rutas — queda documentado como mejora opcional.
 */
function construirCSP(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co",
    "form-action 'self' https://*.transbank.cl",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");
}

/**
 * Refresca la sesión de Supabase (patrón @supabase/ssr), aplica expiración por
 * inactividad (30 min) y añade la CSP en producción.
 */
export async function aplicarSeguridadYSesion(
  request: NextRequest
): Promise<NextResponse> {
  const esProd = process.env.NODE_ENV === "production";
  let response = NextResponse.next({ request });

  if (isSupabaseConfigured()) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value)
              );
              response = NextResponse.next({ request });
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Gate de rutas protegidas: sin sesión → /login (barrera server-side dura,
      // además del control en cada página/acción). Evita servir el cascarón de
      // páginas protegidas a clientes anónimos.
      const path = request.nextUrl.pathname;
      const PROTEGIDAS = ["/perfil", "/campanas/nueva", "/mis-campanas", "/veterinaria"];
      if (!user && PROTEGIDAS.some((r) => path === r || path.startsWith(`${r}/`))) {
        const url = new URL("/login", request.url);
        return NextResponse.redirect(url);
      }

      // Expiración de sesión por inactividad.
      if (user) {
        const previa = request.cookies.get("milo_actividad")?.value;
        const ahora = Date.now();
        if (previa && ahora - Number(previa) > INACTIVIDAD_MS) {
          await supabase.auth.signOut();
          response = NextResponse.redirect(new URL("/login?expirada=1", request.url));
          response.cookies.delete("milo_actividad");
        } else {
          response.cookies.set("milo_actividad", String(ahora), {
            httpOnly: true,
            sameSite: "lax",
            secure: esProd,
            path: "/",
            maxAge: 60 * 60 * 8,
          });
        }
      }
    } catch {
      // No romper la navegación.
    }
  }

  if (esProd) {
    response.headers.set("content-security-policy", construirCSP());
  }
  return response;
}
