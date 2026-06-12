-- =============================================================
-- Milo — Migración inicial 001
-- Esquema completo + Row Level Security (RLS) en TODAS las tablas.
-- =============================================================
-- Notas de seguridad (ver CLAUDE.md):
--  * RUT del solicitante (rut_hash) y tramo RSH NUNCA se exponen a anon.
--  * doc_url / presupuesto_url / certificado_url son rutas de Storage:
--    nunca devolver una URL firmada directa al cliente.
--  * El feed público lee SOLO la vista `campanas_publicas` (columnas seguras).
--  * Operaciones privilegiadas (verificar RSH vía Clave Única, marcar
--    veterinaria.verificada, cerrar campaña / regla 70%, actualizar estado de
--    donación tras Webpay) se hacen con la SERVICE ROLE KEY en el servidor:
--    la service role omite RLS por diseño.
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
  rsh_verificado_at timestamptz,   -- se fija SOLO vía Clave Única (service role)
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
  doc_url    text,                           -- ruta Storage del documento de verificación
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
  credito_milo    boolean not null default false,      -- regla 70%: crédito Milo
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

-- ---------- Índices ----------
create index idx_mascotas_solicitante     on public.mascotas (solicitante_id);
create index idx_campanas_mascota         on public.campanas (mascota_id);
create index idx_campanas_veterinaria     on public.campanas (veterinaria_id);
create index idx_campanas_estado          on public.campanas (estado);
create index idx_donaciones_campana       on public.donaciones (campana_id);
create index idx_donaciones_donante       on public.donaciones (donante_id);
create index idx_actualizaciones_campana  on public.actualizaciones (campana_id);

-- =============================================================
-- Row Level Security — habilitado en TODAS las tablas
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
-- Nota: rsh_tramo / rsh_verificado_at se fijan vía service role (Clave Única).

-- ----- veterinarias -----
create policy "veterinarias: ver propia"
  on public.veterinarias for select using (auth.uid() = user_id);
create policy "veterinarias: crear propia"
  on public.veterinarias for insert with check (auth.uid() = user_id);
create policy "veterinarias: editar propia"
  on public.veterinarias for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Nota: `verificada` solo la cambia el equipo Milo (service role).

-- ----- mascotas (el solicitante dueño gestiona las suyas) -----
create policy "mascotas: ver propias"
  on public.mascotas for select using (auth.uid() = solicitante_id);
create policy "mascotas: crear propias"
  on public.mascotas for insert with check (auth.uid() = solicitante_id);
create policy "mascotas: editar propias"
  on public.mascotas for update using (auth.uid() = solicitante_id) with check (auth.uid() = solicitante_id);
create policy "mascotas: borrar propias"
  on public.mascotas for delete using (auth.uid() = solicitante_id);

-- ----- campanas (dueño vía mascota, o veterinaria vinculada) -----
create policy "campanas: ver dueño o vet vinculada"
  on public.campanas for select using (
    veterinaria_id = auth.uid()
    or exists (
      select 1 from public.mascotas m
      where m.id = campanas.mascota_id and m.solicitante_id = auth.uid()
    )
  );
create policy "campanas: crear (solicitante dueño de la mascota)"
  on public.campanas for insert with check (
    exists (
      select 1 from public.mascotas m
      where m.id = mascota_id and m.solicitante_id = auth.uid()
    )
  );
create policy "campanas: editar dueño o vet vinculada"
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
-- Nota: el feed público NO lee esta tabla directamente (usa campanas_publicas).

-- ----- donaciones (cada donante solo ve/crea las suyas) -----
create policy "donaciones: ver propias"
  on public.donaciones for select using (auth.uid() = donante_id);
create policy "donaciones: crear propias"
  on public.donaciones for insert with check (auth.uid() = donante_id);
-- Nota: el estado de pago (pendiente -> pagada/rechazada/reembolsada) lo
-- actualiza el servidor con service role tras confirmar Webpay.

-- ----- actualizaciones -----
create policy "actualizaciones: lectura pública de campañas visibles"
  on public.actualizaciones for select using (
    exists (
      select 1 from public.campanas c
      where c.id = actualizaciones.campana_id and c.estado in ('activa', 'exitosa')
    )
  );
create policy "actualizaciones: crear (vet vinculada o solicitante dueño)"
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
-- Vista pública del feed — SOLO columnas seguras.
-- Las tablas base no exponen filas a anon (RLS sin policy anon = 0 filas).
-- Esta vista (security definer por defecto) revela únicamente columnas no
-- sensibles de campañas visibles. NUNCA incluir aquí rut, rut_hash,
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
