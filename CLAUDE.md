# MILO — Contexto del Proyecto para Claude Code

## Qué es Milo

Plataforma web chilena de financiamiento colectivo para atención veterinaria.
Conecta solicitantes vulnerables (RSH tramo 40% o inferior, validado con Clave
Única) con veterinarias verificadas y donantes.

## Tres roles de usuario

- **solicitante**: dueño de mascota vulnerable. Se autentica SOLO con Clave Única.
- **veterinaria**: clínica registrada. Requiere verificación manual del equipo Milo.
- **donante**: cualquier persona. Registro simple con email/Google.

## Stack

- Next.js 15 App Router + TypeScript *(la spec original decía 14; se eligió 15 estable)*
- Tailwind CSS v3 (paleta en `tailwind.config.ts` — usar siempre esos tokens)
- Supabase: auth, DB, storage, edge functions
- Transbank Webpay Plus (sandbox primero, NUNCA datos de tarjeta directos)
- Resend para emails
- Vercel para deploy

## Comandos útiles

```bash
npm run dev          # servidor local
npm run build        # build de producción
npm run lint         # linter
npx supabase start   # Supabase local
npx supabase db push # aplicar migraciones
```

## Estructura de carpetas

```
src/
  app/           # rutas Next.js App Router
  components/    # componentes reutilizables
  lib/
    supabase/    # client.ts y server.ts
    transbank/   # helper de Webpay
    resend/      # helper de emails
  types/         # tipos TypeScript globales
supabase/
  migrations/    # SQL ordenado por número
```

## Reglas de código (seguir siempre)

- TypeScript estricto. No usar `any` salvo casos extremos justificados.
- Server Components por defecto. Usar Client Components solo si hay interactividad.
- Nunca poner lógica de negocio en componentes — va en `lib/` o server actions.
- Toda subida de archivos: validar tipo (PDF/JPG/PNG) y tamaño máximo 5MB.
- Nunca exponer el RUT del solicitante en ninguna respuesta de API o UI.
- Nunca exponer la URL firmada de Supabase Storage directamente al cliente.
- Comisión del 5% siempre visible antes de confirmar donación.
- RLS de Supabase activo en TODAS las tablas desde el inicio.
- Variables de entorno: usar `.env.local` para desarrollo, nunca commitear secrets.

## Regla del 70% (lógica de negocio crítica)

Cuando una campaña cierra (fecha_limite alcanzada):

- `monto_recaudado >= 70%` de `monto_meta` → estado = `'exitosa'`, transferir fondos a la vet.
- `monto_recaudado < 70%` de `monto_meta` → estado = `'no_financiada'` → notificar
  donantes con opciones: (A) redirigir a otra campaña, (B) crédito Milo → devolución
  en efectivo disponible solo si se solicita dentro de 72 horas.

## Validaciones anti-fraude (nunca saltarse)

1. RSH obtenido SOLO vía Clave Única OAuth — nunca aceptar PDF subido manualmente
   por el solicitante.
2. Presupuesto PDF debe ser subido por la VETERINARIA vinculada, no por el solicitante.
3. La veterinaria debe confirmar el caso antes de que la campaña se active.
4. El tramo RSH debe ser 40% o inferior — rechazar automáticamente si es mayor.

## MVP — orden de prioridad

1. Feed público de campañas (sin login)
2. Detalle de campaña + flujo de donación con Transbank sandbox
3. Registro y login (los 3 roles)
4. Creación de campaña (solicitante) con Clave Única
5. Panel veterinaria (confirmar casos)
6. Cierre de campaña y regla del 70%
7. Emails transaccionales
8. Feed de éxitos (fotos post-recuperación)

## Identidad visual

- Fuente: Nunito (títulos), Inter (cuerpo)
- Naranja `#F97316` = acción principal
- Verde `#16A34A` = estados exitosos
- Fondo `#FFFBF5` = warm white
- El animal siempre es el protagonista visual. No mostrar pobreza, mostrar esperanza.

## Lo que Claude NO debe hacer

- No avanzar al siguiente módulo sin confirmación del usuario.
- No usar localStorage para datos sensibles (usar Supabase Auth session).
- No manejar datos de tarjetas directamente (delegar 100% a Transbank).
- No exponer RUT, tramo RSH exacto ni documentos en respuestas de API públicas.
- No commitear variables de entorno.
- No crear tablas sin RLS.
