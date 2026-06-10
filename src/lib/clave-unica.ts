import { createHash } from "crypto";

/**
 * Helper de Clave Única (OpenID Connect del Estado de Chile).
 *
 * Clave Única NO es un proveedor nativo de Supabase: se integra con un flujo
 * OAuth/OIDC propio (authorize → callback → token → userinfo) y luego se crea /
 * inicia sesión del usuario en Supabase con service role.
 *
 * Requiere credenciales entregadas por la División de Gobierno Digital (no hay
 * credenciales públicas de prueba como en Transbank). Mientras no estén
 * configuradas, los endpoints degradan con un mensaje claro.
 *
 * Docs: https://digital.gob.cl/biblioteca/orientaciones/claveunica/
 */
export const claveUnica = {
  authorizeUrl:
    process.env.CLAVE_UNICA_AUTHORIZE_URL ??
    "https://accounts.claveunica.gob.cl/openid/authorize/",
  tokenUrl:
    process.env.CLAVE_UNICA_TOKEN_URL ??
    "https://accounts.claveunica.gob.cl/openid/token/",
  userinfoUrl:
    process.env.CLAVE_UNICA_USERINFO_URL ??
    "https://accounts.claveunica.gob.cl/openid/userinfo/",
  clientId: process.env.CLAVE_UNICA_CLIENT_ID ?? "",
  clientSecret: process.env.CLAVE_UNICA_CLIENT_SECRET ?? "",
  scope: "openid run name",
};

export function claveUnicaConfigurada(): boolean {
  return Boolean(claveUnica.clientId && claveUnica.clientSecret);
}

export function construirAuthorizeUrl(
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: claveUnica.clientId,
    response_type: "code",
    scope: claveUnica.scope,
    redirect_uri: redirectUri,
    state,
  });
  return `${claveUnica.authorizeUrl}?${params.toString()}`;
}

export interface ClaveUnicaToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token?: string;
}

export interface ClaveUnicaUserinfo {
  sub: string;
  name?: string;
  RolUnico?: { numero: number; DV: string; tipo: string };
}

export async function intercambiarCodigo(
  code: string,
  redirectUri: string
): Promise<ClaveUnicaToken> {
  const body = new URLSearchParams({
    client_id: claveUnica.clientId,
    client_secret: claveUnica.clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
    code,
  });
  const res = await fetch(claveUnica.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Clave Única token error: ${res.status}`);
  return (await res.json()) as ClaveUnicaToken;
}

export async function obtenerUserinfo(
  accessToken: string
): Promise<ClaveUnicaUserinfo> {
  const res = await fetch(claveUnica.userinfoUrl, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Clave Única userinfo error: ${res.status}`);
  return (await res.json()) as ClaveUnicaUserinfo;
}

/** RUT (ej. "12345678-9") hasheado: nunca se guarda ni expone el RUT en claro. */
export function hashRut(rut: string): string {
  return createHash("sha256")
    .update(rut.replace(/[.\s]/g, "").toLowerCase())
    .digest("hex");
}
