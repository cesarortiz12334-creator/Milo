# Arquitectura — Milo

Visión general de cómo se conectan las piezas y los dos flujos críticos
(campaña y donación). Los diagramas son Mermaid (GitHub los renderiza solo).

---

## Sistema y servicios

```mermaid
flowchart LR
  subgraph Browser["Navegador"]
    UI["Next.js App Router<br/>React 19 + Tailwind"]
  end

  subgraph VercelBox["Vercel"]
    MW["Middleware<br/>CSP · sesión · rate limit"]
    SSR["Server Components<br/>Server Actions<br/>Route Handlers"]
    CRON["Cron diario<br/>cierre regla 70%"]
  end

  SB[("Supabase<br/>Postgres + Auth + Storage")]
  TBK["Transbank<br/>Webpay Plus"]
  RS["Resend<br/>emails"]

  UI -->|requests| MW --> SSR
  SSR <-->|RLS / service role| SB
  SSR -->|crear / commit| TBK
  SSR -->|notificar| RS
  CRON -->|cierra campañas| SB
  CRON -->|avisa| RS
```

> El solicitante valida su RSH subiendo la **Cartola Hogar (PDF)**, que se procesa
> server-side (`lib/cartola.ts`). Milo no integra Clave Única.

**Claves de seguridad:** el navegador nunca habla directo con Supabase para datos
sensibles (todo pasa por RLS o por el servidor con *service role*); las tarjetas
nunca tocan el servidor de Milo (100% en Webpay); los documentos privados viven
en el bucket `documentos` con URLs firmadas.

---

## Ciclo de vida de una campaña

```mermaid
stateDiagram-v2
  [*] --> borrador
  borrador --> pendiente: solicitante la crea (RSH <= 40%)
  pendiente --> activa: la vet confirma + sube presupuesto
  activa --> exitosa: cierre con recaudado >= 70%
  activa --> no_financiada: cierre con recaudado < 70%
  exitosa --> [*]: se transfieren fondos a la vet
  no_financiada --> [*]: credito Milo o devolucion (72h)
```

- **borrador → pendiente:** la crea el solicitante, validando su **Cartola RSH
  (PDF)**: RUT coincide, < 90 días, tramo ≤ 40%. No se activa sola.
- **pendiente → activa:** la veterinaria **verificada** confirma el caso y sube el
  presupuesto PDF. Recién ahí es pública y recibe donaciones. *(Las campañas
  > $200.000 requieren además revisión manual del equipo Milo.)*
- **activa → exitosa / no_financiada:** el cron diario aplica la **regla del 70%**
  al llegar la `fecha_limite`.
- El `monto_meta` queda **congelado** una vez confirmada (trigger en BD).

---

## Flujo de una donación

```mermaid
sequenceDiagram
  participant D as Donante
  participant A as Milo (Next.js)
  participant T as Transbank
  participant DB as Supabase

  D->>A: POST /api/webpay/crear (monto)
  A->>A: valida (Zod) + rate limit + same-origin
  A->>T: create(buyOrder, monto, returnUrl)
  T-->>A: token + url
  A-->>D: form que se auto-envía a Webpay
  D->>T: paga con tarjeta (en Webpay)
  T-->>D: redirige a /api/webpay/retorno (token_ws)
  D->>A: retorno
  A->>T: commit(token_ws)
  T-->>A: AUTHORIZED / rechazada
  A->>DB: donacion 'pagada' + suma a monto_recaudado  %% TODO(Supabase)
  A->>DB: registra auditoria
  A-->>D: /campana/[id]/resultado
```

Al **cierre exitoso** de la campaña, los fondos recaudados se transfieren a la
veterinaria (paso de back-office, marcado como `TODO` en `lib/cerrar-campanas.ts`).
Si la campaña **no se financia**, cada donante elige: redirigir su aporte a otra
campaña, dejarlo como **crédito Milo**, o pedir **devolución en efectivo dentro de
72 horas**.

---

## Mapa de carpetas (resumen)

```
src/
  app/
    page.tsx                  feed público
    campana/[id]/             detalle + donación + devolución
    campanas/nueva/           crear campaña (solicitante)
    veterinaria/              panel: confirmar casos
    mis-campanas/             campañas del solicitante
    login, registro/          auth 3 roles (+ registro/solicitante)
    exitos/                   feed de éxitos
    api/webpay/               crear + retorno (Transbank)
    api/cron/cerrar-campanas/ cierre regla 70% (protegido)
    auth/{callback,signout}/  OAuth Google + logout
  components/                 UI (CampanaCard, auth/, veterinaria/, campanas/…)
  lib/
    supabase/{client,server,admin,middleware,config}.ts
    transbank/  resend/  validaciones.ts  rate-limit.ts  seguridad.ts
    cartola.ts  rut.ts  auditoria.ts  cierre.ts  uploads.ts  storage.ts
  middleware.ts               CSP + sesión + rate limit
supabase/migrations/          001..007 (aplicar en orden)
```
