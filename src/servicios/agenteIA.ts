import type { SupabaseClient } from '@supabase/supabase-js';

import type { CultivoContexto, Turno } from '../../supabase/functions/_shared/agente';
import { asegurarSesion, supabase } from './supabase';

export type { CultivoContexto, Turno };

/** Motivo por el que el Agente con IA no respondió. */
export class ErrorAgente extends Error {
  constructor(readonly motivo: 'limite' | 'sin_conexion') {
    super(motivo);
  }
}

export type PedidoAgente = { pregunta: string; historial: Turno[]; cultivos: CultivoContexto[]; mes: number };

/** Hay Agente con IA si la app tiene servidor configurado. */
export const hayAgenteIA = (cliente: SupabaseClient | null = supabase): boolean => cliente !== null;

/**
 * Pregunta al Agente con IA (Edge Function `agente`). La clave de Anthropic nunca está en la app.
 * Lanza ErrorAgente('limite') si se pasó el límite diario y ErrorAgente('sin_conexion') ante cualquier otra falla.
 */
export async function preguntarAgenteIA(pedido: PedidoAgente, cliente: SupabaseClient | null = supabase): Promise<string> {
  if (!cliente) throw new ErrorAgente('sin_conexion');
  try {
    await asegurarSesion(cliente);
  } catch {
    throw new ErrorAgente('sin_conexion');
  }
  const { data, error } = await cliente.functions.invoke<{ texto?: string }>('agente', { body: pedido });
  if (error) {
    const estado = (error as { context?: { status?: number } }).context?.status;
    throw new ErrorAgente(estado === 429 ? 'limite' : 'sin_conexion');
  }
  if (!data?.texto) throw new ErrorAgente('sin_conexion');
  return data.texto;
}
