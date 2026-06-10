-- =============================================================
-- Milo — Migración 005: cierre de campañas (regla del 70%)
-- =============================================================
--  * cerrada_at: cuándo se cerró la campaña (referencia para la ventana de 72h).
--  * El donante puede leer las campañas a las que aportó (para ver el resultado
--    y sus opciones si la campaña no se financió).
--  * Se agrega cerrada_at a la vista pública.
-- =============================================================

alter table public.campanas
  add column if not exists cerrada_at timestamptz;

-- El donante puede ver las campañas a las que donó (incluye no_financiada).
create policy "campanas: ver donante que aportó"
  on public.campanas for select
  using (
    exists (
      select 1 from public.donaciones d
      where d.campana_id = campanas.id and d.donante_id = auth.uid()
    )
  );

-- Recreamos la vista pública agregando cerrada_at al final (CREATE OR REPLACE
-- solo permite añadir columnas al final, sin reordenar las existentes).
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
