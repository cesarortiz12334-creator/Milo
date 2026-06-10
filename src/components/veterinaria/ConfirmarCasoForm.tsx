"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { confirmarCaso, type CasoState } from "@/app/veterinaria/actions";
import { Mensaje, BTN_PRIMARIO } from "@/components/auth/campos";
import { validarArchivo, TIPOS_PDF, MAX_MB } from "@/lib/uploads";

const inicial: CasoState = {};

export default function ConfirmarCasoForm({
  campanaId,
  configurado,
}: {
  campanaId: string;
  configurado: boolean;
}) {
  const [state, action, pending] = useActionState(confirmarCaso, inicial);
  const [fileError, setFileError] = useState<string | null>(null);

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setFileError(
      f ? validarArchivo(f, { tipos: TIPOS_PDF, maxMB: MAX_MB }) : null
    );
  }

  if (state.message) {
    return <Mensaje tipo="ok">{state.message}</Mensaje>;
  }

  return (
    <form action={action} className="mt-4 space-y-3 border-t border-black/10 pt-4">
      <input type="hidden" name="campana_id" value={campanaId} />
      <label className="block text-sm font-semibold text-dark">
        Presupuesto (PDF, máx. {MAX_MB}MB)
        <input
          type="file"
          name="presupuesto"
          accept="application/pdf"
          onChange={onFile}
          required
          className="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:font-heading file:text-sm file:font-bold file:text-primary"
        />
      </label>
      {fileError && <Mensaje tipo="error">{fileError}</Mensaje>}
      {state.error && <Mensaje tipo="error">{state.error}</Mensaje>}
      <button
        type="submit"
        disabled={pending || !configurado || !!fileError}
        className={BTN_PRIMARIO}
      >
        {pending ? "Confirmando…" : "Confirmar caso y activar campaña"}
      </button>
    </form>
  );
}
