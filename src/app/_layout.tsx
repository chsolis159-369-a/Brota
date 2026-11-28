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

import { NOMBRE_BD, prepararBaseDatos } from '@/db';
import { capturarErrores } from '@/servicios/errores';
import { borrarArchivo } from '@/servicios/fotos';
import { useDatos } from '@/store/datos';
import { aplicarPreferencias } from '@/store/preferencias';
import { animacionPantallas, useMovimientoReducido } from '@/tema/movimiento';
import { useTema } from '@/tema/useTema';

void SplashScreen.preventAutoHideAsync();
capturarErrores();
// Idioma y modo de pantalla elegidos en Configuración (D-35), antes de dibujar la primera pantalla.
aplicarPreferencias();

/** Carga los datos locales (perfil, cultivos, actividad y progreso) al abrir la app. */
function CargarDatos() {
  const db = useSQLiteContext();
  useEffect(() => {
    void useDatos.getState().cargar(db, { borrarArchivo });
  }, [db]);
  return null;
}

export default function RaizLayout() {
  const { modo, c } = useTema();
  const reducido = useMovimientoReducido();
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
        <CargarDatos />
        <StatusBar style={modo === 'oscuro' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, ...animacionPantallas(reducido) }} />
      </ThemeProvider>
    </SQLiteProvider>
  );
}
