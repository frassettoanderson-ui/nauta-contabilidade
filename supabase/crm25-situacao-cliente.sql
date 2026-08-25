-- crm25: situação do cliente (Ativo / Em processo / Inativo)
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS situacao TEXT NOT NULL DEFAULT 'ativo'
  CHECK (situacao IN ('ativo', 'em_processo', 'inativo'));

CREATE INDEX IF NOT EXISTS clientes_situacao_idx ON clientes (situacao);

GRANT SELECT, INSERT, UPDATE, DELETE ON clientes TO nauta_user;
