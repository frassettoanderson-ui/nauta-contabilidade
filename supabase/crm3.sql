-- Link público de cadastro (token)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS link_token TEXT;
CREATE INDEX IF NOT EXISTS clientes_link_token_idx ON clientes(link_token);
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nauta_user;
