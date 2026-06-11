"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import {
  publicarActualizacion,
  type ActualizacionState,
} from "@/app/campana/[id]/actualizacion-actions";
import { TextArea, Mensaje, BTN_PRIMARIO } from "@/components/auth/campos";
import { validarArchivo, TIPOS_IMAGEN, MAX_MB } from "@/lib/uploads";

const inicial: ActualizacionState = {};

export default function ActualizacionForm({
  campanaId,
  configurado,
}: {
  campanaId: string;
  configurado: boolean;
}) {
  const [state, action, pending] = useActionState(publicarActualizacion, inicial);
  const [fotoError, setFotoError] = useState<string | null>(null);

  function onFoto(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setFotoError(f ? validarArchivo(f, { tipos: TIPOS_IMAGEN, maxMB: MAX_MB }) : null);
  }

  if (state.message) return <Mensaje tipo="ok">{state.message}</Mensaje>;

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-black/10 p-4">
      <p className="font-heading font-bold text-dark">Publicar una actualización</p>
      <p className="text-xs text-muted">
        Comparte cómo va tu mascota. Avisaremos a tus donantes por email.
      </p>
      <input type="hidden" name="campana_id" value={campanaId} />
      <TextArea
        label="Mensaje"
        name="mensaje"
        rows={3}
        required
        placeholder="¡Pelusa ya está en casa y se recupera muy bien, gracias a todos!"
      />
      <label className="block text-sm font-semibold text-dark">
        Foto (JPG/PNG, opcional)
        <input
          type="file"
          name="foto"
          accept="image/jpeg,image/png"
          onChange={onFoto}
          className="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:font-heading file:text-sm file:font-bold file:text-primary"
        />
      </label>
      {fotoError && <Mensaje tipo="error">{fotoError}</Mensaje>}
      {state.error && <Mensaje tipo="error">{state.error}</Mensaje>}
      <button
        type="submit"
        disabled={pending || !configurado || !!fotoError}
        className={BTN_PRIMARIO}
      >
        {pending ? "Publicando…" : "Publicar y avisar a donantes"}
      </button>
    </form>
  );
}
