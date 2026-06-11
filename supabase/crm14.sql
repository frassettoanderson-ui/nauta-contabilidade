-- crm14: tipo de empresa (regime tributário) do cliente
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS emp_regime TEXT;
