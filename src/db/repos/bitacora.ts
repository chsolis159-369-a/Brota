import { nuevoId } from '@/util/id';

import type { BaseDatos, TipoRegistro } from '../tipos';

/* ---------- Registros ---------- */

export type Registro = {
  id: string;
  cultivoId: string;
  /** AAAA-MM-DD HH:MM, hora local. */
  fecha: string;
  tipo: TipoRegistro;
  nota: string;
};

type FilaRegistro = { id: string; cultivo_id: string; fecha: string; tipo: TipoRegistro; nota: string };

const mapearRegistro = (f: FilaRegistro): Registro => ({
  id: f.id,
  cultivoId: f.cultivo_id,
  fecha: f.fecha,
  tipo: f.tipo,
  nota: f.nota,
});

/** Del más nuevo al más viejo. */
export async function listarRegistros(db: BaseDatos, cultivoId: string): Promise<Registro[]> {
  const filas = await db.getAllAsync<FilaRegistro>(
    'SELECT id, cultivo_id, fecha, tipo, nota FROM registros WHERE cultivo_id = ? ORDER BY fecha DESC, creado_en DESC',
    cultivoId,
  );
  return filas.map(mapearRegistro);
}

export async function crearRegistro(
  db: BaseDatos,
  datos: Omit<Registro, 'id'>,
  ahora: Date = new Date(),
): Promise<Registro> {
  const registro: Registro = { ...datos, id: nuevoId() };
  await db.runAsync(
    'INSERT INTO registros (id, cultivo_id, fecha, tipo, nota, creado_en) VALUES (?, ?, ?, ?, ?, ?)',
    [registro.id, registro.cultivoId, registro.fecha, registro.tipo, registro.nota, ahora.toISOString()],
  );
  return registro;
}

/* ---------- Mediciones ---------- */

export type ValoresMedicion = {
  watts: number | null;
  alturaCm: number | null;
  horas: number | null;
  ppfd: number | null;
  temp: number | null;
  humedad: number | null;
};

export type Medicion = ValoresMedicion & { id: string; cultivoId: string; fecha: string };

type FilaMedicion = {
  id: string;
  cultivo_id: string;
  fecha: string;
  watts: number | null;
  altura_cm: number | null;
  horas: number | null;
  ppfd: number | null;
  temp: number | null;
  humedad: number | null;
};

const mapearMedicion = (f: FilaMedicion): Medicion => ({
  id: f.id,
  cultivoId: f.cultivo_id,
  fecha: f.fecha,
  watts: f.watts,
  alturaCm: f.altura_cm,
  horas: f.horas,
  ppfd: f.ppfd,
  temp: f.temp,
  humedad: f.humedad,
});

export const medicionVacia = (v: ValoresMedicion): boolean =>
  [v.watts, v.alturaCm, v.horas, v.ppfd, v.temp, v.humedad].every((x) => x === null);

/** Del más nuevo al más viejo. */
export async function listarMediciones(db: BaseDatos, cultivoId: string): Promise<Medicion[]> {
  const filas = await db.getAllAsync<FilaMedicion>(
    'SELECT id, cultivo_id, fecha, watts, altura_cm, horas, ppfd, temp, humedad FROM mediciones WHERE cultivo_id = ? ORDER BY fecha DESC, creado_en DESC',
    cultivoId,
  );
  return filas.map(mapearMedicion);
}

/** Guarda una medición. Si no trae ningún valor no se guarda y devuelve null (regla del prototipo). */
export async function crearMedicion(
  db: BaseDatos,
  datos: Omit<Medicion, 'id'>,
  ahora: Date = new Date(),
): Promise<Medicion | null> {
  if (medicionVacia(datos)) return null;
  const m: Medicion = { ...datos, id: nuevoId() };
  await db.runAsync(
    'INSERT INTO mediciones (id, cultivo_id, fecha, watts, altura_cm, horas, ppfd, temp, humedad, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [m.id, m.cultivoId, m.fecha, m.watts, m.alturaCm, m.horas, m.ppfd, m.temp, m.humedad, ahora.toISOString()],
  );
  return m;
}

/* ---------- Fotos (solo en el dispositivo, D-08) ---------- */

export type Foto = { id: string; cultivoId: string; uri: string; fecha: string };

type FilaFoto = { id: string; cultivo_id: string; uri: string; fecha: string };

/** De la más nueva a la más vieja. */
export async function listarFotos(db: BaseDatos, cultivoId: string): Promise<Foto[]> {
  const filas = await db.getAllAsync<FilaFoto>(
    'SELECT id, cultivo_id, uri, fecha FROM fotos WHERE cultivo_id = ? ORDER BY creado_en DESC',
    cultivoId,
  );
  return filas.map((f) => ({ id: f.id, cultivoId: f.cultivo_id, uri: f.uri, fecha: f.fecha }));
}

export async function agregarFoto(db: BaseDatos, datos: Omit<Foto, 'id'>, ahora: Date = new Date()): Promise<Foto> {
  const foto: Foto = { ...datos, id: nuevoId() };
  await db.runAsync('INSERT INTO fotos (id, cultivo_id, uri, fecha, creado_en) VALUES (?, ?, ?, ?, ?)', [
    foto.id,
    foto.cultivoId,
    foto.uri,
    foto.fecha,
    ahora.toISOString(),
  ]);
  return foto;
}
