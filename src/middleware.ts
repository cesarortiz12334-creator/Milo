import { NextResponse, type NextRequest } from "next/server";
import { aplicarSeguridadYSesion } from "@/lib/supabase/middleware";
import { ipDesdeHeaders } from "@/lib/seguridad";
import { rateLimit, MINUTO } from "@/lib/rate-limit";

export async function middleware(request: NextRequest) {
  // Rate limit general: 100 req/min por IP. Solo en producción para no chocar
  // con el HMR de desarrollo. (Best-effort por instancia; ver lib/rate-limit.)
  if (process.env.NODE_ENV === "production") {
    const ip = ipDesdeHeaders(request.headers);
    const rl = rateLimit(`req:${ip}`, 100, MINUTO);
    if (!rl.ok) {
      return new NextResponse("Demasiadas solicitudes. Intenta más tarde.", {
        status: 429,
        headers: { "retry-after": "60" },
      });
    }
  }

  return aplicarSeguridadYSesion(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
