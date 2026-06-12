-- crm19: chat interno (Fase 1)

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS chat_conversas (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo          TEXT NOT NULL DEFAULT 'interna',  -- interna | site
  setor         TEXT,                              -- conversas do site
  visitante_nome    TEXT,
  visitante_contato TEXT,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_participantes (
  conversa_id UUID NOT NULL,
  user_id     UUID NOT NULL,
  lido_em     TIMESTAMPTZ,
  PRIMARY KEY (conversa_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_mensagens (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversa_id  UUID NOT NULL,
  autor_id     UUID,                          -- user que enviou (null = visitante/bot)
  autor_tipo   TEXT DEFAULT 'user',           -- user | visitante | bot
  autor_nome   TEXT,
  texto        TEXT,
  arquivo_url  TEXT,
  arquivo_nome TEXT,
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_msg_conversa ON chat_mensagens (conversa_id);
CREATE INDEX IF NOT EXISTS idx_chat_part_user ON chat_participantes (user_id);
