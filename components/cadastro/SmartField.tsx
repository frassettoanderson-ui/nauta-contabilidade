'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import {
  maskCPF, validateCPF, maskCNPJ, maskCEP, maskPhone, onlyLetters, onlyNumbers, maskMoney,
  ESTADOS_BR, ESTADO_CIVIL_OPS, fetchCEP, parseCidadeEstado,
  type CEPData,
} from '@/lib/form-masks'

const BASE    = 'w-full h-11 px-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none disabled:opacity-40'
const BASE_SEL = 'w-full h-11 px-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none disabled:opacity-40 [&>option]:text-gray-900 [&>option]:bg-white'
const FS   = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }
const FSE  = { ...FS, borderColor: 'rgba(239,68,68,0.6)' }
const FSS  = { ...FS } // removido colorScheme:'dark' — causava texto branco nas options
const FSSE = { ...FSS, borderColor: 'rgba(239,68,68,0.6)' }

/**
 * Tipos suportados além dos nativos (text, date, number):
 *  nome          → somente letras
 *  cpf           → máscara CPF + validação
 *  cnpj          → máscara CNPJ
 *  cep           → máscara CEP + busca ViaCEP (requer onCEPFill)
 *  phone         → máscara telefone
 *  estado_civil  → select com opções fixas
 *  cidade_estado → dois selects (UF + Cidade via IBGE), ocupa 2 colunas no grid
 */
export interface SmartFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  disabled?: boolean
  /** Chamado após busca de CEP bem-sucedida; o pai deve atualizar endereco/bairro/cidade_estado */
  onCEPFill?: (data: CEPData) => void
}

export default function SmartField({
  label, value, onChange, type = 'text', required, disabled, onCEPFill,
}: SmartFieldProps) {
  const [cpfInvalid, setCpfInvalid]     = useState(false)
  const [loadingCep, setLoadingCep]     = useState(false)
  const [cidades, setCidades]           = useState<string[]>([])
  const [loadingCities, setLoadingCities] = useState(false)

  // Para cidade_estado: derivado diretamente da prop `value`
  const { uf: csUF, cidade: csCidade } = parseCidadeEstado(value)

  useEffect(() => {
    if (type !== 'cidade_estado' || !csUF) { setCidades([]); return }
    setLoadingCities(true)
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${csUF}/municipios?orderBy=nome`)
      .then(r => r.json())
      .then((d: { nome: string }[]) => setCidades(d.map(m => m.nome)))
      .catch(() => setCidades([]))
      .finally(() => setLoadingCities(false))
  }, [type, csUF])

  const Label = ({ text }: { text: string }) => (
    <label className="block text-xs font-semibold text-gray-400 mb-1.5">
      {text}{required && <span className="text-red-400"> *</span>}
    </label>
  )

  const errBorder = required && !String(value ?? '').trim()

  // ── NOME (somente letras) ──────────────────────────────────────────────
  if (type === 'nome') {
    return (
      <div>
        <Label text={label} />
        <input type="text" value={value} disabled={disabled}
          onChange={e => onChange(onlyLetters(e.target.value))}
          className={BASE} style={errBorder ? FSE : FS} />
      </div>
    )
  }

  // ── CPF ───────────────────────────────────────────────────────────────
  if (type === 'cpf') {
    const full    = value.replace(/\D/g, '').length === 11
    const invalid = cpfInvalid || (full && !validateCPF(value))
    return (
      <div>
        <Label text={label} />
        <input type="text" value={value} disabled={disabled} placeholder="000.000.000-00"
          onChange={e => { onChange(maskCPF(e.target.value)); setCpfInvalid(false) }}
          onBlur={() => { if (full) setCpfInvalid(!validateCPF(value)) }}
          className={BASE} style={invalid || errBorder ? FSE : FS} />
        {invalid && <p className="text-red-400 text-[10px] mt-1">CPF inválido</p>}
      </div>
    )
  }

  // ── SOMENTE NÚMEROS ───────────────────────────────────────────────────
  if (type === 'numero') {
    return (
      <div>
        <Label text={label} />
        <input type="text" inputMode="numeric" value={value} disabled={disabled}
          onChange={e => onChange(onlyNumbers(e.target.value))}
          className={BASE} style={errBorder ? FSE : FS} />
      </div>
    )
  }

  // ── VALOR MONETÁRIO ───────────────────────────────────────────────────
  if (type === 'dinheiro') {
    return (
      <div>
        <Label text={label} />
        <input type="text" inputMode="numeric" value={value} disabled={disabled} placeholder="R$ 0,00"
          onChange={e => onChange(maskMoney(e.target.value))}
          className={BASE} style={errBorder ? FSE : FS} />
      </div>
    )
  }

  // ── CNPJ ──────────────────────────────────────────────────────────────
  if (type === 'cnpj') {
    return (
      <div>
        <Label text={label} />
        <input type="text" value={value} disabled={disabled} placeholder="00.000.000/0001-00"
          onChange={e => onChange(maskCNPJ(e.target.value))}
          className={BASE} style={errBorder ? FSE : FS} />
      </div>
    )
  }

  // ── TELEFONE ──────────────────────────────────────────────────────────
  if (type === 'phone') {
    return (
      <div>
        <Label text={label} />
        <input type="tel" value={value} disabled={disabled} placeholder="(00) 00000-0000"
          onChange={e => onChange(maskPhone(e.target.value))}
          className={BASE} style={errBorder ? FSE : FS} />
      </div>
    )
  }

  // ── CEP ───────────────────────────────────────────────────────────────
  if (type === 'cep') {
    const handleCEP = async (raw: string) => {
      const masked = maskCEP(raw)
      onChange(masked)
      if (masked.replace(/\D/g, '').length === 8 && onCEPFill) {
        setLoadingCep(true)
        const data = await fetchCEP(masked)
        if (data) onCEPFill(data)
        setLoadingCep(false)
      }
    }
    return (
      <div>
        <Label text={label} />
        <div className="relative">
          <input type="text" value={value} disabled={disabled} placeholder="00000-000"
            onChange={e => handleCEP(e.target.value)}
            className={BASE} style={errBorder ? FSE : FS} />
          {loadingCep && (
            <Loader2 size={14} className="animate-spin text-[#0BBCD4] absolute right-3 top-3.5 pointer-events-none" />
          )}
        </div>
        {!loadingCep && value.replace(/\D/g,'').length === 8 && (
          <p className="text-[10px] text-[#0BBCD4] mt-1">Endereço preenchido automaticamente</p>
        )}
      </div>
    )
  }

  // ── ESTADO CIVIL ──────────────────────────────────────────────────────
  if (type === 'estado_civil') {
    return (
      <div>
        <Label text={label} />
        <select value={value} disabled={disabled}
          onChange={e => onChange(e.target.value)}
          className={BASE_SEL} style={errBorder && !value ? FSSE : FSS}>
          <option value="">Selecione</option>
          {ESTADO_CIVIL_OPS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    )
  }

  // ── CIDADE / ESTADO ───────────────────────────────────────────────────
  // Ocupa 2 colunas — adiciona sm:col-span-2 no próprio wrapper
  if (type === 'cidade_estado') {
    const handleUF = (uf: string) => {
      onChange(uf ? `/${uf}` : '')
    }
    const handleCidade = (cidade: string) => {
      onChange(csUF ? `${cidade}/${csUF}` : cidade)
    }
    return (
      <div className="sm:col-span-2 grid sm:grid-cols-2 gap-3">
        {/* Estado */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">
            Estado{required && <span className="text-red-400"> *</span>}
          </label>
          <select value={csUF} disabled={disabled}
            onChange={e => handleUF(e.target.value)}
            className={BASE_SEL} style={required && !csUF ? FSSE : FSS}>
            <option value="">Selecione o estado</option>
            {ESTADOS_BR.map(e => (
              <option key={e.uf} value={e.uf}>{e.nome} ({e.uf})</option>
            ))}
          </select>
        </div>
        {/* Cidade */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">
            Cidade{required && <span className="text-red-400"> *</span>}
          </label>
          {loadingCities ? (
            <div className="h-11 flex items-center px-4 rounded-xl" style={FS}>
              <Loader2 size={14} className="animate-spin text-[#0BBCD4]" />
              <span className="text-xs text-gray-500 ml-2">Carregando cidades...</span>
            </div>
          ) : (
            <select value={csCidade} disabled={disabled || !csUF}
              onChange={e => handleCidade(e.target.value)}
              className={BASE_SEL} style={required && !csCidade ? FSSE : FSS}>
              <option value="">{csUF ? 'Selecione a cidade' : 'Selecione o estado primeiro'}</option>
              {cidades.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      </div>
    )
  }

  // ── PADRÃO (text, date, number) ───────────────────────────────────────
  return (
    <div>
      <Label text={label} />
      <input type={type} value={value} disabled={disabled}
        onChange={e => onChange(e.target.value)}
        className={BASE}
        style={{
          ...FS,
          ...(type === 'date' ? { colorScheme: 'dark' } : {}),
          ...(errBorder ? { borderColor: 'rgba(239,68,68,0.4)' } : {}),
        }} />
    </div>
  )
}
