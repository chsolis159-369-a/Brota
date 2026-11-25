import type { AndroidSymbol } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';

/** Ícono con su versión de iOS (SF Symbols) y de Android (Material Symbols), vía expo-symbols (D-29). */
export type DefIcono = { ios: SFSymbol; android: AndroidSymbol };

const i = (ios: SFSymbol, android: AndroidSymbol): DefIcono => ({ ios, android });

export const ICONOS = {
  tarea: i('checkmark.circle.fill', 'task_alt'),
  check: i('checkmark', 'check'),
  puntos: i('star.fill', 'star'),
  racha: i('flame.fill', 'local_fire_department'),
  nivel: i('medal.fill', 'military_tech'),
  cultivo: i('leaf.fill', 'eco'),
  cosecha: i('basket.fill', 'agriculture'),
  alerta: i('exclamationmark.triangle.fill', 'warning'),
  registros: i('list.bullet.clipboard', 'edit_note'),
  tiempo: i('clock.fill', 'schedule'),
  logro: i('trophy.fill', 'emoji_events'),
  bloqueado: i('lock.fill', 'lock'),
  consejo: i('lightbulb.fill', 'lightbulb'),
  camara: i('camera.fill', 'photo_camera'),
  galeria: i('photo.on.rectangle', 'photo_library'),
  enviar: i('paperplane.fill', 'send'),
  ia: i('sparkles', 'auto_awesome'),
  pro: i('crown.fill', 'workspace_premium'),
  examen: i('graduationcap.fill', 'school'),
  glosario: i('book.closed.fill', 'menu_book'),
  volver: i('chevron.left', 'chevron_left'),
  ir: i('chevron.right', 'chevron_right'),
  ubicacion: i('location.fill', 'location_on'),
  // Clima (descripcionClima)
  soleado: i('sun.max.fill', 'sunny'),
  parcial: i('cloud.sun.fill', 'partly_cloudy_day'),
  nublado: i('cloud.fill', 'cloud'),
  niebla: i('cloud.fog.fill', 'foggy'),
  lluvia: i('cloud.rain.fill', 'rainy'),
  nieve: i('snowflake', 'ac_unit'),
  tormenta: i('cloud.bolt.rain.fill', 'thunderstorm'),
  // Tipos de registro
  Riego: i('drop.fill', 'water_drop'),
  Fertilizante: i('flask.fill', 'science'),
  Poda: i('scissors', 'content_cut'),
  Plaga: i('ant.fill', 'pest_control'),
  Observación: i('eye.fill', 'visibility'),
  // Categorías de módulos
  huerta: i('carrot.fill', 'yard'),
  nutricion: i('flask.fill', 'science'),
  hidro: i('drop.fill', 'water_drop'),
  inerte: i('square.grid.3x3.fill', 'grain'),
  luz: i('sun.max.fill', 'light_mode'),
  plagas: i('ant.fill', 'pest_control'),
  cannabis: i('leaf.fill', 'eco'),
} satisfies Record<string, DefIcono>;

export type NombreIcono = keyof typeof ICONOS;
