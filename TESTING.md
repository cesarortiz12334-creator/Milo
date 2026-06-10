# Guía de Pruebas — Milo

Casos que **deben pasar** antes de salir a producción. Hazlos en un entorno con
Supabase real conectado (no en "modo demo"), salvo el flujo de Transbank que ya
funciona contra el sandbox sin backend.

> Para preparar datos: crea al menos un usuario **veterinaria** y márcalo como
> `verificada = true` (tabla `veterinarias`, vía SQL Editor con service role), y
> un **solicitante** con `rsh_verificado_at` seteado y `rsh_tramo <= 40`.

---

## 1. Donación con Transbank (sandbox)

**Pasos**
1. Abre una campaña `activa` → botón **Donar**.
2. Elige un monto → verifica el **desglose de comisión 5%** antes de confirmar.
3. **Donar con Webpay** → te redirige a Webpay sandbox.
4. Paga con una **tarjeta de prueba**:
   - VISA (aprueba): `4051 8856 0044 6623`, CVV `123`, cualquier fecha futura.
   - En el RUT/clave de prueba usa: RUT `11.111.111-1`, clave `123`.
   - Para simular rechazo: MASTERCARD `5186 0595 5959 0568`.

**Esperado**
- Aprobada → página de resultado "¡Gracias por tu donación!" con el monto.
- Rechazada → "Tu pago fue rechazado".
- Recargar la página de resultado **no** vuelve a cobrar (idempotencia).
- (Con los `TODO(Supabase)` hechos) `donaciones` registra la fila y
  `campanas.monto_recaudado` sube; hay una fila en `auditoria`.

---

## 2. Creación de campaña — RSH válido e inválido

**Caso válido** (solicitante con `rsh_verificado_at` y `rsh_tramo <= 40`)
1. Login como solicitante → **Crear campaña**.
2. Completa mascota + campaña, elige veterinaria, sube foto (JPG/PNG ≤ 5MB).
3. Enviar.

**Esperado:** campaña creada en estado **`pendiente`**; redirige a *Mis campañas*
con el aviso; llega email a la veterinaria (si Resend está configurado).

**Casos inválidos (deben ser RECHAZADOS):**
- Solicitante con `rsh_tramo > 40` → "Tu tramo RSH debe ser 40% o inferior…".
- Solicitante sin `rsh_verificado_at` → "Tu RSH aún no está verificado…".
- Intentar una **segunda** campaña teniendo una `activa`/`pendiente` → "Ya tienes
  una campaña activa o pendiente…".
- Subir un archivo que **no** sea imagen real (ej. un `.exe` renombrado a `.png`)
  → rechazado por verificación de contenido (magic bytes).
- Monto > $50.000.000 → rechazado por validación (Zod).

---

## 3. Confirmación de caso por la veterinaria

**Pasos**
1. Login como veterinaria **verificada** → **Mi panel**.
2. En "Casos pendientes", sube el **presupuesto en PDF** y **Confirmar caso**.

**Esperado:** la campaña pasa a **`activa`**; el caso sale de pendientes; llega
email al solicitante; hay fila `caso_confirmado` en `auditoria`.

**Casos a verificar:**
- Veterinaria **no verificada** → no puede confirmar (mensaje de bloqueo).
- PDF con JavaScript embebido → rechazado.
- Archivo que no es PDF real → rechazado.
- Tras confirmar, intentar cambiar `monto_meta` de esa campaña (vía API/DB) →
  **el trigger lo impide** ("No se puede cambiar el monto de una campaña ya confirmada").

---

## 4. Cierre de campaña — regla del 70%

Para forzar el cierre: pon `fecha_limite` en el pasado (SQL) y llama al cron:
```bash
curl -H "Authorization: Bearer <CRON_SECRET>" https://<dominio>/api/cron/cerrar-campanas
```

**Caso exitoso:** una campaña con `monto_recaudado >= 70%` de la meta.
- **Esperado:** estado → `exitosa`; email al solicitante; aparece en `/exitos`;
  fila `campana_cerrada` en `auditoria`.

**Caso fallido:** una campaña con `monto_recaudado < 70%`.
- **Esperado:** estado → `no_financiada`; las donaciones pagadas quedan con
  `credito_milo = true`; en el detalle aparecen las **opciones de devolución** con
  la ventana de **72h**; email a los donantes.
- Pedir "devolución en efectivo" dentro de 72h → donación `reembolsada`. Fuera de
  72h → rechazado ("El plazo de 72 horas… ya venció").

**Sin autorización:** `GET /api/cron/cerrar-campanas` sin el header → **401**.

---

## 5. Rate limiting

- **Login:** 6 intentos fallidos seguidos desde la misma IP → el 6º responde
  "Demasiados intentos…".
- **Crear campaña:** crear 4 en 24h desde la misma IP → la 4ª es bloqueada.
- **Donar:** 11 inicios de donación en 1h desde la misma IP → el 11º bloqueado.
- **General (prod):** una ráfaga > 100 req/min por IP → `429`.

> Recuerda: en memoria el límite es por-instancia. Para una prueba fiable en
> producción, configura Upstash (ver DEPLOY.md §6).

---

## 6. Control de acceso por rol

Estando logueado, intenta entrar a rutas de otro rol:

| Rol logueado | Ruta | Esperado |
|---|---|---|
| donante / vet | `/campanas/nueva` | bloqueo: "Solo solicitantes…" |
| solicitante / donante | `/veterinaria` | "Esta sección es solo para veterinarias." |
| sin sesión | `/campanas/nueva`, `/mis-campanas`, `/veterinaria` | redirige a `/login` |

También: tras **30 min de inactividad**, la siguiente navegación redirige a
`/login?expirada=1`.

---

## 7. Cabeceras de seguridad (smoke test)

```bash
curl -sI https://<dominio>/ | grep -iE "content-security|x-frame|x-content|referrer|permissions|strict-transport|x-powered"
```
**Esperado:** CSP presente, `X-Frame-Options: DENY`, `X-Content-Type-Options:
nosniff`, HSTS presente, y **sin** `X-Powered-By`.
