# Contenido pendiente

Errores u observaciones sobre `content/modulos.json`. El contenido **no se corrige acá**: se anota y lo decide el usuario.

## Estado al 2026-11-23 (versión prueba 0.9)
`npm run lint:contenido` pasa sin errores: 17 módulos visibles + 3 de cannabis, 128 preguntas, 31 términos.

## Observaciones (no son errores)
1. **Una sola pregunta básica por módulo.** Los 17 módulos visibles tienen exactamente 1 pregunta de dificultad 1. La regla "evitar las del intento anterior" no se puede cumplir para la básica: se repite en cada intento del test (el prototipo hace lo mismo). Agregar una segunda básica por módulo resolvería esto.
2. **`hidro-sistemas` tiene 4 intermedias y 2 trampa** (el resto tiene 3 y 3). No afecta los sorteos: hay preguntas de sobra en cada bloque.
3. **Los módulos de cannabis no tienen `banco`** (3 preguntas cada uno). Están ocultos (`CANNABIS_HABILITADO = false`), así que no afecta esta versión.
