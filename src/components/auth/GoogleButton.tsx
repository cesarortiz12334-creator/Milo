"use client";

import { createClient } from "@/lib/supabase/client";

export default function GoogleButton({
  configurado,
  next = "/",
  texto = "Continuar con Google",
}: {
  configurado: boolean;
  next?: string;
  texto?: string;
}) {
  async function ingresar() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          next
        )}`,
      },
    });
  }

  return (
    <button
      type="button"
      onClick={ingresar}
      disabled={!configurado}
      className="flex w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-dark transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span aria-hidden="true">🔵</span> {texto}
    </button>
  );
}
