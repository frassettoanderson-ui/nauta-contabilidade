-- Lembretes: hora
ALTER TABLE lead_lembretes ADD COLUMN IF NOT EXISTS hora TIME;

-- Clientes (cadastro completo vinculado ao lead)
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  -- Dados do cliente (pessoa)
  cli_nome_completo  TEXT,
  cli_rg             TEXT,
  cli_cpf            TEXT,
  cli_nascimento     TEXT,
  cli_nome_pai       TEXT,
  cli_nome_mae       TEXT,
  cli_estado_civil   TEXT,
  cli_recibo_irpf    TEXT,
  cli_titulo_eleitor TEXT,
  cli_doc_url        TEXT,
  cli_cert_url       TEXT,
  cli_cert_senha     TEXT,
  -- Dados da empresa
  emp_nome           TEXT,
  emp_fantasia       TEXT,
  emp_endereco       TEXT,
  emp_area_ocupada   TEXT,
  emp_edificacao     TEXT,
  emp_usa_glp        BOOLEAN DEFAULT false,
  emp_proprietario   TEXT,
  emp_atividade      TEXT,
  emp_capital_social TEXT,
  emp_telefone       TEXT,
  emp_email          TEXT,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cliente_socios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  ordem INT NOT NULL,
  nome_completo  TEXT,
  rg             TEXT,
  cpf            TEXT,
  nascimento     TEXT,
  nome_pai       TEXT,
  nome_mae       TEXT,
  participacao   NUMERIC DEFAULT 0,
  estado_civil   TEXT,
  recibo_irpf    TEXT,
  titulo_eleitor TEXT,
  doc_url        TEXT,
  cert_url       TEXT,
  cert_senha     TEXT
);

CREATE INDEX IF NOT EXISTS clientes_lead_idx        ON clientes(lead_id);
CREATE INDEX IF NOT EXISTS cliente_socios_cli_idx   ON cliente_socios(cliente_id);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nauta_user;
