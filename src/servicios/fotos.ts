import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { nuevoId } from '@/util/id';

/**
 * Elige una foto de la galería y la copia a la carpeta de documentos de la app (D-08: las fotos
 * quedan solo en el dispositivo). El selector del sistema no pide permiso de acceso a la galería.
 * Devuelve la URI de la copia, o null si se canceló.
 */
export async function elegirFoto(): Promise<string | null> {
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
  const asset = r.canceled ? undefined : r.assets[0];
  if (!asset) return null;
  const carpeta = new Directory(Paths.document, 'fotos');
  carpeta.create({ idempotent: true });
  const origen = new File(asset.uri);
  const extension = origen.extension.replace('.', '') || 'jpg';
  const destino = new File(carpeta, `${nuevoId()}.${extension}`);
  await origen.copy(destino);
  return destino.uri;
}

/** Borra el archivo de una foto; si ya no existe, no hace nada. */
export function borrarArchivo(uri: string): void {
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // Si no se puede borrar, no se interrumpe el borrado del cultivo.
  }
}
