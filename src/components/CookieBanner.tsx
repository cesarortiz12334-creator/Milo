"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CLAVE = "milo_cookies_ok";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CLAVE)) setVisible(true);
    } catch {
      // Si localStorage no está disponible, no mostramos el banner.
    }
  }, []);

  function aceptar() {
    try {
      localStorage.setItem(CLAVE, "1");
    } catch {
      // ignorar
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-white/95 p-4 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-dark">
          Usamos cookies técnicas necesarias para el funcionamiento de la
          plataforma. Sin publicidad ni rastreo.{" "}
          <Link href="/cookies" className="font-semibold text-primary underline">
            Más información
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={aceptar}
          className="shrink-0 rounded-full bg-primary px-6 py-2 font-heading text-sm font-bold text-white transition hover:bg-primary/90"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
