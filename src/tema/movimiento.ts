import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Duración de las transiciones de pantalla (D-32): suaves, de 150 a 250 ms, sin rebotes. */
export const DURACION_TRANSICION = 200;

/**
 * Verdadero si el sistema tiene activado "reducir movimiento" (AccessibilityInfo): entonces la app no
 * anima las transiciones. Se actualiza si la persona cambia la opción con la app abierta.
 */
export function useMovimientoReducido(): boolean {
  const [reducido, setReducido] = useState(false);
  useEffect(() => {
    let vigente = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (vigente) setReducido(v);
    });
    const suscripcion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducido);
    return () => {
      vigente = false;
      suscripcion.remove();
    };
  }, []);
  return reducido;
}

/** Opciones de animación de una pila de pantallas: fundido corto, o ninguna con movimiento reducido. */
export const animacionPantallas = (reducido: boolean) => ({ animation: reducido ? ('none' as const) : ('fade' as const), animationDuration: DURACION_TRANSICION });
