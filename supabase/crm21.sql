-- crm21: financeiro — lançamentos (entradas/despesas), categorias de serviço avulso e despesas fixas

CREATE TABLE IF NOT EXISTS fin_categorias_servico (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome      TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fin_lancamentos (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo         TEXT NOT NULL,           -- entrada | despesa
  categoria    TEXT,
  descricao    TEXT,
  cliente_nome TEXT,                    -- para entradas avulsas
  valor        NUMERIC,
  data         DATE,
  autor        TEXT,
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fin_lanc_tipo ON fin_lancamentos (tipo, data DESC);

CREATE TABLE IF NOT EXISTS fin_despesas_fixas (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao      TEXT NOT NULL,
  categoria      TEXT,
  valor          NUMERIC,
  dia_vencimento INT,
  ativo          BOOLEAN DEFAULT true,
  criado_em      TIMESTAMPTZ DEFAULT NOW()
);
