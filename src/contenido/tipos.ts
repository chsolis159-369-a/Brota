/** Tipos de content/modulos.json (extraído del prototipo; ver tools/extraer-contenido.js). */

export type Categoria = 'huerta' | 'nutricion' | 'hidro' | 'inerte' | 'luz' | 'plagas' | 'cannabis';

export type Dificultad = 1 | 2 | 3;

export type Pregunta = {
  /** Dificultad: 1 básica, 2 intermedia, 3 trampa. */
  d: Dificultad;
  /** Enunciado. */
  p: string;
  /** Única respuesta correcta. */
  ok: string;
  /** Las tres incorrectas. */
  no: [string, string, string];
  /** Explicación. */
  e: string;
};

export type Leccion = { t: string; x: string };

export type Modulo = {
  id: string;
  cat: Categoria;
  /** Puntos mínimos para desbloquear. */
  req: number;
  /** Módulos que hay que aprobar antes. */
  pre?: string[];
  /** Solo Pro. */
  pro?: boolean;
  aviso?: string;
  t: string;
  d: string;
  lec: Leccion[];
  quiz: Pregunta[];
  banco: Pregunta[];
};

export type TerminoGlosario = [termino: string, definicion: string];

export type Contenido = {
  fuente: string;
  version: string;
  modulos: Modulo[];
  glosario: TerminoGlosario[];
};
