-- Tabela de leads captados pela home
CREATE TABLE IF NOT EXISTS leads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  whatsapp    TEXT NOT NULL,
  email       TEXT NOT NULL,
  interesse   TEXT NOT NULL,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS leads_criado_em_idx ON leads (criado_em DESC);
CREATE INDEX IF NOT EXISTS leads_interesse_idx  ON leads (interesse);

-- Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Apenas usuários autenticados (colaboradores) podem ler leads
CREATE POLICY "Colaboradores podem ver leads"
  ON leads FOR SELECT
  USING (auth.role() = 'authenticated');

-- Qualquer pessoa pode inserir um lead (público)
CREATE POLICY "Qualquer pessoa pode inserir lead"
  ON leads FOR INSERT
  WITH CHECK (true);
