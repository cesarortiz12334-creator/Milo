import { NextRequest, NextResponse } from "next/server";
import { isAdminConfigured } from "@/lib/supabase/admin";
import { cerrarCampanasVencidas } from "@/lib/cerrar-campanas";

export const runtime = "nodejs";

/**
 * Cierre diario de campañas vencidas (regla del 70%).
 * Protegido con CRON_SECRET: Vercel Cron envía `Authorization: Bearer <secret>`.
 * Configurado en vercel.json.
 */
function autorizado(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Supabase service role no configurado" },
      { status: 503 }
    );
  }

  try {
    const resultado = await cerrarCampanasVencidas();
    return NextResponse.json({ ok: true, ...resultado });
  } catch (err) {
    console.error("Error cerrando campañas:", err);
    return NextResponse.json({ error: "Falló el cierre" }, { status: 500 });
  }
}
