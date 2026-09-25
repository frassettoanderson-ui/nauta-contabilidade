'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import LogoObrigo from '@/components/sistema/LogoObrigo'
import { playClick } from '@/lib/click-sound'

// Login no padrão do Obrigô (AuthShell.tsx): fundo gradiente marinho-800→900,
// logo centralizada, card branco (.card p-7), título/subtítulo slate, .label/.input, btn-primary.
export default function SistemaLoginPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    playClick()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', { email: usuario, password: senha, redirect: false })
    if (res?.ok) router.push('/sistema')
    else { setError('Usuário ou senha incorretos.'); setLoading(false) }
  }

  return (
    <main className="sys-theme grid min-h-screen place-items-center p-4" style={{ background: 'linear-gradient(to bottom right, #0e2240, #0a1a33)' }}>
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <LogoObrigo size={40} variant="light" />
        </div>
        <div className="card p-7">
          <h1 className="text-xl font-semibold text-slate-800">Entrar</h1>
          <p className="mt-1 text-sm text-slate-500">Acesse o painel do seu escritório</p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <div>
              <label htmlFor="usuario" className="label">Usuário</label>
              <input id="usuario" type="text" autoComplete="username" value={usuario} onChange={e => setUsuario(e.target.value)} className="input" required />
            </div>
            <div>
              <label htmlFor="senha" className="label">Senha</label>
              <div className="relative">
                <input id="senha" type={showPass ? 'text' : 'password'} autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)} className="input pr-10" required />
                <button type="button" onClick={() => setShowPass(s => !s)} aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Entrar'}
            </button>
            <div className="text-center">
              <Link href="/sistema/recuperar-senha" className="text-sm hover:underline" style={{ color: '#D9650F' }}>Esqueci minha senha</Link>
            </div>
          </form>
        </div>
        <div className="mt-4 text-center text-sm" style={{ color: '#d6e0ee' }}>
          Ainda não tem usuário?{' '}
          <Link href="/sistema/criar-usuario" className="font-medium text-white underline">Criar usuário</Link>
        </div>
      </div>
    </main>
  )
}
