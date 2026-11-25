import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/**
 * Lado mayor de la foto que se manda al Agente (D-30). El costo de una imagen depende de su
 * resolución: 1280 px alcanzan para ver manchas, insectos y bordes de hojas.
 */
export const LADO_MAX_FOTO = 1280;

export type FotoParaAnalizar = { uri: string; base64: string; tipo: 'image/jpeg' };

export type ResultadoFoto = { tipo: 'ok'; foto: FotoParaAnalizar } | { tipo: 'cancelada' } | { tipo: 'sin_permiso' } | { tipo: 'error' };

/**
 * Saca una foto con la cámara o la elige de la galería, y la achica y comprime para mandarla al
 * Agente. La cámara pide permiso recién acá; la galería usa el selector del sistema, sin permiso.
 * La foto no se guarda en la galería ni en el teléfono: solo queda en la caché mientras dura el chat.
 */
export async function fotoParaAnalizar(origen: 'camara' | 'galeria'): Promise<ResultadoFoto> {
  try {
    if (origen === 'camara') {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) return { tipo: 'sin_permiso' };
    }
    const opciones: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
    const r = origen === 'camara' ? await ImagePicker.launchCameraAsync(opciones) : await ImagePicker.launchImageLibraryAsync(opciones);
    const asset = r.canceled ? undefined : r.assets[0];
    if (!asset) return { tipo: 'cancelada' };

    const contexto = ImageManipulator.manipulate(asset.uri);
    const grande = Math.max(asset.width, asset.height) > LADO_MAX_FOTO;
    const ajustada = grande ? contexto.resize(asset.width >= asset.height ? { width: LADO_MAX_FOTO } : { height: LADO_MAX_FOTO }) : contexto;
    const imagen = await ajustada.renderAsync();
    const guardada = await imagen.saveAsync({ base64: true, compress: 0.7, format: SaveFormat.JPEG });
    if (!guardada.base64) return { tipo: 'error' };
    return { tipo: 'ok', foto: { uri: guardada.uri, base64: guardada.base64, tipo: 'image/jpeg' } };
  } catch {
    return { tipo: 'error' };
  }
}
