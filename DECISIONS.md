# Decisiones

Lo que la especificación no define, decidido con el criterio más simple. Formato: contexto → decisión.

## D-01 · Gestor de paquetes y estructura
Un solo repo: la app en la raíz, `supabase/` para el backend. npm. Identificadores de dominio en español, como en el prototipo (`cultivos`, `registros`, `reglas`).

## D-02 · Versión de Expo
Se crea con `create-expo-app@latest` (la última estable al iniciar H1) y la versión queda fijada en `package.json`.

## D-03 · i18n
`i18next` + `react-i18next` + `expo-localization`. Un solo idioma cargado (`es-AR`), con los textos del prototipo sin cambios.

## D-04 · Lógica compartida con el servidor
`src/reglas/` es TypeScript puro sin dependencias. Las Edge Functions (Deno) lo importan desde el repo, y un script copia `content/modulos.json` a `supabase/functions/_shared/`. Una prueba verifica que la copia sea idéntica al original.

## D-05 · Banco de preguntas en el dispositivo
Los tests de módulo corren sin conexión, así que `modulos.json` (con las respuestas correctas) viaja en la app y los exámenes sortean de ese mismo banco. El anti-trampa protege el **procedimiento**: sorteo, tiempo, intentos, corrección y puntos se resuelven en el servidor, y la API del examen nunca devuelve la correcta antes de recibir la respuesta. No protege el secreto del banco: alguien que extraiga el bundle podría ver las respuestas. Se acepta porque la constancia es un reconocimiento interno sin validez. La alternativa sería un banco solo para exámenes en el servidor, que requiere contenido nuevo y queda fuera de esta versión.

**Estado: aprobada por el usuario (2026-11-23).** Se revisa si los puntos o la constancia pasan a tener valor real (ranking público, premios, constancia verificable). En ese caso el banco de exámenes tiene que estar solo en el servidor.

## D-06 · Guardado de respuestas del examen
Cada respuesta se envía al servidor al confirmarla (`examen-responder`). Así se puede retomar tras cerrar la app y, al vencer el tiempo, el servidor corrige lo que ya recibió, aunque el teléfono esté apagado.

## D-07 · Día para los topes de intentos
El "día" de los 3 intentos se calcula en el servidor con la zona horaria guardada en el perfil (tomada del dispositivo; por defecto `America/Argentina/Buenos_Aires`). Así coincide con el día que ve el usuario y la regla queda en el servidor.

## D-08 · Fotos del cultivo
En esta versión las fotos quedan solo en el dispositivo (carpeta de documentos de la app); la bitácora guarda la ruta. No se suben a Supabase. Se borran con "Borrar mi cuenta".

## D-09 · Servicios externos sin claves
Supabase, RevenueCat, Claude, Sentry y PostHog se usan detrás de interfaces. Sin variables de entorno, la app usa una implementación simulada (exámenes y agente muestran "Requiere conexión" y el plan queda en Gratis) para que el desarrollo y las pruebas no dependan de cuentas.

## D-10 · Origen de los archivos de referencia
- `reference/brota-v9-prototipo.html` es el artifact "BROTA" de claude.ai (versión `prueba 0.9`, leído el 2026-11-23), guardado tal cual. Incluye el envoltorio HTML que agrega claude.ai al publicar (`<!doctype html>…<body>`); el código y los textos del prototipo están completos dentro.
- `content/modulos.json` se genera con `node tools/extraer-contenido.js`: lee `MODULOS` y `GLOSARIO` del prototipo con `JSON.parse` (son JSON puro) y exige que la reserialización coincida byte a byte con el texto original. `--check` verifica que no se haya desviado. Agrega solo `fuente` y `version`.
- `reference/pruebas-prototipo-v9.js` y `tools/auditoria-contenido.js` no existían y se reconstruyeron (ver el informe en el commit H0).

## D-11 · Cultivos de ejemplo y puntos (discrepancia prototipo ↔ especificación)
La especificación dice "Los cultivos de ejemplo no dan puntos ni logros". En el prototipo, `migrarLedger` y `ledger.creados` excluyen los ejemplos, pero un registro o una medición nuevos en un cultivo de ejemplo **sí** suman al ledger (y habilitan "Primer registro" o "Primera medición de luz").
Decisión: se sigue la especificación. En la app, registros y mediciones en cultivos de ejemplo se guardan en su bitácora pero no suman al ledger ni a logros, y no cuentan para la racha. Las **tareas** de los cultivos de ejemplo se mantienen como en el prototipo (suman, con el tope diario de 40), porque la especificación no las menciona y cambiarlas alteraría la pantalla Hoy de quien recién empieza.
Las pruebas del prototipo documentan esto en la sección "Discrepancias"; en `src/reglas` esas comprobaciones tienen que pasar.

## D-12 · Textos del prototipo que no aplican a la app (pendiente de OK del usuario)
Estos textos describen limitaciones del prototipo web. Se reemplazan cuando llegue el hito indicado, con la propuesta de abajo, **salvo que el usuario diga otra cosa**:
| Texto del prototipo | Propuesta | Hito |
|---|---|---|
| "Hoy en Tu zona (ejemplo) · pronóstico de ejemplo" | "Hoy en {ciudad}" (pronóstico real) | H2 |
| "Subí una foto cada semana para ver la evolución. Las fotos se guardan en este navegador mientras uses la app." | "…Las fotos se guardan en este dispositivo." | H2 |
| "Si el botón no copia, seleccioná el texto y copialo a mano." | se quita (el portapapeles nativo funciona) | H5 |
| "Modo de ejemplo sin conexión: las respuestas salen de reglas simples. El guía real se conecta con el backend." | Con servidor: "El guía usa inteligencia artificial y responde solo sobre cultivo. Puede equivocarse: ante un problema grave, consultá a un técnico." (D-27). Sin servidor se mantiene el del prototipo. | hecho |
| Tarjeta "Probá Pro 14 días · Activar prueba" | la prueba aparece en el paywall como oferta de la tienda | H5 |
| "El cobro real se conecta después. Por ahora el cambio es solo local." | texto de renovación automática de las tiendas + "Restaurar compras" | H5 |
| Privacidad: "Versión de prueba. El texto final de privacidad se publica antes del lanzamiento." / "En esta versión de prueba, los datos quedan en tu navegador y no se envían a un servidor." | texto real: qué se guarda en el dispositivo y qué en el servidor, con enlace a la política | H6 |
| "Se eliminan cultivos, bitácora, progreso, exámenes y tareas de este dispositivo." | "…de este dispositivo y de nuestros servidores." | H6 |
| "La app no envía nada sola: pegá el texto en el formulario o mensaje que te indiquemos." | "Enviar mi opinión" (tabla `feedback`) | H6 |

**Textos nuevos (no están en el prototipo)**, aprobados por el mismo criterio. `__tests__/textos.test.ts` exige que cada uno figure en su lista:
- "Agregar foto" (botón; el prototipo usaba el selector de archivos del navegador).
- "Pronóstico no disponible sin conexión." (sin pronóstico guardado).
- Clima: "Niebla", "Nieve", "Tormenta" y los días "Lun", "Mar", "Mié" (D-19).
- Permisos del sistema (en `app.json`; iOS los exige): "BROTA usa tu ubicación aproximada para mostrar el pronóstico del clima de tu zona." y "BROTA usa tus fotos para que sigas la evolución de tus cultivos." Cámara y micrófono quedan apagados.

## D-13 · Identidad de git
Los commits se firman con `user.name = chsol` y el email privado de GitHub del usuario (`…@users.noreply.github.com`), configurados solo en este repo (`git config --local`), para que su email personal no quede en el historial. Los commits H0 a H2 se reescribieron con ese email antes de la primera subida. Se cambia con `git config user.name "…"` y `git config user.email "…"`.

Repositorio: `github.com/chsolis159-369-a/brota` (privado).

## D-14 · Contraste AA sobre los colores del prototipo
Tres pares del prototipo no llegan a 4,5:1. Se ajusta lo mínimo y el resto de los tokens queda igual (lo verifica `__tests__/tema.test.ts`):
- Claro, `gold` `#B8862B` → `#8A6420`: puntos de tareas, estrellas y etiqueta "Recomendado" (3,0 → 4,95 sobre el fondo).
- Claro, `muted` `#66756B` → `#606E65`: texto secundario sobre `accent-soft` (4,13 → 4,56).
- Oscuro, texto sobre `accent` `#FFFFFF` → `#121A14`: botones y chips activos (1,95 → 9,08).

## D-15 · Identificadores de la app
`com.brota.app` para iOS (bundle identifier) y Android (package). Se puede cambiar hasta la primera subida a las tiendas; después queda fijo.

## D-16 · Pestañas nativas con íconos
Las pestañas usan `NativeTabs` de Expo Router (barra nativa de iOS y Android). Su prop `disabled` bloquea las otras pestañas durante un examen. El prototipo solo tiene texto; las barras nativas necesitan ícono, así que se suman SF Symbols en iOS y Material en Android (Hoy: sol, Cultivos: hoja, Agente: globos de diálogo, Aprender: libro, Plan: estrella). Los textos de las pestañas no cambian.

## D-17 · Íconos de la app y pantalla de carga
Por ahora se usan los íconos de la plantilla de Expo, con los colores de fondo de BROTA en la pantalla de carga (`#F4F7F2` claro, `#121A14` oscuro). Hace falta un ícono propio antes de subir a las tiendas (H6).

## D-18 · Pruebas de la base de datos
Los repositorios reciben un `BaseDatos` con la forma de expo-sqlite. En Jest se usa un adaptador sobre `node:sqlite` (SQLite real en memoria, incluido en Node), así que las pruebas verifican el SQL, las restricciones `CHECK`, las claves foráneas y las transacciones sin módulos nativos.

## D-19 · Clima
- Proveedor: Open-Meteo detrás de `ProveedorClima` (`src/servicios/clima.ts`). Su plan gratis es no comercial: hay que cambiarlo antes de publicar con suscripciones.
- Ubicación: se pide el permiso de ubicación aproximada la primera vez que se abre Hoy. Sin permiso (o si falla), se usa Buenos Aires.
- El pronóstico se guarda (almacén clave-valor de expo-sqlite) y se vuelve a pedir si tiene más de una hora. Sin conexión se muestra el último guardado; si nunca hubo uno, "Pronóstico no disponible sin conexión."
- "Mañana hay lluvia" (tarea de drenaje) usa la probabilidad máxima de lluvia de mañana ≥ 60 %, como el prototipo.
- Descripciones del tiempo (códigos WMO) con las palabras del prototipo: Soleado, Parcialmente nublado, Nublado y Lluvia (también para llovizna y chaparrones). Se suman Niebla, Nieve y Tormenta.
- En la lista de días se muestra la máxima de cada día.

## D-20 · Flujos de Maestro
Los flujos (`.maestro/`) corren sobre un build release con el JS incluido (`npm run android:release`), sin depender de Metro ni del menú de desarrollo, con `clearState` y todos los permisos denegados. El diálogo del permiso de ubicación aparece unos segundos después de abrir Hoy: los flujos lo esperan hasta 15 s, esperan a que termine de abrirse (Android descarta los toques durante la animación) y tocan "No permitir" mientras siga visible. (Conceder la ubicación no sirve: en el emulador el GPS está apagado y Google muestra su propio diálogo; por eso la app pide la posición con `mayShowUserSettingsDialog: false` y, si falla, usa la ubicación por defecto.) Las tareas dependen del pronóstico real, así que los flujos no cuentan tareas: verifican los puntos.

## D-21 · Sin entorno Android en la PC (2026-11-24)
Se probó instalar Android Studio, el SDK, un emulador y Maestro en la PC del usuario, pero la compilación choca con el límite de rutas de Windows (D-23) y la máquina queda al límite de memoria y disco. A pedido del usuario se desinstaló todo eso (Android Studio, SDK, emulador, caché de Gradle, Maestro y variables `ANDROID_HOME`/`JAVA_HOME`): la compilación y los flujos de Maestro corren solo en GitHub Actions. En la PC quedan el código, Node, Git y la CLI de GitHub para programar, correr las pruebas de Jest y subir los cambios.
Notas por si se vuelve a instalar: `sdkmanager` está deprecado; los paquetes se instalan con `android sdk install` y nombres con `/` (por ejemplo `platforms/android-37.0`).

## D-22 · Sin react-native-reanimated
La plantilla de Expo trae `react-native-reanimated` y `react-native-worklets`, pero la app no los usa y en Expo Router son opcionales. En Windows su código C++ supera el límite de 260 caracteres de ruta y rompe la compilación de Android. Se quitan del `package.json` y, como npm igual los instala como dependencias pares (de `react-native-drawer-layout` y `expo-modules-core`), `react-native.config.js` los excluye del autolinking: no se compila su código nativo. En el JS de la app no se importan (Expo Router solo los usa en Drawer y en sus mocks de pruebas). Resultado: menos peso y compilación más rápida. Si más adelante hace falta animar algo, primero se usa la API `Animated` de React Native.

## D-23 · Compilación de Android en GitHub Actions
En Windows, otros módulos (por ejemplo `react-native-gesture-handler`) también superan los 260 caracteres de ruta al compilar en `C:\Users\…\Desktop\BROTA`; mover el proyecto no alcanza (las rutas llegan a ~350). Se probó que CMake acortara las rutas con `CMAKE_OBJECT_PATH_MAX`, pero el plugin de React Native lo fija en 1024 y no se puede cambiar sin pelear contra él. Activar las rutas largas de Windows requiere cambiar el registro como administrador.
Decisión del usuario (2026-11-24): compilar y probar en **GitHub Actions** (Linux, sin ese límite y con más memoria), en un repositorio privado. `.github/workflows/android.yml` corre `npm run verificar`, compila el APK release y corre los flujos de Maestro en un emulador; el APK y los resultados quedan como artefactos. Si alguna vez se quiere compilar en esta PC, hay que activar `LongPathsEnabled` (CMake 3.31.6 con ninja 1.12.1 ya está instalada en el SDK).

## D-24 · Consejos del día con fundamento (pedido del usuario, 2026-11-24)
Cada consejo del día (los 7 del prototipo, sin cambios) suma un "Por qué:" que explica el mecanismo agronómico: qué le pasa a la raíz, a la planta o a la plaga y por qué funciona la recomendación. Los textos están en `tipsPorque` (i18n). No se citan fuentes puntuales para no atribuir datos a publicaciones no verificadas; si se quieren citas (por ejemplo INTA ProHuerta), las revisa el usuario.

## D-25 · Aprender, Agente y Plan mientras no hay servidor ni cuentas
Para que no haya pestañas vacías en el APK de prueba:
- **Aprender** (H3) está completo y funciona sin conexión. La sección Exámenes muestra la lista, el estado y la ficha de cada examen; el botón "Empezar el examen" queda deshabilitado con el aviso "Los exámenes se habilitan en la próxima versión de prueba…" hasta H4 (Supabase).
- **Agente**: responde con las reglas del prototipo (`src/reglas/agente.ts`) y muestra el aviso del prototipo "Modo de ejemplo sin conexión…". En H5 pasa a Claude conservando esas reglas.
- **Plan**: como en el prototipo, elegir Pro cambia el plan solo en el teléfono ("El cobro real se conecta después…"), para poder probar las funciones Pro. En H5 lo reemplaza RevenueCat. La prueba local de 14 días del prototipo no se agrega: en la app es una oferta de las tiendas (CLAUDE.md).
- Privacidad dice "tu teléfono" en lugar de "tu navegador": es lo cierto en esta versión (todo queda en el dispositivo).

## D-26 · Borrar la cuenta: enlace chico con confirmación (pedido del usuario, 2026-11-24)
En el prototipo "Borrar mi cuenta y todos los datos" es un botón grande. A pedido del usuario, en la app es un enlace de texto chico, en rojo y subrayado, al final de Plan, para que no se toque sin querer. Mantiene el área táctil de 44 px (accesibilidad) y siempre pide confirmación ("Se eliminan cultivos, bitácora, progreso, exámenes y tareas de este dispositivo. No se puede deshacer." → "Confirmar borrado"). El texto no cambia.

## D-27 · Agente con IA (pedido del usuario, 2026-11-24)
- **Arquitectura**: Edge Function de Supabase `agente` (`supabase/functions/agente/`) que llama a la Messages API de Claude con el SDK oficial (`@anthropic-ai/sdk` 1.12.0). La clave de Anthropic solo existe como secreto de la función; la app nunca la tiene.
- **Modelo**: `ANTHROPIC_MODEL`, por defecto `claude-sonnet-5-5` (CLAUDE.md), con esfuerzo `low` (chat breve) y `max_tokens` 2048 (respuestas de ~120 palabras con margen para el razonamiento). El prompt de sistema es estable (sin fechas) y lleva `cache_control`; el mes y los cultivos van en el mensaje del usuario. Si el modelo rechaza por una regla de seguridad, el servidor reintenta con otro modelo (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`). El SDK reintenta solo los errores transitorios (2 reintentos, 30 s).
- **Reglas del agente**: solo cultivo; la negativa ante dosis, consumo o venta se resuelve sin llamar al modelo (en la app y en el servidor, con las mismas palabras del prototipo, verificadas por una prueba) y además está en el prompt; ante un problema grave, consultar a un técnico; nada de productos fitosanitarios por marca ni dosis de agroquímicos.
- **Historial del cultivo solo en Pro**: la app lo manda si el plan local es Pro, pero el servidor lo usa solo si RevenueCat confirma el entitlement `pro` (H5). Hasta entonces el agente da consejos generales a todos.
- **Sesión**: anónima de Supabase (`signInAnonymously`), sin pedir datos; en H6 se vincula a una cuenta. Hay que activar "Allow anonymous sign-ins" en el panel de Supabase.
- **Límite**: 30 preguntas por usuario y por día (hora de Argentina), en la tabla `agente_uso` con RLS y una función que solo puede llamar el servidor. Costo estimado con Sonnet 5.5: menos de un centavo de dólar por pregunta. Se recomienda además fijar un límite de gasto en la consola de Anthropic.
- **Sin servidor o sin conexión**: el Agente responde con las reglas del prototipo y lo aclara ("No pude conectarme con el guía. Te respondo con reglas simples:"). Textos nuevos: aviso de IA, "Pensando…", límite diario y sin conexión.
- **Despliegue**: `.github/workflows/supabase.yml` chequea la función con Deno y, si el repositorio tiene configurado el proyecto, aplica las migraciones, carga los secretos y publica la función. El APK se compila con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` (variables públicas de GitHub).
- **Claves**: `tools/cargar-claves.ps1` pide los datos en una ventana (los secretos no se muestran) y los guarda como variables y secretos de GitHub con `gh`; nunca pasan por el código ni por el chat. El workflow activa solo las sesiones anónimas por la API de administración de Supabase y usa la CLI 3 (`--remote`, `--yes`).
- **Fallas de Claude**: la función responde 502 con un `motivo` sin datos privados (`sin_credito`, `clave_invalida`, `modelo_no_disponible`, etc.) para diagnosticar; el mensaje completo queda en los logs de Supabase. La app lo trata como sin conexión.

## D-28 · Logo: plántula de cannabis (pedido del usuario, 2026-11-25)
- **Diseño**: inspirado en la foto de referencia del usuario: una plántula de cannabis de costado saliendo de la tierra, con el tallo fino, dos cotiledones lisos y redondeados abiertos a los costados, el primer par de hojas verdaderas (una sola hoja dentada cada una, larga, abierta en V) y el brote del centro. A pedido del usuario ("un poco más real"), con acabado realista: luz desde arriba a la izquierda, cada hoja plegada en su nervio (una mitad más iluminada), nervaduras hacia cada diente, canaleta del nervio, sombra interior y pelusa en los bordes; fondo verde desenfocado como en la foto. Texturas con relieve iluminado (un mapa de alturas de ruido iluminado desde arriba a la izquierda, como en 3D): la tierra con grumos y huecos, la superficie fina de las hojas y los cotiledones mates; pelitos (tricomas) en el tallo y los bordes; hojas con dientes curvos en forma de ganchito y desparejos, nervaduras que se curvan hacia cada diente y van hundidas en una canaleta, lomos entre nervaduras (la textura acolchada de la foto), nervio central afinado y borde translúcido; cotiledones en forma de cuchara, con punta redonda y nervio sutil; perlita en bolitas porosas con sombra; tierra lejana desenfocada detrás de la plántula (profundidad de campo, como en la foto), fibras y sombra donde nace el tallo. Como en la foto, nada es un espejo perfecto: las hojas suben en V y se arquean (la punta se abre hacia afuera), cada mitad tiene su ancho, el borde ondula, los dientes varían, los cotiledones están abombados con la punta caída y el tallo se inclina apenas. Antes se probaron una hoja de 7 foliolos, una vista desde arriba y una versión plana.
- **Un solo origen**: `tools/marca/` (geometría, dibujo y generador) produce el ícono de la app, el ícono adaptable de Android (fondo con la tierra; frente con la plántula y un terrón esfumado, dentro de la zona segura; monocromático), la imagen de la pantalla de carga, los SVG de `assets/marca/` y `assets/images/logo.png`, el logo de la app (encabezado, bienvenida y avatar del guía). Por los filtros (desenfoques y grano), el logo de la app es una imagen y no se dibuja en vivo. `node tools/marca/generar-marca.js` los vuelve a generar y una prueba verifica que estén al día.
- **iOS**: usa el mismo `icon.png`; se borró el ícono de ejemplo de Expo (`assets/expo.icon`). Pantalla de carga verde oscuro (#1A4A33; #0B2318 en modo oscuro) con la plántula.
- **Tiendas**: CLAUDE.md pedía "sin cannabis" para las tiendas. Con este logo, Google Play y App Store van a pedir declarar referencias a drogas en la clasificación por edad (probablemente para mayores de edad) y la revisión puede ser más estricta. El contenido de cannabis sigue oculto (`CANNABIS_HABILITADO = false`) y el agente sigue sin hablar de dosis, consumo ni venta.

## D-29 · Rediseño visual (pedido del usuario, 2026-11-25)
El usuario pidió un diseño más llamativo, atractivo y que transmita confianza. El prototipo sigue siendo la fuente de los textos y del comportamiento; los colores y el estilo visual se reemplazan:
- **Paleta**: verde esmeralda de la marca con acentos lima, ámbar y celeste, en claro y oscuro (`src/tema/colores.ts`). Todo texto cumple contraste AA (≥ 4,5); el lima, solo para gráficos sobre el degradé (≥ 3). Lo verifica `__tests__/tema.test.ts`, que ya no compara con los colores del prototipo.
- **Componentes**: tarjetas blancas con sombra suave (en oscuro, con borde); tarjetas destacadas con el degradé de la marca para el resumen de Hoy, el nivel en Aprender y el plan Pro (los textos y botones de adentro pasan solos a su versión clara); botón primario con degradé; chips en píldora; estadísticas con íconos de color; títulos de sección en Fraunces; logo en el encabezado y grande en el onboarding.
- **Íconos**: los de `expo-symbols`, ya instalado (SF Symbols en iOS, Material Symbols en Android), en `src/tema/iconos.ts`: categorías de módulos, tipos de registro, clima, logros, puntos y racha. Son decorativos: los lectores de pantalla los saltean.
- **Sin dependencias nuevas** para el diseño: degradés y sombras con `backgroundImage` y `boxShadow` de React Native.
- **Revisión visual**: el workflow de Android saca capturas de las pantallas principales en claro y en oscuro (`.maestro/capturas/`, artefacto `capturas`).

## D-30 · Fotos en el Agente (pedido del usuario, 2026-11-25)
El usuario pidió que el Agente use la cámara para analizar la planta, hojas, plagas, insectos y todo lo de la huerta. Estaba fuera de alcance (`FOTO_AGENTE = false`); ahora está prendido y requiere el servidor del Agente con IA (D-27).
- **App**: tarjeta "Analizar una foto" (título del prototipo) con "Sacar foto" y "Elegir de la galería". La cámara pide permiso recién al usarla. La foto se achica a 1280 px de lado mayor y se comprime (JPEG 0,7, unos 300 KB) antes de mandarla; si hay una pregunta escrita, va junto con la foto. La foto se ve en el chat y no se guarda en el teléfono.
- **Servidor**: la Edge Function valida la foto (JPEG, PNG o WebP, base64, hasta 2 MB) y se la pasa a Claude como imagen, con reglas para fotos en el prompt: decir qué ve, la causa más probable con prudencia ("orientación, no diagnóstico seguro"), qué hacer primero empezando por lo de menor impacto, distinguir insectos plaga de benéficos, pedir otra foto si no alcanza y no describir personas. Con foto usa esfuerzo `medium` para mirar la imagen con detalle.
- **Límite**: 10 fotos por usuario y por día, además de las 30 preguntas (una foto cuesta más que una pregunta de texto). Migración `20261125120000_agente_fotos.sql`.
- **Privacidad**: se corrigió el texto que decía que en la prueba los datos no se envían a un servidor: ahora aclara que las preguntas y las fotos al guía viajan al servidor y al servicio de IA solo para responder, y que las fotos no se guardan.
- **Textos nuevos**: ayuda, pista, botones, "Analizando la foto…", permiso de cámara, error, sin conexión y límite de fotos. "Analizar una foto" y "Foto subida por el usuario" salen del prototipo; su aviso de "análisis de ejemplo" no aplica y no se usa.

## D-31 · Reconocimiento con fotos y preguntas (pedido del usuario, 2026-11-27)
El usuario pidió sumar al Agente el diseño "BROTA: estructura del agente agronómico": que reconozca plantas, flores, frutos, plagas, hongos, enfermedades y carencias combinando fotos y preguntas. Se construye sobre D-27 y D-30, sin dependencias nuevas.
- **Salida estructurada**: la Edge Function pide a Claude un JSON con esquema fijo (`output_config.format`): `texto`, `candidatos` (nombre, nombre científico, tipo y confianza de 0 a 1), `pregunta` y `opciones`, `pedir_foto` y `derivar`. El servidor no confía en el modelo (`procesarRespuesta`): ordena, deja hasta 3 candidatos y 4 opciones, recorta textos, saca "No sé" de las opciones y calcula la certeza. Si la salida no es ese JSON (por ejemplo, si responde el modelo de respaldo), se usa como texto, igual que antes.
- **Umbrales**: certeza alta desde 80 %, media desde 40 %, baja por debajo (`UMBRAL_ALTA`, `UMBRAL_MEDIA`), como en el diseño. Por debajo de 80 % el modelo hace UNA pregunta cerrada con 2 a 4 opciones.
- **Preguntas por ronda**: hasta 5 (`MAX_PREGUNTAS_RECO`) desde la última foto. La app cuenta las preguntas de la ronda (`src/reglas/reconocimiento.ts`) y las manda en `preguntasHechas`; el servidor lo acota a 0..5 y, en el máximo, no deja pasar otra pregunta. Cada respuesta cuenta como una pregunta del límite diario (D-27).
- **App**: debajo del texto del guía, una tarjeta "Lo que puede ser" con los candidatos y su porcentaje, una etiqueta de certeza ("Muy probable", "Probable", "Poco seguro"), la foto puntual pedida y el aviso de derivar a un técnico. Si hay pregunta, el último mensaje muestra las opciones como botones, más "No sé" y "Mandar foto". La foto no se vuelve a mandar en las respuestas: el historial lleva un resumen de los candidatos y de la pregunta.
- **Servicio especializado opcional**: con el secreto `KINDWISE_API_KEY`, antes de llamar a Claude la función consulta plant.id v3 (especie y salud, `health: all`) con la foto y le pasa a Claude hasta 3 especies y 3 problemas con su probabilidad, como un dato para comparar. Sin la clave, o si falla o tarda más de 10 s, Claude reconoce solo con la foto. Cada consulta consume créditos de Kindwise: activarlo después de estimar el costo por usuario.
- **Prompt**: sección "Cómo reconocés con fotos y preguntas": confianza prudente, variedad o cultivar nunca por encima de 0,6, nunca decir que un hongo o una planta silvestre se puede comer, derivar ante problemas graves.
- **Textos nuevos** (no están en el prototipo): `agente.reco.*`.
- **Pendiente**: base de conocimiento propia con fichas revisadas por un agrónomo, productos registrados de SENASA y banco de fotos para medir aciertos (fases 2 a 4 del diseño).

## D-32 · Diseño de confianza y confort (pedido del usuario, 2026-11-27)
Pasada de diseño sobre D-29 para que la app transmita **seguridad** (seria, confiable, cuida datos y plata) y **confort** (calma, se lee sin esfuerzo). Público: gente de todas las edades, muchos sin experiencia técnica, que usa la app con las manos sucias, a pleno sol o de noche en el indoor, y muchas veces preocupada por su planta. No cambian textos, comportamiento, contenido, banderas, logo (D-28), fuentes ni nombres de tokens; sin dependencias nuevas.
- **Paleta**: papel cálido (#F7F5EF), verde salvia profundo como único color de acción (#2D6A4C), terracota para problemas reales, ocre para atención y azul pizarra para información (clima). En oscuro, "verde noche" (#121A16), nunca negro puro ni verde neón, para no encandilar en el indoor. Botón primario plano, sin degradé ni sombra de color; sombras mínimas en claro y ninguna en oscuro (ahí, borde fino). Token nuevo `bordeCampo` para el borde de campos y controles, con contraste de 3:1 o más (WCAG 1.4.11). Todos los pares de texto siguen en AA (≥ 4,5), verificados en `__tests__/tema.test.ts`.
- **El color significa algo y nunca va solo**: verde = acción o todo bien; ocre = atención; terracota = problema; azul = información. Siempre con ícono o texto. Las medallas de las estadísticas, de los módulos y de la bitácora pasan a un solo tono suave (antes había un color por dato o por categoría); quedan con color propio solo el clima (información) y la salud del cultivo (bien, atención o problema, que además dice el texto).
- **Tipografía y medidas**: cuerpo 17/26, secundario 15/22, botón 17/24, etiqueta 13/18 sin mayúsculas forzadas ni espaciado, pestañas 13/18; Fraunces solo desde 20 px. Toque mínimo 48 px, margen 20, relleno de tarjeta 20 y 16 entre tarjetas. Los textos largos parten en dos líneas y las filas se apilan con letra grande: nada se corta.
- **Componentes**: pantalla con fondo liso (sin el brillo verde de arriba); como máximo un bloque destacado (Hero) por pantalla, con un degradé muy sutil; campos con etiqueta siempre visible (la misma que antes era el texto de ayuda), borde `bordeCampo` y foco visible (borde verde de 2 px); acciones de borrar con texto terracota sobre fondo neutro, separadas y con confirmación (D-26); íconos en dos tamaños fijos.
- **Plan**: Gratis y Pro con la misma tarjeta (el plan actual, marcado con borde), sin bloque destacado ni colores de urgencia: precios claros, sin trucos. "Restaurar compras" y los enlaces a términos llegan con RevenueCat (H5): hoy no hay textos para eso y no se inventan.
- **Agente**: la certeza del reconocimiento (D-31) lleva color, ícono y texto; "Poco seguro" va en tono neutro, no de alerta. El aviso de que el guía usa IA y puede equivocarse queda visible al pie.
- **Estados**: mientras cargan los datos, bloques grises suaves en lugar de una pantalla vacía; vacíos con ícono y el texto que ya existe; errores en un recuadro suave con ícono, nunca rojo a pantalla completa.
- **Movimiento**: transiciones de pantalla en fundido de unos 200 ms, sin rebotes; con "reducir movimiento" activado en el sistema (AccessibilityInfo), sin animaciones ni efecto al tocar.
- **Examen**: el temporizador se mantiene tranquilo y solo pasa a alerta en el último minuto, como en el prototipo; se aplica cuando llegue el examen en el servidor (H4).
- **Verificación**: las capturas de GitHub Actions (`.maestro/capturas`) suman una pasada con la letra del sistema al máximo, además de claro y oscuro. Esa pasada mostró dos ajustes: en Android los íconos de expo-symbols son caracteres de una fuente y con la letra agrandada se cortaban en su caja, así que se compensa la escala para que midan siempre lo mismo; y las etiquetas de las pestañas crecen como máximo 1,35 veces para que entren las cinco sin cortarse (el resto de la app crece sin límite).

## D-33 · Íconos más profesionales (pedido del usuario, 2026-11-27)
El usuario pidió dejar el diseño como está y cambiar solo los íconos para que se vean más profesionales.
- **Un solo estilo**: íconos de línea, sin rellenos, con el mismo grosor en toda la app (el normal de Material Symbols en Android, el de SF Symbols en iOS) y la misma idea en las dos plataformas. Se descartó un grosor más fino: combina peor con los títulos y los números, y suma otra fuente (~1 MB) a la app.
- **Contenedor**: el círculo pastel con un ícono chico pasa a un cuadrado de esquinas redondeadas (28 % del lado) con el mismo fondo suave de su tono, y el ícono va siempre en el tamaño normal (22). Los colores siguen la regla de D-32.
- **Íconos que no correspondían**: "en cosecha" era un tractor (ahora una canasta); huerta, un cerco con una flor (ahora una fruta en Android y una zanahoria en iOS); sustrato inerte, una trama de puntos (ahora capas); cultivo, una hoja (ahora una plántula, como el logo); las plantillas de interior mostraban un sol (ahora una casa; exterior, un sol). Registros pasa a una tablilla, examen a una lista con tildes, glosario a un diccionario e hidroponía a agua. "+ Nuevo cultivo" queda sin ícono: el "+" del texto ya lo dice.
- **Pestañas**: Hoy (calendario), Cultivos (plántula), Agente (globo de conversación), Aprender (birrete) y Plan (insignia de Pro), elegidas para que tengan un peso visual parejo; antes Agente y Aprender se veían más gruesas que el resto.
- **iOS**: solo símbolos de SF Symbols 4.2 o anteriores, porque el mínimo de la app es iOS 16.4; el matraz que se usaba (SF Symbols 5) no se habría visto y pasa a tubos de ensayo. Una prueba (`__tests__/iconos.test.ts`) revisa la versión, que existan en Android, que no haya rellenos y que cada pestaña tenga un ícono distinto.
- **Letra grande**: las capturas con la letra del sistema al máximo mostraron que las etiquetas de las estadísticas se partían a mitad de palabra ("cultivo / s"), algo que ya pasaba antes de este cambio. Ahora el ancho mínimo de cada recuadro crece con la letra del sistema, así que con letra grande los recuadros bajan de línea; con la letra normal quedan igual.

## D-34 · Plan Gratis ampliado (pedido del usuario, 2026-11-28)
El usuario definió qué incluye el plan Gratis. Cambia reglas y textos del prototipo, con su autorización.
- **Cultivos**: hasta 3 cultivos propios (antes 2); los de ejemplo siguen sin contar. El aviso de límite toma el número de la constante.
- **Bitácora, registro rápido, tareas diarias, logros y racha**: sin cambios. El usuario los quiere como gratificación por el cuidado de cada planta.
- **Módulos**: los mismos 16 con test. El usuario los nombró sin hidroponía, pero 3 de los 16 son de hidroponía, así que el texto la mantiene.
- **Exámenes**: 6 en Gratis, uno por bloque, más el final Pro. Los bloques salen de las categorías del contenido, sin inventar preguntas: Huerta (35 preguntas en el banco) se parte en dos exámenes (Suelo, compost y rotación; Siembra y calendario), nutrición (7) va con hidroponía, y sustrato inerte, luz y plagas tienen el suyo. Se sortean 10 o 12 preguntas según el tamaño del banco (siempre menos que las disponibles), con 1 minuto por pregunta y +40 puntos la primera vez. El final exige los seis. El repaso de errores ya mostraba la explicación de cada pregunta ("con fundamentos").
- **Agente**: 6 preguntas por día en Gratis (30 en Pro), las fotos siguen con su propio límite de 10. Memoria limitada en Gratis: el servidor manda al modelo los últimos 2 mensajes y los datos básicos de cada cultivo (nombre, tipo, ubicación, etapa y día); Pro suma los últimos 6 mensajes, los registros y la última medición. El plan lo decide el servidor (RevenueCat, H5); hasta entonces todos son Gratis.
- **Textos**: los ítems de Gratis y los nombres de los exámenes nuevos se escribieron con el mismo tono del prototipo y figuran en la lista de textos nuevos de `__tests__/textos.test.ts`.
- **Pruebas de Maestro**: el flujo del Agente reintenta escribir y mandar la pregunta si la respuesta anterior de la IA es larga (un reconocimiento con opciones movía la pantalla y el texto no llegaba al campo).

## D-35 · Configuración (pedido del usuario, 2026-11-28)
Pantalla nueva que se abre con un engranaje a la derecha del título de cada pestaña (se desactiva durante un examen, como las pestañas). Primero estuvo en el encabezado, pero junto a "Plan gratis · Prueba" no entraba y bajaba a una segunda línea que empujaba toda la pantalla. Las cinco pestañas del prototipo no cambian.
- **Idioma**: español (por defecto), inglés, italiano, francés y chino simplificado (D-36). Cada idioma se muestra con su propio nombre.
- **Tamaño de letra**: Normal, Grande (×1,15) y Muy grande (×1,3). Se suma al tamaño de letra del sistema, que la app ya respetaba (D-32).
- **Modo de pantalla**: Automático (sigue al teléfono, como hasta ahora), Claro u Oscuro. Se aplica a toda la app con `Appearance.setColorScheme`.
- **Perfil**: forma de cultivar (la del onboarding), el plan actual con un botón a Planes y el enlace chico "Borrar mi cuenta y todos los datos" con confirmación (D-26), que se mudó desde Plan. Después de borrar vuelve a las pestañas.
- **Privacidad y términos**: la privacidad se mudó desde Plan (su texto dice ahora dónde está el borrado). Los términos y condiciones son genéricos, marcados como versión de prueba: uso educativo, el guía puede equivocarse, nada de dosis, consumo ni venta, leyes de cada país, suscripción por las tiendas con renovación automática, constancia sin validez, borrado de datos y cambios. Hay que revisarlos con un abogado antes de publicar.
- **Dónde se guarda**: idioma, letra y modo son preferencias del dispositivo y se guardan en el almacén clave-valor de expo-sqlite, que se lee de forma sincrónica al abrir (la app arranca ya con lo elegido). "Borrar mi cuenta" no las cambia.
- **Textos**: nuevos, en el tono del prototipo, en la lista de textos nuevos de `__tests__/textos.test.ts`.

## D-36 · Idiomas: inglés, italiano, francés y chino (pedido del usuario, 2026-11-28)
- **Qué se traduce**: todos los textos de la app (`src/i18n/*.json`): pantallas, consejos del día con su fundamento, respuestas sin conexión del guía, términos y privacidad. También los nombres de los niveles, que estaban en el código: se traducen al mostrarlos y las reglas siguen usando los nombres del prototipo.
- **Qué queda en español**: el contenido de `content/modulos.json` (lecciones, preguntas y glosario), que no se edita y del que no se inventan versiones. Configuración lo avisa al elegir otro idioma. Si se quiere el contenido traducido, hace falta una traducción revisada del archivo, como contenido aparte.
- **Chino**: chino simplificado (`zh-CN`). Fraunces y Nunito Sans no tienen caracteres chinos: el teléfono usa su fuente del sistema para esos textos.
- **El guía con IA** responde en el idioma elegido: la app manda el idioma y el servidor, que solo acepta los cinco de la app, agrega la instrucción al último mensaje. En español no cambia nada.
- **Datos que viajan al guía** (con D-34): en Gratis la app manda solo los datos básicos de cada cultivo; en Pro, también registros y la última medición. El servidor recorta igual según el plan que confirma.
- **Pruebas**: `__tests__/idiomas.test.ts` exige que cada idioma tenga las mismas claves y las mismas variables que el español, sin textos vacíos. El flujo de Maestro de Configuración cambia a inglés y a chino y vuelve al español.
- **Calidad**: traducciones hechas con cuidado pero sin revisión de hablantes nativos; conviene revisarlas antes de publicar en esos mercados.
