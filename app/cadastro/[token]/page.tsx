'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Check, AlertCircle, Pencil } from 'lucide-react'
import { CLI_FIELDS, EMP_FIELDS, SOCIO_FIELDS } from '@/lib/cadastro'
import SmartField from '@/components/cadastro/SmartField'
import type { CEPData } from '@/lib/form-masks'

type Obj = Record<string, unknown>

function makeCEPFill(setter: (k: string, v: unknown) => void, prefix: string) {
  return (data: CEPData) => {
    setter(`${prefix}endereco`, data.logradouro)
    setter(`${prefix}bairro`, data.bairro)
    setter(`${prefix}cidade_estado`, `${data.localidade}/${data.uf}`)
  }
}

export default function CadastroPublicoPage() {
  const { token } = useParams<{ token: string }>()
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [saving, setSaving] = useState(false)
  const [readOnly, setReadOnly] = useState(false)

  const [cli, setCli] = useState<Obj>({})
  const [emp, setEmp] = useState<Obj>({ emp_usa_glp: false })
  const [socios, setSocios] = useState<Obj[]>([{}, {}, {}])
  const [s2, setS2] = useState(false)
  const [s3, setS3] = useState(false)
  const [senhaGov, setSenhaGov] = useState('')

  useEffect(() => {
    fetch(`/api/cadastro/${token}`).then(async r => {
      if (!r.ok) { setErro('Link inválido ou expirado.'); setLoading(false); return }
      const d = await r.json()
      const c: Obj = {}, e: Obj = {}
      Object.entries(d).forEach(([k, v]) => { if (k.startsWith('cli_')) c[k] = v; if (k.startsWith('emp_')) e[k] = v })
      setCli(c); setEmp({ emp_usa_glp: false, ...e })
      const ss = (d.socios as Obj[]) || []
      setSocios([0, 1, 2].map(i => ss[i] ?? {}))
      if (ss[1]?.nome_completo || ss[1]?.cpf) setS2(true)
      if (ss[2]?.nome_completo || ss[2]?.cpf) setS3(true)
      // Já preenchido antes? Abre travado, com botão Editar.
      if (c.cli_nome_completo || c.cli_cpf) setReadOnly(true)
      setLoading(false)
    }).catch(() => { setErro('Erro ao carregar o cadastro.'); setLoading(false) })
  }, [token])

  const setCliK = (k: string, v: unknown) => setCli(s => ({ ...s, [k]: v }))
  const setEmpK = (k: string, v: unknown) => setEmp(s => ({ ...s, [k]: v }))
  const setSocioK = (i: number, k: string, v: unknown) => setSocios(s => s.map((x, j) => j === i ? { ...x, [k]: v } : x))

  async function enviar() {
    setSaving(true)
    const ativos = [true, s2, s3]
    const sociosOut = socios.map((s, i) => ativos[i] ? s : {})
    const r = await fetch(`/api/cadastro/${token}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...cli, ...emp, socios: sociosOut, senha_gov: senhaGov }),
    })
    setSaving(false)
    if (r.ok) setEnviado(true)
    else alert('Erro ao enviar. Tente novamente.')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0918' }}><Loader2 size={28} className="animate-spin text-[#0BBCD4]" /></div>

  if (erro) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0a0918' }}>
      <div className="text-center"><AlertCircle size={32} className="text-red-400 mx-auto mb-3" /><p className="text-white">{erro}</p></div>
    </div>
  )

  if (enviado) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0a0918' }}>
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(34,197,94,0.15)' }}><Check size={26} className="text-[#22c55e]" /></div>
        <h1 className="text-xl font-black text-white mb-2">Cadastro enviado!</h1>
        <p className="text-gray-400 text-sm">Obrigado. A Nauta Contabilidade recebeu seus dados.</p>
      </div>
    </div>
  )

  const Secao = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
    <div className="rounded-2xl p-5 mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h2 className="text-sm font-black text-[#0BBCD4] uppercase tracking-wider mb-4">{titulo}</h2>
      {children}
    </div>
  )

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: '#0a0918' }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo-branca.png" alt="Nauta" width={150} height={45} className="h-10 w-auto object-contain mb-3" priority />
          <h1 className="text-xl font-black text-white text-center">Ficha de cadastro</h1>
          <p className="text-gray-500 text-sm text-center mt-1">Preencha seus dados abaixo. Leva poucos minutos.</p>
        </div>

        <Secao titulo="Seus dados">
          <div className="grid sm:grid-cols-2 gap-3">
            {CLI_FIELDS.map(([k, label, type]) => (
              <SmartField key={k} label={label} type={type}
                value={(cli[k] as string) || ''}
                onChange={v => setCliK(k, v)}
                onCEPFill={type === 'cep' ? makeCEPFill(setCliK, 'cli_') : undefined}
                disabled={readOnly}
              />
            ))}
          </div>
        </Secao>

        <Secao titulo="Dados da empresa">
          <div className="grid sm:grid-cols-2 gap-3">
            {EMP_FIELDS.map(([k, label, type]) => (
              <SmartField key={k} label={label} type={type}
                value={(emp[k] as string) || ''}
                onChange={v => setEmpK(k, v)}
                onCEPFill={type === 'cep' ? makeCEPFill(setEmpK, 'emp_') : undefined}
                disabled={readOnly}
              />
            ))}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Usa gás GLP?</label>
              <div className="flex gap-2">
                {[['Sim', true], ['Não', false]].map(([l, val]) => (
                  <button key={String(l)} type="button" disabled={readOnly} onClick={() => setEmpK('emp_usa_glp', val)} className="flex-1 h-11 rounded-xl text-sm font-bold"
                    style={{ background: emp.emp_usa_glp === val ? '#0BBCD4' : 'rgba(255,255,255,0.05)', color: emp.emp_usa_glp === val ? '#fff' : '#9ca3af', border: '1px solid rgba(255,255,255,0.10)' }}>{l as string}</button>
                ))}
              </div>
            </div>
          </div>
        </Secao>

        <Secao titulo="Sócio 1">
          <div className="grid sm:grid-cols-2 gap-3">
            {SOCIO_FIELDS.map(([k, label, type]) => (
              <SmartField key={k} label={label} type={type}
                value={(socios[0]?.[k] as string) || ''}
                onChange={v => setSocioK(0, k, v)}
                disabled={readOnly}
              />
            ))}
          </div>
        </Secao>

        <label className="flex items-center gap-2 mb-4 cursor-pointer"><input type="checkbox" checked={s2} disabled={readOnly} onChange={e => setS2(e.target.checked)} className="w-4 h-4 accent-[#0BBCD4]" /><span className="text-sm text-gray-300">Adicionar Sócio 2</span></label>
        {s2 && <Secao titulo="Sócio 2"><div className="grid sm:grid-cols-2 gap-3">{SOCIO_FIELDS.map(([k, label, type]) => <SmartField key={k} label={label} type={type} value={(socios[1]?.[k] as string) || ''} onChange={v => setSocioK(1, k, v)} disabled={readOnly} />)}</div></Secao>}

        <label className="flex items-center gap-2 mb-4 cursor-pointer"><input type="checkbox" checked={s3} disabled={readOnly} onChange={e => setS3(e.target.checked)} className="w-4 h-4 accent-[#0BBCD4]" /><span className="text-sm text-gray-300">Adicionar Sócio 3</span></label>
        {s3 && <Secao titulo="Sócio 3"><div className="grid sm:grid-cols-2 gap-3">{SOCIO_FIELDS.map(([k, label, type]) => <SmartField key={k} label={label} type={type} value={(socios[2]?.[k] as string) || ''} onChange={v => setSocioK(2, k, v)} disabled={readOnly} />)}</div></Secao>}

        <Secao titulo="Acesso gov.br">
          <p className="text-xs text-gray-400 mb-3">Sua senha do gov.br é guardada com segurança e fica visível apenas para a coordenação do escritório. Não aparece no cadastro.</p>
          <SmartField label="Senha do gov.br" type="text"
            value={senhaGov} onChange={v => setSenhaGov(v as string)} disabled={readOnly} />
        </Secao>

        {readOnly ? (
          <button onClick={() => setReadOnly(false)}
            className="w-full h-12 font-bold text-white rounded-xl flex items-center justify-center gap-2 mt-2"
            style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>
            <Pencil size={16} /> Editar meus dados
          </button>
        ) : (
          <button onClick={enviar} disabled={saving}
            className="w-full h-12 font-bold text-white rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>
            {saving ? <Loader2 size={18} className="animate-spin" /> : 'Enviar cadastro'}
          </button>
        )}
      </div>
    </div>
  )
}
