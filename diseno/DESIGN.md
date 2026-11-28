# BROTA · Sistema de diseño

Fuente de verdad: el código de `src/tema` y `src/componentes`. Este documento los describe y se actualiza junto con ellos; `__tests__/disenoDoc.test.ts` falla si los colores de acá no coinciden con `src/tema/colores.ts`. Decisiones de origen: D-28 (logo), D-29 (rediseño), D-32 (confianza y confort) y D-33 (íconos), en `DECISIONS.md`.

## Concepto: "huerta serena"

Seguridad y confort. La app tiene que verse seria y confiable (cuida datos y plata) y a la vez calma, fácil de leer sin esfuerzo. La usa gente de todas las edades, muchos sin experiencia técnica, con las manos sucias, a pleno sol o de noche en el indoor, y muchas veces preocupada por su planta.

- Papel cálido de fondo, tarjetas blancas con sombra mínima y un solo verde salvia profundo para las acciones.
- En oscuro, "verde noche": nunca negro puro ni verde neón, para no encandilar en el indoor.
- Nada apura ni asusta: sin colores de urgencia, sin rojo lleno, sin animaciones llamativas.

## Reglas

1. **El color significa algo y nunca va solo**: verde = acción o todo bien; ocre (`gold`) = atención; terracota (`alert`) = problema; azul (`info`) = información (clima). Siempre acompañado de un ícono o un texto.
2. **Una acción principal por pantalla**: un solo botón primario visible por pantalla o por tarjeta; el resto, botones secundarios (fantasma).
3. **Como máximo un bloque destacado (Hero) por pantalla**, con un degradé muy sutil.
4. Todo texto cumple contraste AA (≥ 4,5) sobre su fondo; el borde de campos y controles (`bordeCampo`) llega a 3:1. Lo verifica `__tests__/tema.test.ts`.
5. Objetivos táctiles de 48 px como mínimo. Con letra grande, los textos parten en varias líneas y las filas se apilan: nada se corta.
6. Los textos salen de `src/i18n` (español rioplatense, con voseo). El diseño no inventa textos.
7. El logo (plántula, D-28) no se modifica: es una imagen generada con `tools/marca/`.

## Colores

Los tokens son los de `src/tema/colores.ts`.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `bg` | #F7F5EF | #121A16 | Fondo de pantalla (papel cálido / verde noche) |
| `surface` | #FFFFFF | #1A2420 | Tarjetas |
| `surfaceAlt` | #F2EFE7 | #16201B | Campos y zonas secundarias dentro de una tarjeta; ícono neutro |
| `fg` | #1C2620 | #E7EDE9 | Texto principal |
| `muted` | #56615A | #A6B2AA | Texto secundario |
| `accent` | #2D6A4C | #8CCBA6 | Único color de acción: botón primario, chip activo, íconos de marca |
| `accentSoft` | #E5EFE8 | #1F3329 | Fondo suave de acción: cuadros de íconos, consejos, mensajes "ok" |
| `border` | #E3DED3 | #2C3B33 | Bordes decorativos y separadores; borde de tarjetas en oscuro |
| `bordeCampo` | #7F8781 | #6C7B72 | Borde de campos, chips y controles (3:1) |
| `alert` | #A8452C | #F0957D | Problema real (terracota) y acciones de borrar |
| `alertSoft` | #FAE9E3 | #3A231D | Fondo suave de alerta |
| `ok` | #2D6A4C | #8CCBA6 | Todo bien |
| `gold` | #87580F | #E3BA68 | Atención (ocre) y etiqueta "Prueba" |
| `goldSoft` | #F7EEDC | #352B18 | Fondo suave de atención |
| `info` | #2E5E83 | #96C0E0 | Información (clima) |
| `infoSoft` | #E4EDF5 | #1B2C39 | Fondo suave de información |
| `sobreAccent` | #FFFFFF | #10201A | Texto sobre `accent` |
| `botonDesde` | #2D6A4C | #8CCBA6 | Botón primario (plano: los dos extremos iguales) |
| `botonHasta` | #2D6A4C | #8CCBA6 | Botón primario (plano) |
| `heroDesde` | #2D6A4C | #22503B | Bloque destacado, inicio del degradé |
| `heroHasta` | #25573F | #1A3F2E | Bloque destacado, fin del degradé |
| `sobreHero` | #FFFFFF | #F3F8F5 | Texto sobre el bloque destacado |
| `sobreHeroSuave` | #DDEDE3 | #D2E6DA | Texto secundario sobre el bloque destacado |
| `lima` | #C7E6A3 | #C7E6A3 | Solo gráficos sobre el bloque destacado (anillo y barras), nunca texto |

**Sombras**
- `sombra` (tarjetas): en claro `0 1px 2px rgba(28, 38, 32, 0.05), 0 4px 12px rgba(28, 38, 32, 0.05)`; en oscuro, ninguna: las tarjetas llevan un borde de 1 px en `border`.
- `sombraBoton`: ninguna, en los dos modos.

## Tipografía

Fraunces (títulos y números destacados, solo desde 20 px) y Nunito Sans (texto). Sin mayúsculas forzadas. Tamaños en px, alto de línea entre barras (`src/tema/tipografia.ts`).

| Variante | Fuente | Tamaño / alto de línea | Uso |
|---|---|---|---|
| `marca` | Fraunces SemiBold | 22/28, espaciado 1,2 | "BROTA" en el encabezado |
| `tituloGrande` | Fraunces SemiBold | 30/38 | Título de cada pantalla |
| `titulo` | Fraunces SemiBold | 22/30 | Títulos de tarjetas grandes |
| `seccion` | Fraunces SemiBold | 21/28 | Títulos de sección |
| `numeroGrande` | Fraunces SemiBold | 32/40 | Valor principal de un bloque destacado |
| `numero` | Fraunces SemiBold | 24/31 | Valores de las estadísticas |
| `subtitulo` | Nunito Sans Bold | 18/25 | Subtítulos |
| `cuerpo` | Nunito Sans Regular | 17/26 | Texto de lectura |
| `cuerpoFuerte` | Nunito Sans Bold | 17/26 | Títulos de ítems y énfasis |
| `boton` | Nunito Sans Bold | 17/24 | Botones |
| `secundario` | Nunito Sans Regular | 15/22 | Texto secundario (color `muted`) |
| `etiqueta` | Nunito Sans Bold | 13/18 | Etiquetas en píldora |
| `pestana` | Nunito Sans Regular | 13/18 | Pestañas |

El texto crece con la letra del sistema y con el tamaño elegido en Configuración: Normal ×1, Grande ×1,15, Muy grande ×1,3 (D-35).

## Medidas

De `MEDIDAS` (`src/tema/useTema.ts`):

- Margen lateral de pantalla: 20 px. Columna centrada de hasta 440 px de ancho.
- Relleno de tarjeta: 20 px. Separación entre tarjetas: 16 px.
- Radio de tarjeta: 20 px. Radio de controles (botones, campos, botones rápidos, consejos): 14 px. Recuadro de estadística: 18 px. Mensajes: 12 px. Chips y etiquetas: píldora (999).
- Objetivo táctil mínimo: 48 px. Botón: 52 px de alto mínimo.

## Componentes

De `src/componentes`:

- **Pantalla**: fondo liso `bg`, encabezado de BROTA (logo, "BROTA" y la píldora del plan con la etiqueta "Prueba"), título grande y, a su derecha, el botón redondo de Configuración (48 px, borde `border`, ícono de engranaje).
- **Tarjeta**: `surface`, radio 20, relleno 20, `sombra` en claro y borde en oscuro.
- **Hero (bloque destacado)**: uno por pantalla como máximo; degradé de `heroDesde` a `heroHasta` a 180°, radio 20; texto `sobreHero`. Hoy (tareas del día), Aprender (nivel).
- **Botón**: alto mínimo 52, radio 14, borde 1,5, relleno 12 × 18, texto `boton`, ícono opcional a la izquierda; se oscurece un poco al tocarlo (opacidad 0,82).
  - Primario: fondo `accent`, texto `sobreAccent`, sin sombra.
  - Fantasma (secundario): fondo `surface`, borde y texto `accent`.
  - Peligro: fondo `surface`, borde y texto `alert`. Peligro lleno: fondo `alertSoft`. Nunca rojo lleno.
- **Chip**: píldora, borde 1,5 en `bordeCampo`, relleno 10 × 16, alto 48; activo con fondo `accent` y texto `sobreAccent`.
- **Botón rápido**: dos por fila, fondo `accentSoft`, borde 1 en `accent`, radio 14, ícono + texto.
- **Campo**: etiqueta siempre visible arriba (`secundario` en `fg`), borde 1,5 en `bordeCampo`; con foco, borde 2 en `accent`; sin placeholder.
- **Medalla (cuadro de ícono)**: cuadrado de esquinas redondeadas (28 % del lado) con el fondo suave de su tono y el ícono de 22 px en el color fuerte. Lados de 36, 40, 44 y 48 px. Por defecto en `accent`; con color propio solo el clima (`info`) y la salud del cultivo (bien, atención o problema).
- **Estadísticas**: recuadros en fila (radio 18, relleno 14) con medalla de 36, número y etiqueta; con letra grande bajan de línea.
- **Etiqueta**: píldora chica (relleno 3 × 10, texto `etiqueta`), en tono `muted`, `gold` u `ok`, con ícono opcional.
- **Mensaje**: recuadro suave (`accentSoft` u `alertSoft`, radio 12) con ícono.
- **Explicación / consejo**: fondo `accentSoft`, radio 14, ícono de lamparita.
- **Estados**: cargando = bloques grises suaves en `border`; vacío = medalla neutra y el texto existente; error = recuadro suave con ícono.
- **Gráficos**: anillo de progreso y barras con `lima` sobre el bloque destacado; barras de progreso planas de 8 px en píldora.

## Íconos

De `src/tema/iconos.ts` (D-33):

- Un solo estilo: de línea, sin rellenos, con el mismo grosor en toda la app. Material Symbols (grosor normal) en Android y SF Symbols (solo hasta la versión 4.2, iOS 16.4) en iOS, con la misma idea en las dos plataformas.
- Dos tamaños fijos: 18 px (chico) y 22 px (normal). Son decorativos: los lectores de pantalla los saltean.
- Pestañas: Hoy (calendario), Cultivos (plántula), Agente (globo de conversación), Aprender (birrete), Plan (insignia de Pro).

## Movimiento

Transiciones de pantalla en fundido de 200 ms, sin rebotes. Con "reducir movimiento" activado en el sistema, sin animaciones (`src/tema/movimiento.ts`).
