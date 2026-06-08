'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, LogIn } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/admin/blog')
    })
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('Email ou senha inválidos.')
    } else {
      router.push('/admin/blog')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#07060f' }}
    >
      {/* Orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(11,188,212,0.08) 0%, transparent 70%)' }}
      />

      <div
        className="relative w-full max-w-sm rounded-2xl p-8"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(11,188,212,0.12)', border: '1px solid rgba(11,188,212,0.2)' }}
          >
            <LogIn size={20} className="text-[#0BBCD4]" />
          </div>
          <h1 className="text-xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>
            Nauta Admin
          </h1>
          <p className="text-gray-500 text-sm mt-1">Acesso restrito ao painel</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full h-11 px-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(11,188,212,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(11,188,212,0.1)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; e.target.style.boxShadow = 'none' }}
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full h-11 px-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(11,188,212,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(11,188,212,0.1)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; e.target.style.boxShadow = 'none' }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 font-bold text-white rounded-xl flex items-center justify-center gap-2 transition-all hover:-translate-y-px disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)', boxShadow: '0 4px 20px rgba(11,188,212,0.25)' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
