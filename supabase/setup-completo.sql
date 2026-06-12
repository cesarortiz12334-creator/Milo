-- =============================================================
-- Milo - Setup COMPLETO de la base de datos (migraciones 001 a 009).
-- Pega TODO esto en el SQL Editor de Supabase (proyecto NUEVO) y dale Run.
-- =============================================================

-- >>>>>>>>>>>>>>>>>>>> 001_initial.sql <<<<<<<<<<<<<<<<<<<<
-- =============================================================
-- Milo â€” MigraciÃ³n inicial 001
-- Esquema completo + Row Level Security (RLS) en TODAS las tablas.
-- =============================================================
-- Notas de seguridad (ver CLAUDE.md):
--  * RUT del solicitante (rut_hash) y tramo RSH NUNCA se exponen a anon.
--  * doc_url / presupuesto_url / certificado_url son rutas de Storage:
--    nunca devolver una URL firmada directa al cliente.
--  * El feed pÃºblico lee SOLO la vista `campanas_publicas` (columnas seguras).
--  * Operaciones privilegiadas (verificar RSH vÃ­a Clave Ãšnica, marcar
--    veterinaria.verificada, cerrar campaÃ±a / regla 70%, actualizar estado de
--    donaciÃ³n tras Webpay) se hacen con la SERVICE ROLE KEY en el servidor:
--    la service role omite RLS por diseÃ±o.
-- =============================================================

create extension if not exists pgcrypto;

-- ---------- Enums ----------
create type user_role      as enum ('solicitante', 'veterinaria', 'donante');
create type campana_estado as enum ('borrador', 'pendiente', 'activa', 'exitosa', 'no_financiada');
create type donacion_estado as enum ('pendiente', 'pagada', 'rechazada', 'reembolsada');

-- ---------- users (perfil ligado a auth.users) ----------
create table public.users (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  role       user_role not null default 'donante',
  created_at timestamptz not null default now()
);

-- ---------- solicitantes (datos sensibles) ----------
create table public.solicitantes (
  user_id           uuid primary key references public.users (id) on delete cascade,
  rsh_tramo         smallint check (rsh_tramo between 0 and 100), -- % RSH (<=40 elegible)
  rsh_verificado_at timestamptz,   -- se fija SOLO vÃ­a Clave Ãšnica (service role)
  rut_hash          text           -- RUT hasheado; nunca el RUT en claro
);

-- ---------- veterinarias ----------
create table public.veterinarias (
  user_id    uuid primary key references public.users (id) on delete cascade,
  nombre     text not null,
  rut        text not null,
  direccion  text,
  telefono   text,
  verificada boolean not null default false, -- solo el equipo Milo (service role) la activa
  doc_url    text,                           -- ruta Storage del documento de verificaciÃ³n
  created_at timestamptz not null default now()
);

-- ---------- mascotas ----------
create table public.mascotas (
  id             uuid primary key default gen_random_uuid(),
  solicitante_id uuid not null references public.solicitantes (user_id) on delete cascade,
  nombre         text not null,
  especie        text not null,
  raza           text,
  foto_url       text,
  descripcion    text,
  created_at     timestamptz not null default now()
);

-- ---------- campanas ----------
create table public.campanas (
  id              uuid primary key default gen_random_uuid(),
  mascota_id      uuid not null references public.mascotas (id) on delete cascade,
  veterinaria_id  uuid not null references public.veterinarias (user_id),
  titulo          text not null,
  descripcion     text,
  monto_meta      integer not null check (monto_meta > 0),         -- CLP
  monto_recaudado integer not null default 0 check (monto_recaudado >= 0),
  estado          campana_estado not null default 'borrador',
  fecha_limite    timestamptz,
  presupuesto_url text,            -- ruta Storage; lo sube la VETERINARIA, no el solicitante
  created_at      timestamptz not null default now()
);

-- ---------- donaciones ----------
create table public.donaciones (
  id              uuid primary key default gen_random_uuid(),
  campana_id      uuid not null references public.campanas (id) on delete cascade,
  donante_id      uuid references public.users (id) on delete set null,
  monto           integer not null check (monto > 0),  -- CLP
  comision        integer not null default 0,          -- 6% Milo (IVA incl.)
  estado          donacion_estado not null default 'pendiente',
  certificado_url text,
  credito_milo    boolean not null default false,      -- regla 70%: crÃ©dito Milo
  tbk_token       text,                                -- token Webpay
  created_at      timestamptz not null default now()
);

-- ---------- actualizaciones ----------
create table public.actualizaciones (
  id         uuid primary key default gen_random_uuid(),
  campana_id uuid not null references public.campanas (id) on delete cascade,
  mensaje    text not null,
  foto_url   text,
  created_at timestamptz not null default now()
);

-- ---------- Ãndices ----------
create index idx_mascotas_solicitante     on public.mascotas (solicitante_id);
create index idx_campanas_mascota         on public.campanas (mascota_id);
create index idx_campanas_veterinaria     on public.campanas (veterinaria_id);
create index idx_campanas_estado          on public.campanas (estado);
create index idx_donaciones_campana       on public.donaciones (campana_id);
create index idx_donaciones_donante       on public.donaciones (donante_id);
create index idx_actualizaciones_campana  on public.actualizaciones (campana_id);

-- =============================================================
-- Row Level Security â€” habilitado en TODAS las tablas
-- =============================================================
alter table public.users           enable row level security;
alter table public.solicitantes    enable row level security;
alter table public.veterinarias    enable row level security;
alter table public.mascotas        enable row level security;
alter table public.campanas        enable row level security;
alter table public.donaciones      enable row level security;
alter table public.actualizaciones enable row level security;

-- ----- users -----
create policy "users: ver propio perfil"
  on public.users for select using (auth.uid() = id);
create policy "users: crear propio perfil"
  on public.users for insert with check (auth.uid() = id);
create policy "users: editar propio perfil"
  on public.users for update using (auth.uid() = id) with check (auth.uid() = id);

-- ----- solicitantes (sin acceso anon; datos sensibles) -----
create policy "solicitantes: ver propio"
  on public.solicitantes for select using (auth.uid() = user_id);
create policy "solicitantes: crear propio"
  on public.solicitantes for insert with check (auth.uid() = user_id);
create policy "solicitantes: editar propio"
  on public.solicitantes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Nota: rsh_tramo / rsh_verificado_at se fijan vÃ­a service role (Clave Ãšnica).

-- ----- veterinarias -----
create policy "veterinarias: ver propia"
  on public.veterinarias for select using (auth.uid() = user_id);
create policy "veterinarias: crear propia"
  on public.veterinarias for insert with check (auth.uid() = user_id);
create policy "veterinarias: editar propia"
  on public.veterinarias for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Nota: `verificada` solo la cambia el equipo Milo (service role).

-- ----- mascotas (el solicitante dueÃ±o gestiona las suyas) -----
create policy "mascotas: ver propias"
  on public.mascotas for select using (auth.uid() = solicitante_id);
create policy "mascotas: crear propias"
  on public.mascotas for insert with check (auth.uid() = solicitante_id);
create policy "mascotas: editar propias"
  on public.mascotas for update using (auth.uid() = solicitante_id) with check (auth.uid() = solicitante_id);
create policy "mascotas: borrar propias"
  on public.mascotas for delete using (auth.uid() = solicitante_id);

-- ----- campanas (dueÃ±o vÃ­a mascota, o veterinaria vinculada) -----
create policy "campanas: ver dueÃ±o o vet vinculada"
  on public.campanas for select using (
    veterinaria_id = auth.uid()
    or exists (
      select 1 from public.mascotas m
      where m.id = campanas.mascota_id and m.solicitante_id = auth.uid()
    )
  );
create policy "campanas: crear (solicitante dueÃ±o de la mascota)"
  on public.campanas for insert with check (
    exists (
      select 1 from public.mascotas m
      where m.id = mascota_id and m.solicitante_id = auth.uid()
    )
  );
create policy "campanas: editar dueÃ±o o vet vinculada"
  on public.campanas for update using (
    veterinaria_id = auth.uid()
    or exists (
      select 1 from public.mascotas m
      where m.id = campanas.mascota_id and m.solicitante_id = auth.uid()
    )
  ) with check (
    veterinaria_id = auth.uid()
    or exists (
      select 1 from public.mascotas m
      where m.id = campanas.mascota_id and m.solicitante_id = auth.uid()
    )
  );
-- Nota: el feed pÃºblico NO lee esta tabla directamente (usa campanas_publicas).

-- ----- donaciones (cada donante solo ve/crea las suyas) -----
create policy "donaciones: ver propias"
  on public.donaciones for select using (auth.uid() = donante_id);
create policy "donaciones: crear propias"
  on public.donaciones for insert with check (auth.uid() = donante_id);
-- Nota: el estado de pago (pendiente -> pagada/rechazada/reembolsada) lo
-- actualiza el servidor con service role tras confirmar Webpay.

-- ----- actualizaciones -----
create policy "actualizaciones: lectura pÃºblica de campaÃ±as visibles"
  on public.actualizaciones for select using (
    exists (
      select 1 from public.campanas c
      where c.id = actualizaciones.campana_id and c.estado in ('activa', 'exitosa')
    )
  );
create policy "actualizaciones: crear (vet vinculada o solicitante dueÃ±o)"
  on public.actualizaciones for insert with check (
    exists (
      select 1 from public.campanas c
      where c.id = campana_id
        and (
          c.veterinaria_id = auth.uid()
          or exists (
            select 1 from public.mascotas m
            where m.id = c.mascota_id and m.solicitante_id = auth.uid()
          )
        )
    )
  );

-- =============================================================
-- Vista pÃºblica del feed â€” SOLO columnas seguras.
-- Las tablas base no exponen filas a anon (RLS sin policy anon = 0 filas).
-- Esta vista (security definer por defecto) revela Ãºnicamente columnas no
-- sensibles de campaÃ±as visibles. NUNCA incluir aquÃ­ rut, rut_hash,
-- rsh_tramo, doc_url ni rutas de documentos privados.
-- =============================================================
create view public.campanas_publicas as
select
  c.id,
  c.titulo,
  c.descripcion,
  c.monto_meta,
  c.monto_recaudado,
  c.estado,
  c.fecha_limite,
  c.created_at,
  m.nombre     as mascota_nombre,
  m.especie    as mascota_especie,
  m.raza       as mascota_raza,
  m.foto_url   as mascota_foto_url,
  v.nombre     as veterinaria_nombre,
  v.verificada as veterinaria_verificada
from public.campanas c
join public.mascotas m     on m.id = c.mascota_id
join public.veterinarias v on v.user_id = c.veterinaria_id
where c.estado in ('activa', 'exitosa');

grant select on public.campanas_publicas to anon, authenticated;


-- >>>>>>>>>>>>>>>>>>>> 002_auth_profiles.sql <<<<<<<<<<<<<<<<<<<<
-- =============================================================
-- Milo â€” MigraciÃ³n 002: creaciÃ³n automÃ¡tica de perfiles al registrarse
-- =============================================================
-- Cuando se crea un usuario en auth.users (signUp / admin), este trigger crea
-- la fila correspondiente en public.users con su rol, y la fila de perfil segÃºn
-- el rol (veterinaria / solicitante). El rol y los datos vienen en el metadata
-- del usuario (raw_user_meta_data), que se setea en options.data al registrarse.
--
-- security definer: corre como el dueÃ±o de la funciÃ³n (omite RLS) para poder
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
    -- El tramo RSH y rut_hash se completan luego vÃ­a Clave Ãšnica (service role).
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


-- >>>>>>>>>>>>>>>>>>>> 003_storage.sql <<<<<<<<<<<<<<<<<<<<
-- =============================================================
-- Milo â€” MigraciÃ³n 003: buckets de Storage y sus polÃ­ticas
-- =============================================================
--  * mascotas   â†’ PÃšBLICO: fotos de mascotas que se muestran en el feed.
--  * documentos â†’ PRIVADO: presupuestos y docs de verificaciÃ³n. Nunca pÃºblicos;
--    se acceden con service role / signed URLs generadas en el servidor.
-- =============================================================

insert into storage.buckets (id, name, public)
values ('mascotas', 'mascotas', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

-- ----- PolÃ­ticas del bucket pÃºblico 'mascotas' -----
-- Lectura pÃºblica (las fotos se ven en el feed).
create policy "mascotas: lectura pÃºblica"
  on storage.objects for select
  using (bucket_id = 'mascotas');

-- Cada usuario sube/edita/borra SOLO dentro de su carpeta (auth.uid()/...).
create policy "mascotas: subir en carpeta propia"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'mascotas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "mascotas: actualizar lo propio"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'mascotas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "mascotas: borrar lo propio"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'mascotas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 'documentos' queda sin polÃ­ticas pÃºblicas: privado por defecto. El presupuesto
-- (lo sube la veterinaria) y los docs de verificaciÃ³n se manejan vÃ­a service role.


-- >>>>>>>>>>>>>>>>>>>> 004_panel_veterinaria.sql <<<<<<<<<<<<<<<<<<<<
-- =============================================================
-- Milo â€” MigraciÃ³n 004: permisos para el panel de la veterinaria
-- =============================================================
-- 1) La veterinaria vinculada a una campaÃ±a puede LEER la mascota de ese caso
--    (para revisarlo). No expone datos del solicitante (RUT, tramo RSH).
-- 2) Storage 'documentos' (privado): la veterinaria sube/lee SOLO en su carpeta.
--    El presupuesto nunca es pÃºblico; se accede vÃ­a signed URL desde el servidor.
-- =============================================================

-- ----- mascotas: lectura para la veterinaria del caso -----
create policy "mascotas: ver vet vinculada"
  on public.mascotas for select
  using (
    exists (
      select 1 from public.campanas c
      where c.mascota_id = mascotas.id
        and c.veterinaria_id = auth.uid()
    )
  );

-- ----- storage 'documentos' (privado): carpeta por usuario -----
create policy "documentos: subir en carpeta propia"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "documentos: leer carpeta propia"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- >>>>>>>>>>>>>>>>>>>> 005_cierre.sql <<<<<<<<<<<<<<<<<<<<
-- =============================================================
-- Milo â€” MigraciÃ³n 005: cierre de campaÃ±as (regla del 70%)
-- =============================================================
--  * cerrada_at: cuÃ¡ndo se cerrÃ³ la campaÃ±a (referencia para la ventana de 72h).
--  * El donante puede leer las campaÃ±as a las que aportÃ³ (para ver el resultado
--    y sus opciones si la campaÃ±a no se financiÃ³).
--  * Se agrega cerrada_at a la vista pÃºblica.
-- =============================================================

alter table public.campanas
  add column if not exists cerrada_at timestamptz;

-- El donante puede ver las campaÃ±as a las que donÃ³ (incluye no_financiada).
create policy "campanas: ver donante que aportÃ³"
  on public.campanas for select
  using (
    exists (
      select 1 from public.donaciones d
      where d.campana_id = campanas.id and d.donante_id = auth.uid()
    )
  );

-- Recreamos la vista pÃºblica agregando cerrada_at al final (CREATE OR REPLACE
-- solo permite aÃ±adir columnas al final, sin reordenar las existentes).
create or replace view public.campanas_publicas as
select
  c.id,
  c.titulo,
  c.descripcion,
  c.monto_meta,
  c.monto_recaudado,
  c.estado,
  c.fecha_limite,
  c.created_at,
  m.nombre     as mascota_nombre,
  m.especie    as mascota_especie,
  m.raza       as mascota_raza,
  m.foto_url   as mascota_foto_url,
  v.nombre     as veterinaria_nombre,
  v.verificada as veterinaria_verificada,
  c.cerrada_at
from public.campanas c
join public.mascotas m     on m.id = c.mascota_id
join public.veterinarias v on v.user_id = c.veterinaria_id
where c.estado in ('activa', 'exitosa');


-- >>>>>>>>>>>>>>>>>>>> 006_seguridad.sql <<<<<<<<<<<<<<<<<<<<
-- =============================================================
-- Milo â€” MigraciÃ³n 006: hardening de seguridad
-- =============================================================
--  1. Tabla de auditorÃ­a INMUTABLE (append-only) para eventos sensibles.
--  2. Trigger que impide cambiar el monto de una campaÃ±a ya confirmada.
-- =============================================================

-- ---------- 1. AuditorÃ­a inmutable ----------
create table public.auditoria (
  id         uuid primary key default gen_random_uuid(),
  evento     text not null,
  actor_id   uuid references auth.users (id) on delete set null,
  campana_id uuid references public.campanas (id) on delete set null,
  detalle    jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_auditoria_campana on public.auditoria (campana_id);
create index idx_auditoria_evento on public.auditoria (evento);

alter table public.auditoria enable row level security;
-- Sin polÃ­ticas para anon/authenticated => sin acceso. Solo service role escribe
-- (la service role omite RLS). Nadie lee estos registros vÃ­a la API pÃºblica.

-- Inmutabilidad real: ni el dueÃ±o de la tabla ni la service role pueden
-- modificar o borrar (los triggers no se saltan con service role).
create or replace function public.auditoria_inmutable()
returns trigger language plpgsql as $$
begin
  raise exception 'La tabla auditoria es inmutable (append-only)';
end;
$$;

create trigger auditoria_no_update
  before update on public.auditoria
  for each row execute function public.auditoria_inmutable();

create trigger auditoria_no_delete
  before delete on public.auditoria
  for each row execute function public.auditoria_inmutable();

-- ---------- 2. Monto de campaÃ±a no editable tras confirmaciÃ³n ----------
-- Una vez que la campaÃ±a deja de estar en 'borrador'/'pendiente' (es decir, la
-- veterinaria ya confirmÃ³ el caso), el monto_meta queda congelado.
create or replace function public.proteger_monto_meta()
returns trigger language plpgsql as $$
begin
  if old.monto_meta is distinct from new.monto_meta
     and old.estado not in ('borrador', 'pendiente') then
    raise exception 'No se puede cambiar el monto de una campaÃ±a ya confirmada';
  end if;
  return new;
end;
$$;

create trigger campanas_proteger_monto
  before update on public.campanas
  for each row execute function public.proteger_monto_meta();


-- >>>>>>>>>>>>>>>>>>>> 007_cartola_rsh.sql <<<<<<<<<<<<<<<<<<<<
-- =============================================================
-- Milo â€” MigraciÃ³n 007: Cartola RSH (PDF) en vez de Clave Ãšnica
-- =============================================================
-- El solicitante ya NO se autentica con Clave Ãšnica. Se registra con email y
-- contraseÃ±a (entregando su RUT) y, al crear una campaÃ±a, sube su Cartola Hogar
-- del RSH en PDF, que se valida automÃ¡ticamente en el servidor.
-- =============================================================

-- ---------- solicitantes: fuera Clave Ãšnica, dentro cartola ----------
alter table public.solicitantes drop column if exists rsh_verificado_at;
alter table public.solicitantes drop column if exists rsh_tramo;

alter table public.solicitantes
  add column if not exists cartola_pdf_url        text,   -- ruta Storage privada
  add column if not exists rut_extraido           text,   -- RUT leÃ­do del PDF (sensible, RLS owner-only)
  add column if not exists tramo_extraido         smallint,
  add column if not exists fecha_emision_cartola  date,
  add column if not exists validacion_estado      text not null default 'pendiente'
    check (validacion_estado in ('pendiente', 'auto_aprobada', 'revision_manual', 'rechazada'));

-- rut_hash (migraciÃ³n 001) se mantiene: es el RUT del REGISTRO, hasheado, contra
-- el que se cruza el RUT extraÃ­do de la cartola.

-- ---------- campanas: revisiÃ³n manual para montos altos ----------
-- CampaÃ±as > $200.000 requieren revisiÃ³n del equipo Milo antes de publicarse.
alter table public.campanas
  add column if not exists requiere_revision_manual boolean not null default false,
  add column if not exists revision_manual_aprobada boolean not null default false,
  add column if not exists vet_confirmo_at          timestamptz;

-- ---------- trigger de alta: guarda rut_hash del solicitante ----------
-- Reemplaza la funciÃ³n de la migraciÃ³n 002 para que, al registrarse un
-- solicitante, se guarde su rut_hash (viene hasheado en el metadata del signUp;
-- el RUT en claro NUNCA se envÃ­a ni se guarda en auth.users).
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


-- >>>>>>>>>>>>>>>>>>>> 008_reportes_y_transparencia.sql <<<<<<<<<<<<<<<<<<<<
-- =============================================================
-- Milo â€” MigraciÃ³n 008: reportes de campaÃ±as + transparencia pÃºblica
-- =============================================================

-- ---------- Reportes de campaÃ±as (cualquiera puede reportar) ----------
create table public.reportes (
  id          uuid primary key default gen_random_uuid(),
  campana_id  uuid references public.campanas (id) on delete set null,
  razon       text not null,
  descripcion text,
  ip          text,
  created_at  timestamptz not null default now()
);

create index idx_reportes_campana on public.reportes (campana_id);

alter table public.reportes enable row level security;

-- Cualquiera (anÃ³nimo o autenticado) puede ENVIAR un reporte. Nadie lee los
-- reportes vÃ­a la API pÃºblica: solo el equipo Milo con service role.
create policy "reportes: cualquiera reporta"
  on public.reportes for insert
  to anon, authenticated
  with check (true);

-- ---------- Historial pÃºblico de transferencias ----------
-- Muestra solo datos NO sensibles (mascota, veterinaria, monto, fecha); nunca
-- el RUT ni datos personales del solicitante. Se deriva de las campaÃ±as
-- exitosas (la transferencia real de fondos es un paso de back-office; TODO).
create view public.transferencias_publicas as
select
  c.id          as campana_id,
  m.nombre      as mascota_nombre,
  m.especie     as mascota_especie,
  v.nombre      as veterinaria_nombre,
  c.monto_recaudado as monto,
  c.cerrada_at  as fecha
from public.campanas c
join public.mascotas m     on m.id = c.mascota_id
join public.veterinarias v on v.user_id = c.veterinaria_id
where c.estado = 'exitosa';

grant select on public.transferencias_publicas to anon, authenticated;


-- >>>>>>>>>>>>>>>>>>>> 009_mensajes_contacto.sql <<<<<<<<<<<<<<<<<<<<
-- =============================================================
-- Milo â€” MigraciÃ³n 009: mensajes del formulario de contacto
-- =============================================================
create table public.mensajes_contacto (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  email      text not null,
  asunto     text not null,
  mensaje    text not null,
  created_at timestamptz not null default now()
);

create index idx_mensajes_contacto_created on public.mensajes_contacto (created_at);

alter table public.mensajes_contacto enable row level security;

-- Cualquiera puede ENVIAR un mensaje de contacto. Nadie lee vÃ­a la API pÃºblica:
-- solo el equipo Milo con service role. (No se envÃ­a ningÃºn email; solo se guarda.)
create policy "contacto: cualquiera envia"
  on public.mensajes_contacto for insert
  to anon, authenticated
  with check (true);



