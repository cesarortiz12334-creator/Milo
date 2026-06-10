"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { crearCampana, type CampanaState } from "@/app/campanas/nueva/actions";
import { Campo, Select, TextArea, Mensaje, BTN_PRIMARIO } from "@/components/auth/campos";
import { validarArchivo, TIPOS_IMAGEN, MAX_MB } from "@/lib/uploads";
import type { VeterinariaOpcion } from "@/lib/mock/veterinarias";

const inicial: CampanaState = {};

export default function NuevaCampanaForm({
  veterinarias,
  configurado,
}: {
  veterinarias: VeterinariaOpcion[];
  configurado: boolean;
}) {
  const [state, action, pending] = useActionState(crearCampana, inicial);
  const [fotoError, setFotoError] = useState<string | null>(null);

  function onFoto(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setFotoError(
      f ? validarArchivo(f, { tipos: TIPOS_IMAGEN, maxMB: MAX_MB }) : null
    );
  }

  return (
    <form action={action} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="font-heading text-lg font-bold text-dark">
          Tu mascota
        </legend>
        <Campo label="Nombre" name="nombre" required />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Especie" name="especie" defaultValue="" required>
            <option value="" disabled>
              Selecciona…
            </option>
            <option value="perro">Perro</option>
            <option value="gato">Gato</option>
            <option value="otro">Otro</option>
          </Select>
          <Campo label="Raza (opcional)" name="raza" />
        </div>
        <TextArea
          label="Cuéntanos sobre tu mascota (opcional)"
          name="descripcion_mascota"
          rows={2}
        />
        <label className="block text-sm font-semibold text-dark">
          Foto (JPG o PNG, máx. {MAX_MB}MB)
          <input
            type="file"
            name="foto"
            accept="image/jpeg,image/png"
            onChange={onFoto}
            className="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:font-heading file:text-sm file:font-bold file:text-primary"
          />
        </label>
        {fotoError && <Mensaje tipo="error">{fotoError}</Mensaje>}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-heading text-lg font-bold text-dark">
          La campaña
        </legend>
        <Campo
          label="Título"
          name="titulo"
          placeholder="Ej: Cirugía de cadera para Pelusa"
          required
        />
        <TextArea
          label="Descripción"
          name="descripcion_campana"
          rows={3}
          placeholder="¿Qué necesita tu mascota y por qué?"
        />
        <div className="grid grid-cols-2 gap-3">
          <Campo
            label="Meta (CLP)"
            name="monto_meta"
            type="number"
            min={1000}
            step={1000}
            required
          />
          <Campo label="Fecha límite" name="fecha_limite" type="date" />
        </div>
        <Select label="Veterinaria" name="veterinaria_id" defaultValue="" required>
          <option value="" disabled>
            Selecciona tu veterinaria…
          </option>
          {veterinarias.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nombre}
            </option>
          ))}
        </Select>
      </fieldset>

      <p className="rounded-xl border border-primary/30 bg-primary-soft/30 p-3 text-sm text-dark">
        El <strong>presupuesto</strong> lo sube tu veterinaria, no tú. Tu campaña
        quedará <strong>pendiente</strong> hasta que la veterinaria confirme el
        caso; recién entonces se publica.
      </p>

      {state.error && <Mensaje tipo="error">{state.error}</Mensaje>}

      <button
        type="submit"
        disabled={pending || !configurado || !!fotoError}
        className={BTN_PRIMARIO}
      >
        {pending ? "Creando…" : "Crear campaña"}
      </button>
    </form>
  );
}
