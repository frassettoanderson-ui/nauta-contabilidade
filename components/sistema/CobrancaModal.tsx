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
      <div className="absolute inset-0" style={{ background: 'rgba(15,23,42,0.55)' }} onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl p-6 shadow-xl" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <button onClick={onClose} className="absolute top-4 right-4" style={{ color: '#94a3b8' }}><X size={20} /></button>
        <h2 className="text-lg font-black text-center" style={{ color: '#0e2240' }}>Cadastrar Cobrança</h2>
        <p className="text-sm mb-5 mt-1 text-center" style={{ color: '#64748b' }}>Campos com <span className="font-semibold" style={{ color: '#d15b47' }}>borda vermelha</span> precisam ser preenchidos. Clique em <b>Editar</b> para ajustar.</p>

        <div className="space-y-3">
          {campos.map(c => {
            const vazio = !String(c.val).trim()
            return (
              <div key={c.label}>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748b' }}>{c.label}</label>
                <input type={c.type} value={c.val} disabled={!editando} onChange={e => c.set(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                  style={{
                    background: editando ? '#ffffff' : '#f8fafc', color: '#1e293b',
                    border: `1px solid ${vazio ? 'rgba(209,91,71,0.8)' : '#cbd5e1'}`,
                    boxShadow: vazio ? '0 0 0 3px rgba(239,68,68,0.12)' : 'none',
                  }} />
              </div>
            )
          })}
        </div>

        {copiado && (
          <p className="text-[13px] font-semibold mt-4 flex items-center justify-center gap-1.5" style={{ color: '#16a34a' }}>
            <Check size={15} /> Copiado para a área de transferência — cole no WhatsApp/Financeiro.
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 mt-5">
          <button onClick={onClose}
            className="h-11 rounded-xl text-sm font-bold transition-colors"
            style={{ background: '#ffb752', color: '#fff' }}>
            Cancelar
          </button>
          <button onClick={() => setEditando(true)} disabled={editando}
            className="h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
            style={{ background: '#69a8d9', color: '#fff' }}>
            <Pencil size={14} /> Editar
          </button>
          <button onClick={salvar}
            className="h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5"
            style={{ background: '#88b87f', color: '#fff' }}>
            {copiado ? <Check size={15} /> : <Copy size={15} />} Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
