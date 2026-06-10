# Milo 🐾

Plataforma web chilena de **financiamiento colectivo para atención veterinaria**.
Conecta a personas vulnerables (acreditadas con su Cartola Hogar del RSH) con
veterinarias verificadas y donantes que quieran ayudar.

> **Estado: MVP completo (8/8 módulos) + hardening de seguridad.** Corre y se
> navega de punta a punta en "modo demo" sin backend real; al conectar los
> servicios pasa a producción. El sandbox de Transbank ya funciona de verdad.

---

## 📚 Empieza por aquí (programador)

| Documento | Para qué |
|---|---|
| **[DEPLOY.md](DEPLOY.md)** | Paso a paso para dejarlo en producción (Supabase, Resend, Vercel, Upstash). Sigue esto. |
| **[TESTING.md](TESTING.md)** | Casos que debes probar antes de salir a producción. |
| **[ARQUITECTURA.md](ARQUITECTURA.md)** | Diagramas: sistema, ciclo de campaña, flujo de donación. |
| **[.env.example](.env.example)** | Todas las variables de entorno, documentadas. |
| **[CLAUDE.md](CLAUDE.md)** | Reglas de negocio y de seguridad del proyecto. |

**Objetivo:** abre el repo, lee este README, sigue `DEPLOY.md` y deberías tener
Milo en producción en menos de un día. Sin trámites externos lentos: el RSH del
solicitante se valida con su **Cartola Hogar en PDF** (ver DEPLOY.md §4).

## Inicio rápido (local)

```bash
npm install
cp .env.example .env.local   # completar (ver .env.example)
npm run dev                  # http://localhost:3000
```

Sin `.env.local` real, arranca en **modo demo**: el feed, el detalle, el flujo de
Transbank sandbox y todas las pantallas se ven; el registro/login, la creación de
campañas y los emails quedan deshabilitados con un aviso.

| Script | Qué hace |
|--------|----------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build |
| `npm run lint` | ESLint |

## Stack

- **Next.js 15** (App Router, TypeScript, `src/`, alias `@/*`)
- **Tailwind CSS v3** (paleta de marca en `tailwind.config.ts`)
- **Supabase** — Postgres + Auth + Storage (RLS en todas las tablas)
- **Transbank Webpay Plus** — pagos (sandbox funcionando end-to-end)
- **Resend** — emails transaccionales
- **Zod** — validación server-side
- **Vercel** — deploy + cron

## Qué está hecho

Los 8 módulos del MVP: feed público, detalle + donación (Transbank), auth 3 roles
(donante email/Google · veterinaria con verificación · solicitante con email +
**validación de Cartola RSH en PDF**), creación de campaña con anti-fraude
(RUT coincide · cartola < 90 días · tramo ≤ 40% · revisión manual > $200.000),
panel veterinaria (presupuesto + confirmar), cierre con **regla del 70%** +
opciones de devolución (72h), emails transaccionales y feed de éxitos.

**Hardening de seguridad** (ver `CLAUDE.md` y el historial de commits): cabeceras
+ CSP, validación Zod, rate limiting, verificación real de archivos, log de
auditoría inmutable, anti-CSRF, idempotencia de pagos, expiración por inactividad.

## Qué falta para producción (resumen)

Detalle completo en [DEPLOY.md §8](DEPLOY.md). Lo esencial:
1. Conectar Supabase real + aplicar migraciones **001→007** + crear buckets.
2. Implementar los `TODO(Supabase)` (persistir donaciones, sumar a
   `monto_recaudado`, transferencia a la vet, leer el detalle de campaña desde
   datos reales) y **calibrar `src/lib/cartola.ts` con cartolas RSH reales**.
3. Configurar Resend (dominio), Transbank producción, `CRON_SECRET`, y
   (recomendado) Upstash para el rate limit.

## Estructura

```
src/app/         rutas (App Router) + api/
src/components/  UI
src/lib/         supabase/ transbank/ resend/ + lógica (cierre, validaciones, …)
supabase/migrations/  SQL 001..007 (aplicar en orden)
```

---

## Contacto

Responsable del proyecto: **_[ tu nombre aquí ]_**
Email: **_[ tu email aquí ]_**

Dudas de negocio (reglas de Milo, RSH, comisión, regla 70%): ver `CLAUDE.md`.
