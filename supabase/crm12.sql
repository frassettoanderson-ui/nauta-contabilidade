-- crm12: entrada no Onboarding + dados de perfil do usuário

-- Onboarding: marca o lead que entrou no processo (sai do CRM comercial)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS em_onboarding        BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS onboarding_etapa     INT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS onboarding_categoria TEXT;

-- Perfil do usuário do sistema
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS nome_completo TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS telefone      TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS foto_url      TEXT;
