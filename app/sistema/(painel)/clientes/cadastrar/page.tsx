'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2, Check, ArrowLeft, ArrowRight, Upload, FileText, Paperclip, Save, Trash2, Link2, Copy, X, Pencil } from 'lucide-react'
import { uploadDoc, saveCliente, getCliente, getClienteByLead, deleteCliente, gerarLinkCadastro, getLeadDetail } from '@/lib/api'
import { CLI_FIELDS, EMP_FIELDS, SOCIO_FIELDS, CLI_TO_SOCIO } from '@/lib/cadastro'
import { tipoFromInteresse, requiredKeysFor, REQ_SOCIO, TIPO_LABEL } from '@/lib/contratos'
import SmartField from '@/components/cadastro/SmartField'
import type { CEPData } from '@/lib/form-masks'

type Obj = Record<string, unknown>

const FIELD = 'w-full h-11 px-4 rounded-xl text-sm text-white placeholder-gray-600 outline-none disabled:opacity-40'
const FS = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }
const PASSOS = ['Dados do cliente', 'Dados da empresa', 'Sócio 1', 'Sócio 2', 'Sócio 3']

function makeCEPFill(setter: (k: string, v: unknown) => void, prefix: string) {
  return (data: CEPData) => {
    setter(`${prefix}endereco`, data.logradouro)
    setter(`${prefix}bairro`, data.bairro)
    setter(`${prefix}cidade_estado`, `${data.localidade}/${data.uf}`)
  }
}

function FileField({ label, url, onUpload, disabled }: { label: string; url?: string; onUpload: (url: string) => void; disabled?: boolean }) {
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
      <label className={`flex items-center gap-2 h-11 px-4 rounded-xl text-sm ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`} style={FS}>
        {busy ? <Loader2 size={15} className="animate-spin text-[#0BBCD4]" /> : url ? <FileText size={15} className="text-[#22c55e]" /> : <Upload size={15} className="text-gray-500" />}
        <span className={url ? 'text-[#22c55e]' : 'text-gray-500'}>{busy ? 'Enviando...' : url ? 'Arquivo enviado ✓' : 'Selecionar arquivo'}</span>
        <input type="file" className="hidden" disabled={disabled} onChange={handle} />
      </label>
    </div>
  )
}

function PessoaUploads({ docKey, certKey, senhaKey, data, set, disabled }: { docKey: string; certKey: string; senhaKey: string; data: Obj; set: (k: string, v: unknown) => void; disabled?: boolean }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3 pt-2">
      <FileField label="Cópia do documento pessoal" url={data[docKey] as string} onUpload={u => set(docKey, u)} disabled={disabled} />
      <FileField label="Certificado digital" url={data[certKey] as string} onUpload={u => set(certKey, u)} disabled={disabled} />
      <div className="sm:col-span-2">
        <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1"><Paperclip size={11} /> Senha do certificado digital</label>
        <input type="text" disabled={disabled} value={(data[senhaKey] as string) || ''} onChange={e => set(senhaKey, e.target.value)} className={FIELD} style={FS} placeholder="senha do certificado" />
      </div>
    </div>
  )
}

function Wizard() {
  const params = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const role = (session?.user as unknown as { role?: string })?.role
  const podeExcluir = role === 'admin' || role === 'gerente'

  const leadId = params.get('lead') || undefined
  const clienteParam = params.get('cliente') || undefined

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [clienteId, setClienteId] = useState<string | undefined>(clienteParam)
  const [linkUrl, setLinkUrl] = useState('')
  const [readOnly, setReadOnly] = useState(false)

  const [cli, setCli] = useState<Obj>({})
  const [emp, setEmp] = useState<Obj>({ emp_usa_glp: false })
  const [socios, setSocios] = useState<Obj[]>([{}, {}, {}])
  const [usarCliente, setUsarCliente] = useState(false)
  const [propEhSocio1, setPropEhSocio1] = useState(false)
  const [socio2Ativo, setSocio2Ativo] = useState(false)
  const [socio3Ativo, setSocio3Ativo] = useState(false)
  const [tipo, setTipo] = useState<number | null>(null)

  useEffect(() => {
    async function init() {
      let data: Obj | null = null
      if (clienteParam) data = await getCliente(clienteParam)
      else if (leadId) data = await getClienteByLead(leadId)
      if (data) {
        setClienteId(data.id as string)
        setReadOnly(true)
        const c: Obj = {}, e: Obj = {}
        Object.entries(data).forEach(([k, v]) => { if (k.startsWith('cli_')) c[k] = v; if (k.startsWith('emp_')) e[k] = v })
        setCli(c); setEmp({ emp_usa_glp: false, ...e })
        const ss = (data.socios as Obj[] | undefined) ?? []
        setSocios([0, 1, 2].map(i => ss[i] ?? {}))
        if (ss[1]?.nome_completo || ss[1]?.cpf) setSocio2Ativo(true)
        if (ss[2]?.nome_completo || ss[2]?.cpf) setSocio3Ativo(true)
      }
      // Determina o tipo de contrato pelo interesse do lead
      const lid = leadId || (data?.lead_id as string | undefined)
      if (lid) {
        try { const lead = await getLeadDetail(lid); setTipo(tipoFromInteresse(lead.interesse)) } catch {}
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

  function togglePropSocio1(checked: boolean) {
    setPropEhSocio1(checked)
    if (checked) {
      const s1 = socios[0] || {}
      setEmp(e => ({
        ...e,
        emp_proprietario_nome: (s1.nome_completo as string) || (cli.cli_nome_completo as string) || '',
        emp_proprietario_cpf:  (s1.cpf as string) || (cli.cli_cpf as string) || '',
      }))
    }
  }

  const ativos = [true, socio2Ativo, socio3Ativo]
  const totalPart = socios.reduce((sum, x, i) => sum + (ativos[i] ? (Number(x.participacao) || 0) : 0), 0)

  function montarPayload(): Obj {
    const sociosOut = socios.map((s, i) => ativos[i] ? s : {})
    return { id: clienteId, lead_id: leadId, ...cli, ...emp, socios: sociosOut }
  }

  async function persistir(): Promise<string | null> {
    if (totalPart > 100) { alert(`A soma da participação dos sócios é ${totalPart}% — não pode passar de 100%.`); return null }
    const r = await saveCliente(montarPayload())
    setClienteId(r.id)
    return r.id
  }

  async function handleSalvar(redirect: boolean) {
    setSaving(true); setSavedMsg('')
    try {
      const id = await persistir()
      if (id) {
        setSavedMsg('Cadastro salvo com sucesso!')
        if (redirect) setTimeout(() => router.push('/sistema/clientes/consultar'), 900)
      }
    } catch { alert('Erro ao salvar o cadastro.') }
    finally { setSaving(false) }
  }

  async function handleExcluir() {
    if (!podeExcluir) { alert('Solicite ao seu Gestor para excluir esse cliente'); return }
    if (!clienteId) { alert('Cadastro ainda não foi salvo.'); return }
    if (!confirm('Excluir este cliente? Esta ação não pode ser desfeita.')) return
    try { await deleteCliente(clienteId); router.push('/sistema/clientes/consultar') }
    catch { alert('Erro ao excluir.') }
  }

  async function handleEnviarLink() {
    setSaving(true)
    try {
      const id = clienteId || await persistir()
      if (!id) return
      const r = await gerarLinkCadastro(id)
      setLinkUrl(r.url)
    } catch { alert('Erro ao gerar o link.') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-24"><Loader2 size={24} className="animate-spin text-[#0BBCD4]" /></div>

  const socioIdx = step - 2
  const socioBloqueado = (socioIdx === 1 && !socio2Ativo) || (socioIdx === 2 && !socio3Ativo)
  const reqKeys = new Set(requiredKeysFor(tipo))
  const socioAtivo = socioIdx === 0 || (socioIdx === 1 && socio2Ativo) || (socioIdx === 2 && socio3Ativo)

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <h1 className="text-2xl font-black text-white mb-1" style={{ letterSpacing: '-0.02em' }}>Cadastro de cliente</h1>
      <p className="text-gray-500 text-sm mb-2">{leadId ? 'Vinculado ao lead selecionado' : clienteId ? 'Editando cadastro existente' : 'Novo cadastro'}</p>
      {tipo && (
        <p className="text-xs mb-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(11,188,212,0.1)', border: '1px solid rgba(11,188,212,0.25)', color: '#0BBCD4' }}>
          Contrato: <b>{TIPO_LABEL[tipo]}</b> · campos com <span className="text-red-400">*</span> são obrigatórios
        </p>
      )}

      {/* Stepper (quebra linha, sem corte) */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {PASSOS.map((p, i) => (
          <button key={p} onClick={() => setStep(i)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{ background: step === i ? 'rgba(11,188,212,0.15)' : 'rgba(255,255,255,0.04)', color: step === i ? '#0BBCD4' : '#6b7280', border: step === i ? '1px solid rgba(11,188,212,0.3)' : '1px solid transparent' }}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: step >= i ? '#0BBCD4' : 'rgba(255,255,255,0.1)', color: step >= i ? '#fff' : '#9ca3af' }}>{i + 1}</span>
            {p}
          </button>
        ))}
      </div>

      <div className="rounded-2xl p-6 mb-6 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {step === 0 && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CLI_FIELDS.map(([k, label, type]) => (
                <SmartField key={k} label={label} type={type} required={reqKeys.has(k)}
                  value={(cli[k] as string) || ''}
                  onChange={v => setCliK(k, v)}
                  onCEPFill={type === 'cep' ? makeCEPFill(setCliK, 'cli_') : undefined}
                  disabled={readOnly}
                />
              ))}
            </div>
            <PessoaUploads docKey="cli_doc_url" certKey="cli_cert_url" senhaKey="cli_cert_senha" data={cli} set={setCliK} />
          </>
        )}

        {step === 1 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EMP_FIELDS.map(([k, label, type]) => (
              <SmartField key={k} label={label} type={type} required={reqKeys.has(k)}
                value={(emp[k] as string) || ''}
                onChange={v => setEmpK(k, v)}
                onCEPFill={type === 'cep' ? makeCEPFill(setEmpK, 'emp_') : undefined}
                disabled={readOnly}
              />
            ))}
            {/* Usa gás GLP — ocupa a coluna vazia ao lado do e-mail */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Usa gás GLP?</label>
              <div className="flex gap-2">
                {[['Sim', true], ['Não', false]].map(([l, val]) => (
                  <button key={String(l)} type="button" disabled={readOnly} onClick={() => setEmpK('emp_usa_glp', val)}
                    className="flex-1 h-11 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                    style={{ background: emp.emp_usa_glp === val ? '#0BBCD4' : 'rgba(255,255,255,0.05)', color: emp.emp_usa_glp === val ? '#fff' : '#9ca3af', border: '1px solid rgba(255,255,255,0.10)' }}>
                    {l as string}
                  </button>
                ))}
              </div>
            </div>
            <label className="sm:col-span-2 lg:col-span-3 flex items-center gap-2 cursor-pointer p-3 rounded-xl" style={{ background: 'rgba(11,188,212,0.06)', border: '1px solid rgba(11,188,212,0.2)' }}>
              <input type="checkbox" checked={propEhSocio1} onChange={e => togglePropSocio1(e.target.checked)} className="w-4 h-4 accent-[#0BBCD4]" />
              <span className="text-sm text-gray-300">O proprietário do imóvel é o Sócio 1 (preenche nome e CPF automaticamente)</span>
            </label>
          </div>
        )}

        {step >= 2 && (
          <>
            {socioIdx === 0 && (
              <label className="flex items-center gap-2 mb-2 cursor-pointer p-3 rounded-xl" style={{ background: 'rgba(11,188,212,0.06)', border: '1px solid rgba(11,188,212,0.2)' }}>
                <input type="checkbox" checked={usarCliente} onChange={e => toggleUsarCliente(e.target.checked)} className="w-4 h-4 accent-[#0BBCD4]" />
                <span className="text-sm text-gray-300">Usar os dados do cliente como Sócio 1</span>
              </label>
            )}
            {socioIdx === 1 && (
              <label className="flex items-center gap-2 mb-2 cursor-pointer p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <input type="checkbox" checked={socio2Ativo} onChange={e => setSocio2Ativo(e.target.checked)} className="w-4 h-4 accent-[#0BBCD4]" />
                <span className="text-sm text-gray-300">Adicionar Sócio 2</span>
              </label>
            )}
            {socioIdx === 2 && (
              <label className="flex items-center gap-2 mb-2 cursor-pointer p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <input type="checkbox" checked={socio3Ativo} onChange={e => setSocio3Ativo(e.target.checked)} className="w-4 h-4 accent-[#0BBCD4]" />
                <span className="text-sm text-gray-300">Adicionar Sócio 3</span>
              </label>
            )}

            {socioBloqueado ? (
              <p className="text-gray-600 text-sm py-6 text-center">Marque a opção acima para preencher os dados deste sócio.</p>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {SOCIO_FIELDS.map(([k, label, type]) => (
                    <SmartField key={k} label={label} type={type}
                      required={socioAtivo && REQ_SOCIO.includes(k)}
                      value={(socios[socioIdx]?.[k] as string) || ''}
                      onChange={v => setSocioK(socioIdx, k, v)}
                      disabled={readOnly}
                    />
                  ))}
                </div>
                <PessoaUploads docKey="doc_url" certKey="cert_url" senhaKey="cert_senha" data={socios[socioIdx] || {}} set={(k, v) => setSocioK(socioIdx, k, v)} />
                <p className="text-xs pt-1" style={{ color: totalPart > 100 ? '#f87171' : '#6b7280' }}>
                  Soma da participação dos sócios: <b>{totalPart}%</b>{totalPart > 100 ? ' — excede 100%!' : ` (faltam ${Math.max(0, 100 - totalPart)}%)`}
                </p>
              </>
            )}
          </>
        )}
      </div>

      {savedMsg && <p className="text-sm text-[#22c55e] mb-4 flex items-center gap-2"><Check size={15} /> {savedMsg}</p>}

      {/* Barra de ações — todos na mesma linha */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={handleEnviarLink} disabled={saving}
          className="inline-flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: 'rgba(124,111,255,0.9)' }}>
          <Link2 size={15} /> Enviar link de cadastro
        </button>

        {readOnly ? (
          <button onClick={() => setReadOnly(false)}
            className="inline-flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>
            <Pencil size={15} /> Editar
          </button>
        ) : (
          <>
            <button onClick={() => router.push('/sistema/clientes/consultar')}
              className="inline-flex items-center gap-2 px-4 h-11 rounded-xl text-sm text-gray-300" style={FS}>
              <X size={15} /> Cancelar
            </button>

            <button onClick={() => handleSalvar(false)} disabled={saving}
              className="inline-flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={FS}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <><Save size={15} /> Salvar</>}
            </button>
          </>
        )}

        {clienteId && !savedMsg && (
          <button onClick={handleExcluir}
            className="inline-flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            <Trash2 size={15} /> Excluir
          </button>
        )}

        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          className="inline-flex items-center gap-2 px-4 h-11 rounded-xl text-sm text-gray-300 disabled:opacity-40" style={FS}>
          <ArrowLeft size={15} /> Voltar
        </button>

        {!readOnly && (step < PASSOS.length - 1 ? (
          <button onClick={() => setStep(s => Math.min(PASSOS.length - 1, s + 1))}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>
            Próximo <ArrowRight size={15} />
          </button>
        ) : (
          <button onClick={() => handleSalvar(true)} disabled={saving}
            className="inline-flex items-center gap-2 px-6 h-11 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Salvar e concluir</>}
          </button>
        ))}
      </div>

      {/* Link gerado */}
      {linkUrl && (
        <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl max-w-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span className="text-xs text-gray-300 truncate flex-1">{linkUrl}</span>
          <button onClick={() => navigator.clipboard?.writeText(linkUrl)} className="text-[#0BBCD4] hover:text-white" title="Copiar"><Copy size={14} /></button>
        </div>
      )}
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
