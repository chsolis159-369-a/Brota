import * as Location from 'expo-location';
import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';

import { openMeteo, UBICACION_POR_DEFECTO, type Clima, type ProveedorClima } from '@/servicios/clima';

const CLAVE = 'clima';
/** Se vuelve a consultar el pronóstico si el guardado tiene más de una hora. */
const VIGENCIA_MS = 60 * 60 * 1000;

type Guardado = { clima: Clima; ciudad: string };

type EstadoClima = {
  clima: Clima | null;
  ciudad: string;
  cargando: boolean;
  actualizar: (proveedor?: ProveedorClima) => Promise<void>;
};

/** Ubicación aproximada con permiso; si no hay permiso o falla, la ubicación por defecto (D-19). */
async function ubicacion(): Promise<{ lat: number; lon: number; ciudad: string }> {
  try {
    let permiso = await Location.getForegroundPermissionsAsync();
    if (permiso.status === 'undetermined' && permiso.canAskAgain) permiso = await Location.requestForegroundPermissionsAsync();
    if (permiso.status !== 'granted') return UBICACION_POR_DEFECTO;
    const pos =
      (await Location.getLastKnownPositionAsync()) ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
    const { latitude: lat, longitude: lon } = pos.coords;
    let ciudad = UBICACION_POR_DEFECTO.ciudad;
    try {
      const [dir] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      ciudad = dir?.city ?? dir?.subregion ?? dir?.region ?? ciudad;
    } catch {
      // Sin nombre de ciudad se usa el de la ubicación por defecto.
    }
    return { lat, lon, ciudad };
  } catch {
    return UBICACION_POR_DEFECTO;
  }
}

export const useClima = create<EstadoClima>()((set, get) => ({
  clima: null,
  ciudad: UBICACION_POR_DEFECTO.ciudad,
  cargando: false,

  async actualizar(proveedor = openMeteo) {
    if (get().cargando) return;
    set({ cargando: true });
    try {
      if (!get().clima) {
        const texto = await Storage.getItem(CLAVE);
        if (texto) set(JSON.parse(texto) as Guardado);
      }
      const actual = get().clima;
      if (actual && Date.now() - new Date(actual.consultado).getTime() < VIGENCIA_MS) return;
      const u = await ubicacion();
      const clima = await proveedor.pronostico(u.lat, u.lon);
      const guardado: Guardado = { clima, ciudad: u.ciudad };
      set(guardado);
      await Storage.setItem(CLAVE, JSON.stringify(guardado));
    } catch {
      // Sin conexión: queda el último pronóstico guardado, si hay.
    } finally {
      set({ cargando: false });
    }
  },
}));
