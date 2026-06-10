"use client";

import { useActionState } from "react";
import { registrarVeterinaria, type AuthState } from "@/lib/auth-actions";
import { Campo, Mensaje, BTN_PRIMARIO } from "./campos";

const inicial: AuthState = {};

export default function RegistroVeterinariaForm({
  configurado,
}: {
  configurado: boolean;
}) {
  const [state, action, pending] = useActionState(
    registrarVeterinaria,
    inicial
  );

  return (
    <form action={action} className="space-y-3">
      <Campo
        label="Nombre de la clínica"
        name="nombre"
        autoComplete="organization"
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <Campo label="RUT" name="rut" placeholder="76.123.456-7" required />
        <Campo label="Teléfono" name="telefono" type="tel" autoComplete="tel" />
      </div>
      <Campo label="Dirección" name="direccion" autoComplete="street-address" />
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
        {pending ? "Creando…" : "Registrar veterinaria"}
      </button>
    </form>
  );
}
