import '@/i18n';

// Solo los pesos que se usan (importar el índice del paquete suma todas las variantes al bundle).
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { NunitoSans_400Regular } from '@expo-google-fonts/nunito-sans/400Regular';
import { NunitoSans_600SemiBold } from '@expo-google-fonts/nunito-sans/600SemiBold';
import { NunitoSans_700Bold } from '@expo-google-fonts/nunito-sans/700Bold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { NOMBRE_BD, obtenerPerfil, prepararBaseDatos } from '@/db';
import { useApp } from '@/store/app';
import { useTema } from '@/tema/useTema';

void SplashScreen.preventAutoHideAsync();

/** Lee el perfil local y carga el plan en el estado de la app. */
function CargarPerfil() {
  const db = useSQLiteContext();
  const setPlan = useApp((s) => s.setPlan);
  useEffect(() => {
    void obtenerPerfil(db).then((p) => {
      if (p) setPlan(p.plan);
    });
  }, [db, setPlan]);
  return null;
}

export default function RaizLayout() {
  const { modo, c } = useTema();
  const [cargadas, error] = useFonts({
    Fraunces_600SemiBold,
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });

  useEffect(() => {
    if (cargadas || error) void SplashScreen.hideAsync();
  }, [cargadas, error]);

  if (!cargadas && !error) return null;

  const base = modo === 'oscuro' ? DarkTheme : DefaultTheme;
  const temaNavegacion = {
    ...base,
    colors: { ...base.colors, background: c.bg, card: c.surface, text: c.fg, border: c.border, primary: c.accent },
  };

  return (
    <SQLiteProvider databaseName={NOMBRE_BD} onInit={prepararBaseDatos}>
      <ThemeProvider value={temaNavegacion}>
        <CargarPerfil />
        <StatusBar style={modo === 'oscuro' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />
      </ThemeProvider>
    </SQLiteProvider>
  );
}
