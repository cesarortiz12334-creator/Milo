"use client";

import Link from "next/link";
import { useActionState } from "react";
import { iniciarSesion, type AuthState } from "@/lib/auth-actions";
import { Campo, Mensaje, BTN_PRIMARIO } from "./campos";

const inicial: AuthState = {};

export default function LoginForm({ configurado }: { configurado: boolean }) {
  const [state, action, pending] = useActionState(iniciarSesion, inicial);

  return (
    <form action={action} className="space-y-3">
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
        autoComplete="current-password"
        required
      />
      <div className="text-right">
        <Link
          href="/recuperar-contrasena"
          className="text-sm font-semibold text-primary hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      {state.error && <Mensaje tipo="error">{state.error}</Mensaje>}
      <button type="submit" disabled={pending || !configurado} className={BTN_PRIMARIO}>
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
