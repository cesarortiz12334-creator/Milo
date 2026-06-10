import { NextRequest, NextResponse } from "next/server";
import {
  claveUnicaConfigurada,
  construirAuthorizeUrl,
} from "@/lib/clave-unica";

export const runtime = "nodejs";

/**
 * Inicia el login con Clave Única: redirige al authorize de Clave Única con un
 * `state` antifalsificación guardado en cookie. Si no hay credenciales, vuelve
 * al login con un aviso.
 */
export async function GET(request: NextRequest) {
  if (!claveUnicaConfigurada()) {
    return NextResponse.redirect(
      new URL("/login?cu=no_configurado", request.url)
    );
  }

  const state = crypto.randomUUID();
  const redirectUri = new URL(
    "/api/auth/clave-unica/callback",
    request.url
  ).toString();

  const response = NextResponse.redirect(
    construirAuthorizeUrl(redirectUri, state)
  );
  response.cookies.set("cu_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return response;
}
