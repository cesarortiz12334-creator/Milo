"use client";

import { useState, useActionState } from "react";
import {
  reportarCampana,
  type ReporteState,
} from "@/app/campana/[id]/reporte-actions";
import { RAZONES_REPORTE } from "@/lib/validaciones";
import { Select, TextArea, Mensaje, BTN_PRIMARIO } from "@/components/auth/campos";

const inicial: ReporteState = {};

export default function ReportarCampanaModal({
  campanaId,
}: {
  campanaId: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [state, action, pending] = useActionState(reportarCampana, inicial);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-xs font-semibold text-muted underline transition hover:text-primary"
      >
        🚩 Reportar campaña
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setAbierto(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {state.message ? (
              <div className="text-center">
                <p className="text-3xl" aria-hidden="true">
                  🙏
                </p>
                <div className="mt-2">
                  <Mensaje tipo="ok">{state.message}</Mensaje>
                </div>
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className={`${BTN_PRIMARIO} mt-4`}
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form action={action} className="space-y-3">
                <h2 className="font-heading text-lg font-bold text-dark">
                  Reportar campaña
                </h2>
                <p className="text-sm text-muted">
                  Ayúdanos a mantener MiloFund seguro. Tu reporte es anónimo.
                </p>
                <input type="hidden" name="campana_id" value={campanaId} />
                <Select label="Razón" name="razon" defaultValue="" required>
                  <option value="" disabled>
                    Selecciona…
                  </option>
                  {RAZONES_REPORTE.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
                <TextArea
                  label="Cuéntanos más (opcional)"
                  name="descripcion"
                  rows={3}
                />
                {state.error && <Mensaje tipo="error">{state.error}</Mensaje>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAbierto(false)}
                    className="flex-1 rounded-full border border-black/10 px-4 py-2.5 text-sm font-semibold text-muted transition hover:bg-black/[0.03]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className={`${BTN_PRIMARIO} flex-1`}
                  >
                    {pending ? "Enviando…" : "Enviar reporte"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
