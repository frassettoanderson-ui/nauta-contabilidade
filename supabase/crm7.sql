-- crm7: campo origem no lead
ALTER TABLE leads ADD COLUMN IF NOT EXISTS origem TEXT;
