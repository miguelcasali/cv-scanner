# DECISIONS.md — VaxPath

Decisiones tomadas ante ambigüedades. Criterio: **la opción más simple y segura**.
Cada entrada: contexto → decisión → motivo.

## Fase 0 — Fundamentos

### D-000 · La especificación detallada no llegó
- **Contexto:** el encargo menciona una "especificación detallada a continuación" que no se adjuntó.
- **Decisión:** la Fase 0 se construye solo con los requisitos del mensaje (pila, módulos y reglas no negociables). Los detalles de los módulos (campos del cuestionario, formato CSV, formato del cuadre PCRS, plantillas NIAC…) quedan **pendientes de la especificación** antes de empezar la Fase 1.
- **Orden de fases asumido:** 0 Fundamentos → 1 Viajero → 2 Derivación → 3 Campañas → 4 Cadena de frío → 5 Panel de la consulta (el orden de la lista de módulos).

### D-001 · Ubicación en el repositorio
- El repositorio `cv-scanner` contiene otra aplicación (TaxHacker / escáner de CV). VaxPath vive en el subdirectorio **`vaxpath/`**, sin tocar la app existente, para no mezclar dependencias ni romper nada. Se puede extraer a su propio repositorio con `git subtree split`.

### D-002 · Versiones
- Next.js 15.5 (App Router), React 19, Prisma 6.19, Auth.js (next-auth) 5 beta, next-intl 4, Tailwind 3.4 y shadcn/ui (estilo "default", componentes copiados en `components/ui`).
- Se eligen las versiones estables más probadas en lugar de las mayores más recientes (Next 16, Prisma 7, Tailwind 4), para reducir el riesgo en un MVP clínico-administrativo.

### D-003 · Modelo multi-tenant
- **Base de datos compartida, esquema compartido, columna `practiceId`** en cada tabla de la consulta (modelo `Practice` = tenant).
- El aislamiento no depende de la disciplina del programador: `tenantDb(practiceId)` (`lib/tenant-db.ts`) es una extensión de Prisma que **inyecta `practiceId`** en todas las lecturas, actualizaciones y borrados, y lo **sobrescribe** en cada creación (aunque quien llama pase otro). Las operaciones no contempladas lanzan error.
- El cliente Prisma "crudo" (`lib/db.ts`) solo se usa en autenticación, auditoría y seed.
- El tenant se deduce **de la sesión del usuario**, nunca de la URL ni de un parámetro: un id de otra consulta devuelve 404.
- Cada usuario pertenece a **una sola consulta** (sin tabla de membresías). Es lo más simple; si un médico trabaja en dos consultas, tendrá dos cuentas. Revisable más adelante.
- Pendiente para producción: *Row-Level Security* de PostgreSQL como segunda barrera.

### D-004 · Autenticación y roles
- Auth.js v5 con **proveedor de credenciales (email + contraseña, bcrypt coste 12)** y sesión JWT de 8 h. Es lo que funciona sin servicios externos (no se envían emails reales, así que no hay *magic links*).
- Roles: `ADMIN`, `CLINICIAN`, `RECEPTION`, `PATIENT`, en un único enum en `User.role`.
- Los permisos están en una única matriz (`lib/rbac.ts`) y se comprueban **en el servidor** en cada página y *server action* mediante `requireUser(permiso)`. El *middleware* solo exige sesión; no decide permisos.
- En cada petición se relee el usuario desde la BD: desactivar una cuenta o cambiarle el rol tiene efecto inmediato, aunque el JWT siga vigente.
- `clinical:decide` es **exclusivo de CLINICIAN** (ni siquiera ADMIN). `templates:edit` → ADMIN y CLINICIAN; el permiso específico de "director clínico" se concretará en la Fase 2.
- Los intentos de login, fallidos o correctos, se auditan. Pendiente para producción: limitación de intentos (*rate limiting*) y 2FA para el personal.

### D-005 · i18n
- `next-intl` **sin prefijo de idioma en la URL**: el idioma se guarda en la cookie `NEXT_LOCALE`. Por defecto, inglés. Evita conflictos entre las rutas de idioma y el *middleware* de autenticación.
- Un test garantiza que `en.json` y `es.json` tienen exactamente las mismas claves.

### D-006 · GDPR
- **Residencia de datos en la UE:** la app **no arranca** si `DATA_REGION` no es una región UE/EEE (`instrumentation.ts` + `lib/env.ts`). Despliegue previsto: PostgreSQL gestionado en `eu-west-1` (Dublín). La declaración no sustituye a la configuración real del proveedor.
- **Cifrado de campos:** AES-256-GCM a nivel de aplicación (`lib/crypto.ts`) para teléfono, email, dirección, número GMS y notas (columnas `*Enc`). **Nombre y fecha de nacimiento van en claro**, porque hacen falta para buscar, verificar la identidad y filtrar por edad (campañas). Es un equilibrio deliberado; el disco de la BD también debe cifrarse en producción.
- **Datos mínimos:** el paciente solo tiene los campos imprescindibles. Los listados no seleccionan columnas cifradas, así que no hay descifrado ni datos sensibles en pantalla.
- **Auditoría:** tabla `audit_logs` con un *trigger* de PostgreSQL que **impide UPDATE y DELETE**. Se registran el login, el login fallido, la lectura de datos sensibles de un paciente, los cambios de consentimiento y la supresión. `audit()` rechaza metadatos con claves que parezcan datos personales (phone, email, dob…).
- **Consentimiento:** tabla `consents` de solo inserción (*trigger* que bloquea UPDATE). Retirar un consentimiento crea una fila nueva. Sin registro, el consentimiento se considera **no otorgado** (*opt-in*). Finalidades: tratamiento de datos, contacto por SMS y contacto por email; cada fila guarda la versión de la política.
- **Derecho de supresión:** `erasePatient()` borra los campos personales y deja una "lápida" (`erasedAt`) para no romper referencias futuras (registros de vacunación, cuadre PCRS). Aún no tiene interfaz: se añadirá con la gestión de pacientes.

### D-007 · Datos de semilla ficticios
- Las personas llevan marcas evidentes en el nombre (Demo, Fictional, Sample, Notreal…). Los emails usan `example.com` (reservado, RFC 2606), los teléfonos el rango `+353 87 000 xxxx` y los números GMS el prefijo `DEMO-`.
- La consulta piloto aparece como **"Valentia Medical Centre (DEMO)"**, sin dirección ni personal reales. Se añade una segunda consulta ficticia para demostrar el aislamiento entre tenants.
- El seed se niega a ejecutarse con `NODE_ENV=production` salvo con `ALLOW_DEMO_SEED=true`.
- Un banner fijo en todas las páginas indica que es un entorno de demostración.

### D-008 · Seguridad de pagos y mensajería (preparado para fases siguientes)
- `lib/env.ts` **rechaza claves de Stripe que no sean `sk_test_`**. La app no arranca con una clave real.
- Todavía no se envía nada. Los SMS y emails serán simulados (se guardan en una "bandeja de salida" en la BD), sin proveedor externo.

### D-009 · No es un producto sanitario (MDR)
- No existe ninguna lógica que proponga vacunas a partir de los datos del paciente. La interfaz lo indica en la portada y en el panel.
- El permiso `clinical:decide` se reserva al rol clínico para que, en las fases siguientes, toda selección o edición de plantillas quede firmada por un profesional y auditada.

### D-010 · Tests
- Unitarios y de integración con **Vitest**, contra una base de datos **separada** (`TEST_DATABASE_URL`), nunca la de desarrollo.
- Prueba de humo E2E con **Playwright** (`e2e/smoke.mjs`) contra el servidor en marcha.
