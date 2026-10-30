-- Links avulsos de preenchimento de cadastro (Relatórios › Links de cadastro): mesma ficha do
-- cliente novo, mas só coleta os dados — não cria cliente/lead nem mexe no onboarding.
CREATE TABLE IF NOT EXISTS cadastro_links (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    uuid,
  token         text NOT NULL UNIQUE,
  destinatario  text NOT NULL,
  observacao    text,
  criado_por    text,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  aberto_em     timestamptz,
  preenchido_em timestamptz,
  atualizado_em timestamptz,
  dados         jsonb,
  senha_gov     text
);
CREATE INDEX IF NOT EXISTS cadastro_links_empresa_idx ON cadastro_links (empresa_id, criado_em DESC);
