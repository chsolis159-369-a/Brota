import { Stack } from 'expo-router';

import { useTema } from '@/tema/useTema';

/** Aprender: lista, módulo (lecciones, test y resultado), glosario y exámenes, dentro de la pestaña. */
export default function AprenderLayout() {
  const { c } = useTema();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />;
}
