// Quem é a CONTRATADA do contrato (a empresa que já assina pelo Holysign): Nauta ou Atuan.
// Regra (decisão 26/10/2026, "conforme o perfil"): perfil Nauta → Nauta; perfil Atuan/MEIs →
// Atuan, exceto cliente marcado como "Nauta" na ficha (contabilidade = 'nauta').
// Enquanto CONTRATADA_POR_PERFIL não estiver ligado, tudo continua saindo pela Nauta (como sempre).
import pool from './db'

export type ContratadaId = 'nauta' | 'atuan'
export interface Contratada {
  id: ContratadaId
  razao: string
  cnpj: string
  endereco: string
  cidade: string
  site: string | null
  marca: string     // nome no timbre quando não há logo
  marcaSub: string
  usaLogo: boolean  // a logo do ERP (public/logo.png) é da Nauta
  responsavel: string | null // responsável técnico (CRC) que aparece no contrato
}

export const CONTRATADAS: Record<ContratadaId, Contratada> = {
  nauta: {
    id: 'nauta', razao: 'NAUTA CONTABILIDADE LTDA', cnpj: '19.361.966/0001-82', endereco: 'Avenida Santa Catarina — Centro, Imbituba/SC',
    cidade: 'Imbituba/SC', site: 'nautacontabilidade.com.br', marca: 'NAUTA <span>CONTABILIDADE</span>', marcaSub: 'Contabilidade Digital', usaLogo: true,
    responsavel: 'Guilherme Dias Ronchi — CRC 041514/O',
  },
  atuan: {
    id: 'atuan', razao: 'ATUAN CONTABILIDADE DIGITAL LTDA', cnpj: '68.561.252/0001-23', endereco: 'Avenida Santa Catarina, 165 — Centro, Imbituba/SC',
    cidade: 'Imbituba/SC', site: null, marca: 'ATUAN <span>CONTABILIDADE</span>', marcaSub: 'Contabilidade Digital', usaLogo: false,
    responsavel: process.env.ATUAN_RESPONSAVEL_TECNICO || null,
  },
}

export const contratadaPorPerfil = () => process.env.CONTRATADA_POR_PERFIL === '1'

export async function contratadaDoLead(lead: { empresa_id?: string | null; contabilidade?: string | null }): Promise<ContratadaId> {
  if (!contratadaPorPerfil()) return 'nauta'
  const slug = lead.empresa_id ? (await pool.query(`SELECT slug FROM empresas WHERE id = $1`, [lead.empresa_id])).rows[0]?.slug : null
  if (slug === 'nauta') return 'nauta'
  return lead.contabilidade === 'nauta' ? 'nauta' : 'atuan'
}
