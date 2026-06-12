-- =============================================================
-- MiloFund — Migración 010: perfiles completos (registro ampliado)
-- =============================================================
-- Agrega los campos nuevos del registro:
--   * users        : nombre, telefono (todos los roles) + rut_hash (donante)
--   * solicitantes : calle, comuna, region (rut_hash ya existía)
--   * veterinarias : comuna, region (direccion/telefono ya existían)
-- y actualiza handle_new_user() para persistirlos desde el metadata del signUp.
--
-- BONUS (corrige bug latente): el trigger anterior insertaba `solicitantes`
-- SOLO con user_id, así que el rut_hash del solicitante NUNCA se guardaba y el
-- cruce con la Cartola RSH no podía funcionar. Ahora sí se guarda.
--
-- Idempotente: usa ADD COLUMN IF NOT EXISTS y CREATE OR REPLACE. Se puede
-- correr sobre la base ya existente sin borrar datos.
-- =============================================================

-- ---------- Columnas nuevas ----------
alter table public.users add column if not exists nombre   text;
alter table public.users add column if not exists telefono text;
alter table public.users add column if not exists rut_hash text;  -- solo donante

alter table public.solicitantes add column if not exists calle  text;
alter table public.solicitantes add column if not exists comuna text;
alter table public.solicitantes add column if not exists region text;

alter table public.veterinarias add column if not exists comuna text;
alter table public.veterinarias add column if not exists region text;

-- mascotas: galería de fotos (1 a 5). foto_url sigue siendo la foto principal.
alter table public.mascotas add column if not exists fotos_urls text[];

-- ---------- Trigger de creación de perfil (actualizado) ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rol user_role;
begin
  rol := coalesce(
    (new.raw_user_meta_data ->> 'role')::user_role,
    'donante'
  );

  insert into public.users (id, email, role, nombre, telefono, rut_hash)
  values (
    new.id,
    new.email,
    rol,
    new.raw_user_meta_data ->> 'nombre',
    new.raw_user_meta_data ->> 'telefono',
    -- El donante no tiene tabla de perfil propia: su RUT hasheado vive en users.
    case when rol = 'donante' then new.raw_user_meta_data ->> 'rut_hash' else null end
  );

  if rol = 'veterinaria' then
    insert into public.veterinarias (user_id, nombre, rut, direccion, telefono, comuna, region)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'nombre', ''),
      coalesce(new.raw_user_meta_data ->> 'rut', ''),
      new.raw_user_meta_data ->> 'calle',
      new.raw_user_meta_data ->> 'telefono',
      new.raw_user_meta_data ->> 'comuna',
      new.raw_user_meta_data ->> 'region'
    );
  elsif rol = 'solicitante' then
    -- rsh_tramo / rsh_verificado_at se completan al validar la Cartola RSH.
    insert into public.solicitantes (user_id, rut_hash, calle, comuna, region)
    values (
      new.id,
      new.raw_user_meta_data ->> 'rut_hash',
      new.raw_user_meta_data ->> 'calle',
      new.raw_user_meta_data ->> 'comuna',
      new.raw_user_meta_data ->> 'region'
    );
  end if;

  return new;
end;
$$;

-- El trigger on_auth_user_created ya existe (migración 002) y apunta a esta
-- misma función, así que CREATE OR REPLACE basta; no hace falta recrearlo.
