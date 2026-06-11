-- crm11: permissões de menu por usuário
-- null = usa o padrão do cargo; array de hrefs = personalizado pelo Gerente
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS menu_perms TEXT[];
