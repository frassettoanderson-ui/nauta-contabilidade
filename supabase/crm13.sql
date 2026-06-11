-- crm13: onboarding por checklist

-- Marca o cliente como concluído no onboarding (sai do board)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS onboarding_concluido BOOLEAN DEFAULT false;

-- Itens marcados de cada cliente (presença da linha = item concluído)
CREATE TABLE IF NOT EXISTS onboarding_checks (
  lead_id  UUID NOT NULL,
  item_key TEXT NOT NULL,
  done_by  TEXT,
  done_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (lead_id, item_key)
);
