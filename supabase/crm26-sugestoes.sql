-- Sugestões de alteração do sistema: qualquer usuário abre, o admin conclui ou não aprova.
CREATE TABLE IF NOT EXISTS sugestoes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        text NOT NULL,
  area          text,
  descricao     text NOT NULL,
  status        text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluida', 'nao_aprovada')),
  autor_id      text,
  autor_nome    text,
  resposta      text,
  resolvido_por text,
  resolvido_em  timestamptz,
  criado_em     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sugestoes_status_idx ON sugestoes (status, criado_em DESC);
