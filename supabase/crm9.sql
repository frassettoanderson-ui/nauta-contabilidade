-- crm9: campos Autentique na tabela contratos
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS autentique_id      TEXT;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS autentique_status  TEXT;   -- pendente | assinado | cancelado
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS autentique_url     TEXT;   -- link do documento assinado
