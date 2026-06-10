import ConfirmarCasoForm from "./ConfirmarCasoForm";
import { emojiEspecie } from "@/lib/especie";
import { formatearCLP } from "@/lib/donaciones";
import type { CasoVet } from "@/lib/mock/casos";

export default function CasoCard({
  caso,
  configurado,
}: {
  caso: CasoVet;
  configurado: boolean;
}) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-soft to-success-soft text-3xl">
          <span aria-hidden="true">{emojiEspecie(caso.mascota_especie)}</span>
        </div>
        <div className="min-w-0">
          <h3 className="font-heading font-bold text-dark">{caso.titulo}</h3>
          <p className="text-sm text-muted">
            {caso.mascota_nombre} · {caso.mascota_especie}
          </p>
          {caso.descripcion && (
            <p className="mt-2 text-sm text-dark/90">{caso.descripcion}</p>
          )}
          <p className="mt-2 text-sm font-semibold text-dark">
            Meta solicitada: {formatearCLP(caso.monto_meta)}
          </p>
        </div>
      </div>

      <ConfirmarCasoForm campanaId={caso.id} configurado={configurado} />
    </article>
  );
}
