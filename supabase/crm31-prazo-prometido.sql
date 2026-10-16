-- Prazo prometido (acionamento de cobrança): quando o link "conforme combinado" foi enviado
ALTER TABLE financeiro_eventos ADD COLUMN IF NOT EXISTS prazo_enviado_em timestamptz;
