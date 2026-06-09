'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, Check, ArrowLeft, ArrowRight, Upload, FileText, Paperclip } from 'lucide-react'
import { uploadDoc, saveCliente, getCliente, getClienteByLead } from '@/lib/api'

type Obj = Record<string, unknown>

const FIELD = 'w-full h-11 px-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none'
const FS = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }

const PASSOS = ['Dados do cliente', 'Dados da empresa', 'Sócio 1', 'Sócio 2', 'Sócio 3']

const CLI_FIELDS = [
  ['cli_nome_completo', 'Nome completo'], ['cli_rg', 'RG'], ['cli_cpf', 'CPF'],
  ['cli_nascimento', 'Data de nascimento', 'date'], ['cli_nome_pai', 'Nome do pai'], ['cli_nome_mae', 'Nome da mãe'],
  ['cli_estado_civil', 'Estado civil'], ['cli_recibo_irpf', 'Nº recibo de IRPF'], ['cli_titulo_eleitor', 'Nº título de eleitor'],
]
const EMP_FIELDS = [
  ['emp_nome', 'Nome da empresa'], ['emp_fantasia', 'Nome fantasia'], ['emp_endereco', 'Endereço da empresa'],
  ['emp_area_ocupada', 'Área ocupada pela empresa'], ['emp_edificacao', 'Nome e área total da edificação'],
  ['emp_proprietario', 'Nome e CPF do proprietário do imóvel'], ['emp_atividade', 'Atividade da empresa'],
  ['emp_capital_social', 'Valor do capital social'], ['emp_telefone', 'Telefone para contato'], ['emp_email', 'E-mail para contato'],
]
const SOCIO_FIELDS = [
  ['nome_completo', 'Nome completo'], ['rg', 'RG'], ['cpf', 'CPF'], ['nascimento', 'Data de nascimento', 'date'],
  ['nome_pai', 'Nome do pai'], ['nome_mae', 'Nome da mãe'], ['participacao', 'Participação (%)', 'number'],
  ['estado_civil', 'Estado civil'], ['recibo_irpf', 'Nº recibo de IRPF'], ['titulo_eleitor', 'Nº título de eleitor'],
]
// mapeamento cliente → sócio (campos pessoais)
const CLI_TO_SOCIO: [string, string][] = [
  ['cli_nome_completo', 'nome_completo'], ['cli_rg', 'rg'], ['cli_cpf', 'cpf'], ['cli_nascimento', 'nascimento'],
  ['cli_nome_pai', 'nome_pai'], ['cli_nome_mae', 'nome_mae'], ['cli_estado_civil', 'estado_civil'],
  ['cli_recibo_irpf', 'recibo_irpf'], ['cli_titulo_eleitor', 'titulo_eleitor'],
]

function TextField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className={FIELD} style={{ ...FS, ...(type === 'date' ? { colorScheme: 'dark' } : {}) }} />
    </div>
  )
}

function FileField({ label, url, onUpload }: { label: string; url?: string; onUpload: (url: string) => void }) {
  const [busy, setBusy] = useState(false)
  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    setBusy(true)
    try { const r = await uploadDoc(f); onUpload(r.url) } catch { alert('Erro no upload') }
    setBusy(false)
  }
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-1.5">{label}</label>
      <label className="flex items-center gap-2 h-11 px-4 rounded-xl cursor-pointer text-sm" style={FS}>
        {busy ? <Loader2 size={15} className="animate-spin text-[#0BBCD4]" /> : url ? <FileText size={15} className="text-[#22c55e]" /> : <Upload size={15} className="text-gray-500" />}
        <span className={url ? 'text-[#22c55e]' : 'text-gray-500'}>{busy ? 'Enviando...' : url ? 'Arquivo enviado ✓' : 'Selecionar arquivo'}</span>
        <input type="file" className="hidden" onChange={handle} />
      </label>
    </div>
  )
}

function PessoaUploads({ docKey, certKey, senhaKey, data, set }: { docKey: string; certKey: string; senhaKey: string; data: Obj; set: (k: string, v: unknown) => void }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3 pt-2">
      <FileField label="Cópia do documento pessoal" url={data[docKey] as string} onUpload={u => set(docKey, u)} />
      <FileField label="Certificado digital" url={data[certKey] as string} onUpload={u => set(certKey, u)} />
      <div className="sm:col-span-2">
        <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1"><Paperclip size={11} /> Senha do certificado digital</label>
        <input type="text" value={(data[senhaKey] as string) || ''} onChange={e => set(senhaKey, e.target.value)} className={FIELD} style={FS} placeholder="senha do certificado" />
      </div>
    </div>
  )
}

function Wizard() {
  const params = useSearchParams()
  const router = useRouter()
  const leadId = params.get('lead') || undefined
  const clienteParam = params.get('cliente') || undefined

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [clienteId, setClienteId] = useState<string | undefined>(clienteParam)

  const [cli, setCli] = useState<Obj>({})
  const [emp, setEmp] = useState<Obj>({ emp_usa_glp: false })
  const [socios, setSocios] = useState<Obj[]>([{}, {}, {}])
  const [usarCliente, setUsarCliente] = useState(false)

  useEffect(() => {
    async function init() {
      let data: Obj | null = null
      if (clienteParam) data = await getCliente(clienteParam)
      else if (leadId) data = await getClienteByLead(leadId)
      if (data) {
        setClienteId(data.id as string)
        const c: Obj = {}, e: Obj = {}
        Object.entries(data).forEach(([k, v]) => { if (k.startsWith('cli_')) c[k] = v; if (k.startsWith('emp_')) e[k] = v })
        setCli(c); setEmp({ emp_usa_glp: false, ...e })
        const ss = (data.socios as Obj[] | undefined) ?? []
        setSocios([0, 1, 2].map(i => ss[i] ?? {}))
      }
      setLoading(false)
    }
    init()
  }, [clienteParam, leadId])

  const setCliK = (k: string, v: unknown) => setCli(s => ({ ...s, [k]: v }))
  const setEmpK = (k: string, v: unknown) => setEmp(s => ({ ...s, [k]: v }))
  const setSocioK = (i: number, k: string, v: unknown) => setSocios(s => s.map((x, j) => j === i ? { ...x, [k]: v } : x))

  function toggleUsarCliente(checked: boolean) {
    setUsarCliente(checked)
    if (checked) {
      setSocios(s => s.map((x, j) => {
        if (j !== 0) return x
        const novo: Obj = { ...x }
        CLI_TO_SOCIO.forEach(([ck, sk]) => { novo[sk] = cli[ck] ?? '' })
        return novo
      }))
    }
  }

  const totalPart = socios.reduce((sum, x) => sum + (Number(x.participacao) || 0), 0)

  async function handleSave() {
    if (totalPart > 100) { alert(`A soma da participação dos sócios é ${totalPart}% — não pode passar de 100%.`); return }
    setSaving(true); setSavedMsg('')
    try {
      const payload: Obj = { id: clienteId, lead_id: leadId, ...cli, ...emp, socios }
      const r = await saveCliente(payload)
      setClienteId(r.id)
      setSavedMsg('Cadastro salvo com sucesso!')
      setTimeout(() => router.push('/sistema/clientes/consultar'), 900)
    } catch {
      alert('Erro ao salvar o cadastro.')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-24"><Loader2 size={24} className="animate-spin text-[#0BBCD4]" /></div>

  const socioIdx = step - 2

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <h1 className="text-2xl font-black text-white mb-1" style={{ letterSpacing: '-0.02em' }}>Cadastro de cliente</h1>
      <p className="text-gray-500 text-sm mb-6">{leadId ? 'Vinculado ao lead selecionado' : clienteId ? 'Editando cadastro existente' : 'Novo cadastro'}</p>

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
        {PASSOS.map((p, i) => (
          <button key={p} onClick={() => setStep(i)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all"
            style={{ background: step === i ? 'rgba(11,188,212,0.15)' : 'rgba(255,255,255,0.04)', color: step === i ? '#0BBCD4' : '#6b7280', border: step === i ? '1px solid rgba(11,188,212,0.3)' : '1px solid transparent' }}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: step >= i ? '#0BBCD4' : 'rgba(255,255,255,0.1)', color: step >= i ? '#fff' : '#9ca3af' }}>{i + 1}</span>
            {p}
          </button>
        ))}
      </div>

      <div className="rounded-2xl p-6 mb-6 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Passo 0 — Cliente */}
        {step === 0 && (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              {CLI_FIELDS.map(([k, label, type]) => <TextField key={k} label={label} type={type} value={(cli[k] as string) || ''} onChange={v => setCliK(k, v)} />)}
            </div>
            <PessoaUploads docKey="cli_doc_url" certKey="cli_cert_url" senhaKey="cli_cert_senha" data={cli} set={setCliK} />
          </>
        )}

        {/* Passo 1 — Empresa */}
        {step === 1 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {EMP_FIELDS.map(([k, label, type]) => <TextField key={k} label={label} type={type} value={(emp[k] as string) || ''} onChange={v => setEmpK(k, v)} />)}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Usa gás GLP?</label>
              <div className="flex gap-2">
                {[['Sim', true], ['Não', false]].map(([l, val]) => (
                  <button key={String(l)} type="button" onClick={() => setEmpK('emp_usa_glp', val)}
                    className="flex-1 h-11 rounded-xl text-sm font-bold transition-all"
                    style={{ background: emp.emp_usa_glp === val ? '#0BBCD4' : 'rgba(255,255,255,0.05)', color: emp.emp_usa_glp === val ? '#fff' : '#9ca3af', border: '1px solid rgba(255,255,255,0.10)' }}>
                    {l as string}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Passos 2-4 — Sócios */}
        {step >= 2 && (
          <>
            {socioIdx === 0 && (
              <label className="flex items-center gap-2 mb-2 cursor-pointer p-3 rounded-xl" style={{ background: 'rgba(11,188,212,0.06)', border: '1px solid rgba(11,188,212,0.2)' }}>
                <input type="checkbox" checked={usarCliente} onChange={e => toggleUsarCliente(e.target.checked)} className="w-4 h-4 accent-[#0BBCD4]" />
                <span className="text-sm text-gray-300">Usar os dados do cliente como Sócio 1</span>
              </label>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              {SOCIO_FIELDS.map(([k, label, type]) => <TextField key={k} label={label} type={type} value={(socios[socioIdx]?.[k] as string) || ''} onChange={v => setSocioK(socioIdx, k, v)} />)}
            </div>
            <PessoaUploads docKey="doc_url" certKey="cert_url" senhaKey="cert_senha" data={socios[socioIdx] || {}} set={(k, v) => setSocioK(socioIdx, k, v)} />
            <p className="text-xs pt-1" style={{ color: totalPart > 100 ? '#f87171' : '#6b7280' }}>
              Soma da participação dos sócios: <b>{totalPart}%</b>{totalPart > 100 ? ' — excede 100%!' : ` (faltam ${Math.max(0, 100 - totalPart)}%)`}
            </p>
          </>
        )}
      </div>

      {savedMsg && <p className="text-sm text-[#22c55e] mb-4 flex items-center gap-2"><Check size={15} /> {savedMsg}</p>}

      {/* Navegação */}
      <div className="flex items-center justify-between">
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          className="inline-flex items-center gap-2 px-4 h-11 rounded-xl text-sm text-gray-300 disabled:opacity-40" style={FS}>
          <ArrowLeft size={15} /> Voltar
        </button>
        {step < PASSOS.length - 1 ? (
          <button onClick={() => setStep(s => Math.min(PASSOS.length - 1, s + 1))}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>
            Próximo <ArrowRight size={15} />
          </button>
        ) : (
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 px-6 h-11 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Salvar cadastro</>}
          </button>
        )}
      </div>
    </div>
  )
}

export default function CadastrarClientePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Loader2 size={24} className="animate-spin text-[#0BBCD4]" /></div>}>
      <Wizard />
    </Suspense>
  )
}
