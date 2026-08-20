'use client'

import { useEffect, useState } from 'react'
import { X, Loader2, Check, FileText } from 'lucide-react'
import { getClienteByLead, saveCliente, type LeadRow } from '@/lib/api'
import { maskCPF, validateCPF } from '@/lib/form-masks'

const FIELD = 'w-full h-11 px-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none'
const FS = { background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

// Popup rápido com os dados MÍNIMOS para gerar o contrato. O restante do
// cadastro é preenchido depois pelo cliente (link enviado no onboarding).
export default function DadosContratoModal({ lead, onClose, onSaved }: { lead: LeadRow; onClose: () => void; onSaved: () => void }) {
  const [carregando, setCarregando] = useState(true)
  const [base, setBase] = useState<Record<string, unknown>>({}) // cadastro existente (para mesclar e não apagar o resto)
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [rg, setRg] = useState('')
  const [endereco, setEndereco] = useState('')
  const [email, setEmail] = useState('')
  const [nascimento, setNascimento] = useState('')
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
        setEndereco(String(cli.cli_endereco ?? ''))
        setEmail(String(cli.cli_email ?? lead.email ?? '').trim().replace(/\s+/g, ''))
        setNascimento(String(cli.cli_nascimento ?? '').slice(0, 10))
      })
      .catch(() => {})
      .finally(() => { if (vivo) setCarregando(false) })
    return () => { vivo = false }
  }, [lead.id, lead.nome, lead.email])

  async function salvar() {
    const emailLimpo = email.trim().replace(/\s+/g, '')
    if (!nome.trim()) return alert('Informe o nome completo.')
    if (!validateCPF(cpf)) return alert('CPF inválido.')
    if (!rg.trim()) return alert('Informe o RG.')
    if (!endereco.trim()) return alert('Informe o endereço.')
    if (!emailOk(emailLimpo)) return alert('E-mail inválido.')
    if (!nascimento) return alert('Informe a data de nascimento.')

    setSaving(true)
    try {
      // Mescla com o cadastro existente para não apagar campos já preenchidos.
      await saveCliente({
        ...base,
        id: base.id,
        lead_id: lead.id,
        cli_nome_completo: nome.trim(),
        cli_cpf: cpf,
        cli_rg: rg.trim(),
        cli_endereco: endereco.trim(),
        cli_email: emailLimpo,
        cli_nascimento: nascimento,
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
      <div className="relative z-10 w-full max-w-md rounded-2xl p-6" style={{ background: 'rgba(15,14,26,0.97)', border: '1px solid var(--sys-border-2)' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-black text-white">Dados para o contrato</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-gray-500 text-sm mb-5">{lead.nome} — dados mínimos para gerar o contrato. O restante do cadastro o cliente preenche depois, no onboarding.</p>

        {carregando ? (
          <div className="h-40 flex items-center justify-center"><Loader2 size={22} className="animate-spin text-gray-500" /></div>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nome completo <span className="text-red-400">*</span></label>
                <input value={nome} onChange={e => setNome(e.target.value)} className={FIELD} style={FS} autoFocus />
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
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Endereço <span className="text-red-400">*</span></label>
                <input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, número, bairro, cidade/UF" className={FIELD} style={FS} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">E-mail <span className="text-red-400">*</span></label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@email.com" className={FIELD} style={FS} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nascimento <span className="text-red-400">*</span></label>
                  <input type="date" value={nascimento} onChange={e => setNascimento(e.target.value)} className={FIELD} style={FS} />
                </div>
              </div>
            </div>

            <button onClick={salvar} disabled={saving}
              className="w-full h-11 mt-5 font-bold text-white rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, var(--sys-accent), #6355e0)' }}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <><FileText size={16} /> Salvar e liberar contrato</>}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
