/** Movimiento (D-32): fundido corto, y ninguna animación si el sistema pide reducir movimiento. */
import { renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { animacionPantallas, DURACION_TRANSICION, useMovimientoReducido } from '@/tema/movimiento';

describe('movimiento', () => {
  it('las transiciones duran entre 150 y 250 ms y se apagan con movimiento reducido', () => {
    expect(DURACION_TRANSICION).toBeGreaterThanOrEqual(150);
    expect(DURACION_TRANSICION).toBeLessThanOrEqual(250);
    expect(animacionPantallas(false).animation).toBe('fade');
    expect(animacionPantallas(true).animation).toBe('none');
  });

  it('lee la opción del sistema', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const { result } = await renderHook(() => useMovimientoReducido());
    await waitFor(() => expect(result.current).toBe(true));
  });
});
