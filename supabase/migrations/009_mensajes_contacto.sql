-- =============================================================
-- Milo — Migración 009: mensajes del formulario de contacto
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

-- Cualquiera puede ENVIAR un mensaje de contacto. Nadie lee vía la API pública:
-- solo el equipo Milo con service role. (No se envía ningún email; solo se guarda.)
create policy "contacto: cualquiera envia"
  on public.mensajes_contacto for insert
  to anon, authenticated
  with check (true);
