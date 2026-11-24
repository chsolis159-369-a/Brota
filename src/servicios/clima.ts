/**
 * Clima. La app depende de la interfaz ProveedorClima; la primera implementación es Open-Meteo.
 * Aviso: el plan gratis de Open-Meteo es solo para uso no comercial. Antes de publicar con
 * suscripciones hay que contratar su plan comercial o cambiar de proveedor (CLAUDE.md > Stack).
 */

export type DiaPronostico = {
  /** AAAA-MM-DD */
  fecha: string;
  max: number;
  min: number;
  /** Probabilidad de lluvia, 0 a 100. */
  lluvia: number;
  codigo: number;
};

export type Clima = {
  hoy: { t: number; min: number; max: number; lluvia: number; viento: number; codigo: number };
  /** Próximos días, empezando por mañana. */
  dias: DiaPronostico[];
  /** Momento de la consulta (ISO). */
  consultado: string;
};

export interface ProveedorClima {
  pronostico(lat: number, lon: number): Promise<Clima>;
}

/** Descripción del código del tiempo (WMO) con las palabras del prototipo; ver DECISIONS D-19. */
export type DescripcionClima = 'soleado' | 'parcial' | 'nublado' | 'niebla' | 'lluvia' | 'nieve' | 'tormenta';

export function descripcionClima(codigo: number): DescripcionClima {
  if (codigo <= 1) return 'soleado';
  if (codigo === 2) return 'parcial';
  if (codigo === 3) return 'nublado';
  if (codigo === 45 || codigo === 48) return 'niebla';
  if ((codigo >= 71 && codigo <= 77) || codigo === 85 || codigo === 86) return 'nieve';
  if (codigo >= 95) return 'tormenta';
  return 'lluvia';
}

type RespuestaOpenMeteo = {
  current: { time: string; temperature_2m: number; weather_code: number; wind_speed_10m: number };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[];
  };
};

/** Convierte la respuesta de Open-Meteo al formato de la app (redondeado como el prototipo). */
export function desdeOpenMeteo(r: RespuestaOpenMeteo, ahora: Date = new Date()): Clima {
  const d = r.daily;
  const dia = (i: number): DiaPronostico => ({
    fecha: d.time[i]!,
    max: Math.round(d.temperature_2m_max[i]!),
    min: Math.round(d.temperature_2m_min[i]!),
    lluvia: Math.round(d.precipitation_probability_max[i] ?? 0),
    codigo: d.weather_code[i]!,
  });
  const hoy = dia(0);
  return {
    hoy: {
      t: Math.round(r.current.temperature_2m),
      min: hoy.min,
      max: hoy.max,
      lluvia: hoy.lluvia,
      viento: Math.round(r.current.wind_speed_10m),
      codigo: r.current.weather_code,
    },
    dias: d.time.slice(1, 5).map((_, i) => dia(i + 1)),
    consultado: ahora.toISOString(),
  };
}

export const openMeteo: ProveedorClima = {
  async pronostico(lat, lon) {
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}` +
      '&current=temperature_2m,weather_code,wind_speed_10m' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
      '&timezone=auto&forecast_days=5&wind_speed_unit=kmh';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo respondió ${res.status}`);
    return desdeOpenMeteo((await res.json()) as RespuestaOpenMeteo);
  },
};

/** Ubicación por defecto si no hay permiso de ubicación (D-19). */
export const UBICACION_POR_DEFECTO = { lat: -34.61, lon: -58.38, ciudad: 'Buenos Aires' };

/** Probabilidad de lluvia de mañana: la usan las tareas de drenaje. */
export const lluviaManana = (c: Clima | null): number | null => c?.dias[0]?.lluvia ?? null;
