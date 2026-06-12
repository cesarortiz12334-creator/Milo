"use client";

import { useState } from "react";
import {
  COMISION_PCT,
  MONTOS_SUGERIDOS,
  MONTO_MINIMO,
  calcularComision,
  calcularNeto,
  formatearCLP,
} from "@/lib/donaciones";

export default function DonacionForm({ campanaId }: { campanaId: string }) {
  const [monto, setMonto] = useState<number>(MONTOS_SUGERIDOS[1]);

  const valido = Number.isFinite(monto) && monto >= MONTO_MINIMO;
  const comision = valido ? calcularComision(monto) : 0;
  const neto = valido ? calcularNeto(monto) : 0;

  return (
    <form
      action="/api/webpay/crear"
      method="POST"
      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="font-heading text-lg font-extrabold text-dark">
        Haz tu donación
      </h2>

      <input type="hidden" name="campana_id" value={campanaId} />

      {/* Montos sugeridos */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {MONTOS_SUGERIDOS.map((m) => {
          const activo = monto === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMonto(m)}
              className={`rounded-xl border px-3 py-2.5 font-heading text-sm font-bold transition ${
                activo
                  ? "border-primary bg-primary-soft/50 text-dark"
                  : "border-black/10 text-muted hover:border-primary/40"
              }`}
            >
              {formatearCLP(m)}
            </button>
          );
        })}
      </div>

      {/* Monto personalizado */}
      <label className="mt-3 block text-sm font-semibold text-dark">
        Otro monto (CLP)
        <input
          type="number"
          inputMode="numeric"
          min={MONTO_MINIMO}
          step={1000}
          value={Number.isFinite(monto) ? monto : ""}
          onChange={(e) => setMonto(parseInt(e.target.value, 10))}
          className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 text-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          placeholder={`Mínimo ${formatearCLP(MONTO_MINIMO)}`}
        />
      </label>

      {/* Monto real que se envía a Webpay */}
      <input type="hidden" name="monto" value={valido ? monto : ""} />

      {/* Desglose — la comisión del 6% SIEMPRE visible antes de confirmar */}
      <dl className="mt-4 space-y-1.5 rounded-xl bg-warm-white p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Tu donación</dt>
          <dd className="font-semibold text-dark">
            {formatearCLP(valido ? monto : 0)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">
            Comisión MiloFund ({Math.round(COMISION_PCT * 100)}% IVA incl.)
          </dt>
          <dd className="font-semibold text-dark">
            − {formatearCLP(comision)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-black/10 pt-1.5">
          <dt className="font-heading font-bold text-dark">La campaña recibe</dt>
          <dd className="font-heading font-bold text-success">
            {formatearCLP(neto)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 space-y-2">
        <button
          type="submit"
          disabled={!valido}
          className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 font-heading text-base font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {valido ? `Pagar ${formatearCLP(monto)} con Webpay` : "Ingresa un monto"}
        </button>
        <button
          type="submit"
          formAction="/api/mercadopago/crear"
          disabled={!valido}
          className="inline-flex w-full items-center justify-center rounded-full bg-[#009EE3] px-4 py-3 font-heading text-base font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Pagar con Mercado Pago
        </button>
      </div>

      <p className="mt-3 text-center text-xs text-muted">
        Elige tu medio de pago. Serás redirigido a la pasarela segura; MiloFund nunca
        ve los datos de tu tarjeta. Ambiente de pruebas (sandbox).
      </p>
    </form>
  );
}
