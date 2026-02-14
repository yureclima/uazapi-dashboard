-- 1. LIMPEZA DE POLÍTICAS E TRIGGERS (Não apaga as tabelas)
-- Isso evita erros de "already exists" sem apagar seus dados
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.is_admin();

-- 2. CRIAÇÃO DAS TABELAS (Caso não existam)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text default 'user',
  created_at timestamptz default now()
);

create table if not exists public.connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  instance_name text not null,
  token text,
  created_at timestamptz default now(),
  unique(user_id, instance_name)
);

-- 3. FUNÇÕES DE SEGURANÇA (CREATE OR REPLACE)
-- Função para criar perfil no cadastro
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Função para verificar Admin (Evita recursão infinita)
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- 4. RE-CRIAR TRIGGER
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. CONFIGURAÇÃO DE RLS (SEGURANÇA)
alter table public.profiles enable row level security;
alter table public.connections enable row level security;

-- Remover políticas antigas para evitar erro de duplicata ao rodar novamente
drop policy if exists "Ver proprio perfil" on public.profiles;
drop policy if exists "Admins veem perfis" on public.profiles;
drop policy if exists "Ver proprias conexoes" on public.connections;
drop policy if exists "Admins veem conexoes" on public.connections;
drop policy if exists "Inserir proprias conexoes" on public.connections;
drop policy if exists "Deletar proprias conexoes" on public.connections;

-- Criar novas políticas
create policy "Ver proprio perfil" on public.profiles 
  for select using (auth.uid() = id);

create policy "Admins veem perfis" on public.profiles 
  for select using (public.is_admin());

create policy "Ver proprias conexoes" on public.connections 
  for select using (user_id = auth.uid());

create policy "Admins veem conexoes" on public.connections 
  for select using (public.is_admin());

create policy "Inserir proprias conexoes" on public.connections 
  for insert with check (user_id = auth.uid());

create policy "Deletar proprias conexoes" on public.connections 
  for delete using (user_id = auth.uid());
