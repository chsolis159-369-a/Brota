-- Uso diario del Agente con IA por usuario (límite de preguntas, D-27).
create table if not exists public.agente_uso (
  usuario uuid not null references auth.users (id) on delete cascade,
  dia date not null,
  preguntas integer not null default 0 check (preguntas >= 0),
  primary key (usuario, dia)
);

alter table public.agente_uso enable row level security;

-- Cada usuario puede ver solo su propio uso. Nadie escribe directo: solo la función de abajo.
create policy "agente_uso: ver el propio"
  on public.agente_uso for select
  using (auth.uid() = usuario);

-- Suma una pregunta al día del usuario (hora de Argentina) si no pasó el límite. Devuelve si la permitió.
create or replace function public.agente_consumir(p_usuario uuid, p_limite integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_preguntas integer;
begin
  insert into public.agente_uso as u (usuario, dia, preguntas)
  values (p_usuario, (now() at time zone 'America/Argentina/Buenos_Aires')::date, 1)
  on conflict (usuario, dia) do update
    set preguntas = u.preguntas + 1
    where u.preguntas < p_limite
  returning u.preguntas into v_preguntas;
  return v_preguntas is not null;
end;
$$;

revoke all on function public.agente_consumir(uuid, integer) from public, anon, authenticated;
grant execute on function public.agente_consumir(uuid, integer) to service_role;
