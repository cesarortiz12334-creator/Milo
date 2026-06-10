-- =============================================================
-- Milo — Migración 003: buckets de Storage y sus políticas
-- =============================================================
--  * mascotas   → PÚBLICO: fotos de mascotas que se muestran en el feed.
--  * documentos → PRIVADO: presupuestos y docs de verificación. Nunca públicos;
--    se acceden con service role / signed URLs generadas en el servidor.
-- =============================================================

insert into storage.buckets (id, name, public)
values ('mascotas', 'mascotas', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

-- ----- Políticas del bucket público 'mascotas' -----
-- Lectura pública (las fotos se ven en el feed).
create policy "mascotas: lectura pública"
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

-- 'documentos' queda sin políticas públicas: privado por defecto. El presupuesto
-- (lo sube la veterinaria) y los docs de verificación se manejan vía service role.
