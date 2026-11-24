# BROTA

Bitácora de cultivo con aprendizaje, exámenes y suscripción Pro, para iOS y Android.

- Reglas del proyecto: [CLAUDE.md](CLAUDE.md)
- Plan por hitos y estado: [PLAN.md](PLAN.md)
- Decisiones tomadas: [DECISIONS.md](DECISIONS.md)
- Observaciones de contenido: [CONTENIDO_PENDIENTE.md](CONTENIDO_PENDIENTE.md)
- Fuente de verdad del comportamiento y los textos: `reference/brota-v9-prototipo.html`

## Requisitos

- Node.js LTS (probado con 26.13.1), npm, Git y la CLI de GitHub (`gh`)
- No hace falta Android Studio en la PC: el APK y los flujos de Maestro se compilan y corren en
  GitHub Actions (D-21, D-23). Para probar en un teléfono, se descarga el artefacto `brota-apk`.

## Primeros pasos

```bash
npm install
npm run verificar        # tipos, lint, contenido y pruebas, como en GitHub
git push                 # dispara GitHub Actions: APK + Maestro
```

Si alguna vez se instala Android localmente: `npm run android` (development build en el emulador),
`npm run android:release` (build con el JS incluido) y `npm run test:e2e` (Maestro).

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
2. Compila el APK release para arm64-v8a (teléfonos) y x86_64 (emulador) y lo guarda como artefacto `brota-apk`. Está firmado con la clave de depuración: sirve para instalar a mano en un teléfono de prueba, no para la tienda (eso es H6, con EAS).
3. Levanta un emulador Android 16 y corre los flujos de Maestro; los resultados quedan en el artefacto `maestro`.

En Windows la compilación local de Android choca con el límite de 260 caracteres de ruta (D-23); por eso se compila en Linux.

## Activar el Agente con IA (Supabase + Claude)

El Agente responde con IA a través de la Edge Function `agente` (D-27). Para activarlo:

1. **Supabase** (https://supabase.com): crear un proyecto. En *Authentication → Sign In / Providers*, activar **Allow anonymous sign-ins**.
2. **Anthropic** (https://console.anthropic.com): crear una API key y, recomendado, fijar un límite de gasto mensual.
3. **GitHub** → el repositorio → *Settings → Secrets and variables → Actions*:
   - Pestaña **Variables** (públicas):
     - `SUPABASE_PROJECT_REF`: el *Reference ID* del proyecto (está en la URL: `https://<ref>.supabase.co`).
     - `EXPO_PUBLIC_SUPABASE_URL`: `https://<ref>.supabase.co`.
     - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: la clave pública (*publishable* o *anon*) de *Project Settings → API Keys*.
   - Pestaña **Secrets** (privados):
     - `SUPABASE_ACCESS_TOKEN`: de *Account → Access Tokens* en Supabase.
     - `SUPABASE_DB_PASSWORD`: la contraseña de la base que se eligió al crear el proyecto.
     - `ANTHROPIC_API_KEY`: la API key de Anthropic.
4. Correr el workflow **Supabase** (*Actions → Supabase → Run workflow*): aplica la migración, carga los secretos y publica la función.
5. El siguiente APK que compile GitHub ya trae el Agente con IA.

Las claves secretas nunca se pegan en el código ni en el chat: van solo en *Secrets* de GitHub. También se pueden cargar desde la terminal con `gh secret set NOMBRE` (pide el valor sin mostrarlo).

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
