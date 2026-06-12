-- crm18: pagamentos e eventos de cobrança do financeiro

-- Pagamentos registrados (1 linha = 1 competência mensal paga)
CREATE TABLE IF NOT EXISTS financeiro_pagamentos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id     UUID NOT NULL,
  competencia DATE NOT NULL,            -- primeiro dia do mês pago (YYYY-MM-01)
  valor       NUMERIC,
  pago_em     DATE,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fin_pag_lead ON financeiro_pagamentos (lead_id);

-- Eventos de cobrança (acionamentos)
CREATE TABLE IF NOT EXISTS financeiro_eventos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id         UUID NOT NULL,
  tipo            TEXT NOT NULL,        -- ligacao | whatsapp | email | sms
  descricao       TEXT,
  prazo_pagamento DATE,                 -- prazo prometido pelo cliente (opcional)
  autor           TEXT,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fin_ev_lead ON financeiro_eventos (lead_id);
