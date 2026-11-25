-- Fotos del Agente con IA (D-30): un límite diario propio, además del de preguntas.
alter table public.agente_uso add column if not exists fotos integer not null default 0 check (fotos >= 0);

-- Cambia la firma: se borra la versión anterior (solo la usaba la Edge Function `agente`).
drop function if exists public.agente_consumir(uuid, integer);

-- Suma una consulta (y una foto, si la hay) al día del usuario, en hora de Argentina, si no pasó los
-- límites. Devuelve 'ok', 'limite' (preguntas) o 'limite_fotos'. La fila se bloquea para que dos
-- pedidos simultáneos no se pasen del límite.
create or replace function public.agente_consumir(p_usuario uuid, p_limite integer, p_foto boolean, p_limite_fotos integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dia date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v_uso public.agente_uso%rowtype;
begin
  insert into public.agente_uso (usuario, dia, preguntas, fotos)
  values (p_usuario, v_dia, 0, 0)
  on conflict (usuario, dia) do nothing;

  select * into v_uso from public.agente_uso where usuario = p_usuario and dia = v_dia for update;
  if v_uso.preguntas >= p_limite then
    return 'limite';
  end if;
  if p_foto and v_uso.fotos >= p_limite_fotos then
    return 'limite_fotos';
  end if;

  update public.agente_uso
    set preguntas = preguntas + 1,
        fotos = fotos + (case when p_foto then 1 else 0 end)
    where usuario = p_usuario and dia = v_dia;
  return 'ok';
end;
$$;

revoke all on function public.agente_consumir(uuid, integer, boolean, integer) from public, anon, authenticated;
grant execute on function public.agente_consumir(uuid, integer, boolean, integer) to service_role;
