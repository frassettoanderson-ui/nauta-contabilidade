-- Responsável pelo financeiro: para quem vão os boletos/cobranças (WhatsApp + e-mail).
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fin_resp_nome text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fin_resp_email text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fin_resp_whatsapp text;
-- Preenche com os dados que a cobrança já usava (nada muda até alguém editar)
UPDATE leads l SET
  fin_resp_nome = COALESCE(NULLIF(c.cli_nome_completo, ''), l.nome),
  fin_resp_email = CASE WHEN COALESCE(NULLIF(c.emp_email, ''), l.email) LIKE '%_@_%._%' THEN COALESCE(NULLIF(c.emp_email, ''), l.email) END,
  fin_resp_whatsapp = COALESCE(NULLIF(l.whatsapp, ''), NULLIF(c.emp_telefone, ''))
FROM clientes c
WHERE c.lead_id = l.id AND l.financeiro_ativo = true
  AND l.fin_resp_nome IS NULL AND l.fin_resp_email IS NULL AND l.fin_resp_whatsapp IS NULL;
