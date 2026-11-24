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
| "Modo de ejemplo sin conexión: las respuestas salen de reglas simples. El guía real se conecta con el backend." | "El guía responde solo sobre cultivo. Ante un problema grave, consultá a un técnico." | H5 |
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
Los flujos (`.maestro/`) corren sobre un build release con el JS incluido (`npm run android:release`), sin depender de Metro ni del menú de desarrollo, con `clearState` y todos los permisos denegados. El diálogo del permiso de ubicación aparece unos segundos después de abrir Hoy: los flujos lo esperan hasta 10 s y lo rechazan. (Conceder la ubicación no sirve: en el emulador el GPS está apagado y Google muestra su propio diálogo; por eso la app pide la posición con `mayShowUserSettingsDialog: false` y, si falla, usa la ubicación por defecto.) Las tareas dependen del pronóstico real, así que los flujos no cuentan tareas: verifican los puntos.

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
