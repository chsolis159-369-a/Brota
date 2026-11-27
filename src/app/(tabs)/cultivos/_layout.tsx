import { Stack } from 'expo-router';

import { animacionPantallas, useMovimientoReducido } from '@/tema/movimiento';
import { useTema } from '@/tema/useTema';

/** Cultivos: lista y detalle, dentro de la pestaña (como el prototipo). */
export default function CultivosLayout() {
  const { c } = useTema();
  const reducido = useMovimientoReducido();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, ...animacionPantallas(reducido) }} />;
}
