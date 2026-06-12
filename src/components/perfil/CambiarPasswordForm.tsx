"use client";

import { useActionState } from "react";
import { cambiarPassword, type PerfilState } from "@/app/perfil/actions";
import { Campo, Mensaje, BTN_PRIMARIO } from "@/components/auth/campos";

const inicial: PerfilState = {};

export default function CambiarPasswordForm() {
  const [state, action, pending] = useActionState(cambiarPassword, inicial);

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
      {state.message && <Mensaje tipo="ok">{state.message}</Mensaje>}
      <button type="submit" disabled={pending} className={BTN_PRIMARIO}>
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
