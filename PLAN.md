# BROTA — plan por hitos

Cerrado el 2026-11-23 sobre el prototipo v9 (`prueba 0.9`). Reglas en `CLAUDE.md`, decisiones en `DECISIONS.md`.

| Hito | Estado |
|---|---|
| H0 · Referencias, contenido, auditoría y pruebas del prototipo | hecho |
| H1 · Base Expo, tema, navegación y datos locales | hecho |
| H2 · Hoy y Cultivos | hecho (Jest 440, Maestro 4/4 en GitHub Actions) |
| H3 · Reglas y Aprender | pendiente |
| H4 · Exámenes en el servidor y constancia | pendiente |
| H5 · Plan y Agente | pendiente |
| H6 · Sincronización, cuenta, observabilidad y builds | pendiente |

## 0. Prerrequisitos

### Herramientas
| Herramienta | Para qué | Hito | Estado |
|---|---|---|---|
| Node.js LTS (26.13.1) + npm | Expo, Jest, scripts | H1 | instalado |
| Git (2.56.1) | un commit por hito | H1 | instalado |
| Expo Go en tu teléfono | ver la app en H1 (sin compras ni módulos nativos propios) | H1 | opcional |
| Android Studio + SDK + emulador | no se usan en la PC: el APK se compila en GitHub Actions (D-21, D-23) | H2 | desinstalado |
| Maestro CLI | flujos móviles en Android, en GitHub Actions | H2 | en CI |
| GitHub (repositorio privado) + Actions | compilar el APK y correr Maestro en Linux (D-23) | H2 | funcionando |
| Supabase local (Docker) | probar Edge Functions; corre en GitHub Actions, no en la PC (poco disco) | H4 | en CI |

Sin Mac: los builds de iOS se hacen en EAS y los flujos de Maestro en iOS corren en EAS Workflows.

### Cuentas y claves que solo vos podés crear
| Cuenta | Qué necesito | Hito |
|---|---|---|
| Expo | usuario para EAS (development builds) | H2 |
| Supabase | proyecto, URL, anon key, service role key | H4 |
| Apple Developer (US$ 99/año) | App ID, Sign in with Apple, productos de suscripción, TestFlight | H5 |
| Google Play Console (US$ 25) | app, productos de suscripción, prueba interna | H5 |
| RevenueCat | proyecto, claves públicas iOS/Android, clave secreta, entitlement `pro`, offering con `brota_pro_mensual` y `brota_pro_anual` | H5 |
| Anthropic | `ANTHROPIC_API_KEY` | H5 |
| URLs públicas de términos y privacidad | enlaces del paywall y de la pantalla de privacidad | H5 |
| Google Cloud | OAuth client para login con Google | H6 |
| Sentry y PostHog | DSN y API key | H6 |
| Open-Meteo comercial (u otro proveedor) | antes de publicar con suscripciones | lanzamiento |

Hasta que existan las claves, cada servicio externo tiene un modo simulado (D-09).

## 1. Qué hay en el prototipo v9

### Pantallas
- **Onboarding** (4 pasos; el último elige perfil: Huerta, Hidroponía, Interior con LED, Exterior o balcón).
- **Encabezado**: "BROTA" y "Plan gratis · Prueba".
- **Hoy**: anillo "X de N tareas de hoy", recomendación (módulo de tu perfil, otro para sumar puntos, examen disponible), puntos / días seguidos / nivel, tareas con puntos y dificultad, tope diario, tus cultivos, 8 logros, clima y consejo del día.
- **Cultivos**: resumen (cultivos, en cosecha, con alertas), "+ Nuevo cultivo" (nombre, tipo, interior/exterior, etapa, fecha), límite Gratis, filtros, plantillas para empezar, tarjeta con etapa y próximo paso.
- **Detalle de cultivo**: próximo paso y guía de la etapa, registros / riegos / días desde el último, etapas, registro rápido (Riego, Fertilizante, Poda, Plaga, Observación), luz y ambiente (interior: W, cm, horas, PPFD, °C, % HR; evaluación de PPFD y altura, VPD con zona 0,8–1,2 kPa, evolución del PPFD), fotos con comparación primera/última, exportar (Pro), bitácora con filtros, eliminar.
- **Agente**: clima y consejo, 7 preguntas rápidas, chat.
- **Aprender**: nivel con barra y texto, chips de niveles, Módulos / Exámenes, categorías, tarjetas de módulo (estrellas, mejor marca, motivo de bloqueo), glosario; módulo (lecciones), test, resultado; exámenes: lista, ficha, examen (temporizador, "No lo sé", salir), resultado (porcentaje, conteos, repasar, revisión), constancia.
- **Plan**: Gratis y Pro (Business oculto), opinión de la prueba, prueba de 14 días, privacidad, borrar cuenta.

### De dónde vienen los datos (localStorage del prototipo → app)
| Prototipo | App (SQLite) | Servidor (H6) |
|---|---|---|
| `bv_cultivos` (con `bitacora`, `condiciones`, `fotos`) | `cultivos`, `registros`, `mediciones`, `fotos` | `cultivos`, `registros`, `mediciones` (fotos solo locales, D-08) |
| `bv_tareas` | `tareas_hechas (dia, tarea_id)` | `tareas_hechas` |
| `bv_ledger` | `ledger_dias (dia, r, m)` + `creados` en `perfil` | `ledger_dias` |
| `bv_estudio` | `estudio_dias (dia)` | dentro de `ledger_dias` (columna `estudio`) |
| `bv_progreso`, `bv_progresoPts` | `progreso_modulos (modulo_id, mejor_aciertos, mejor_puntos)` | `progreso_modulos` |
| `bv_examenes`, `bv_excurso` | caché de lectura | `examenes_estado`, `examenes_intentos` (fuente de verdad) |
| `bv_perfil`, plan | `perfil` | `profiles` (+ entitlement de RevenueCat) |

## 2. Arquitectura

```
app/                       Expo Router
  _layout.tsx              fuentes, tema, proveedores, bloqueo durante examen
  (tabs)/                  hoy, cultivos, agente, aprender, plan
  cultivo/[id].tsx         detalle y bitácora
  aprender/...             módulo, test, resultado, glosario, exámenes, constancia
src/
  reglas/                  lógica pura (sin React, Expo ni IO): constantes, niveles, ledger y topes,
                           tareas, racha, logros, requisitos de módulos, test de módulo, mezcla de opciones,
                           exámenes (habilitación, sorteo, puntaje), mediciones (VPD, PPFD), migrarLedger
  contenido/               tipos y carga de content/modulos.json (filtra cannabis)
  db/                      expo-sqlite: esquema, migraciones, repositorios
  store/                   Zustand
  tema/                    tokens claro/oscuro, tipografías
  i18n/                    es-AR (textos del prototipo)
  servicios/               clima, supabase, compras, exámenes, agente, analytics, errores
  componentes/
supabase/
  migrations/              tablas + RLS
  functions/               examen-estado, examen-iniciar, examen-responder, examen-finalizar,
                           examen-abandonar, agente, borrar-cuenta, _shared/
content/modulos.json       generado desde el prototipo (no se edita a mano)
reference/                 prototipo v9 y sus pruebas
tools/                     extraer-contenido.js, auditoria-contenido.js
__tests__/                 Jest
.maestro/                  flujos
```

Scripts: `npm test`, `npm run lint:contenido`, `npm run contenido:check` (modulos.json sigue igual al prototipo), `npm run test:prototipo` (259 comprobaciones contra el HTML), `npm run typecheck`, `npm run lint`.

## 3. Hitos

### H1 — Base Expo, tema, navegación y datos locales
- Proyecto Expo (SDK vigente), TypeScript estricto, Expo Router, `expo-dev-client`, ESLint.
- Tokens claro/oscuro del prototipo (`--bg`, `--surface`, `--fg`, `--muted`, `--accent`, `--accent-soft`, `--border`, `--alert`, `--ok`, `--gold`), Fraunces y Nunito Sans.
- i18n con `es-AR` por defecto; los textos visibles salen de ahí.
- Encabezado y cinco pestañas con sus títulos del prototipo (Hoy, Mis cultivos, Agente, Aprender, Planes).
- SQLite: esquema, migraciones y repositorios (cultivos, registros, mediciones, fotos, tareas_hechas, ledger_dias, estudio_dias, progreso_modulos, perfil). Los cultivos de ejemplo del prototipo se siembran en la primera apertura.
- Carga de `content/modulos.json` tipada, con cannabis filtrado por `CANNABIS_HABILITADO`; `FOTO_AGENTE = false`.
- **Pruebas**: Jest para repositorios (contra SQLite real de Node), carga de contenido, auditoría (casos que deben fallar) y tokens.
- **Cierre**: `npm test`, `npm run typecheck`, `npm run lint`, `npm run lint:contenido` y `npx expo export` sin errores.

### H2 — Hoy y Cultivos
- Onboarding (`onboarding_completo`), Hoy y Cultivos completos según la sección 1.
- Fotos con `expo-image-picker`, guardadas en el dispositivo. Clima con `ProveedorClima` (Open-Meteo, con ubicación aproximada y respaldo sin permiso).
- Puntos de tareas, registros y mediciones a través del ledger con topes. Cultivos de ejemplo según D-11.
- Eventos `cultivo_creado` y `registro_creado`.
- **Pruebas**: Jest de tareas, ledger, racha, logros, VPD/PPFD y salud del cultivo (portadas de las secciones 3 a 6 y 18 de las pruebas del prototipo). Maestro: onboarding, crear cultivo, registrar, medir, tope de 2 cultivos.
- **Hecho además**: `src/reglas` ya incluye niveles, desbloqueo de módulos, habilitación de exámenes, logros y recomendación (Hoy los necesita); en H3 se suma el test de módulo y el resto de la aceptación. Compilación y Maestro en GitHub Actions (D-23).

### H3 — Reglas y Aprender
- `src/reglas/` completo. Las comprobaciones de reglas de `reference/pruebas-prototipo-v9.js` se portan a Jest contra `src/reglas` (`__tests__/aceptacion/`, con los mismos nombres), incluidas las 3 de "Discrepancias", que ahí tienen que pasar.
- Aprender: niveles, módulos, lecciones, test, resultado, glosario, aviso de Maestro pendiente, diagnóstico Pro con paywall. Evento `modulo_test_fin`.
- **Pruebas**: aceptación portada; Maestro: test de módulo completo sin conexión.

### H4 — Exámenes en el servidor y constancia
- Migraciones de `examenes_intentos`, `examenes_estado` y `constancias` con RLS.
- Edge Functions (todas validan el usuario; usan `src/reglas` y `modulos.json` copiados a `_shared/`):
  - `examen-estado`: intentos de hoy, intento abierto, mejor marca, aprobado y fecha por examen.
  - `examen-iniciar`: valida requisitos (módulos sincronizados, exámenes previos y, para el final, entitlement `pro` en RevenueCat); cuenta el intento; sortea priorizando preguntas no vistas en el intento anterior; mezcla opciones; guarda todo y devuelve preguntas **sin la correcta**, hora del servidor y vencimiento. Si hay un intento abierto, lo devuelve.
  - `examen-responder`: guarda la respuesta de la pregunta siguiente (sin volver atrás); rechaza lo que llega vencido.
  - `examen-abandonar`: "Salir" del prototipo: el intento cuenta y no se guarda resultado.
  - `examen-finalizar`: corrige, actualiza mejor marca, historial (10) y puntos (+40 la primera aprobación), y devuelve la corrección con explicaciones. Los vencidos se cierran solos con lo respondido.
- App: pantallas de exámenes, temporizador accesible, bloqueo de pestañas, retomar, resultado, constancia. Eventos `examen_inicio` y `examen_fin`.
- **Pruebas**: Jest de sorteo y puntaje; pruebas de las funciones contra Supabase local; Maestro: examen completo, cierre y retoma.

### H5 — Plan y Agente
- RevenueCat: paywall con los textos del prototipo y precios de la tienda, oferta introductoria de 14 días, "Restaurar compras", términos, privacidad y renovación automática. Puntos de paywall: límite de cultivos, diagnóstico, final, Maestro pendiente, exportar, historial del agente. Exportar bitácora (Pro).
- Eventos `paywall_visto`, `trial_iniciado`, `compra_ok`.
- Edge Function `agente`: Claude (modelo por variable, por defecto `claude-sonnet-5-5`) con las reglas del agente; historial solo si el servidor confirma `pro`.
- **Pruebas**: Jest de entitlement y del armado del contexto del agente (incluye las reglas: dosis/consumo/venta, técnico ante problemas graves); Maestro: paywall desde cada punto.

### H6 — Sincronización, cuenta, observabilidad y builds
- Auth (email, Google, Apple); sincronización SQLite ↔ Supabase; migración inicial con `migrarLedger`.
- "Borrar mi cuenta y todos los datos" (`borrar-cuenta` + limpieza local), privacidad real, opinión → `feedback`.
- Sentry y PostHog; `eas.json` (development, preview, production); TestFlight y prueba interna de Play.
- **Cierre**: criterio de terminado de `CLAUDE.md` en ambos builds.

## 4. Riesgos abiertos
- El banco de preguntas viaja en la app (D-05, aprobada con condición de revisión).
- Maestro en iOS depende de EAS Workflows.
- Open-Meteo gratis no permite uso comercial.
- Textos del prototipo que describen limitaciones del prototipo (D-12): se reemplazan con la propuesta salvo que el usuario diga otra cosa.
