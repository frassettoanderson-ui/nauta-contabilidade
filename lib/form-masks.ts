// Máscaras, validadores e utilitários de formulário — reutilizáveis em todo o projeto

export const ESTADOS_BR = [
  { uf: 'AC', nome: 'Acre' },         { uf: 'AL', nome: 'Alagoas' },
  { uf: 'AP', nome: 'Amapá' },        { uf: 'AM', nome: 'Amazonas' },
  { uf: 'BA', nome: 'Bahia' },        { uf: 'CE', nome: 'Ceará' },
  { uf: 'DF', nome: 'Distrito Federal' }, { uf: 'ES', nome: 'Espírito Santo' },
  { uf: 'GO', nome: 'Goiás' },        { uf: 'MA', nome: 'Maranhão' },
  { uf: 'MT', nome: 'Mato Grosso' },  { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'MG', nome: 'Minas Gerais' }, { uf: 'PA', nome: 'Pará' },
  { uf: 'PB', nome: 'Paraíba' },      { uf: 'PR', nome: 'Paraná' },
  { uf: 'PE', nome: 'Pernambuco' },   { uf: 'PI', nome: 'Piauí' },
  { uf: 'RJ', nome: 'Rio de Janeiro' }, { uf: 'RN', nome: 'Rio Grande do Norte' },
  { uf: 'RS', nome: 'Rio Grande do Sul' }, { uf: 'RO', nome: 'Rondônia' },
  { uf: 'RR', nome: 'Roraima' },      { uf: 'SC', nome: 'Santa Catarina' },
  { uf: 'SP', nome: 'São Paulo' },    { uf: 'SE', nome: 'Sergipe' },
  { uf: 'TO', nome: 'Tocantins' },
]

export const ESTADO_CIVIL_OPS = [
  'Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável',
]

// ─── Máscaras ─────────────────────────────────────────────────────────────

export function maskCPF(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

export function maskCNPJ(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

export function maskCEP(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

export function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Remove qualquer caractere que não seja letra, espaço, apóstrofo ou hífen */
export function onlyLetters(v: string): string {
  return v.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '')
}

// ─── Validadores ──────────────────────────────────────────────────────────

export function validateCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i)
  let r = (sum * 10) % 11; if (r === 10 || r === 11) r = 0
  if (r !== parseInt(d[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i)
  r = (sum * 10) % 11; if (r === 10 || r === 11) r = 0
  return r === parseInt(d[10])
}

// ─── CEP via ViaCEP ───────────────────────────────────────────────────────

export interface CEPData {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
}

export async function fetchCEP(cep: string): Promise<CEPData | null> {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return null
  try {
    const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    if (!r.ok) return null
    const d = await r.json()
    if (d.erro) return null
    return { logradouro: d.logradouro, bairro: d.bairro, localidade: d.localidade, uf: d.uf }
  } catch { return null }
}

// ─── Helper: parseia "Cidade/UF" ──────────────────────────────────────────

export function parseCidadeEstado(v: string): { cidade: string; uf: string } {
  if (!v) return { cidade: '', uf: '' }
  const idx = v.lastIndexOf('/')
  if (idx === -1) return { cidade: v.trim(), uf: '' }
  return { cidade: v.slice(0, idx).trim(), uf: v.slice(idx + 1).trim() }
}
