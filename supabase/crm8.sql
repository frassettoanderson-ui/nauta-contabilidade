-- crm8: separa nome e CPF do proprietário do imóvel
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS emp_proprietario_nome TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS emp_proprietario_cpf  TEXT;

-- migra dado antigo (texto livre) para o campo de nome, se existir
UPDATE clientes
   SET emp_proprietario_nome = emp_proprietario
 WHERE emp_proprietario IS NOT NULL
   AND (emp_proprietario_nome IS NULL OR emp_proprietario_nome = '');
