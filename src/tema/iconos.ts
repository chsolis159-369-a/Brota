import type { AndroidSymbol } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';

/** Ícono con su versión de iOS (SF Symbols) y de Android (Material Symbols), vía expo-symbols (D-29). */
export type DefIcono = { ios: SFSymbol; android: AndroidSymbol };

const i = (ios: SFSymbol, android: AndroidSymbol): DefIcono => ({ ios, android });

/**
 * Un solo estilo (D-33): íconos de línea, sin rellenos, con el mismo grosor en toda la app y la misma idea
 * en iOS y en Android. En iOS, solo símbolos de SF Symbols 4 o anteriores (iOS 16.4, el mínimo de la app).
 */
export const ICONOS = {
  tarea: i('checkmark.circle', 'task_alt'),
  check: i('checkmark', 'check'),
  puntos: i('star', 'star'),
  racha: i('flame', 'local_fire_department'),
  nivel: i('medal', 'military_tech'),
  cultivo: i('leaf', 'psychiatry'),
  cosecha: i('basket', 'shopping_basket'),
  alerta: i('exclamationmark.triangle', 'warning'),
  registros: i('list.bullet.clipboard', 'assignment'),
  tiempo: i('clock', 'schedule'),
  logro: i('trophy', 'emoji_events'),
  bloqueado: i('lock', 'lock'),
  consejo: i('lightbulb', 'lightbulb'),
  camara: i('camera', 'photo_camera'),
  galeria: i('photo.on.rectangle', 'photo_library'),
  enviar: i('paperplane', 'send'),
  ia: i('sparkles', 'auto_awesome'),
  pro: i('rosette', 'workspace_premium'),
  examen: i('checklist', 'fact_check'),
  glosario: i('character.book.closed', 'dictionary'),
  volver: i('chevron.left', 'chevron_left'),
  ir: i('chevron.right', 'chevron_right'),
  ubicacion: i('mappin.and.ellipse', 'location_on'),
  duda: i('questionmark.circle', 'help'),
  info: i('info.circle', 'info'),
  privacidad: i('lock.shield', 'shield_lock'),
  ajustes: i('gearshape', 'settings'),
  terminos: i('doc.text', 'description'),
  // Dónde está el cultivo (plantillas)
  interior: i('house', 'home'),
  exterior: i('sun.max', 'sunny'),
  // Clima (descripcionClima)
  soleado: i('sun.max', 'sunny'),
  parcial: i('cloud.sun', 'partly_cloudy_day'),
  nublado: i('cloud', 'cloud'),
  niebla: i('cloud.fog', 'foggy'),
  lluvia: i('cloud.rain', 'rainy'),
  nieve: i('cloud.snow', 'weather_snowy'),
  tormenta: i('cloud.bolt.rain', 'thunderstorm'),
  // Tipos de registro
  Riego: i('drop', 'water_drop'),
  Fertilizante: i('testtube.2', 'science'),
  Poda: i('scissors', 'content_cut'),
  Plaga: i('ant', 'pest_control'),
  Observación: i('eye', 'visibility'),
  // Categorías de módulos
  huerta: i('carrot', 'nutrition'),
  nutricion: i('testtube.2', 'science'),
  hidro: i('water.waves', 'water'),
  inerte: i('square.3.layers.3d', 'layers'),
  luz: i('sun.max', 'light_mode'),
  plagas: i('ant', 'pest_control'),
  cannabis: i('leaf', 'eco'),
} satisfies Record<string, DefIcono>;

export type NombreIcono = keyof typeof ICONOS;

/** Dos tamaños fijos para que los íconos se vean iguales en toda la app (D-32). */
export const TAMANO_ICONO = { chico: 18, normal: 22 } as const;
