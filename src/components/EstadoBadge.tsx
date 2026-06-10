import type { CampanaEstado } from "@/types";

const MAP: Record<CampanaEstado, { label: string; cls: string }> = {
  borrador: { label: "Borrador", cls: "bg-black/5 text-muted" },
  pendiente: {
    label: "Pendiente de confirmación",
    cls: "bg-primary-soft text-primary",
  },
  activa: { label: "Activa", cls: "bg-success-soft text-success" },
  exitosa: { label: "Exitosa", cls: "bg-success text-white" },
  no_financiada: { label: "No financiada", cls: "bg-black/5 text-muted" },
};

export default function EstadoBadge({ estado }: { estado: CampanaEstado }) {
  const { label, cls } = MAP[estado];
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}
