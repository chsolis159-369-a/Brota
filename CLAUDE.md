# BROTA — reglas del repo

App móvil (iOS y Android) de bitácora de cultivo con aprendizaje, exámenes y suscripción Pro. Versión actual: prueba pública.

## Fuente de verdad (no negociable)
- `reference/brota-v9-prototipo.html` define comportamiento, reglas y textos (español rioplatense, con voseo). Todo texto visible debe coincidir con el prototipo.
- `content/modulos.json` se carga tal cual: 17 módulos + 3 de cannabis ocultos, 128 preguntas y glosario. **No se edita y no se inventan preguntas.** Si una pregunta tiene un error, anotarlo en `CONTENIDO_PENDIENTE.md`.
- `reference/pruebas-prototipo-v9.js`: 147 comprobaciones, portadas a Jest como pruebas de aceptación.
- `tools/auditoria-contenido.js` corre como `npm run lint:contenido` y falla si una pregunta no tiene 4 opciones distintas, dificultad 1 a 3 y explicación.
- No cambiar `modulos.json` ni los textos del prototipo sin avisar al usuario.
- Lo que no esté definido se decide con el criterio más simple y se anota en `DECISIONS.md`. Solo se le pregunta al usuario por cuentas o claves que solo él puede crear.

## Alcance
- Pestañas: Hoy, Cultivos, Agente, Aprender, Plan. Configuración (D-35) se abre con el engranaje del encabezado: idioma (es-AR, en, it, fr, zh-CN; D-36), tamaño de letra, modo claro u oscuro, perfil con "Borrar mi cuenta y todos los datos", privacidad y términos.
- Fuera de alcance y **sin código accesible**: plan Business y contenido de cannabis (`CANNABIS_HABILITADO = false`). El análisis de fotos por IA en el Agente está prendido (`FOTO_AGENTE = true`, D-30), con reconocimiento por fotos y preguntas (candidatos, certeza y opciones como botones, D-31).
- **Gratis (US$ 0)** (D-34): hasta 3 cultivos propios (los de ejemplo no cuentan), bitácora y registro rápido, tareas diarias, logros y racha, 16 módulos con test, 6 exámenes con nota y repaso de errores con fundamentos, agente con respuestas generales (6 preguntas por día y memoria limitada: últimos 2 mensajes y datos básicos de los cultivos).
- **Pro (US$ 5.99/mes o US$ 49.99/año)**: todo lo de Gratis más cultivos ilimitados, módulo `diagnostico`, Examen final con constancia y nivel Maestro de cultivo, exportar la bitácora como texto, agente que usa el historial del cultivo.
- Puntos de paywall (como en el prototipo): límite de 2 cultivos, módulo Diagnóstico bloqueado, Examen final, aviso de Maestro pendiente, exportar, historial del agente.

## Stack
- Expo (SDK vigente) + TypeScript estricto + Expo Router + Zustand. Modo claro/oscuro; colores y estilo visual del rediseño D-29 (el prototipo manda en textos y comportamiento). Logo: plántula de cannabis generada con `tools/marca/` (D-28). Fraunces (títulos) y Nunito Sans (texto). i18n preparado, `es-AR` por defecto.
- Local primero: `expo-sqlite` para cultivos, registros, mediciones y progreso. Lecciones y tests de módulo funcionan sin conexión.
- Backend: Supabase (Auth con email, Google y Apple; Postgres con RLS; Edge Functions).
- Suscripciones: RevenueCat (`react-native-purchases`, `react-native-purchases-ui`). Requiere development build (`expo-dev-client`); Expo Go no procesa compras. Entitlement `pro`; productos `brota_pro_mensual` y `brota_pro_anual`. La prueba de 14 días es una oferta introductoria de las tiendas, **no** un botón local. Obligatorio: "Restaurar compras", enlaces a términos y privacidad, texto de renovación automática.
- Clima: interfaz `ProveedorClima`; primera implementación Open-Meteo (su plan gratis es no comercial: contratar el comercial o cambiar de proveedor antes de publicar con suscripciones).
- Agente: Edge Function que llama a la API de Claude. Modelo por variable de entorno, por defecto `claude-sonnet-5-5`. La clave nunca va en la app.
- Sentry (errores) y PostHog (métricas).
- Jest (lógica) y Maestro (flujos). Builds con EAS.

## Reglas de puntaje (módulo puro `src/reglas/`, sin React ni IO, con pruebas)
Constantes: `PREGS_TEST=3`, `APROBAR_MODULO=2`, `BONUS_PERFECTO=15`, `TOPE_TAREAS_DIA=40`, `TOPE_REG_DIA=5`, `TOPE_MED_DIA=2`, `INTENTOS_DIA=3`, `APROBAR_EXAMEN=0.8`.

- **Niveles** por puntos totales: Inexperto 0, Aprendiz 60, Aprendiz avanzado 180, Cultivador 350, Cultivador experto 600, Maestro de cultivo 900. Maestro exige además el Examen final aprobado; hasta entonces se muestra Cultivador experto con el texto: "Tenés los puntos para Maestro de cultivo. Para obtenerlo, aprobá el Examen final (Pro)."
- **Actividad**: tarea fácil 5 pts, media 10 (medir luz), difícil 15 (drenaje ante lluvia); tope 40 pts por día. Registro 2 pts (máx. 5 por día). Medición de luz 4 pts (máx. 2 por día; una medición sin ningún valor no se guarda).
- Esos puntos viven en un **ledger por día** (registros y mediciones con puntos, más cultivos creados) y **no se pierden al borrar un cultivo**.
- Los cultivos de ejemplo no dan puntos ni logros.
- **Racha**: cuenta días con tarea, registro, medición, test de módulo o examen.
- **Módulos**: se desbloquean por puntos mínimos (`req`) y por prerrequisitos aprobados (`pre`). `diagnostico` es solo Pro.
- **Test de módulo**: 3 preguntas (una de dificultad 1, una de 2, una de 3) de las 7 del módulo, evitando las del intento anterior. Cada acierto suma 10 × dificultad; perfecto suma +15; solo cuenta la mejor marca por módulo (máx. 75). Aprobado = 2 de 3.
- **Opciones**: las 4 se mezclan en cada aparición; la posición de la correcta no debe poder memorizarse. Nunca "todas/ninguna de las anteriores".

## Exámenes (Aprender > Exámenes)
| Examen | Preguntas | Tiempo | Puntos | Temario |
|---|---|---|---|---|
| Suelo, compost y rotación | 12 | 12 min | +40 la 1.ª vez | módulos `suelo`, `compost`, `rotacion` |
| Siembra y calendario | 10 | 10 min | +40 | módulos `germinacion`, `calendario` |
| Hidroponía y nutrición | 12 | 12 min | +40 | `hidro`, `nutricion` |
| Sustrato inerte | 10 | 10 min | +40 | `inerte` |
| Luz y ambiente | 12 | 12 min | +40 | `luz` |
| Plagas | 10 | 10 min | +40 | `plagas` (en Pro, con `diagnostico`) |
| Examen final BROTA (Pro) | 30 | 30 min | 0 | todo menos cannabis; exige los seis anteriores aprobados |

- Habilitado solo si están aprobados todos los módulos de su bloque a los que el plan da acceso.
- Sorteo estratificado: 20 % básicas, 40 % intermedias, 40 % trampa; parejo entre módulos; prioriza preguntas no vistas.
- Puntaje: acierto +dificultad, error −dificultad/3, "No lo sé" o sin responder 0. Porcentaje = max(0, neto) / suma de dificultades. Aprueba con ≥ 80 %.
- 1 minuto por pregunta. 3 intentos por día por examen (cuenta al empezar). Sin volver atrás. Si se cierra la app, se retoma. Al vencer, se corrige lo respondido. Mientras corre, las otras pestañas quedan bloqueadas.
- Resultado: porcentaje, aciertos, errores, sin responder; módulos flojos (< 70 %) con botón para repasar; revisión de falladas con explicación (opción de ver todas).
- Constancia (solo con el final aprobado): nombre opcional, porcentaje, fecha y "reconocimiento interno de BROTA, sin validez académica ni legal".
- Aprobar el final habilita Maestro y la constancia.

**Anti-trampa**: sorteo, hora de inicio, vencimiento, conteo de intentos, corrección y puntos de examen se resuelven en Edge Functions. El cliente nunca recibe las respuestas correctas antes de enviar las suyas. El servidor valida el entitlement `pro` con RevenueCat antes de iniciar el final y devuelve la corrección con explicaciones. Los exámenes requieren conexión. Los tests de módulo corren en el dispositivo y se sincronizan después.

## Agente (IA)
Conserva las reglas del agente por reglas del prototipo: solo cultivo; nunca dosis, consumo ni venta; ante un problema grave sugerir consultar a un técnico; el historial del cultivo solo en Pro (se valida en el servidor). Límite diario: 6 preguntas en Gratis y 30 en Pro (D-34).

## Datos (Postgres con RLS: cada usuario ve solo lo suyo)
`profiles`, `cultivos`, `registros`, `mediciones`, `tareas_hechas`, `ledger_dias`, `progreso_modulos` (mejor_aciertos, mejor_puntos), `examenes_intentos` (examen_id, inicio, fin, respuestas, porcentaje, aprobado), `examenes_estado` (mejor, aprobado, fecha, puntos), `constancias`, `feedback` (calificación, comentario, versión, errores recientes).
Migración inicial desde datos locales: reconstruir el ledger con los topes diarios, como `migrarLedger` del prototipo.

## Tiendas, privacidad y accesibilidad
- "Borrar mi cuenta y todos los datos" dentro de la app: borra en Supabase y en el dispositivo (incluidos ledger y exámenes). Pantalla de privacidad real y enlaces a términos.
- Sin contenido de cannabis, dosis, consumo ni venta (el logo es una plántula de cannabis por pedido del usuario: declarar referencias a drogas en la clasificación por edad, D-28). Sin pagos fuera de las compras integradas.
- Objetivos táctiles ≥ 44 px, contraste AA, textos escalables, lectores de pantalla en preguntas y temporizador.

## Métricas (PostHog)
`onboarding_completo`, `cultivo_creado`, `registro_creado`, `modulo_test_fin`, `examen_inicio`, `examen_fin`, `paywall_visto`, `trial_iniciado`, `compra_ok`.

## Variables de entorno (documentadas en el README, sin valores)
- App: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.
- Solo servidor: `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `REVENUECAT_SECRET_KEY` y, opcional, `KINDWISE_API_KEY` (plant.id, D-31).
- Nunca commitear valores. `.env*` va en `.gitignore`.

## Cómo trabajar
- Hitos H1 a H6 según `PLAN.md`, un commit por hito, con las pruebas pasando.
- Terminado = pasan `npm test`, `npm run lint:contenido` y los flujos de Maestro, sin errores en consola, y todo el texto visible coincide con el prototipo.
- Documentos vivos: `PLAN.md` (hitos y estado), `DECISIONS.md` (decisiones tomadas), `CONTENIDO_PENDIENTE.md` (errores de contenido detectados).
