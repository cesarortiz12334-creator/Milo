-- =============================================================
-- Milo — Migración 004: permisos para el panel de la veterinaria
-- =============================================================
-- 1) La veterinaria vinculada a una campaña puede LEER la mascota de ese caso
--    (para revisarlo). No expone datos del solicitante (RUT, tramo RSH).
-- 2) Storage 'documentos' (privado): la veterinaria sube/lee SOLO en su carpeta.
--    El presupuesto nunca es público; se accede vía signed URL desde el servidor.
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
