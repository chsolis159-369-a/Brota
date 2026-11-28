/**
 * Edge Function `agente`: el guía de cultivo de BROTA con Claude.
 * - Exige una sesión de Supabase (anónima o con cuenta).
 * - Rechaza sin llamar al modelo las consultas de dosis, consumo o venta.
 * - Limita las preguntas y las fotos por usuario y por día (tabla agente_uso, D-27 y D-30).
 * - Analiza una foto de la planta, una hoja, una plaga o un insecto (D-30).
 * - Reconoce con fotos y preguntas (D-31): responde con salida estructurada (texto, candidatos con su
 *   confianza, una pregunta con opciones, foto puntual, derivar). Si está KINDWISE_API_KEY, antes consulta
 *   el servicio plant.id con la foto y le pasa el resultado al modelo como un dato más.
 * - Límite diario y memoria según el plan (D-34): Pro (entitlement `pro` de RevenueCat, H5) usa el historial
 *   de los cultivos y 30 preguntas por día; Gratis, los datos básicos y 6 preguntas por día.
 * Secretos (nunca en la app): ANTHROPIC_API_KEY, ANTHROPIC_MODEL (opcional), REVENUECAT_SECRET_KEY (H5),
 * KINDWISE_API_KEY (opcional, D-31).
 * Supabase inyecta SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY.
 */
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

import {
  ESQUEMA_RESPUESTA,
  LIMITE_DIARIO,
  LIMITE_FOTOS_DIARIO,
  MODELO_POR_DEFECTO,
  NEGATIVA,
  SISTEMA,
  armarMensajes,
  candidatosDelServicio,
  esConsultaProhibida,
  motivoDeErrorIA,
  pedidoPlantId,
  respuestaDelModelo,
  validarPedido,
  type CandidatoServicio,
  type Foto,
} from '../_shared/agente.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

// El SDK reintenta solo los errores transitorios (429, 5xx y de conexión).
const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY'), timeout: 30_000, maxRetries: 2 });
const MODELO = Deno.env.get('ANTHROPIC_MODEL') || MODELO_POR_DEFECTO;

/** Pro se valida en el servidor con RevenueCat. Sin la clave (antes de H5), nadie es Pro para el agente. */
async function esPro(usuario: string): Promise<boolean> {
  const clave = Deno.env.get('REVENUECAT_SECRET_KEY');
  if (!clave) return false;
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(usuario)}`, {
    headers: { Authorization: `Bearer ${clave}` },
  });
  if (!res.ok) return false;
  const datos = await res.json();
  const pro = datos?.subscriber?.entitlements?.pro;
  return !!pro && (!pro.expires_date || new Date(pro.expires_date).getTime() > Date.now());
}

/**
 * Servicio especializado de reconocimiento (plant.id de Kindwise), opcional: sin la clave, o si falla o
 * tarda más de 10 s, el modelo reconoce solo con la foto. Cada llamada consume créditos de Kindwise.
 */
async function reconocerConServicio(foto: Foto): Promise<CandidatoServicio[]> {
  const clave = Deno.env.get('KINDWISE_API_KEY');
  if (!clave) return [];
  try {
    const { url, cuerpo } = pedidoPlantId(foto);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Api-Key': clave, 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error('plant.id', res.status);
      return [];
    }
    return candidatosDelServicio(await res.json());
  } catch (e) {
    console.error('plant.id', e instanceof Error ? e.message : e);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'metodo' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const usuarioCliente = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const {
    data: { user },
  } = await usuarioCliente.auth.getUser();
  if (!user) return json({ error: 'no_autorizado' }, 401);

  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    return json({ error: 'pedido_invalido' }, 400);
  }
  const v = validarPedido(cuerpo);
  if (!v.ok) return json({ error: v.error }, 400);

  if (esConsultaProhibida(v.pedido.pregunta)) return json({ texto: NEGATIVA });

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const conFoto = v.pedido.foto !== null;
  // El plan lo decide el servidor (RevenueCat): define el límite diario y la memoria del agente (D-34).
  const pro = await esPro(user.id).catch(() => false);
  const { data: uso, error: errorUso } = await admin.rpc('agente_consumir', {
    p_usuario: user.id,
    p_limite: pro ? LIMITE_DIARIO.pro : LIMITE_DIARIO.gratis,
    p_foto: conFoto,
    p_limite_fotos: LIMITE_FOTOS_DIARIO,
  });
  if (errorUso) {
    console.error('agente_consumir', errorUso.message);
    return json({ error: 'servidor' }, 500);
  }
  if (uso === 'limite' || uso === 'limite_fotos') return json({ error: uso }, 429);
  if (uso !== 'ok') {
    console.error('agente_consumir', uso);
    return json({ error: 'servidor' }, 500);
  }

  const servicio = v.pedido.foto ? await reconocerConServicio(v.pedido.foto) : [];

  try {
    const respuesta = await anthropic.beta.messages.create({
      model: MODELO,
      // Respuestas breves por diseño (unas 120 palabras) más los candidatos; con margen para el razonamiento.
      max_tokens: 2048,
      // Con foto, un poco más de esfuerzo: así revisa la imagen con detalle antes de responder.
      // Salida estructurada (D-31): el texto y el reconocimiento en un JSON con el esquema fijo.
      output_config: { effort: conFoto ? 'medium' : 'low', format: { type: 'json_schema', schema: ESQUEMA_RESPUESTA } },
      // Si el modelo rechaza por una regla de seguridad, el servidor reintenta con otro modelo.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [{ type: 'text', text: SISTEMA, cache_control: { type: 'ephemeral' } }],
      messages: armarMensajes(v.pedido, pro, servicio),
    });
    const { texto, reconocimiento } = respuestaDelModelo(respuesta, v.pedido.preguntasHechas);
    return json({ texto, reconocimiento, pro });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ error: 'ocupado' }, 503);
    if (e instanceof Anthropic.APIError) {
      console.error('Anthropic', e.status, e.message);
      return json({ error: 'ia', motivo: motivoDeErrorIA(e.status, e.message) }, 502);
    }
    console.error(e);
    return json({ error: 'servidor' }, 500);
  }
});
