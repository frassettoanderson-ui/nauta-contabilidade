-- crm10: e-mail pessoal do cliente (sócio 1)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cli_email TEXT;
