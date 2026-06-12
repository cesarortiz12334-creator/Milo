"use client";

import { useActionState } from "react";
import { solicitarReset, type AuthState } from "@/lib/auth-actions";
import { Campo, Mensaje, BTN_PRIMARIO } from "./campos";

const inicial: AuthState = {};

export default function RecuperarForm({ configurado }: { configurado: boolean }) {
  const [state, action, pending] = useActionState(solicitarReset, inicial);

  return (
    <form action={action} className="space-y-3">
      <Campo
        label="Correo"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      {state.error && <Mensaje tipo="error">{state.error}</Mensaje>}
      {state.message && <Mensaje tipo="ok">{state.message}</Mensaje>}
      <button type="submit" disabled={pending || !configurado} className={BTN_PRIMARIO}>
        {pending ? "Enviando…" : "Enviar instrucciones"}
      </button>
    </form>
  );
}
