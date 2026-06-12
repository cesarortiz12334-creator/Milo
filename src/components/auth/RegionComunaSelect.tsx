"use client";

import { useState } from "react";
import { Select } from "./campos";
import { REGIONES, comunasDeRegion } from "@/lib/chile";

/**
 * Selectores en cascada Región → Comuna. Al cambiar la región, la comuna se
 * reinicia (key={region}) y se llena solo con las comunas de esa región.
 * Envía los campos `region` y `comuna` en el FormData.
 */
export default function RegionComunaSelect() {
  const [region, setRegion] = useState("");
  const comunas = comunasDeRegion(region);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Select
        label="Región"
        name="region"
        required
        value={region}
        onChange={(e) => setRegion(e.target.value)}
      >
        <option value="">Selecciona…</option>
        {REGIONES.map((r) => (
          <option key={r.nombre} value={r.nombre}>
            {r.nombre}
          </option>
        ))}
      </Select>

      <Select
        key={region}
        label="Comuna"
        name="comuna"
        required
        defaultValue=""
        disabled={!region}
      >
        <option value="">{region ? "Selecciona…" : "Elige región primero"}</option>
        {comunas.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
    </div>
  );
}
