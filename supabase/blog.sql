-- ============================================================
-- BLOG MODULE — Nauta Contabilidade
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- Extensão para gerar UUIDs
create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────
-- CATEGORIAS
-- ────────────────────────────────────────────
create table if not exists categorias (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  slug      text not null unique,
  criado_em timestamp with time zone default now()
);

-- ────────────────────────────────────────────
-- TAGS
-- ────────────────────────────────────────────
create table if not exists tags (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  slug      text not null unique,
  criado_em timestamp with time zone default now()
);

-- ────────────────────────────────────────────
-- POSTS
-- ────────────────────────────────────────────
create table if not exists posts (
  id               uuid primary key default gen_random_uuid(),
  titulo           text not null,
  slug             text not null unique,
  resumo           text,
  conteudo         text,
  imagem_destaque  text,
  autor            text default 'Equipe Nauta',
  categoria_id     uuid references categorias(id) on delete set null,
  status           text not null default 'rascunho' check (status in ('rascunho', 'publicado')),
  criado_em        timestamp with time zone default now(),
  atualizado_em    timestamp with time zone default now()
);

-- ────────────────────────────────────────────
-- POSTS_TAGS (N:N)
-- ────────────────────────────────────────────
create table if not exists posts_tags (
  post_id  uuid references posts(id) on delete cascade,
  tag_id   uuid references tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- ────────────────────────────────────────────
-- TRIGGER: atualiza atualizado_em automaticamente
-- ────────────────────────────────────────────
create or replace function update_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_posts_atualizado_em on posts;
create trigger trg_posts_atualizado_em
  before update on posts
  for each row execute function update_atualizado_em();

-- ────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────

-- Posts: leitura pública apenas para publicados
alter table posts enable row level security;
drop policy if exists "posts_public_read" on posts;
create policy "posts_public_read" on posts
  for select using (status = 'publicado');

-- Admin: acesso total para usuários autenticados
drop policy if exists "posts_admin_all" on posts;
create policy "posts_admin_all" on posts
  for all using (auth.role() = 'authenticated');

-- Categorias: leitura pública
alter table categorias enable row level security;
drop policy if exists "categorias_public_read" on categorias;
create policy "categorias_public_read" on categorias
  for select using (true);
drop policy if exists "categorias_admin_all" on categorias;
create policy "categorias_admin_all" on categorias
  for all using (auth.role() = 'authenticated');

-- Tags: leitura pública
alter table tags enable row level security;
drop policy if exists "tags_public_read" on tags;
create policy "tags_public_read" on tags
  for select using (true);
drop policy if exists "tags_admin_all" on tags;
create policy "tags_admin_all" on tags
  for all using (auth.role() = 'authenticated');

-- Posts_tags: leitura pública
alter table posts_tags enable row level security;
drop policy if exists "posts_tags_public_read" on posts_tags;
create policy "posts_tags_public_read" on posts_tags
  for select using (true);
drop policy if exists "posts_tags_admin_all" on posts_tags;
create policy "posts_tags_admin_all" on posts_tags
  for all using (auth.role() = 'authenticated');

-- ────────────────────────────────────────────
-- SEED: Categorias iniciais
-- ────────────────────────────────────────────
insert into categorias (nome, slug) values
  ('Fiscal',                    'fiscal'),
  ('Trabalhista',               'trabalhista'),
  ('Empresarial',               'empresarial'),
  ('Contabilidade Eleitoral',   'contabilidade-eleitoral'),
  ('MEI',                       'mei'),
  ('Planejamento Tributário',   'planejamento-tributario')
on conflict (slug) do nothing;

-- ────────────────────────────────────────────
-- STORAGE: Bucket para imagens do blog
-- Execute separadamente no dashboard do Supabase Storage
-- ou via SQL abaixo:
-- ────────────────────────────────────────────
-- insert into storage.buckets (id, name, public)
-- values ('blog-images', 'blog-images', true)
-- on conflict do nothing;

-- Política de upload para usuários autenticados
-- create policy "blog_images_upload" on storage.objects
--   for insert with check (bucket_id = 'blog-images' and auth.role() = 'authenticated');
-- create policy "blog_images_public_read" on storage.objects
--   for select using (bucket_id = 'blog-images');
