-- =============================================================
-- Milo — Migración 002: creación automática de perfiles al registrarse
-- =============================================================
-- Cuando se crea un usuario en auth.users (signUp / admin), este trigger crea
-- la fila correspondiente en public.users con su rol, y la fila de perfil según
-- el rol (veterinaria / solicitante). El rol y los datos vienen en el metadata
-- del usuario (raw_user_meta_data), que se setea en options.data al registrarse.
--
-- security definer: corre como el dueño de la función (omite RLS) para poder
-- insertar en las tablas de perfil.
-- =============================================================

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
    -- El tramo RSH y rut_hash se completan luego vía Clave Única (service role).
    insert into public.solicitantes (user_id)
    values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
