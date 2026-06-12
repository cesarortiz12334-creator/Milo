"use client";

import { useActionState } from "react";
import { registrarVeterinaria, type AuthState } from "@/lib/auth-actions";
import { Campo, Mensaje, BTN_PRIMARIO } from "./campos";
import RegionComunaSelect from "./RegionComunaSelect";

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
        label="Razón social"
        name="nombre"
        autoComplete="organization"
        placeholder="Clínica Veterinaria ..."
        required
      />
      <Campo
        label="RUT de la empresa"
        name="rut"
        placeholder="76.123.456-7"
        required
      />
      <Campo
        label="Correo"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <Campo
        label="Teléfono"
        name="telefono"
        type="tel"
        autoComplete="tel"
        placeholder="+56 9 1234 5678"
        required
      />
      <Campo
        label="Dirección (calle y número)"
        name="calle"
        autoComplete="street-address"
        required
      />
      <RegionComunaSelect />
      <Campo
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <p className="rounded-xl bg-primary-soft/30 px-3 py-2 text-xs text-muted">
        Durante la verificación, el equipo MiloFund te solicitará la
        documentación de acreditación de la clínica (certificados y patente).
      </p>
      {state.error && <Mensaje tipo="error">{state.error}</Mensaje>}
      {state.message && <Mensaje tipo="ok">{state.message}</Mensaje>}
      <button type="submit" disabled={pending || !configurado} className={BTN_PRIMARIO}>
        {pending ? "Creando…" : "Registrar veterinaria"}
      </button>
    </form>
  );
}
