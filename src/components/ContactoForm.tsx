"use client";

import { useActionState } from "react";
import { enviarContacto, type ContactoState } from "@/app/contacto/actions";
import { ASUNTOS_CONTACTO } from "@/lib/validaciones";
import { Campo, Select, TextArea, Mensaje, BTN_PRIMARIO } from "@/components/auth/campos";

const inicial: ContactoState = {};

export default function ContactoForm() {
  const [state, action, pending] = useActionState(enviarContacto, inicial);

  if (state.message) {
    return (
      <div className="text-center">
        <p className="text-3xl" aria-hidden="true">
          ✅
        </p>
        <div className="mt-2">
          <Mensaje tipo="ok">{state.message}</Mensaje>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <Campo label="Nombre completo" name="nombre" autoComplete="name" required />
      <Campo label="Correo" name="email" type="email" autoComplete="email" required />
      <Select label="Asunto" name="asunto" defaultValue="" required>
        <option value="" disabled>
          Selecciona…
        </option>
        {ASUNTOS_CONTACTO.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </Select>
      <TextArea label="Mensaje" name="mensaje" rows={5} required />
      {state.error && <Mensaje tipo="error">{state.error}</Mensaje>}
      <button type="submit" disabled={pending} className={BTN_PRIMARIO}>
        {pending ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
