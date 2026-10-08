-- Data de abertura do CNPJ (início de atividade na Receita) + CNPJ consultado (reconsulta se mudar)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS emp_data_abertura date;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS emp_data_abertura_cnpj text;
