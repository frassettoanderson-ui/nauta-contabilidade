-- crm22: validade do link de cadastro + arquivos restritos (senha gov.br)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS link_token_expira TIMESTAMPTZ;
ALTER TABLE cliente_arquivos ADD COLUMN IF NOT EXISTS restrito BOOLEAN DEFAULT false;
ALTER TABLE cliente_arquivos ADD COLUMN IF NOT EXISTS conteudo TEXT;  -- texto restrito (ex.: senha), em vez de arquivo em disco
