/**
 * Reconocimiento con fotos y preguntas en el chat del Agente (D-31). Funciones puras, sin React ni IO.
 */
import type { Reconocimiento } from '../../supabase/functions/_shared/agente';
import { MAX_PREGUNTAS_RECO } from '../../supabase/functions/_shared/agente';

/** Lo mínimo de un mensaje del chat que hace falta acá (MensajeChat de store/app). */
type Mensaje = { de: 'agente' | 'vos'; t: string; foto?: string; reco?: Reconocimiento };

/** Resumen del reconocimiento para el historial: así el modelo sabe qué candidatos tenía y qué preguntó (D-31). */
export function resumenReconocimiento(r: Reconocimiento): string {
  const partes: string[] = [];
  if (r.candidatos.length) partes.push(`Candidatos: ${r.candidatos.map((x) => `${x.nombre} ${Math.round(x.confianza * 100)} %`).join(', ')}.`);
  if (r.pregunta) partes.push(`Pregunta: ${r.pregunta.texto} Opciones: ${r.pregunta.opciones.join(' / ')}.`);
  if (r.pedirFoto) partes.push(`Foto pedida: ${r.pedirFoto}.`);
  return partes.length ? `(${partes.join(' ')})` : '';
}

/**
 * Preguntas de reconocimiento que el agente ya hizo en la ronda actual: desde la última foto del usuario
 * (o desde el principio del chat, si no mandó fotos). El servidor no deja pasar de MAX_PREGUNTAS_RECO (D-31).
 */
export function preguntasDeLaRonda(chat: readonly Mensaje[]): number {
  let n = 0;
  for (let i = chat.length - 1; i >= 0; i--) {
    const m = chat[i]!;
    if (m.de === 'vos' && m.foto) break;
    if (m.de === 'agente' && m.reco?.pregunta) n++;
  }
  return Math.min(n, MAX_PREGUNTAS_RECO);
}
