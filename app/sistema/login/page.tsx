'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { User, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import GridBackground from '@/components/sistema/GridBackground'
import { playClick } from '@/lib/click-sound'

const FIELD = 'w-full h-12 pl-11 pr-4 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-all duration-200'

export default function SistemaLoginPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focus, setFocus] = useState<string | null>(null)

  // Tilt 3D suave da caixa conforme o mouse se aproxima
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState('')

  function handleCardMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5   // -0.5 → 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    setTilt(`perspective(900px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateY(-2px)`)
  }
  function handleCardLeave() {
    setTilt('perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    playClick()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', { email: usuario, password: senha, redirect: false })
    if (res?.ok) {
      router.push('/sistema')
    } else {
      setError('Usuário ou senha incorretos.')
      setLoading(false)
    }
  }

  const fieldStyle = (name: string) => ({
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${focus === name ? 'rgba(11,188,212,0.6)' : 'rgba(255,255,255,0.10)'}`,
    boxShadow: focus === name ? '0 0 0 4px rgba(11,188,212,0.10)' : 'none',
  })

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <GridBackground />

      <section className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo-vertical-branca.png"
            alt="Nauta Contabilidade"
            width={200}
            height={160}
            className="w-36 h-auto object-contain"
            priority
            style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' }}
          />
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-[#0BBCD4]">
            Sistema de Gestão
          </p>
        </div>

        {/* Card */}
        <div
          ref={cardRef}
          onMouseMove={handleCardMove}
          onMouseLeave={handleCardLeave}
          className="rounded-2xl p-7"
          style={{
            background: 'rgba(15,14,26,0.72)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
            transform: tilt || 'perspective(900px)',
            transition: 'transform 0.25s ease-out',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Usuário */}
            <div>
              <label htmlFor="usuario" className="block text-xs font-semibold text-gray-400 mb-1.5">Usuário</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  id="usuario"
                  type="text"
                  autoComplete="username"
                  value={usuario}
                  onChange={e => setUsuario(e.target.value)}
                  onFocus={() => setFocus('usuario')}
                  onBlur={() => setFocus(null)}
                  placeholder="seu usuário"
                  className={FIELD}
                  style={fieldStyle('usuario')}
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="senha" className="block text-xs font-semibold text-gray-400 mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  id="senha"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  onFocus={() => setFocus('senha')}
                  onBlur={() => setFocus(null)}
                  placeholder="••••••••"
                  className={FIELD + ' pr-11'}
                  style={fieldStyle('senha')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors rounded-lg"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="group w-full h-12 font-bold text-white rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #0BBCD4, #0999ae)',
                boxShadow: '0 8px 28px rgba(11,188,212,0.28)',
              }}
            >
              {loading
                ? <Loader2 size={18} className="animate-spin" />
                : <>Entrar <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" /></>
              }
            </button>
          </form>

          {/* Links */}
          <div className="flex items-center justify-between mt-5 text-xs">
            <Link href="/sistema/criar-usuario" className="text-gray-400 hover:text-[#0BBCD4] transition-colors">
              Criar usuário
            </Link>
            <Link href="/sistema/recuperar-senha" className="text-gray-400 hover:text-[#0BBCD4] transition-colors">
              Recuperar senha
            </Link>
          </div>
        </div>

        <p className="text-center text-gray-600 text-[11px] mt-6">
          © {new Date().getFullYear()} Nauta Contabilidade · Acesso restrito
        </p>
      </section>
    </main>
  )
}
