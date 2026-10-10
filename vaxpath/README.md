# VaxPath

Web app de **flujo de trabajo de vacunación** para consultas de medicina general (GP) en Irlanda. Piloto: Valentia Medical Centre (Co. Kerry). Multi-tenant desde el diseño.

> **Herramienta administrativa, no un producto sanitario.** VaxPath no recomienda vacunas: toda decisión clínica la toma un profesional.
> Entorno de demostración: no envía SMS ni emails reales y Stripe funciona solo en modo TEST.

Las decisiones de diseño están en [DECISIONS.md](./DECISIONS.md).

## Estado por fases

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Fundamentos: multi-tenant, Auth.js + roles, i18n EN/ES, auditoría, cifrado, consentimiento, seed | ✅ |
| 1 | Viajero: cuestionario, reserva y pago (Stripe TEST) | ⏳ |
| 2 | Derivación de especialistas + plantillas NIAC editables | ⏳ |
| 3 | Campañas: CSV, elegibles, SMS simulados, cuadre PCRS | ⏳ |
| 4 | Cadena de frío: registros, alertas +2/+8 °C, stock, lotes, caducidades | ⏳ |
| 5 | Panel de la consulta | ⏳ |

## Arranque local

Requisitos: Node 22 y PostgreSQL 16.

```bash
cd vaxpath
cp .env.example .env
# Genera los secretos:
#   AUTH_SECRET=$(openssl rand -base64 32)
#   FIELD_ENCRYPTION_KEY=$(openssl rand -base64 32)
npm install
npx prisma migrate dev      # crea las tablas
npm run db:seed             # datos de demostración ficticios
npm run dev                 # http://localhost:3000
```

### Cuentas de demostración (todas ficticias)

Contraseña: `VaxPath-demo-2026`

| Email | Rol | Consulta |
|---|---|---|
| admin@valentia-demo.example.com | ADMIN | Valentia Medical Centre (DEMO) |
| clinician@valentia-demo.example.com | CLINICIAN | Valentia Medical Centre (DEMO) |
| reception@valentia-demo.example.com | RECEPTION | Valentia Medical Centre (DEMO) |
| patient@valentia-demo.example.com | PATIENT | Valentia Medical Centre (DEMO) |
| admin@practice-b.example.com | ADMIN | Fictional Practice B (DEMO) |

## Tests

```bash
npm run test:db     # aplica las migraciones a TEST_DATABASE_URL (una vez)
npm test            # unitarios + integración (Vitest)
npm run typecheck
npm run lint
npm run build && npm start &   # luego:
npm run test:e2e    # prueba de humo con Playwright contra http://localhost:3000
```

## Estructura

```
app/                 rutas (App Router): /, /login, /app/* (personal), /portal (paciente)
auth.ts, auth.config.ts   Auth.js (credenciales, JWT, roles)
lib/tenant-db.ts     aislamiento multi-tenant (extensión de Prisma)
lib/rbac.ts          matriz de permisos por rol
lib/crypto.ts        cifrado AES-256-GCM de campos sensibles
lib/audit.ts         registro de auditoría (solo inserción)
lib/consent.ts       consentimientos (historial de solo inserción)
lib/env.ts           validación al arrancar: región UE y Stripe solo TEST
messages/{en,es}.json  traducciones
prisma/              esquema, migraciones y seed ficticio
tests/               Vitest     e2e/  Playwright
```
