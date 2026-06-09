-- Endereço pessoal do cliente (responsável legal) — usado no contrato Tipo 1
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cli_endereco      TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cli_bairro        TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cli_cidade_estado TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cli_cep           TEXT;

-- Contratos gerados
CREATE TABLE IF NOT EXISTS contratos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      UUID REFERENCES leads(id) ON DELETE SET NULL,
  cliente_id   UUID REFERENCES clientes(id) ON DELETE SET NULL,
  tipo         INT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'gerado', -- gerado | enviado | assinado
  pdf_url      TEXT,
  assinado_url TEXT,
  autentique_id TEXT,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS contratos_lead_idx ON contratos(lead_id);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nauta_user;
