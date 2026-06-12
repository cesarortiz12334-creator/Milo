import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-warm-white px-4 text-center">
      <p className="text-6xl" aria-hidden="true">
        🐾
      </p>
      <h1 className="mt-4 font-heading text-3xl font-extrabold text-dark">
        Esta página no existe
      </h1>
      <p className="mt-2 max-w-md text-muted">
        Puede que el enlace esté roto o que la campaña ya no esté disponible.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-primary px-5 py-2.5 font-heading text-sm font-bold text-white transition hover:bg-primary/90"
        >
          Ir al inicio
        </Link>
        <Link
          href="/"
          className="rounded-full border border-black/10 bg-white px-5 py-2.5 font-heading text-sm font-bold text-dark transition hover:bg-black/[0.03]"
        >
          Ver campañas activas
        </Link>
      </div>
    </div>
  );
}
