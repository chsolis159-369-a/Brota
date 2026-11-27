import type { SupabaseClient } from '@supabase/supabase-js';

import type { Candidato, Certeza, CultivoContexto, Foto, Reconocimiento, Turno } from '../../supabase/functions/_shared/agente';
import { asegurarSesion, supabase } from './supabase';

export type { Candidato, Certeza, CultivoContexto, Foto, Reconocimiento, Turno };
export { LIMITE_FOTOS_DIARIO, MAX_PREGUNTAS_RECO } from '../../supabase/functions/_shared/agente';

/** Motivo por el que el Agente con IA no respondió. */
export class ErrorAgente extends Error {
  constructor(readonly motivo: 'limite' | 'limite_fotos' | 'sin_conexion') {
    super(motivo);
  }
}

export type PedidoAgente = {
  pregunta: string;
  historial: Turno[];
  cultivos: CultivoContexto[];
  mes: number;
  foto?: Foto;
  /** Preguntas de reconocimiento que el agente ya hizo en esta ronda (D-31). */
  preguntasHechas?: number;
};

/** Respuesta del Agente con IA: el texto y, si reconoció algo, los candidatos y la pregunta (D-31). */
export type RespuestaIA = { texto: string; reconocimiento: Reconocimiento | null };

/** Hay Agente con IA si la app tiene servidor configurado. */
export const hayAgenteIA = (cliente: SupabaseClient | null = supabase): boolean => cliente !== null;

type ContextoError = { status?: number; json?: () => Promise<unknown> };

/** Lee el motivo de un 429: "limite_fotos" o, si no se puede leer, "limite". */
async function motivoLimite(contexto: ContextoError): Promise<'limite' | 'limite_fotos'> {
  try {
    const cuerpo = (await contexto.json?.()) as { error?: string } | undefined;
    return cuerpo?.error === 'limite_fotos' ? 'limite_fotos' : 'limite';
  } catch {
    return 'limite';
  }
}

/**
 * Pregunta al Agente con IA (Edge Function `agente`), con una foto opcional (D-30). La clave de
 * Anthropic nunca está en la app. Lanza ErrorAgente('limite' o 'limite_fotos') si se pasó un límite
 * diario y ErrorAgente('sin_conexion') ante cualquier otra falla.
 */
export async function preguntarAgenteIA(pedido: PedidoAgente, cliente: SupabaseClient | null = supabase): Promise<RespuestaIA> {
  if (!cliente) throw new ErrorAgente('sin_conexion');
  try {
    await asegurarSesion(cliente);
  } catch {
    throw new ErrorAgente('sin_conexion');
  }
  const { data, error } = await cliente.functions.invoke<{ texto?: string; reconocimiento?: Reconocimiento | null }>('agente', { body: pedido });
  if (error) {
    const contexto = (error as { context?: ContextoError }).context;
    if (contexto?.status === 429) throw new ErrorAgente(await motivoLimite(contexto));
    throw new ErrorAgente('sin_conexion');
  }
  if (!data?.texto) throw new ErrorAgente('sin_conexion');
  return { texto: data.texto, reconocimiento: data.reconocimiento ?? null };
}
