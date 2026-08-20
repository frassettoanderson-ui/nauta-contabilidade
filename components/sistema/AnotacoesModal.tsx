'use client'

import { useEffect, useState } from 'react'
import { X, Loader2, Send, Clock } from 'lucide-react'
import { getLeadDetail, addAtividade, type AtividadeRow } from '@/lib/api'

// Histórico de anotações/alterações do cliente (reusa as atividades do lead).
export default function AnotacoesModal({ leadId, nome, onClose }: { leadId: string; nome: string; onClose: () => void }) {
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
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-md" style={{ background: 'rgba(5,4,20,0.8)' }} onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl p-6 flex flex-col" style={{ background: 'rgba(15,14,26,0.97)', border: '1px solid var(--sys-border-2)', maxHeight: '85vh' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-black text-white flex items-center gap-2"><Clock size={18} className="text-[color:var(--sys-accent)]" /> Anotações</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        <p className="text-gray-500 text-sm mb-4 truncate">{nome}</p>

        {/* Nova anotação */}
        <div className="flex items-end gap-2 mb-4">
          <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={2}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) adicionar() }}
            placeholder="Escreva uma anotação ou alteração… (Ctrl+Enter para salvar)"
            className="flex-1 px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 outline-none resize-none"
            style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }} autoFocus />
          <button onClick={adicionar} disabled={salvando || !texto.trim()}
            className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--sys-accent), #6355e0)' }} title="Adicionar anotação">
            {salvando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>

        {/* Histórico */}
        <div className="overflow-y-auto -mr-2 pr-2 space-y-2" style={{ minHeight: 80 }}>
          {itens === null ? (
            <div className="h-24 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-gray-500" /></div>
          ) : itens.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-6">Nenhuma anotação ainda.</p>
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
    </div>
  )
}
