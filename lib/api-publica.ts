// API pública do Obrigô (/api/v1/*) para sistemas externos (bots, n8n, Zapier...).
// Autenticação: header "Authorization: Bearer obr_..." (chave gerada em Sistema › Integrações).
// Cada chave enxerga só o perfil (empresa) em que foi criada. Chave "só leitura" não grava.
import { NextResponse } from 'next/server'
import { autenticarChave, type AcessoApi } from './integracoes'

export function erroApi(status: number, codigo: string, mensagem: string) {
  return NextResponse.json({ erro: { codigo, mensagem } }, { status })
}

export async function comChave(req: Request, precisaEscrita = false): Promise<AcessoApi | NextResponse> {
  const a = await autenticarChave(req.headers)
  if (!a) return erroApi(401, 'chave_invalida', 'Envie a chave no header Authorization: Bearer obr_... (Sistema › Integrações).')
  if (precisaEscrita && !a.escrita) return erroApi(403, 'somente_leitura', 'Esta chave é só de leitura. Gere uma chave com permissão de escrita.')
  return a
}

const dataISO = (v: unknown) => (v instanceof Date ? v.toISOString() : v ? String(v) : null)

// Cliente (cadastro da empresa) — nunca sai senha, certificado ou documento pessoal
export function montarCliente(c: Record<string, unknown>) {
  return {
    id: c.id,
    lead_id: c.lead_id ?? null,
    razao_social: c.emp_nome ?? null,
    nome_fantasia: c.emp_fantasia ?? null,
    cnpj: c.emp_cnpj ?? null,
    regime: c.emp_regime ?? null,
    atividade: c.emp_atividade ?? null,
    telefone: c.emp_telefone ?? null,
    email: c.emp_email ?? null,
    endereco: c.emp_endereco ?? null,
    bairro: c.emp_bairro ?? null,
    cidade_uf: c.emp_cidade_estado ?? null,
    cep: c.emp_cep ?? null,
    situacao: c.situacao ?? null,
    responsavel: c.cli_nome_completo ?? c.emp_proprietario_nome ?? null,
    responsavel_email: c.cli_email ?? null,
    criado_em: dataISO(c.criado_em),
  }
}
