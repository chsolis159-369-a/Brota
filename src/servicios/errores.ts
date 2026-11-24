/**
 * Últimos errores de la app (ERRORES del prototipo): se incluyen en el texto de la opinión de la
 * prueba. En H6 se suma Sentry; esto queda como resumen local.
 */
const MAX = 5;
const errores: string[] = [];

export function registrarError(e: unknown): void {
  const texto = String(e instanceof Error ? e.message : e || 'error').slice(0, 120);
  errores.push(texto);
  if (errores.length > MAX) errores.shift();
}

export const erroresRecientes = (): readonly string[] => errores.slice();

type ManejadorGlobal = (error: unknown, fatal?: boolean) => void;
type ErrorUtilsRN = { getGlobalHandler: () => ManejadorGlobal; setGlobalHandler: (h: ManejadorGlobal) => void };

let instalado = false;

/** Engancha el manejador global de errores de React Native (sin reemplazar el existente). */
export function capturarErrores(): void {
  const eu = (globalThis as { ErrorUtils?: ErrorUtilsRN }).ErrorUtils;
  if (instalado || !eu) return;
  instalado = true;
  const anterior = eu.getGlobalHandler();
  eu.setGlobalHandler((error, fatal) => {
    registrarError(error);
    anterior(error, fatal);
  });
}
