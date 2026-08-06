'use client'

import { useEffect, useState } from 'react'

interface Comentario { id: string; nome: string; comentario: string; criado_em: string }

const LS_KEY = 'nauta_coment_dados'

export default function CommentSection({ postId }: { postId: string }) {
  const [lista, setLista] = useState<Comentario[]>([])
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [comentario, setComentario] = useState('')
  const [salvar, setSalvar] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  useEffect(() => {
    fetch(`/api/blog/comentarios?postId=${postId}`)
      .then(r => r.json()).then(d => setLista(d.comentarios ?? [])).catch(() => {})
    try {
      const s = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
      if (s) { setNome(s.nome || ''); setEmail(s.email || ''); setSalvar(true) }
    } catch {}
  }, [postId])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (nome.trim().length < 2) { setMsg({ tipo: 'erro', texto: 'Informe seu nome.' }); return }
    if (comentario.trim().length < 3) { setMsg({ tipo: 'erro', texto: 'Escreva um comentário.' }); return }
    setEnviando(true)
    try {
      const r = await fetch('/api/blog/comentarios', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, nome, email, comentario }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Erro ao enviar')
      if (salvar) localStorage.setItem(LS_KEY, JSON.stringify({ nome, email }))
      else localStorage.removeItem(LS_KEY)
      setComentario('')
      setMsg({ tipo: 'ok', texto: 'Comentário enviado! Ele aparece aqui após a nossa aprovação.' })
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err instanceof Error ? err.message : 'Erro ao enviar.' })
    } finally {
      setEnviando(false)
    }
  }

  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }

  return (
    <section className="mt-14 pt-10 border-t border-white/10">
      <h2 className="text-2xl font-black text-white mb-6" style={{ letterSpacing: '-0.02em' }}>
        Comentários {lista.length > 0 && <span className="text-gray-500 text-lg font-bold">({lista.length})</span>}
      </h2>

      {/* Lista */}
      {lista.length > 0 && (
        <div className="space-y-5 mb-10">
          {lista.map(c => (
            <div key={c.id} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#0BBCD4' }}>
                  {c.nome.trim().charAt(0).toUpperCase()}
                </span>
                <span className="text-gray-200 text-sm font-semibold">{c.nome}</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{c.comentario}</p>
            </div>
          ))}
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={enviar} className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 className="text-white font-bold mb-1">Deixe seu comentário</h3>
        <p className="text-xs text-gray-500 mb-5">Campos com <span className="text-[#0BBCD4]">*</span> são obrigatórios.</p>

        <label className="block text-sm text-gray-300 mb-1.5">Comentário <span className="text-[#0BBCD4]">*</span></label>
        <textarea value={comentario} onChange={e => setComentario(e.target.value)} rows={4} required
          className="w-full rounded-xl p-3 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#0BBCD4]/30 mb-4 resize-y" style={inputStyle} />

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Nome <span className="text-[#0BBCD4]">*</span></label>
            <input value={nome} onChange={e => setNome(e.target.value)} required
              className="w-full h-11 rounded-xl px-3 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#0BBCD4]/30" style={inputStyle} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">E-mail <span className="text-gray-600">(opcional)</span></label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full h-11 rounded-xl px-3 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#0BBCD4]/30" style={inputStyle} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-gray-400 mb-5 cursor-pointer">
          <input type="checkbox" checked={salvar} onChange={e => setSalvar(e.target.checked)} className="accent-[#0BBCD4]" />
          Salvar meus dados neste navegador para a próxima vez que eu comentar.
        </label>

        {msg && (
          <p className="text-sm mb-4" style={{ color: msg.tipo === 'ok' ? '#22c55e' : '#f87171' }}>{msg.texto}</p>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={enviando}
            className="px-6 py-3 font-bold text-white text-sm rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50"
            style={{ background: '#0BBCD4' }}>
            {enviando ? 'Enviando…' : 'Publicar comentário'}
          </button>
        </div>
      </form>
    </section>
  )
}
