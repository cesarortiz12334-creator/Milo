"use client";

import { useActionState } from "react";
import { actualizarPerfil, type PerfilState } from "@/app/perfil/actions";
import { Campo, Mensaje, BTN_PRIMARIO } from "@/components/auth/campos";
import type { UserRole } from "@/types";

const inicial: PerfilState = {};

export default function PerfilForm({
  nombre,
  telefono,
  calle,
  comuna,
  region,
  role,
}: {
  nombre: string;
  telefono: string;
  calle: string;
  comuna: string;
  region: string;
  role: UserRole | null;
}) {
  const [state, action, pending] = useActionState(actualizarPerfil, inicial);
  const conDireccion = role === "solicitante" || role === "veterinaria";

  return (
    <form action={action} className="space-y-3">
      <Campo label="Nombre completo" name="nombre" defaultValue={nombre} required />
      <Campo
        label="Teléfono"
        name="telefono"
        type="tel"
        defaultValue={telefono}
        placeholder="+56 9 1234 5678"
        required
      />
      {conDireccion && (
        <>
          <Campo
            label={role === "veterinaria" ? "Dirección" : "Calle y número"}
            name="calle"
            defaultValue={calle}
          />
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Región" name="region" defaultValue={region} />
            <Campo label="Comuna" name="comuna" defaultValue={comuna} />
          </div>
        </>
      )}
      {state.error && <Mensaje tipo="error">{state.error}</Mensaje>}
      {state.message && <Mensaje tipo="ok">{state.message}</Mensaje>}
      <button type="submit" disabled={pending} className={BTN_PRIMARIO}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
