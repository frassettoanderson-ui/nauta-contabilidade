-- crm17: financeiro — cliente entra ao concluir o onboarding
ALTER TABLE leads ADD COLUMN IF NOT EXISTS financeiro_ativo     BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS honorario_vencimento DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS financeiro_status    TEXT DEFAULT 'em_aberto'; -- em_aberto | em_dia | atrasado
