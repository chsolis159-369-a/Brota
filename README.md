# BROTA

Bitácora de cultivo con aprendizaje, exámenes y suscripción Pro, para iOS y Android.

- Reglas del proyecto: [CLAUDE.md](CLAUDE.md)
- Plan por hitos y estado: [PLAN.md](PLAN.md)
- Decisiones tomadas: [DECISIONS.md](DECISIONS.md)
- Observaciones de contenido: [CONTENIDO_PENDIENTE.md](CONTENIDO_PENDIENTE.md)
- Fuente de verdad del comportamiento y los textos: `reference/brota-v9-prototipo.html`

## Requisitos

- Node.js LTS (probado con 26.13.1) y npm
- Android: Android Studio (su Java, JBR) y el SDK en `%LOCALAPPDATA%\Android\Sdk` con
  `platforms/android-37.0`, `build-tools/37.0.0`, `ndk/27.1.12297006` y un emulador
  (`system-images/android-36/google_apis/x86_64`). Variables `ANDROID_HOME` y `JAVA_HOME`.
- Maestro CLI para los flujos (`.maestro/`)

## Primeros pasos

```bash
npm install
npm run android          # development build en el emulador + Metro
npm run android:release  # build release con el JS incluido (para Maestro)
npm run test:e2e         # flujos de Maestro (con el emulador abierto y la app instalada)
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm test` | Pruebas con Jest (lógica, base de datos con SQLite real, textos, tema) |
| `npm run test:prototipo` | 259 comprobaciones que corren el prototipo v9 real en Node |
| `npm run lint:contenido` | Auditoría de `content/modulos.json` (falla ante preguntas mal formadas) |
| `npm run contenido:check` | Verifica que `content/modulos.json` siga igual al prototipo |
| `npm run contenido:extraer` | Vuelve a extraer el contenido del prototipo |
| `npm run typecheck` | TypeScript estricto |
| `npm run lint` | ESLint |
| `npm run verificar` | Todo lo anterior en orden |
| `npm run test:e2e` | Flujos de Maestro en el emulador |

## Integración continua (GitHub Actions)

`.github/workflows/android.yml` corre en cada push a `main`, en cada pull request y a mano:
1. `npm run verificar` (tipos, lint, contenido y pruebas).
2. Compila el APK release para x86_64 y lo guarda como artefacto `brota-release-x86_64`.
3. Levanta un emulador Android 16 y corre los flujos de Maestro; los resultados quedan en el artefacto `maestro`.

En Windows la compilación local de Android choca con el límite de 260 caracteres de ruta (D-23); por eso se compila en Linux.

## Variables de entorno

Se cargan desde `.env` (ver `.env.example`). Nunca se commitean valores.

En la app (se incluyen en el bundle; no van secretos acá):

| Variable | Para qué |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (anon) de Supabase |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | Clave pública de RevenueCat para iOS |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | Clave pública de RevenueCat para Android |

Solo en el servidor (secretos de las Edge Functions de Supabase, nunca en la app):

| Variable | Para qué |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Acceso de servicio a la base (borrado de cuenta, exámenes) |
| `ANTHROPIC_API_KEY` | API de Claude para el Agente |
| `ANTHROPIC_MODEL` | Modelo del Agente; por defecto `claude-sonnet-5-5` |
| `REVENUECAT_SECRET_KEY` | Validar el entitlement `pro` antes del Examen final y del historial del Agente |

Sin estas variables la app funciona en modo local: exámenes y Agente avisan que requieren conexión y el plan queda en Gratis (D-09).

## Estructura

```
src/app/          pantallas (Expo Router)
src/reglas/       lógica pura de puntos, niveles, tests y exámenes
src/db/           SQLite: migraciones y repositorios
src/contenido/    carga de content/modulos.json
src/componentes/  componentes compartidos
src/tema/         colores y tipografías del prototipo
src/i18n/         textos (es-AR)
__tests__/        pruebas de Jest
reference/        prototipo v9 y sus pruebas
tools/            extracción y auditoría del contenido
```
