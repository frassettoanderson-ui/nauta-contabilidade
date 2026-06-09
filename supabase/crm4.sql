-- Valores de negociação (no lead)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS valor_honorario NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS valor_abertura  NUMERIC;

-- Novos campos da empresa (para o contrato)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS emp_cnpj          TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS emp_bairro        TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS emp_cidade_estado TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS emp_cep           TEXT;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nauta_user;
