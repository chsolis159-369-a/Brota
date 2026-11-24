/**
 * Edge Function `agente`: el guía de cultivo de BROTA con Claude.
 * - Exige una sesión de Supabase (anónima o con cuenta).
 * - Rechaza sin llamar al modelo las consultas de dosis, consumo o venta.
 * - Limita las preguntas por usuario y por día (tabla agente_uso, D-27).
 * - Usa el historial de los cultivos solo si RevenueCat confirma el entitlement `pro` (H5).
 * Secretos (nunca en la app): ANTHROPIC_API_KEY, ANTHROPIC_MODEL (opcional), REVENUECAT_SECRET_KEY (H5).
 * Supabase inyecta SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY.
 */
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

import {
  LIMITE_DIARIO,
  MODELO_POR_DEFECTO,
  NEGATIVA,
  SISTEMA,
  armarMensajes,
  esConsultaProhibida,
  motivoDeErrorIA,
  textoDeRespuesta,
  validarPedido,
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
  const { data: permitido, error: errorUso } = await admin.rpc('agente_consumir', { p_usuario: user.id, p_limite: LIMITE_DIARIO });
  if (errorUso) {
    console.error('agente_consumir', errorUso.message);
    return json({ error: 'servidor' }, 500);
  }
  if (!permitido) return json({ error: 'limite' }, 429);

  const pro = await esPro(user.id).catch(() => false);

  try {
    const respuesta = await anthropic.beta.messages.create({
      model: MODELO,
      // Respuestas breves por diseño (unas 120 palabras); con margen para el razonamiento.
      max_tokens: 2048,
      output_config: { effort: 'low' },
      // Si el modelo rechaza por una regla de seguridad, el servidor reintenta con otro modelo.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [{ type: 'text', text: SISTEMA, cache_control: { type: 'ephemeral' } }],
      messages: armarMensajes(v.pedido, pro),
    });
    return json({ texto: textoDeRespuesta(respuesta), pro });
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
