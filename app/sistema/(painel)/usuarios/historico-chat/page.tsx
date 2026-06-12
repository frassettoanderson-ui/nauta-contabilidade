'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, MessageCircle, X } from 'lucide-react'
import { chatHistorico, chatMensagens, type ChatHistorico, type ChatMensagem } from '@/lib/api'

const ROLE: Record<string, string> = { comercial: 'Comercial', fiscal: 'Fiscal', pessoal: 'Pessoal', atendente: 'Atendimento' }
const MOTIVO: Record<string, string> = { atendente: 'Encerrado pelo atendente', inatividade: 'Encerrado por inatividade' }

export default function HistoricoChatPage() {
  const [rows, setRows] = useState<ChatHistorico[] | null>(null)
  const [ver, setVer] = useState<ChatHistorico | null>(null)

  useEffect(() => { chatHistorico().then(setRows).catch(() => setRows([])) }, [])

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <h1 className="text-2xl font-black text-white mb-1 flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
        <MessageCircle size={22} className="text-[#0BBCD4]" /> Histórico de chat
      </h1>
      <p className="text-gray-500 text-sm mb-6">Atendimentos do site encerrados.</p>

      {rows === null ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#0BBCD4]" /></div>
      ) : rows.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-16">Nenhum atendimento encerrado ainda.</p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
          {rows.map((r, i) => (
            <button key={r.id} onClick={() => setVer(r)}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-white/[0.03] transition-colors"
              style={{ borderTop: i ? '1px solid var(--sys-surface-4)' : 'none' }}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{r.visitante_nome || 'Visitante'}</p>
                <p className="text-[11px] text-gray-500">{ROLE[r.setor ?? ''] ?? r.setor} · {r.visitante_contato || '—'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] text-gray-400">{format(new Date(r.encerrada_em), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}</p>
                <p className="text-[10px] text-gray-600">{MOTIVO[r.encerrada_motivo ?? ''] ?? r.encerrada_motivo}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {ver && <VerConversa conversa={ver} onClose={() => setVer(null)} />}
    </div>
  )
}

function VerConversa({ conversa, onClose }: { conversa: ChatHistorico; onClose: () => void }) {
  const [msgs, setMsgs] = useState<ChatMensagem[] | null>(null)
  useEffect(() => { chatMensagens(conversa.id).then(setMsgs).catch(() => setMsgs([])) }, [conversa.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl" style={{ background: 'var(--sys-modal)', border: '1px solid var(--sys-border-2)' }}>
        <div className="flex items-center justify-between px-5 h-14 border-b shrink-0" style={{ borderColor: 'var(--sys-border)' }}>
          <div>
            <p className="text-sm font-bold text-white">{conversa.visitante_nome || 'Visitante'}</p>
            <p className="text-[11px] text-gray-500">{ROLE[conversa.setor ?? ''] ?? conversa.setor}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {msgs === null ? <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[#0BBCD4]" /></div>
            : msgs.map(m => {
              const visit = m.autor_tipo === 'visitante'
              const bot = m.autor_tipo === 'bot'
              if (bot) return <p key={m.id} className="text-center text-[11px] text-gray-500 whitespace-pre-wrap py-1">{m.texto}</p>
              return (
                <div key={m.id} className={`flex ${visit ? 'justify-start' : 'justify-end'}`}>
                  <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm" style={{ background: visit ? 'var(--sys-surface-3)' : 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>
                    {!visit && <p className="text-[10px] text-white/70 mb-0.5">{m.autor_nome}</p>}
                    <p className={visit ? 'text-gray-200' : 'text-white'}>{m.texto}</p>
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
