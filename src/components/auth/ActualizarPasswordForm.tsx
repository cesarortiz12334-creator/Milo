"use client";

import { useActionState } from "react";
import { actualizarPassword, type AuthState } from "@/lib/auth-actions";
import { Campo, Mensaje, BTN_PRIMARIO } from "./campos";

const inicial: AuthState = {};

export default function ActualizarPasswordForm({
  configurado,
}: {
  configurado: boolean;
}) {
  const [state, action, pending] = useActionState(actualizarPassword, inicial);

  return (
    <form action={action} className="space-y-3">
      <Campo
        label="Nueva contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      {state.error && <Mensaje tipo="error">{state.error}</Mensaje>}
      <button type="submit" disabled={pending || !configurado} className={BTN_PRIMARIO}>
        {pending ? "Guardando…" : "Guardar nueva contraseña"}
      </button>
    </form>
  );
}
