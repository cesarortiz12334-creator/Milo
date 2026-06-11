# Guía de Deploy — Milo

Paso a paso, **en orden**, para llevar Milo de "modo demo" a producción real. Al
terminar, marca el [checklist final](#9-checklist-final-antes-de-producción).

Tiempo estimado: unas horas. **Ya no hay trámites con el Estado**: el solicitante
valida su RSH subiendo su Cartola Hogar en PDF (ver §4).

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
   007_cartola_rsh.sql      → cartola RSH del solicitante + revisión manual >$200k
   008_reportes_y_transparencia.sql → tabla reportes + vista transferencias_publicas
   ```
   Opción B (CLI): `npx supabase link --project-ref <ref>` y luego
   `npx supabase db push`.
4. **Verifica Storage** (Storage → Buckets): deben existir `mascotas` (público) y
   `documentos` (privado). Los crea la migración 003; si no aparecen, créalos a mano
   con esa visibilidad.
5. **Verifica RLS** (Authentication → Policies): todas las tablas (`users`,
   `solicitantes`, `veterinarias`, `mascotas`, `campanas`, `donaciones`,
   `actualizaciones`, `auditoria`, `reportes`) deben tener "RLS enabled".
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

Emails transaccionales (en `src/lib/resend/templates.ts`), todos automáticos:
nuevo caso pendiente (a la vet), campaña activa y **fondos transferidos** (a los
donantes), campaña no financiada (opciones de devolución), recibo de donación, y
**actualización de recuperación** con foto (a los donantes).

---

## 4. Validación del RSH por Cartola Hogar (PDF) — sin trámite con el Estado

El solicitante se registra con email/contraseña + su RUT. Al crear una campaña
sube su **Cartola Hogar del RSH** en PDF, y el servidor la valida automáticamente
(`src/lib/cartola.ts`):

1. El PDF no debe venir de un editor común (metadatos Producer/Creator).
2. El RUT de la cartola debe coincidir con el del registro.
3. La cartola debe tener **menos de 90 días**.
4. El **tramo debe ser ≤ 40%**.

> El solicitante descarga su cartola **gratis** en **https://ventanillaunicasocial.gob.cl**
> con **su propia** Clave Única (no la de Milo). Milo no integra Clave Única.

> ⚠️ **CALIBRACIÓN OBLIGATORIA:** los patrones de extracción de RUT, fecha y tramo
> en `src/lib/cartola.ts` son SUPUESTOS (no hubo cartola de muestra al construir).
> **Debes verificarlos y ajustarlos con cartolas reales** antes de producción, y
> revisar el `Producer` real del PDF del Estado para pasar a una *allowlist*.
> Recomendado: además, verificar el código/QR de la cartola contra el sistema del
> Estado (la validación más robusta). El control de revisión manual de campañas
> > $200.000 es el segundo filtro mientras calibras.

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
- `src/lib/cartola.ts` → **calibrar los patrones de extracción** (RUT, fecha,
  tramo) y la firma del PDF (Producer) con cartolas RSH reales; idealmente añadir
  verificación del código/QR contra el sistema del Estado.
- Revisión manual de campañas > $200.000: falta la acción de back-office del equipo
  Milo que apruebe (`campanas.revision_manual_aprobada = true`) y active la campaña
  una vez confirmada por la vet.
- `src/app/campana/[id]/page.tsx` → leer la campaña real desde la vista
  `campanas_publicas` (hoy usa datos mock).

---

## 9. Checklist final antes de producción

- [ ] Migraciones **001→008** aplicadas y verificadas en Supabase.
- [ ] Buckets `mascotas` (público) y `documentos` (privado) existen.
- [ ] RLS activo en todas las tablas (incluida `auditoria`).
- [ ] Email + Google habilitados en Supabase Auth; redirect URLs en la allowlist.
- [ ] Dominio verificado en Resend; `RESEND_API_KEY` + `MILO_FROM_EMAIL` cargadas.
- [ ] Patrones de `src/lib/cartola.ts` **calibrados con cartolas RSH reales**.
- [ ] `TBK_ENVIRONMENT=production` con commerce code + api key reales.
- [ ] `CRON_SECRET` cargada; cron visible en Vercel → Settings → Cron Jobs.
- [ ] `NEXT_PUBLIC_SITE_URL` apunta al dominio real.
- [ ] (Recomendado) Upstash configurado y `rate-limit.ts` adaptado.
- [ ] Los `TODO(Supabase)` del §8 implementados.
- [ ] Pruebas de [TESTING.md](TESTING.md) pasando.
- [ ] `npm run build` sin errores en Vercel.
