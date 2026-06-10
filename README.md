# Milo 🐾

Plataforma web chilena de **financiamiento colectivo para atención veterinaria**.
Conecta a personas vulnerables (acreditadas con RSH vía Clave Única) con
veterinarias verificadas y donantes que quieran ayudar.

> **Estado: MVP completo (8/8 módulos)** en "modo demo". Corre y se navega de
> punta a punta sin backend real; al conectar Supabase/Transbank/Resend pasa a
> producción. Ver [Qué falta para producción](#qué-falta-para-producción).

---

## Stack

- **Next.js 15** (App Router, TypeScript, `src/`, alias `@/*`)
- **Tailwind CSS v3** (paleta de marca en `tailwind.config.ts`)
- **Supabase** — Postgres + Auth + Storage (RLS en todas las tablas)
- **Transbank Webpay Plus** — pagos (sandbox funcionando end-to-end)
- **Resend** — emails transaccionales
- **Vercel** — deploy + cron

## Inicio rápido (local)

```bash
cd milo
npm install
cp .env.example .env.local   # completar con valores reales (ver abajo)
npm run dev                  # http://localhost:3000
```

Sin `.env.local` real, la app funciona en **modo demo**: el feed, el detalle, el
flujo de Transbank sandbox y todas las pantallas se ven, pero el registro/login,
la creación de campañas y los emails quedan deshabilitados con un aviso.

### Scripts

| Script | Qué hace |
|--------|----------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build |
| `npm run lint` | ESLint |

## Variables de entorno

Ver `.env.example` para la lista completa. Resumen:

| Variable | Para qué | Obligatoria |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente Supabase | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Cierre de campañas, emails, Clave Única (solo servidor) | Sí |
| `TBK_ENVIRONMENT` / `TBK_COMMERCE_CODE` / `TBK_API_KEY` | Webpay (en `integration` usa las creds oficiales de prueba) | Prod |
| `RESEND_API_KEY` / `MILO_FROM_EMAIL` | Emails (requiere dominio verificado en Resend) | Prod |
| `CLAVE_UNICA_CLIENT_ID` / `CLAVE_UNICA_CLIENT_SECRET` | Login de solicitantes | Prod |
| `CRON_SECRET` | Protege el cron de cierre | Prod |
| `NEXT_PUBLIC_SITE_URL` | URLs absolutas en emails/redirects | Sí |

> **Nunca** commitear `.env.local` ni secrets. La service role key jamás va al cliente.

## Base de datos (Supabase)

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. Aplicar las migraciones de `supabase/migrations/` en orden (`001`→`005`),
   con `npx supabase db push` o pegándolas en el SQL Editor:
   - `001_initial.sql` — tablas + enums + **RLS** + vista pública `campanas_publicas`
   - `002_auth_profiles.sql` — trigger que crea el perfil al registrarse
   - `003_storage.sql` — buckets `mascotas` (público) y `documentos` (privado)
   - `004_panel_veterinaria.sql` — RLS para el panel + storage de presupuestos
   - `005_cierre.sql` — `cerrada_at`, RLS donante, regla del 70%
3. En **Auth → Providers** habilitar Email y Google (para donantes).

## Arquitectura

```
src/
  app/                 # rutas (App Router)
    api/webpay/        # crear / retorno de Transbank
    api/auth/clave-unica/  # OAuth Clave Única
    api/cron/          # cierre diario (regla 70%)
    campana/[id]/      # detalle + donación + devolución
    campanas/nueva/    # crear campaña (solicitante)
    veterinaria/       # panel: confirmar casos
    login, registro/   # auth 3 roles
    exitos/            # feed de éxitos
    dev/emails/        # preview de emails (solo dev)
  components/          # UI (CampanaCard, auth/, veterinaria/, campanas/, ...)
  lib/
    supabase/          # client.ts, server.ts, admin.ts (service role), middleware.ts
    transbank/         # Webpay Plus
    resend/            # client + templates + emails
    cierre.ts          # regla del 70% (lógica pura)
    auth.ts, uploads.ts, donaciones.ts, ...
    mock/              # datos demo
supabase/migrations/   # SQL 001..005
```

Reglas de negocio y de seguridad (RLS, RUT nunca expuesto, comisión 5%, regla
70%, anti-fraude) están documentadas en **`CLAUDE.md`**.

## Qué está hecho (los 8 módulos del MVP)

1. ✅ Feed público de campañas
2. ✅ Detalle + donación con **Transbank sandbox** (funciona end-to-end)
3. ✅ Registro/login 3 roles (donante email/Google, veterinaria con verificación, solicitante Clave Única)
4. ✅ Creación de campaña (solicitante) con anti-fraude (RSH ≤ 40%)
5. ✅ Panel veterinaria (subir presupuesto PDF + confirmar caso → activa)
6. ✅ Cierre + **regla del 70%** + opciones de devolución (72h) + cron
7. ✅ Emails transaccionales (Resend) — preview en `/dev/emails`
8. ✅ Feed de éxitos

## Qué falta para producción

- [ ] Crear proyecto **Supabase** real, aplicar migraciones y crear los buckets.
- [ ] Completar `.env.local` con todas las claves reales.
- [ ] **Conectar el detalle de campaña a datos reales** (hoy usa `lib/mock/`).
- [ ] Implementar los `TODO(Supabase)` marcados en el código:
  - Crear/iniciar la sesión del **solicitante** tras Clave Única (con service role)
    y la **verificación del tramo RSH**.
  - **Transferencia de fondos** a la veterinaria al cerrar una campaña exitosa.
- [ ] Registrar **Clave Única** ante la División de Gobierno Digital.
- [ ] Verificar un dominio en **Resend** para el remitente.
- [ ] Revisar las 2 vulnerabilidades moderadas de `npm audit`.
- [ ] Tests automatizados (no incluidos en el MVP).

## Deploy (Vercel)

1. Subir el repo a GitHub (ver abajo).
2. Importar el repo en [vercel.com](https://vercel.com) → framework Next.js detectado.
3. Cargar las variables de entorno del proyecto.
4. El cron de cierre (`vercel.json`) corre diario a las 03:00; Vercel envía
   `Authorization: Bearer $CRON_SECRET` automáticamente.

## Publicar en GitHub (para compartir con el equipo)

```bash
cd milo
git init && git add -A && git commit -m "Milo MVP"
# Crear un repo vacío en github.com y luego:
git remote add origin https://github.com/<usuario>/milo.git
git branch -M main
git push -u origin main
```

El **link de GitHub** (`https://github.com/<usuario>/milo`) es el que le pasas al
programador. El **link de la app** lo entrega Vercel tras el deploy.
