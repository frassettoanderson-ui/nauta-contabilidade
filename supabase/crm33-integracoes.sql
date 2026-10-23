-- Integrações com sistemas externos (API + webhooks), por perfil (empresa: atuan / nauta / meis).
-- Aplicar como postgres: sudo -u postgres psql -d nauta -f supabase/crm33-integracoes.sql
-- (os privilégios padrão do schema já dão acesso ao nauta_user)

-- Chaves de API: guardamos só o hash; a chave aparece uma vez, na criação.
CREATE TABLE IF NOT EXISTS integracao_chaves (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   uuid NOT NULL REFERENCES empresas(id),
  nome         text NOT NULL,
  prefixo      text NOT NULL,             -- começo da chave, para reconhecer na lista
  hash         text NOT NULL UNIQUE,      -- sha256 da chave
  escrita      boolean NOT NULL DEFAULT false, -- pode criar lead / marcar item do onboarding
  criado_por   text,
  criado_em    timestamptz NOT NULL DEFAULT now(),
  ultimo_uso   timestamptz,
  revogada_em  timestamptz
);
CREATE INDEX IF NOT EXISTS idx_integracao_chaves_empresa ON integracao_chaves (empresa_id);

-- Webhooks: para onde avisar e quais eventos. O segredo assina cada aviso (HMAC-SHA256).
CREATE TABLE IF NOT EXISTS integracao_webhooks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     uuid NOT NULL REFERENCES empresas(id),
  nome           text NOT NULL,
  url            text NOT NULL,
  eventos        text[] NOT NULL DEFAULT '{}',
  segredo        text NOT NULL,
  ativo          boolean NOT NULL DEFAULT true,
  falhas_seguidas int NOT NULL DEFAULT 0,
  criado_por     text,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_integracao_webhooks_empresa ON integracao_webhooks (empresa_id);

-- Fila/histórico de entregas: cada evento x webhook vira uma linha; tenta de novo com espera crescente.
CREATE TABLE IF NOT EXISTS integracao_entregas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id      uuid NOT NULL REFERENCES integracao_webhooks(id) ON DELETE CASCADE,
  empresa_id      uuid NOT NULL,
  evento          text NOT NULL,
  evento_id       uuid NOT NULL,
  payload         jsonb NOT NULL,
  status          text NOT NULL DEFAULT 'pendente', -- pendente | entregue | falhou
  tentativas      int NOT NULL DEFAULT 0,
  proxima_em      timestamptz NOT NULL DEFAULT now(),
  ultimo_codigo   int,
  ultima_resposta text,
  ultimo_erro     text,
  criado_em       timestamptz NOT NULL DEFAULT now(),
  entregue_em     timestamptz
);
CREATE INDEX IF NOT EXISTS idx_integracao_entregas_fila ON integracao_entregas (status, proxima_em);
CREATE INDEX IF NOT EXISTS idx_integracao_entregas_webhook ON integracao_entregas (webhook_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_integracao_entregas_empresa ON integracao_entregas (empresa_id, criado_em DESC);
