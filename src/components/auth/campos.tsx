import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const BASE_INPUT =
  "mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 font-body text-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

/** Input etiquetado reutilizable para los formularios de auth. */
export function Campo({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm font-semibold text-dark">
      {label}
      <input {...props} className={BASE_INPUT} />
    </label>
  );
}

export function Select({
  label,
  children,
  ...props
}: { label: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block text-sm font-semibold text-dark">
      {label}
      <select {...props} className={BASE_INPUT}>
        {children}
      </select>
    </label>
  );
}

export function TextArea({
  label,
  ...props
}: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block text-sm font-semibold text-dark">
      {label}
      <textarea {...props} className={BASE_INPUT} />
    </label>
  );
}

/** Mensaje de error (rojo) o éxito (verde) para los formularios. */
export function Mensaje({
  tipo,
  children,
}: {
  tipo: "error" | "ok";
  children: ReactNode;
}) {
  const cls =
    tipo === "error"
      ? "border-red-300 bg-red-50 text-red-700"
      : "border-success/30 bg-success-soft text-success";
  return (
    <p className={`rounded-xl border px-3 py-2 text-sm ${cls}`} role="status">
      {children}
    </p>
  );
}

export const BTN_PRIMARIO =
  "inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 font-heading text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50";
