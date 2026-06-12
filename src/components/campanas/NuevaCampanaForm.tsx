"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { crearCampana, type CampanaState } from "@/app/campanas/nueva/actions";
import { Campo, Select, TextArea, Mensaje, BTN_PRIMARIO } from "@/components/auth/campos";
import { validarArchivo, TIPOS_IMAGEN, TIPOS_PDF, MAX_MB } from "@/lib/uploads";
import type { VeterinariaOpcion } from "@/lib/mock/veterinarias";

const inicial: CampanaState = {};

/** Campo de texto guiado (mínimo 50 caracteres) con ayuda debajo. */
function Guiado({
  name,
  label,
  ayuda,
  placeholder,
}: {
  name: string;
  label: string;
  ayuda: string;
  placeholder?: string;
}) {
  return (
    <div>
      <TextArea
        label={label}
        name={name}
        rows={3}
        minLength={50}
        required
        placeholder={placeholder}
      />
      <p className="mt-1 text-xs text-muted">{ayuda}</p>
    </div>
  );
}

export default function NuevaCampanaForm({
  veterinarias,
  configurado,
}: {
  veterinarias: VeterinariaOpcion[];
  configurado: boolean;
}) {
  const [state, action, pending] = useActionState(crearCampana, inicial);
  const [fotos, setFotos] = useState<File[]>([]);
  const [fotosError, setFotosError] = useState<string | null>(null);
  const [cartolaError, setCartolaError] = useState<string | null>(null);

  function onFotos(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    let err: string | null = null;
    if (files.length === 0) {
      err = "Debes subir al menos una foto de tu mascota para crear la campaña";
    } else if (files.length > 5) {
      err = "Puedes subir un máximo de 5 fotos.";
    } else {
      for (const f of files) {
        const e1 = validarArchivo(f, { tipos: TIPOS_IMAGEN, maxMB: MAX_MB });
        if (e1) {
          err = e1;
          break;
        }
      }
    }
    setFotos(files);
    setFotosError(err);
  }

  function onCartola(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setCartolaError(f ? validarArchivo(f, { tipos: TIPOS_PDF, maxMB: MAX_MB }) : null);
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

        <label className="block text-sm font-semibold text-dark">
          Fotos de tu mascota (JPG o PNG · 1 a 5 · máx. {MAX_MB}MB c/u)
          <input
            type="file"
            name="fotos"
            accept="image/jpeg,image/png"
            multiple
            onChange={onFotos}
            required
            className="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:font-heading file:text-sm file:font-bold file:text-primary"
          />
        </label>
        <p className="text-xs text-muted">
          (Te recomendamos incluir: • Una foto clara de la cara de tu mascota •
          Una foto junto a tu familia — genera más conexión emocional • Una foto
          en la veterinaria o que muestre la lesión o enfermedad • Un video corto
          de 15-30 segundos si tienes uno. Las campañas con 3 o más fotos recaudan
          hasta 60% más)
        </p>
        {fotos.length > 0 && !fotosError && (
          <p className="text-xs font-semibold text-success">
            {fotos.length} foto{fotos.length > 1 ? "s" : ""} seleccionada
            {fotos.length > 1 ? "s" : ""}.
          </p>
        )}
        {fotosError && <Mensaje tipo="error">{fotosError}</Mensaje>}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-heading text-lg font-bold text-dark">
          Tu Registro Social de Hogares
        </legend>
        <p className="text-sm text-muted">
          Sube tu <strong>Cartola Hogar del RSH</strong> en PDF. La descargas
          gratis en <strong>ventanillaunicasocial.gob.cl</strong> con tu Clave
          Única. Validamos automáticamente tu RUT, la vigencia y el tramo (debe ser
          40% o inferior).
        </p>
        <label className="block text-sm font-semibold text-dark">
          Cartola Hogar (PDF, máx. {MAX_MB}MB)
          <input
            type="file"
            name="cartola"
            accept="application/pdf"
            onChange={onCartola}
            required
            className="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:font-heading file:text-sm file:font-bold file:text-primary"
          />
        </label>
        {cartolaError && <Mensaje tipo="error">{cartolaError}</Mensaje>}
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

        <Guiado
          name="que_paso"
          label="¿Qué le pasó a tu mascota?"
          ayuda="Te recomendamos ser específico: cuándo ocurrió, cómo, qué síntomas tiene."
        />
        <Guiado
          name="diagnostico"
          label="¿Qué diagnóstico dio la veterinaria?"
          ayuda="Describe el diagnóstico y el tratamiento recomendado."
        />
        <Guiado
          name="por_que_ayuda"
          label="¿Por qué necesitan ayuda económica?"
          ayuda="Cuéntanos tu situación familiar y por qué no pueden costear el tratamiento solos."
        />
        <Guiado
          name="algo_especial"
          label="Cuéntanos algo especial de tu mascota"
          ayuda="Su nombre, edad, personalidad, cuánto tiempo lleva con tu familia — esto conecta con los donantes."
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
        caso. Las campañas sobre <strong>$200.000</strong> pasan además por una
        revisión del equipo MiloFund antes de publicarse.
      </p>

      {state.error && <Mensaje tipo="error">{state.error}</Mensaje>}

      <button
        type="submit"
        disabled={
          pending || !configurado || !!fotosError || !!cartolaError || fotos.length === 0
        }
        className={BTN_PRIMARIO}
      >
        {pending ? "Creando…" : "Crear campaña"}
      </button>
    </form>
  );
}
