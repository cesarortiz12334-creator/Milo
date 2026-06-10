# Guía de Deploy — Milo

Paso a paso, **en orden**, para llevar Milo de "modo demo" a producción real. Al
terminar, marca el [checklist final](#9-checklist-final-antes-de-producción).

Tiempo estimado: medio día (la parte lenta es Clave Única, que depende de un
trámite con el Estado — ver §4).

> **Convención:** `<...>` = reemplazar por tu valor. Todas las variables de
> entorno están descritas en [`.env.example`](.env.example).

---

## 1. Supabase (base de datos, auth y storage)

1. Crea una cuenta y un proyecto en **https://app.supabase.com** (región: South
   America / São Paulo recomendado para Chile).
2. Copia las llaves en **Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (¡secreta!)
3. **Aplica las migraciones EN ORDEN.** Opción A (SQL Editor): abre cada archivo
   de `supabase/migrations/` y pégalo/ejecútalo en orden:
   ```
   001_initial.sql          → tablas, enums, RLS, vista campanas_publicas
   002_auth_profiles.sql    → trigger que crea el perfil al registrarse
   003_storage.sql          → buckets 'mascotas' (público) y 'documentos' (privado)
   004_panel_veterinaria.sql→ RLS panel vet + storage de presupuestos
   005_cierre.sql           → cerrada_at, RLS donante, regla 70%
   006_seguridad.sql        → tabla auditoría inmutable + trigger monto inmutable
   ```
   Opción B (CLI): `npx supabase link --project-ref <ref>` y luego
   `npx supabase db push`.
4. **Verifica Storage** (Storage → Buckets): deben existir `mascotas` (público) y
   `documentos` (privado). Los crea la migración 003; si no aparecen, créalos a mano
   con esa visibilidad.
5. **Verifica RLS** (Authentication → Policies): todas las tablas (`users`,
   `solicitantes`, `veterinarias`, `mascotas`, `campanas`, `donaciones`,
   `actualizaciones`, `auditoria`) deben tener "RLS enabled".
6. **Auth → Providers:** habilita **Email**. Para **Google** (donantes), ver §3.
7. **Auth → URL Configuration:**
   - `Site URL` = tu dominio de producción (ej. `https://milo.cl`).
   - `Redirect URLs` (allowlist): agrega `https://<tu-dominio>/auth/callback` y, para
     dev, `http://localhost:3000/auth/callback`.

---

## 2. Google OAuth (login de donantes)

1. En **https://console.cloud.google.com** crea un proyecto → **APIs y servicios →
   Credenciales → Crear credenciales → ID de cliente de OAuth → Aplicación web**.
2. En "URIs de redireccionamiento autorizados" agrega la callback de Supabase:
   `https://<TU-PROYECTO>.supabase.co/auth/v1/callback`.
3. Copia el **Client ID** y **Client Secret**.
4. En Supabase: **Auth → Providers → Google** → pega Client ID/Secret → Enable.

No se necesita ninguna variable de entorno de Google en la app: Supabase maneja el flujo.

---

## 3. Resend (emails transaccionales)

1. Crea cuenta en **https://resend.com**.
2. **Domains → Add Domain**: agrega tu dominio y crea los registros DNS (SPF/DKIM)
   que te indica. Espera a que quede **Verified**.
3. **API Keys → Create API Key** → `RESEND_API_KEY`.
4. Define `MILO_FROM_EMAIL` con una dirección **de ese dominio verificado**
   (ej. `Milo <hola@milo.cl>`).

Sin Resend, la app funciona pero los emails solo se registran en consola.

---

## 4. Clave Única (login de solicitantes) ⚠️ trámite con el Estado

> **Importante / honesto:** Clave Única está pensada para **instituciones del
> Estado**. Una plataforma privada normalmente **no obtiene credenciales
> directas**; suele requerir convenio con una institución pública habilitada o
> integrarse mediante un intermediario autorizado. **Confirma elegibilidad antes
> de prometer este flujo.** Alternativa si no calificas: usar un proveedor de
> verificación de identidad/KYC chileno y validar el RUT/RSH por otra vía.

Si eres elegible:

1. Revisa la documentación oficial: **https://digital.gob.cl** (Clave Única para
   integradores) y el portal de integración de Gobierno Digital.
2. Solicita la integración entregando, entre otros: datos de la institución y la
   **`redirect_uri`** = `https://<tu-dominio>/api/auth/clave-unica/callback`.
3. Te entregan **`client_id`** y **`client_secret`** → `CLAVE_UNICA_CLIENT_ID` /
   `CLAVE_UNICA_CLIENT_SECRET`. Los endpoints ya están configurados por defecto.
4. **Completa el código pendiente** en
   `src/app/api/auth/clave-unica/callback/route.ts` (marcado con `TODO(Supabase)`):
   crear/iniciar la sesión del solicitante con service role, guardar `rut_hash`, y
   gatillar la **verificación del tramo RSH** (debe ser ≤ 40%). Ver [TESTING.md](TESTING.md).

---

## 5. Transbank (pagos)

- **Dev/sandbox:** deja `TBK_ENVIRONMENT=integration`. No necesitas credenciales:
  el SDK usa las oficiales de prueba. Tarjetas de prueba en [TESTING.md](TESTING.md).
- **Producción:** completa el onboarding comercial en
  **https://www.transbankdevelopers.cl/**, obtén tu *commerce code* y *api key*, y
  define `TBK_ENVIRONMENT=production`, `TBK_COMMERCE_CODE=<...>`, `TBK_API_KEY=<...>`.

---

## 6. Upstash Redis (rate limiting distribuido)

En Vercel (serverless) el rate limit en memoria es por-instancia, no global. Para
un límite real:

1. Crea cuenta en **https://upstash.com** → **Redis → Create Database** (región
   cercana). En **REST API** copia `UPSTASH_REDIS_REST_URL` y
   `UPSTASH_REDIS_REST_TOKEN`.
2. `npm i @upstash/ratelimit @upstash/redis`.
3. Adapta `src/lib/rate-limit.ts` para usar Upstash (la **interfaz `rateLimit()`
   no cambia**, solo el almacén interno). Ejemplo:
   ```ts
   import { Ratelimit } from "@upstash/ratelimit";
   import { Redis } from "@upstash/redis";
   const redis = Redis.fromEnv();
   // crea un Ratelimit por ventana y expón una función equivalente a rateLimit()
   ```

Mientras no lo configures, el rate limit sigue funcionando (en memoria) — suficiente
para empezar, no ideal a escala.

---

## 7. Vercel (deploy + cron)

1. En **https://vercel.com** → **Add New → Project** → importa el repo de GitHub.
   Detecta Next.js automáticamente.
2. **Settings → Environment Variables:** carga TODAS las de [`.env.example`](.env.example)
   con sus valores reales (Production y, si quieres, Preview). Recuerda:
   `NEXT_PUBLIC_SITE_URL` = tu dominio final.
3. **Deploy.** El **cron** ya está definido en `vercel.json`
   (`/api/cron/cerrar-campanas`, diario 03:00) — Vercel envía
   `Authorization: Bearer $CRON_SECRET` automáticamente. Solo asegúrate de tener
   `CRON_SECRET` cargada.
4. (Opcional) **Settings → Domains:** conecta tu dominio propio.

---

## 8. Implementar los `TODO(Supabase)` antes de cobrar de verdad

La capa demo funciona, pero estos puntos deben completarse para producción real
(busca `TODO` en el código):

- `src/app/api/webpay/crear/route.ts` → insertar la donación en `donaciones`
  (estado `pendiente`, `tbk_token`) en vez del store en memoria.
- `src/app/api/webpay/retorno/route.ts` → al aprobar, marcar la donación `pagada`
  y sumar al `monto_recaudado` de la campaña (service role).
- `src/lib/cerrar-campanas.ts` → transferir los fondos a la veterinaria al cerrar
  una campaña exitosa (back-office / integración bancaria).
- `src/app/api/auth/clave-unica/callback/route.ts` → crear sesión del solicitante
  + verificación del tramo RSH.
- `src/app/campana/[id]/page.tsx` → leer la campaña real desde la vista
  `campanas_publicas` (hoy usa datos mock).

---

## 9. Checklist final antes de producción

- [ ] Migraciones **001→006** aplicadas y verificadas en Supabase.
- [ ] Buckets `mascotas` (público) y `documentos` (privado) existen.
- [ ] RLS activo en todas las tablas (incluida `auditoria`).
- [ ] Email + Google habilitados en Supabase Auth; redirect URLs en la allowlist.
- [ ] Dominio verificado en Resend; `RESEND_API_KEY` + `MILO_FROM_EMAIL` cargadas.
- [ ] Clave Única configurada (o definida la alternativa de verificación).
- [ ] `TBK_ENVIRONMENT=production` con commerce code + api key reales.
- [ ] `CRON_SECRET` cargada; cron visible en Vercel → Settings → Cron Jobs.
- [ ] `NEXT_PUBLIC_SITE_URL` apunta al dominio real.
- [ ] (Recomendado) Upstash configurado y `rate-limit.ts` adaptado.
- [ ] Los `TODO(Supabase)` del §8 implementados.
- [ ] Pruebas de [TESTING.md](TESTING.md) pasando.
- [ ] `npm run build` sin errores en Vercel.
