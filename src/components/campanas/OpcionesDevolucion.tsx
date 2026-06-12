"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  solicitarDevolucion,
  type DevolucionState,
} from "@/app/campana/[id]/devolucion-actions";
import { Mensaje, BTN_PRIMARIO } from "@/components/auth/campos";
import {
  ventanaDevolucionVigente,
  horasRestantesDevolucion,
  HORAS_DEVOLUCION,
} from "@/lib/cierre";

const inicial: DevolucionState = {};

export default function OpcionesDevolucion({
  campanaId,
  cerradaEn,
  configurado,
}: {
  campanaId: string;
  cerradaEn: string | null;
  configurado: boolean;
}) {
  const [state, action, pending] = useActionState(solicitarDevolucion, inicial);
  const vigente = ventanaDevolucionVigente(cerradaEn);
  const horas = horasRestantesDevolucion(cerradaEn);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="font-heading text-lg font-bold text-dark">
        Esta campaña no alcanzó su meta
      </h2>
      <p className="mt-1 text-sm text-muted">
        No se llegó al 70% de la meta. Si donaste, elige qué hacer con tu aporte:
      </p>

      <ul className="mt-4 space-y-3 text-sm">
        <li className="rounded-xl border border-black/10 p-3">
          <p className="font-semibold text-dark">A · Apóyalo en otra campaña</p>
          <p className="text-muted">Redirige tu aporte para ayudar a otra mascota.</p>
          <Link href="/" className="mt-2 inline-block font-semibold text-primary">
            Ver campañas →
          </Link>
        </li>

        <li className="rounded-xl border border-black/10 p-3">
          <p className="font-semibold text-dark">B · Crédito MiloFund</p>
          <p className="text-muted">
            Tu aporte queda como crédito para usar cuando quieras (opción por
            defecto).
          </p>
        </li>

        <li className="rounded-xl border border-black/10 p-3">
          <p className="font-semibold text-dark">C · Devolución en efectivo</p>
          <p className="text-muted">
            {vigente
              ? `Disponible solo dentro de ${HORAS_DEVOLUCION}h del cierre. Te quedan ~${horas}h.`
              : `El plazo de ${HORAS_DEVOLUCION}h para pedir devolución en efectivo ya venció.`}
          </p>
          {state.message ? (
            <div className="mt-2">
              <Mensaje tipo="ok">{state.message}</Mensaje>
            </div>
          ) : (
            <form action={action} className="mt-2 space-y-2">
              <input type="hidden" name="campana_id" value={campanaId} />
              {state.error && <Mensaje tipo="error">{state.error}</Mensaje>}
              <button
                type="submit"
                disabled={pending || !configurado || !vigente}
                className={BTN_PRIMARIO}
              >
                {pending ? "Procesando…" : "Solicitar devolución en efectivo"}
              </button>
            </form>
          )}
        </li>
      </ul>
    </div>
  );
}
