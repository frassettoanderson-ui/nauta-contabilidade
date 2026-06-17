-- crm23: observações da negociação (carência, honorário por período, condições especiais)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS negociacao_obs TEXT;
