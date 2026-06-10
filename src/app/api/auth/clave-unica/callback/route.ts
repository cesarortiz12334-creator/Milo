import { NextRequest, NextResponse } from "next/server";
import {
  intercambiarCodigo,
  obtenerUserinfo,
  hashRut,
} from "@/lib/clave-unica";

export const runtime = "nodejs";

/**
 * Callback de Clave Única. Valida el `state`, intercambia el código por token,
 * obtiene el RUT del ciudadano y (TODO) crea/inicia su sesión de solicitante.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieState = request.cookies.get("cu_state")?.value;

  if (!code || !state || state !== cookieState) {
    return NextResponse.redirect(new URL("/login?cu=error", request.url));
  }

  try {
    const redirectUri = new URL(
      "/api/auth/clave-unica/callback",
      request.url
    ).toString();

    const token = await intercambiarCodigo(code, redirectUri);
    const info = await obtenerUserinfo(token.access_token);

    const rut = info.RolUnico
      ? `${info.RolUnico.numero}-${info.RolUnico.DV}`
      : "";
    const rutHash = hashRut(rut);

    // TODO(Supabase): con SUPABASE_SERVICE_ROLE_KEY:
    //   1. find-or-create del usuario (role 'solicitante') por rut_hash.
    //   2. guardar `rut_hash` en `solicitantes` (nunca el RUT en claro).
    //   3. iniciar sesión del usuario (set de cookies de sesión).
    //   4. derivar a la verificación del tramo RSH (debe ser <= 40%).
    // Por ahora marcamos rutHash como usado para no romper el lint y registramos.
    void rutHash;

    const dest = new URL("/", request.url);
    dest.searchParams.set("bienvenida", "solicitante");
    const response = NextResponse.redirect(dest);
    response.cookies.delete("cu_state");
    return response;
  } catch (err) {
    console.error("Error en callback de Clave Única:", err);
    return NextResponse.redirect(new URL("/login?cu=error", request.url));
  }
}
