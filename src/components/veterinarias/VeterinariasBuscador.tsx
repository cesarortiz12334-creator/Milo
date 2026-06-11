"use client";

import { useState } from "react";
import type { VeterinariaPublica } from "@/lib/mock/veterinarias-publicas";

export default function VeterinariasBuscador({
  veterinarias,
}: {
  veterinarias: VeterinariaPublica[];
}) {
  const [q, setQ] = useState("");
  const filtro = q.toLowerCase().trim();
  const filtradas = veterinarias.filter((v) =>
    `${v.nombre} ${v.comuna}`.toLowerCase().includes(filtro)
  );

  return (
    <>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Busca por nombre o comuna…"
        className="mt-6 w-full rounded-full border border-black/10 px-5 py-3 text-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
      />

      {filtradas.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-white p-8 text-center text-muted ring-1 ring-black/5">
          No encontramos veterinarias con ese criterio.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((v) => (
            <article
              key={v.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-heading font-bold text-dark">{v.nombre}</h3>
                <span className="shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
                  ✓ Verificada
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">
                {v.direccion}
                {v.comuna ? `, ${v.comuna}` : ""}
              </p>
              {v.telefono && <p className="text-sm text-muted">{v.telefono}</p>}
              <div className="mt-3 flex gap-4 text-sm">
                <span className="text-dark">
                  <strong className="font-heading">{v.campanas_activas}</strong>{" "}
                  <span className="text-muted">campañas activas</span>
                </span>
                <span className="text-dark">
                  <strong className="font-heading">{v.mascotas_ayudadas}</strong>{" "}
                  <span className="text-muted">mascotas ayudadas</span>
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
