-- =============================================================
-- Milo — Migración 006: hardening de seguridad
-- =============================================================
--  1. Tabla de auditoría INMUTABLE (append-only) para eventos sensibles.
--  2. Trigger que impide cambiar el monto de una campaña ya confirmada.
-- =============================================================

-- ---------- 1. Auditoría inmutable ----------
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
-- Sin políticas para anon/authenticated => sin acceso. Solo service role escribe
-- (la service role omite RLS). Nadie lee estos registros vía la API pública.

-- Inmutabilidad real: ni el dueño de la tabla ni la service role pueden
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

-- ---------- 2. Monto de campaña no editable tras confirmación ----------
-- Una vez que la campaña deja de estar en 'borrador'/'pendiente' (es decir, la
-- veterinaria ya confirmó el caso), el monto_meta queda congelado.
create or replace function public.proteger_monto_meta()
returns trigger language plpgsql as $$
begin
  if old.monto_meta is distinct from new.monto_meta
     and old.estado not in ('borrador', 'pendiente') then
    raise exception 'No se puede cambiar el monto de una campaña ya confirmada';
  end if;
  return new;
end;
$$;

create trigger campanas_proteger_monto
  before update on public.campanas
  for each row execute function public.proteger_monto_meta();
