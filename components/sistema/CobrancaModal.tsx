'use client'

import { useEffect, useState } from 'react'
import { X, Loader2, Copy, Check, Pencil } from 'lucide-react'
import { getClienteByLead, getLeadDetail } from '@/lib/api'

const brl = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
}
const dataBr = (iso: string) => {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return d && m && a ? `${d}/${m}/${a}` : iso
}

export default function CobrancaModal({ leadId, nome: nomeInit, cnpj: cnpjInit, onClose }: { leadId: string; nome?: string; cnpj?: string; onClose: () => void }) {
  const [nome, setNome] = useState(nomeInit || '')
  const [cnpj, setCnpj] = useState(cnpjInit || '')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState('') // 1º vencimento não existe no sistema
  const [editando, setEditando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  // Puxa do sistema: WhatsApp/e-mail/honorário do lead + e-mail/CNPJ do cadastro
  useEffect(() => {
    let vivo = true
    getLeadDetail(leadId).then(d => {
      if (!vivo) return
      setWhatsapp(v => v || String(d.whatsapp ?? ''))
      setEmail(v => v || String(d.email ?? ''))
      setValor(v => v || brl(d.valor_honorario))
      setVencimento(v => v || String((d as { honorario_vencimento?: string }).honorario_vencimento ?? '').slice(0, 10))
    }).catch(() => {})
    getClienteByLead(leadId).then(c => {
      if (!vivo || !c) return
      setNome(v => v || String(c.emp_nome ?? c.cli_nome_completo ?? ''))
      setCnpj(v => v || String(c.emp_cnpj ?? ''))
      const mail = String(c.emp_email ?? c.cli_email ?? '')
      if (mail) setEmail(mail)
    }).catch(() => {})
    return () => { vivo = false }
  }, [leadId])

  const campos = [
    { label: 'Nome da empresa', val: nome, set: setNome, type: 'text' },
    { label: 'CNPJ', val: cnpj, set: setCnpj, type: 'text' },
    { label: 'WhatsApp', val: whatsapp, set: setWhatsapp, type: 'text' },
    { label: 'E-mail', val: email, set: setEmail, type: 'email' },
    { label: 'Valor do honorário (R$)', val: valor, set: setValor, type: 'text' },
    { label: '1º Vencimento', val: vencimento, set: setVencimento, type: 'date' },
  ]

  function textoWhats() {
    return [
      '🧾 *NOVA COBRANÇA*',
      '',
      `🏢 *Empresa:* ${nome || '-'}`,
      `🔢 *CNPJ:* ${cnpj || '-'}`,
      `📱 *WhatsApp:* ${whatsapp || '-'}`,
      `📧 *E-mail:* ${email || '-'}`,
      `💰 *Honorário:* R$ ${valor || '-'}/mês`,
      `📅 *1º Vencimento:* ${dataBr(vencimento) || '-'}`,
    ].join('\n')
  }

  async function salvar() {
    try {
      await navigator.clipboard.writeText(textoWhats())
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      alert('Não foi possível copiar. Copie manualmente:\n\n' + textoWhats())
    }
  }

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-md" style={{ background: 'rgba(5,4,20,0.8)' }} onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl p-6" style={{ background: 'rgba(15,14,26,0.97)', border: '1px solid var(--sys-border-2)' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-black text-white">Cadastrar Cobrança</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-gray-500 text-sm mb-5">Campos com <span className="text-red-400 font-semibold">borda vermelha</span> precisam ser preenchidos. Clique em <b>Editar</b> para ajustar.</p>

        <div className="space-y-3">
          {campos.map(c => {
            const vazio = !String(c.val).trim()
            return (
              <div key={c.label}>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">{c.label}</label>
                <input type={c.type} value={c.val} disabled={!editando} onChange={e => c.set(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none disabled:opacity-80"
                  style={{
                    background: 'var(--sys-surface-3)',
                    border: `1px solid ${vazio ? 'rgba(239,68,68,0.75)' : 'var(--sys-border-2)'}`,
                    boxShadow: vazio ? '0 0 0 3px rgba(239,68,68,0.12)' : 'none',
                  }} />
              </div>
            )
          })}
        </div>

        {copiado && (
          <p className="text-[13px] text-green-400 font-semibold mt-4 flex items-center gap-1.5">
            <Check size={15} /> Copiado para a área de transferência — cole no WhatsApp/Financeiro.
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 mt-5">
          <button onClick={onClose}
            className="h-11 rounded-xl text-sm font-bold text-gray-300 transition-colors"
            style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }}>
            Cancelar
          </button>
          <button onClick={() => setEditando(true)} disabled={editando}
            className="h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
            style={{ background: 'color-mix(in srgb, var(--sys-accent) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--sys-accent) 40%, transparent)', color: 'var(--sys-accent)' }}>
            <Pencil size={14} /> Editar
          </button>
          <button onClick={salvar}
            className="h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            {copiado ? <Check size={15} /> : <Copy size={15} />} Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
