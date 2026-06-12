-- crm20: encerramento de atendimentos do chat do site
ALTER TABLE chat_conversas ADD COLUMN IF NOT EXISTS encerrada_em     TIMESTAMPTZ;
ALTER TABLE chat_conversas ADD COLUMN IF NOT EXISTS encerrada_motivo TEXT; -- atendente | inatividade
