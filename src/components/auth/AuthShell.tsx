import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";

export default function AuthShell({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="font-heading text-2xl font-extrabold text-dark">
          {titulo}
        </h1>
        {subtitulo && <p className="mt-1 text-muted">{subtitulo}</p>}
        <div className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          {children}
        </div>
      </main>
    </div>
  );
}
