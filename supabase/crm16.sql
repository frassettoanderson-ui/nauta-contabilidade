-- crm16: arquivos avulsos do cliente (Drive)
CREATE TABLE IF NOT EXISTS cliente_arquivos (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL,
  nome       TEXT NOT NULL,
  url        TEXT NOT NULL,
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cliente_arquivos_cliente ON cliente_arquivos (cliente_id);
