import { Stack } from 'expo-router';

import { useTema } from '@/tema/useTema';

/** Cultivos: lista y detalle, dentro de la pestaña (como el prototipo). */
export default function CultivosLayout() {
  const { c } = useTema();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />;
}
