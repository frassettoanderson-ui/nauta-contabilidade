-- crm24: multi-empresa (multi-tenant) — Fase 1
-- 3 escritórios no mesmo painel: Nauta Contabilidade, Atuan Digital, Vértice BPO.
-- Dados existentes viram todos "Nauta". Idempotente (pode rodar de novo).

-- 1) Tabela de empresas ---------------------------------------------------
CREATE TABLE IF NOT EXISTS empresas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  nome            TEXT NOT NULL,
  cor_accent      TEXT NOT NULL DEFAULT '#0BBCD4',
  logo_url        TEXT,          -- logo p/ tema claro
  logo_branca_url TEXT,          -- logo p/ tema escuro
  ordem           INT  NOT NULL DEFAULT 0,
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed das 3 empresas (cores placeholder p/ Atuan e Vértice — trocar depois).
INSERT INTO empresas (slug, nome, cor_accent, logo_branca_url, logo_url, ordem) VALUES
  ('nauta',   'Nauta Contabilidade', '#0BBCD4', '/logo-branca.png', '/logo.png', 1),
  ('atuan',   'Atuan Digital',       '#6366F1', NULL, NULL, 2),
  ('vertice', 'Vértice BPO',         '#10B981', NULL, NULL, 3)
ON CONFLICT (slug) DO NOTHING;

-- 2) Vínculo usuário ↔ empresa (quem vê o quê) ---------------------------
CREATE TABLE IF NOT EXISTS usuario_empresas (
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  empresa_id    UUID NOT NULL REFERENCES empresas(id)    ON DELETE CASCADE,
  PRIMARY KEY (admin_user_id, empresa_id)
);

-- Todos os usuários atuais passam a ver a Nauta.
INSERT INTO usuario_empresas (admin_user_id, empresa_id)
SELECT au.id, e.id FROM admin_users au CROSS JOIN empresas e WHERE e.slug = 'nauta'
ON CONFLICT DO NOTHING;

-- Admin (dono) vê as 3.
INSERT INTO usuario_empresas (admin_user_id, empresa_id)
SELECT au.id, e.id FROM admin_users au CROSS JOIN empresas e WHERE au.role = 'admin'
ON CONFLICT DO NOTHING;

-- 3) empresa_id nas tabelas-raiz + backfill = Nauta -----------------------
DO $$
DECLARE
  t TEXT;
  nauta_id UUID;
  tabelas TEXT[] := ARRAY[
    'leads','clientes','cliente_socios','contratos','lead_atividades',
    'lead_lembretes','onboarding_checks','cliente_arquivos',
    'fin_categorias_servico','fin_lancamentos','fin_despesas_fixas',
    'financeiro_pagamentos','financeiro_eventos','chat_conversas'
  ];
BEGIN
  SELECT id INTO nauta_id FROM empresas WHERE slug = 'nauta';
  FOREACH t IN ARRAY tabelas LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id)', t);
    EXECUTE format('UPDATE %I SET empresa_id = %L WHERE empresa_id IS NULL', t, nauta_id);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_empresa ON %I (empresa_id)', t, t);
  END LOOP;
END $$;
