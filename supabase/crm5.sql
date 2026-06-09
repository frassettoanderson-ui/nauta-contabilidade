-- Responsável pelo lead (divisão por comercial)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS responsavel_id   UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS responsavel_nome TEXT;
CREATE INDEX IF NOT EXISTS leads_responsavel_idx ON leads(responsavel_id);
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nauta_user;
