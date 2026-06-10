"use client";

import { useActionState } from "react";
import { registrarDonante, type AuthState } from "@/lib/auth-actions";
import { Campo, Mensaje, BTN_PRIMARIO } from "./campos";

const inicial: AuthState = {};

export default function RegistroDonanteForm({
  configurado,
}: {
  configurado: boolean;
}) {
  const [state, action, pending] = useActionState(registrarDonante, inicial);

  return (
    <form action={action} className="space-y-3">
      <Campo label="Nombre" name="nombre" autoComplete="name" required />
      <Campo
        label="Correo"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <Campo
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={6}
        required
      />
      {state.error && <Mensaje tipo="error">{state.error}</Mensaje>}
      {state.message && <Mensaje tipo="ok">{state.message}</Mensaje>}
      <button type="submit" disabled={pending || !configurado} className={BTN_PRIMARIO}>
        {pending ? "Creando…" : "Crear cuenta"}
      </button>
    </form>
  );
}
