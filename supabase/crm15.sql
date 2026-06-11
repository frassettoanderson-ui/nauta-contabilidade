-- crm15: inscrição imobiliária da empresa
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS emp_inscricao_imobiliaria TEXT;
