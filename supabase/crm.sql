-- CRM: etapas, classificação, atividades e lembretes dos leads

ALTER TABLE leads ADD COLUMN IF NOT EXISTS etapa TEXT NOT NULL DEFAULT 'novo';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS classificacao INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS lead_atividades (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  descricao  TEXT NOT NULL,
  autor      TEXT,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_lembretes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  descricao  TEXT NOT NULL,
  data       DATE NOT NULL,
  concluido  BOOLEAN NOT NULL DEFAULT false,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lead_atividades_lead_idx ON lead_atividades(lead_id);
CREATE INDEX IF NOT EXISTS lead_lembretes_lead_idx  ON lead_lembretes(lead_id);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nauta_user;
