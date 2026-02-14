-- 1. Create Teams Table
create table if not exists public.teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now()
);

-- 2. Create Team Members Table
create table if not exists public.team_members (
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member',
  created_at timestamptz default now(),
  primary key (team_id, user_id)
);

-- 3. Add team_id to connections
alter table public.connections 
add column if not exists team_id uuid references public.teams(id) on delete set null;

-- 4. Utility Functions (Security Definer to avoid RLS recursion)
create or replace function public.check_membership(t_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.team_members
    where team_id = t_id and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer set search_path = public;

-- 5. Enable RLS
alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- 6. RLS for Teams
drop policy if exists "Admins manage teams" on public.teams;
drop policy if exists "Members view their teams" on public.teams;
drop policy if exists "Admin total teams" on public.teams;
drop policy if exists "Select teams" on public.teams;

create policy "Admin total teams" on public.teams
  for all using (public.is_admin());

create policy "Select teams" on public.teams
  for select using (public.check_membership(id));

-- 7. RLS for Team Members
drop policy if exists "Admins manage members" on public.team_members;
drop policy if exists "Members view team members" on public.team_members;
drop policy if exists "Admin total members" on public.team_members;
drop policy if exists "Select members" on public.team_members;

create policy "Admin total members" on public.team_members
  for all using (public.is_admin());

create policy "Select members" on public.team_members
  for select using (
    user_id = auth.uid() 
    or 
    public.check_membership(team_id)
  );

-- 8. UPDATE Connections RLS (AS QUE ESTAVAM FALTANDO)
drop policy if exists "Ver proprias ou time conexoes" on public.connections;
drop policy if exists "Admin total connections" on public.connections;
drop policy if exists "Admins gerenciam conexoes" on public.connections;
drop policy if exists "Dono gerencia conexao" on public.connections;

-- Política de VISUALIZAÇÃO (SELECT)
create policy "Conexoes visiveis" on public.connections
  for select using (
    public.is_admin()
    or 
    user_id = auth.uid() 
    or 
    team_id in (select tm.team_id from public.team_members tm where tm.user_id = auth.uid())
  );

-- Política de ATUALIZAÇÃO (UPDATE) - PERMITE ADMIN OU DONO
create policy "Gerenciar conexoes" on public.connections
  for update using (
    public.is_admin() or user_id = auth.uid()
  ) with check (
    public.is_admin() or user_id = auth.uid()
  );

-- Política de INSERÇÃO (INSERT) - PERMITE ADMIN OU DONO
drop policy if exists "Inserir proprias conexoes" on public.connections;
create policy "Inserir conexoes" on public.connections
  for insert with check (
    public.is_admin() or user_id = auth.uid()
  );

-- Política de DELEÇÃO (DELETE)
drop policy if exists "Deletar proprias conexoes" on public.connections;
create policy "Deletar conexoes" on public.connections
  for delete using (
    public.is_admin() or user_id = auth.uid()
  );
