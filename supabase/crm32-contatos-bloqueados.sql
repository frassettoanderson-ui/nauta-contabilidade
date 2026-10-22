-- Contatos bloqueados no site (formulário de contato e chat) — lib/bloqueio.ts
CREATE TABLE IF NOT EXISTS contatos_bloqueados (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo      text NOT NULL CHECK (tipo IN ('fone', 'email')),
  valor     text NOT NULL,
  motivo    text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tipo, valor)
);
