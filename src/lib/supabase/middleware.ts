import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "./config";

/**
 * Refresca la sesión de Supabase en cada request (patrón SSR de @supabase/ssr).
 * Si Supabase no está configurado, devuelve la respuesta sin tocar nada para no
 * romper la navegación. Cualquier error se ignora con el mismo objetivo.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) return response;

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

    // IMPORTANTE: no metas lógica entre crear el cliente y getUser().
    await supabase.auth.getUser();
  } catch {
    // No debe interrumpir la navegación.
  }

  return response;
}
