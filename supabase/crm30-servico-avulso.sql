-- Cobranças de serviço avulso (fora do honorário mensal): não dão baixa em mês de honorário nem entram na régua.
ALTER TABLE financeiro_cobrancas ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'honorario';
ALTER TABLE financeiro_cobrancas ADD COLUMN IF NOT EXISTS servico text;
CREATE INDEX IF NOT EXISTS financeiro_cobrancas_tipo_idx ON financeiro_cobrancas (lead_id, tipo);
