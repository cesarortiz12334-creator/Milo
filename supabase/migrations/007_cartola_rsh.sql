-- =============================================================
-- Milo — Migración 007: Cartola RSH (PDF) en vez de Clave Única
-- =============================================================
-- El solicitante ya NO se autentica con Clave Única. Se registra con email y
-- contraseña (entregando su RUT) y, al crear una campaña, sube su Cartola Hogar
-- del RSH en PDF, que se valida automáticamente en el servidor.
-- =============================================================

-- ---------- solicitantes: fuera Clave Única, dentro cartola ----------
alter table public.solicitantes drop column if exists rsh_verificado_at;
alter table public.solicitantes drop column if exists rsh_tramo;

alter table public.solicitantes
  add column if not exists cartola_pdf_url        text,   -- ruta Storage privada
  add column if not exists rut_extraido           text,   -- RUT leído del PDF (sensible, RLS owner-only)
  add column if not exists tramo_extraido         smallint,
  add column if not exists fecha_emision_cartola  date,
  add column if not exists validacion_estado      text not null default 'pendiente'
    check (validacion_estado in ('pendiente', 'auto_aprobada', 'revision_manual', 'rechazada'));

-- rut_hash (migración 001) se mantiene: es el RUT del REGISTRO, hasheado, contra
-- el que se cruza el RUT extraído de la cartola.

-- ---------- campanas: revisión manual para montos altos ----------
-- Campañas > $200.000 requieren revisión del equipo Milo antes de publicarse.
alter table public.campanas
  add column if not exists requiere_revision_manual boolean not null default false,
  add column if not exists revision_manual_aprobada boolean not null default false,
  add column if not exists vet_confirmo_at          timestamptz;

-- ---------- trigger de alta: guarda rut_hash del solicitante ----------
-- Reemplaza la función de la migración 002 para que, al registrarse un
-- solicitante, se guarde su rut_hash (viene hasheado en el metadata del signUp;
-- el RUT en claro NUNCA se envía ni se guarda en auth.users).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rol user_role;
begin
  rol := coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'donante');

  insert into public.users (id, email, role)
  values (new.id, new.email, rol);

  if rol = 'veterinaria' then
    insert into public.veterinarias (user_id, nombre, rut, direccion, telefono)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'nombre', ''),
      coalesce(new.raw_user_meta_data ->> 'rut', ''),
      new.raw_user_meta_data ->> 'direccion',
      new.raw_user_meta_data ->> 'telefono'
    );
  elsif rol = 'solicitante' then
    insert into public.solicitantes (user_id, rut_hash)
    values (new.id, new.raw_user_meta_data ->> 'rut_hash');
  end if;

  return new;
end;
$$;
