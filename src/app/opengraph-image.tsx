import { ImageResponse } from "next/og";

export const alt = "Milo — Ayuda a una mascota a recuperarse";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
        <div style={{ display: "flex", fontSize: 52, fontWeight: 800, color: "#F97316" }}>
          Milo
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 800,
            color: "#1C1917",
            marginTop: 24,
            lineHeight: 1.1,
          }}
        >
          Ayuda a una mascota a recuperarse
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#78716C", marginTop: 28 }}>
          Financiamiento colectivo veterinario · Chile
        </div>
      </div>
    ),
    { ...size }
  );
}
