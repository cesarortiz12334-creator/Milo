import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para Server Components, Route Handlers y Server Actions.
 * En Next.js 15 `cookies()` es asíncrono, por eso esta función es async.
 *
 * Para operaciones privilegiadas (omitir RLS) usar la SERVICE ROLE KEY en el
 * servidor; nunca exponer esa key al cliente.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // `setAll` fue llamado desde un Server Component. Se puede ignorar
            // si hay middleware refrescando la sesión del usuario.
          }
        },
      },
    }
  );
}
