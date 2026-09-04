'use client'

import { useEffect, useState } from 'react'
import { Loader2, Send, Clock } from 'lucide-react'
import { getLeadDetail, addAtividade, type AtividadeRow } from '@/lib/api'

// Histórico de anotações do cliente — dentro do cadastro (mantém o que veio do
// CRM/onboarding e permite novas). É o mesmo registro (lead_atividades).
export default function HistoricoCliente({ leadId }: { leadId: string }) {
  const [itens, setItens] = useState<AtividadeRow[] | null>(null)
  const [texto, setTexto] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    let vivo = true
    getLeadDetail(leadId)
      .then(d => { if (vivo) setItens(d.atividades ?? []) })
      .catch(() => { if (vivo) setItens([]) })
    return () => { vivo = false }
  }, [leadId])

  async function adicionar() {
    const t = texto.trim()
    if (!t) return
    setSalvando(true)
    try {
      const nova = await addAtividade(leadId, t)
      setItens(l => [nova, ...(l ?? [])])
      setTexto('')
    } catch {
      alert('Não foi possível salvar a anotação.')
    } finally {
      setSalvando(false)
    }
  }

  const fmt = (v: string) => {
    try { return new Date(v).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
    catch { return v }
  }

  return (
    <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
      <p className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <Clock size={16} className="text-[color:var(--sys-accent)]" /> Histórico de anotações
      </p>

      <div className="flex items-end gap-2 mb-3">
        <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={2}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) adicionar() }}
          placeholder="Nova anotação sobre o cliente… (Ctrl+Enter para salvar)"
          className="flex-1 px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none resize-none"
          style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }} />
        <button onClick={adicionar} disabled={salvando || !texto.trim()}
          className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, var(--sys-accent), #6355e0)' }} title="Adicionar anotação">
          {salvando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto -mr-2 pr-2">
        {itens === null ? (
          <div className="h-16 flex items-center justify-center"><Loader2 size={18} className="animate-spin text-gray-500" /></div>
        ) : itens.length === 0 ? (
          <p className="text-gray-600 text-xs">Nenhuma anotação ainda.</p>
        ) : (
          itens.map(a => (
            <div key={a.id} className="rounded-xl p-3" style={{ background: 'var(--sys-surface-2)', border: '1px solid var(--sys-border)' }}>
              <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">{a.descricao}</p>
              <p className="text-[11px] text-gray-500 mt-1.5">{fmt(a.criado_em)}{a.autor ? ` · ${a.autor}` : ''}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
