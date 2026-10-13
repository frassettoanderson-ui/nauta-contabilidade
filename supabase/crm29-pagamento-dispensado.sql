-- Mês dispensado (cobrança excluída): conta como quitado para a régua/atraso, mas não é recebimento.
ALTER TABLE financeiro_pagamentos ADD COLUMN IF NOT EXISTS dispensado boolean NOT NULL DEFAULT false;
