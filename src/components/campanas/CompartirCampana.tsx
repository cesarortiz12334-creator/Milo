"use client";

import { useState } from "react";

export default function CompartirCampana({
  campanaId,
  titulo,
  mascota,
}: {
  campanaId: string;
  titulo: string;
  mascota: string;
}) {
  const [copiado, setCopiado] = useState(false);

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://milofund.com";
  const url = `${base}/campana/${campanaId}`;
  const texto = `Ayuda a ${mascota}: ${titulo} 🐾`;

  const wa = `https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const tw = `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // ignorar
    }
  }

  const cls =
    "inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-dark transition hover:bg-black/[0.03]";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-muted">Compartir:</span>
      <a href={wa} target="_blank" rel="noopener noreferrer" className={cls}>
        💬 WhatsApp
      </a>
      <a href={fb} target="_blank" rel="noopener noreferrer" className={cls}>
        👍 Facebook
      </a>
      <a href={tw} target="_blank" rel="noopener noreferrer" className={cls}>
        ✖ Twitter
      </a>
      <button type="button" onClick={copiar} className={cls}>
        {copiado ? "✓ Copiado" : "🔗 Copiar link"}
      </button>
    </div>
  );
}
