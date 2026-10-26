-- Contratos pelo Holysign (assinador da HolyTech), além do Autentique.
-- provedor: quem está com o documento (autentique | holysign); contratada: nauta | atuan.
-- autentique_id/autentique_status/link_assinatura seguem sendo o "documento no assinador" para o card.
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS provedor text NOT NULL DEFAULT 'autentique';
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS contratada text;
