-- =============================================================
-- Milo — Migración 008: reportes de campañas + transparencia pública
-- =============================================================

-- ---------- Reportes de campañas (cualquiera puede reportar) ----------
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

-- Cualquiera (anónimo o autenticado) puede ENVIAR un reporte. Nadie lee los
-- reportes vía la API pública: solo el equipo Milo con service role.
create policy "reportes: cualquiera reporta"
  on public.reportes for insert
  to anon, authenticated
  with check (true);

-- ---------- Historial público de transferencias ----------
-- Muestra solo datos NO sensibles (mascota, veterinaria, monto, fecha); nunca
-- el RUT ni datos personales del solicitante. Se deriva de las campañas
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
