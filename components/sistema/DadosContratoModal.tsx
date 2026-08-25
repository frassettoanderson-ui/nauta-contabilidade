'use client'

import { useEffect, useState } from 'react'
import { X, Loader2, FileText } from 'lucide-react'
import { getClienteByLead, saveCliente, updateLead, type LeadRow } from '@/lib/api'
import { maskCPF, validateCPF, maskCEP, fetchCEP } from '@/lib/form-masks'

const FIELD = 'w-full h-11 px-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none'
const SEL = 'w-full h-11 px-4 rounded-xl text-sm text-white outline-none cursor-pointer appearance-none'
const FS = { background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

// Interesses que geram contrato (os demais — Eleitoral/Outro — não têm tipo de contrato).
const TIPOS = ['Abrir minha empresa', 'Deixar de ser MEI', 'Trocar de contador', 'BPO Financeiro']

// Popup com os dados MÍNIMOS para gerar o contrato (tipo + pessoa + endereço).
// O restante do cadastro é preenchido depois pelo cliente (link no onboarding).
export default function DadosContratoModal({ lead, onClose, onSaved }: { lead: LeadRow; onClose: () => void; onSaved: () => void }) {
  const [carregando, setCarregando] = useState(true)
  const [base, setBase] = useState<Record<string, unknown>>({})
  const [tipo, setTipo] = useState(TIPOS.includes(String(lead.interesse)) ? String(lead.interesse) : '')
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [rg, setRg] = useState('')
  const [nascimento, setNascimento] = useState('')
  const [email, setEmail] = useState('')
  const [cep, setCep] = useState('')
  const [endereco, setEndereco] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidadeUf, setCidadeUf] = useState('')
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let vivo = true
    getClienteByLead(lead.id)
      .then(c => {
        if (!vivo) return
        const cli = c ?? {}
        setBase(cli)
        setNome(String(cli.cli_nome_completo ?? lead.nome ?? '').trim())
        setCpf(String(cli.cli_cpf ?? ''))
        setRg(String(cli.cli_rg ?? ''))
        setNascimento(String(cli.cli_nascimento ?? '').slice(0, 10))
        setEmail(String(cli.cli_email ?? lead.email ?? '').trim().replace(/\s+/g, ''))
        setCep(String(cli.cli_cep ?? ''))
        setEndereco(String(cli.cli_endereco ?? ''))
        setBairro(String(cli.cli_bairro ?? ''))
        setCidadeUf(String(cli.cli_cidade_estado ?? ''))
      })
      .catch(() => {})
      .finally(() => { if (vivo) setCarregando(false) })
    return () => { vivo = false }
  }, [lead.id, lead.nome, lead.email])

  async function onCepChange(v: string) {
    const m = maskCEP(v)
    setCep(m)
    if (m.replace(/\D/g, '').length === 8) {
      setBuscandoCep(true)
      try {
        const d = await fetchCEP(m)
        if (d) {
          if (!endereco.trim() && d.logradouro) setEndereco(d.logradouro)
          if (d.bairro) setBairro(d.bairro)
          if (d.localidade) setCidadeUf(`${d.localidade}/${d.uf}`)
        }
      } finally { setBuscandoCep(false) }
    }
  }

  async function salvar() {
    const emailLimpo = email.trim().replace(/\s+/g, '')
    if (!tipo) return alert('Selecione o tipo de contrato.')
    if (!nome.trim()) return alert('Informe o nome completo.')
    if (!validateCPF(cpf)) return alert('CPF inválido.')
    if (!rg.trim()) return alert('Informe o RG.')
    if (!nascimento) return alert('Informe a data de nascimento.')
    if (!emailOk(emailLimpo)) return alert('E-mail inválido.')
    if (!endereco.trim()) return alert('Informe o endereço (rua e número).')
    if (!bairro.trim()) return alert('Informe o bairro.')
    if (!cidadeUf.trim()) return alert('Informe a cidade/UF.')

    setSaving(true)
    try {
      // Define o tipo de contrato no lead (era o que faltava para liberar a geração).
      if (tipo !== lead.interesse) await updateLead(lead.id, { interesse: tipo })
      // Mescla com o cadastro existente para não apagar campos já preenchidos.
      await saveCliente({
        ...base,
        id: base.id,
        lead_id: lead.id,
        cli_nome_completo: nome.trim(),
        cli_cpf: cpf,
        cli_rg: rg.trim(),
        cli_nascimento: nascimento,
        cli_email: emailLimpo,
        cli_cep: cep,
        cli_endereco: endereco.trim(),
        cli_bairro: bairro.trim(),
        cli_cidade_estado: cidadeUf.trim(),
      })
      onSaved()
      onClose()
    } catch {
      alert('Erro ao salvar os dados.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-md" style={{ background: 'rgba(5,4,20,0.8)' }} onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl p-6 flex flex-col" style={{ background: 'rgba(15,14,26,0.97)', border: '1px solid var(--sys-border-2)', maxHeight: '90vh' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-black text-white">Dados para o contrato</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-gray-500 text-sm mb-4">{lead.nome} — dados mínimos para gerar o contrato. O restante o cliente preenche depois, no onboarding.</p>

        {carregando ? (
          <div className="h-40 flex items-center justify-center"><Loader2 size={22} className="animate-spin text-gray-500" /></div>
        ) : (
          <>
            <div className="space-y-3 overflow-y-auto -mr-2 pr-2">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Tipo de contrato <span className="text-red-400">*</span></label>
                <select value={tipo} onChange={e => setTipo(e.target.value)} className={SEL} style={FS}>
                  <option value="" style={{ background: '#13111f' }}>Selecione…</option>
                  {TIPOS.map(t => <option key={t} value={t} style={{ background: '#13111f' }}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nome completo <span className="text-red-400">*</span></label>
                <input value={nome} onChange={e => setNome(e.target.value)} className={FIELD} style={FS} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">CPF <span className="text-red-400">*</span></label>
                  <input value={cpf} onChange={e => setCpf(maskCPF(e.target.value))} placeholder="000.000.000-00" className={FIELD} style={FS} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">RG <span className="text-red-400">*</span></label>
                  <input value={rg} onChange={e => setRg(e.target.value)} className={FIELD} style={FS} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nascimento <span className="text-red-400">*</span></label>
                  <input type="date" value={nascimento} onChange={e => setNascimento(e.target.value)} className={FIELD} style={FS} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">E-mail <span className="text-red-400">*</span></label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@email.com" className={FIELD} style={FS} />
                </div>
              </div>

              <div className="pt-1 mt-1" style={{ borderTop: '1px solid var(--sys-border)' }} />
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">CEP {buscandoCep && <span className="text-gray-500">(buscando…)</span>}</label>
                <input value={cep} onChange={e => onCepChange(e.target.value)} placeholder="00000-000" inputMode="numeric" className={FIELD} style={FS} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Endereço (rua e número) <span className="text-red-400">*</span></label>
                <input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua Exemplo, 123" className={FIELD} style={FS} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Bairro <span className="text-red-400">*</span></label>
                  <input value={bairro} onChange={e => setBairro(e.target.value)} className={FIELD} style={FS} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Cidade / UF <span className="text-red-400">*</span></label>
                  <input value={cidadeUf} onChange={e => setCidadeUf(e.target.value)} placeholder="Cidade/UF" className={FIELD} style={FS} />
                </div>
              </div>
            </div>

            <button onClick={salvar} disabled={saving}
              className="w-full h-11 mt-5 font-bold text-white rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--sys-accent), #6355e0)' }}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <><FileText size={16} /> Salvar e liberar contrato</>}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
