import { ImageResponse } from "next/og";
import { getCampanaMockById } from "@/lib/mock/campanas";
import { formatearCLP } from "@/lib/donaciones";

export const alt = "Campaña en Milo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function CampanaOpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = getCampanaMockById(id);

  const nombre = c?.mascota_nombre ?? "Una mascota";
  const meta = c?.monto_meta ?? 0;
  const recaudado = c?.monto_recaudado ?? 0;
  const progreso = meta > 0 ? Math.min(100, Math.round((recaudado / meta) * 100)) : 0;
  const dias = c?.fecha_limite
    ? Math.max(
        0,
        Math.ceil(
          (new Date(c.fecha_limite).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#FFFBF5",
          padding: "80px",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 800, color: "#F97316" }}>
          Milo
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 800,
            color: "#1C1917",
            marginTop: 16,
          }}
        >
          Ayuda a {nombre}
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#78716C", marginTop: 16 }}>
          {formatearCLP(recaudado)} de {formatearCLP(meta)} · {progreso}%
          {dias !== null ? ` · ${dias} días restantes` : ""}
        </div>
        {/* Barra de progreso */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: 28,
            background: "#FED7AA",
            borderRadius: 999,
            marginTop: 36,
          }}
        >
          <div
            style={{
              display: "flex",
              width: `${progreso}%`,
              height: 28,
              background: progreso >= 70 ? "#16A34A" : "#F97316",
              borderRadius: 999,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
