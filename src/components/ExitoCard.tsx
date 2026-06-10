import { emojiEspecie } from "@/lib/especie";
import { formatearCLP } from "@/lib/donaciones";
import type { HistoriaExito } from "@/lib/mock/exitos";

export default function ExitoCard({ historia }: { historia: HistoriaExito }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-success-soft to-primary-soft">
        {historia.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={historia.foto_url}
            alt={`Foto de ${historia.mascota_nombre} recuperad@`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-6xl" aria-hidden="true">
            {emojiEspecie(historia.mascota_especie)}
          </span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-success px-3 py-1 text-xs font-bold text-white">
          ✓ Recuperad@
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div>
          <h3 className="font-heading text-lg font-extrabold text-dark">
            {historia.mascota_nombre}
          </h3>
          <p className="text-sm text-muted">{historia.titulo}</p>
        </div>

        {historia.actualizacion && (
          <p className="text-sm italic text-dark/90">
            “{historia.actualizacion}”
          </p>
        )}

        <div className="mt-auto pt-2">
          <p className="text-sm text-dark">
            <strong className="font-heading text-success">
              {formatearCLP(historia.monto_recaudado)}
            </strong>{" "}
            recaudados
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <span aria-hidden="true">🏥</span>
            {historia.veterinaria_nombre}
          </p>
        </div>
      </div>
    </article>
  );
}
