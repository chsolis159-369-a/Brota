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

## D-13 · Identidad de git
Los commits se firman con `user.name = chsol` y el email de la cuenta del usuario, configurados solo en este repo (`git config --local`). Se cambia con `git config user.name "…"` y `git config user.email "…"`.
