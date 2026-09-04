'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2, Check, ArrowLeft, ArrowRight, Upload, FileText, FileImage, Paperclip, Save, Trash2, Link2, Copy, X, Send, Pencil, Folder, Download, Lock, Building2, Plus, Clock } from 'lucide-react'
import { uploadDoc, saveCliente, getCliente, getClienteByLead, deleteCliente, gerarLinkCadastro, getLeadDetail, enviarParaAssinatura, getContratoByLead, listArquivos, addArquivoCliente, deleteArquivoCliente, type ContratoRow, type ArquivoRow } from '@/lib/api'
import { CLI_FIELDS, EMP_FIELDS, SOCIO_FIELDS, CLI_TO_SOCIO } from '@/lib/cadastro'
import HistoricoCliente from '@/components/sistema/HistoricoCliente'
import { tipoFromInteresse, requiredKeysFor, REQ_SOCIO, TIPO_LABEL } from '@/lib/contratos'
import SmartField from '@/components/cadastro/SmartField'
import type { CEPData, CNPJData } from '@/lib/form-masks'
import { maskCNPJ, fetchCNPJ, maskPhone } from '@/lib/form-masks'

type Obj = Record<string, unknown>

const FIELD = 'w-full h-10 px-3.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none disabled:opacity-40'
const FS = { background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }

// Largura do campo no grid de 12 colunas
const SPAN_CLS: Record<number, string> = {
  2: 'lg:col-span-2', 3: 'lg:col-span-3', 4: 'lg:col-span-4', 5: 'lg:col-span-5',
  6: 'lg:col-span-6', 8: 'lg:col-span-8', 12: 'lg:col-span-12',
}
const colSpan = (n = 4) => `col-span-12 sm:col-span-6 ${SPAN_CLS[n] ?? 'lg:col-span-4'}`

function makeCEPFill(setter: (k: string, v: unknown) => void, prefix: string) {
  return (data: CEPData) => {
    setter(`${prefix}endereco`, data.logradouro)
    setter(`${prefix}bairro`, data.bairro)
    setter(`${prefix}cidade_estado`, `${data.localidade}/${data.uf}`)
  }
}

// Auto-preenche os dados da empresa a partir do CNPJ (BrasilAPI/Receita).
function makeCNPJFill(setter: (k: string, v: unknown) => void) {
  return (d: CNPJData) => {
    if (d.razao_social) setter('emp_nome', d.razao_social)
    if (d.nome_fantasia) setter('emp_fantasia', d.nome_fantasia)
    const end = [d.logradouro, d.numero].filter(Boolean).join(', ')
    if (end) setter('emp_endereco', end)
    if (d.bairro) setter('emp_bairro', d.bairro)
    if (d.cep) setter('emp_cep', d.cep)
    if (d.municipio) setter('emp_cidade_estado', `${d.municipio}/${d.uf}`)
    if (d.atividade) setter('emp_atividade', d.atividade)
    if (d.telefone) setter('emp_telefone', d.telefone)
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
      <label className={`flex items-center gap-2 h-10 px-3.5 rounded-lg text-sm ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`} style={FS}>
        {busy ? <Loader2 size={15} className="animate-spin text-[color:var(--sys-accent)]" /> : url ? <FileText size={15} className="text-[#22c55e]" /> : <Upload size={15} className="text-gray-500" />}
        <span className={url ? 'text-[#22c55e]' : 'text-gray-500'}>{busy ? 'Enviando...' : url ? 'Arquivo enviado ✓' : 'Selecionar arquivo'}</span>
        <input type="file" className="hidden" disabled={disabled} onChange={handle} />
      </label>
    </div>
  )
}

function fileKind(s: string) {
  const v = s.toLowerCase()
  if (/\.(png|jpe?g|gif|webp|svg|bmp)/.test(v)) return 'img'
  if (/\.pdf/.test(v)) return 'pdf'
  return 'file'
}

function FileTile({ nome, url, onDelete, restrito }: { nome: string; url: string; onDelete?: () => void; restrito?: boolean }) {
  const kind = fileKind(nome + ' ' + url)
  const Icon = kind === 'img' ? FileImage : FileText
  const color = restrito ? '#fbbf24' : kind === 'pdf' ? '#ef4444' : kind === 'img' ? '#22c55e' : 'var(--sys-accent)'
  return (
    <div className="relative flex flex-col items-center text-center p-3 pt-7 rounded-xl transition-colors hover:bg-white/[0.04]"
      title={restrito ? 'Conteúdo sensível (ex.: senha gov.br)' : undefined}>
      <div className="absolute top-1.5 right-1.5 flex gap-1">
        <a href={url} target="_blank" rel="noopener noreferrer" download title="Baixar"
          className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:text-white"
          style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }}><Download size={13} /></a>
        {onDelete && <button onClick={onDelete} title="Excluir"
          className="w-6 h-6 rounded-md flex items-center justify-center text-red-400 hover:text-red-300"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}><Trash2 size={13} /></button>}
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" download className="flex flex-col items-center gap-2 w-full">
        <div className="relative">
          <Icon size={44} style={{ color }} strokeWidth={1.5} />
          {restrito && <Lock size={14} className="absolute -bottom-0.5 -right-1 text-[#fbbf24]" />}
        </div>
        <span className="text-[11px] text-gray-300 leading-tight line-clamp-2 w-full break-all" title={nome}>{nome}</span>
      </a>
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
  const abrirEditavel = params.get('edit') === '1'

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [exportando, setExportando] = useState(false)
  const [clienteId, setClienteId] = useState<string | undefined>(clienteParam)
  const [linkUrl, setLinkUrl] = useState('')
  const [contrato, setContrato] = useState<ContratoRow | null>(null)
  const [enviandoAssinatura, setEnviandoAssinatura] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [arquivos, setArquivos] = useState<ArquivoRow[]>([])
  const [uploadingArq, setUploadingArq] = useState(false)

  const [cli, setCli] = useState<Obj>({})
  const [emp, setEmp] = useState<Obj>({ emp_usa_glp: false })
  const [socios, setSocios] = useState<Obj[]>([{}, {}, {}, {}]) // sócios 2..5 (índice 0 = Sócio 2)
  const [propEhSocio1, setPropEhSocio1] = useState(false)
  const [temSocios, setTemSocios] = useState(false)
  const [numSocios, setNumSocios] = useState(2) // total de sócios, incluindo o Sócio 1 (o próprio cliente)
  const [tipo, setTipo] = useState<number | null>(null)
  const [histLeadId, setHistLeadId] = useState<string | null>(null)
  const [temFiliais, setTemFiliais] = useState(false)
  const [filiais, setFiliais] = useState<Obj[]>([])
  const [filialBuscando, setFilialBuscando] = useState<number | null>(null)

  useEffect(() => {
    async function init() {
      let data: Obj | null = null
      if (clienteParam) data = await getCliente(clienteParam)
      else if (leadId) data = await getClienteByLead(leadId)
      if (data) {
        setClienteId(data.id as string)
        setReadOnly(!abrirEditavel) // cadastro existente abre travado; com ?edit=1 (preencher) já abre liberado
        const c: Obj = {}, e: Obj = {}
        Object.entries(data).forEach(([k, v]) => { if (k.startsWith('cli_')) c[k] = v; if (k.startsWith('emp_')) e[k] = v })
        setCli(c); setEmp({ emp_usa_glp: false, ...e })
        const fil = Array.isArray(data.emp_filiais) ? (data.emp_filiais as Obj[]) : []
        setFiliais(fil)
        setTemFiliais(!!data.emp_tem_filiais || fil.length > 0)
        const ss = (data.socios as Obj[] | undefined) ?? []
        const extras = ss.slice(1) // Sócio 1 = o próprio cliente (já carregado em `cli`)
        setSocios([0, 1, 2, 3].map(i => extras[i] ?? {}))
        if (extras.length > 0) { setTemSocios(true); setNumSocios(Math.min(5, extras.length + 1)) }
      }
      // Determina o tipo de contrato pelo interesse do lead
      const lid = leadId || (data?.lead_id as string | undefined)
      setHistLeadId(lid ?? null)
      if (lid) {
        try {
          const lead = await getLeadDetail(lid)
          setTipo(tipoFromInteresse(lead.interesse))
          // Lead recém-fechado ainda sem cadastro: pré-preenche com o que já temos no lead
          // (nome, e-mail, telefone) para não digitar duas vezes.
          if (!data) {
            const nome = String(lead.nome || '').trim()
            const email = String(lead.email || '').trim().replace(/\s+/g, '')
            const tel = String(lead.whatsapp || '').trim()
            if (nome || email) {
              setCli(c => ({ ...c, ...(nome ? { cli_nome_completo: nome } : {}), ...(email ? { cli_email: email } : {}) }))
            }
            if (nome || email || tel) {
              setEmp(e => ({ ...e, ...(nome ? { emp_proprietario_nome: nome } : {}), ...(email ? { emp_email: email } : {}), ...(tel ? { emp_telefone: tel } : {}) }))
            }
          }
        } catch {}
        try { const c = await getContratoByLead(lid); setContrato(c) } catch {}
      }
      setLoading(false)
    }
    init()
  }, [clienteParam, leadId])

  // Carrega os arquivos avulsos quando há cliente salvo
  useEffect(() => {
    if (clienteId) listArquivos(clienteId).then(setArquivos).catch(() => setArquivos([]))
  }, [clienteId])

  async function handleUploadArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f || !clienteId) return
    setUploadingArq(true)
    try {
      const r = await uploadDoc(f)
      const novo = await addArquivoCliente(clienteId, f.name, r.url)
      setArquivos(a => [novo, ...a])
    } catch { alert('Erro ao enviar o arquivo.') }
    finally { setUploadingArq(false); e.target.value = '' }
  }

  async function handleExcluirArquivo(arqId: string, nome: string) {
    if (!clienteId) return
    if (!confirm(`Excluir o arquivo "${nome}"?\n\n⚠️ Esta ação não pode ser desfeita.`)) return
    try { await deleteArquivoCliente(clienteId, arqId); setArquivos(a => a.filter(x => x.id !== arqId)) }
    catch { alert('Erro ao excluir.') }
  }

  const setCliK = (k: string, v: unknown) => setCli(s => ({ ...s, [k]: v }))
  const setEmpK = (k: string, v: unknown) => setEmp(s => ({ ...s, [k]: v }))
  const setSocioK = (i: number, k: string, v: unknown) => setSocios(s => s.map((x, j) => j === i ? { ...x, [k]: v } : x))

  function togglePropSocio1(checked: boolean) {
    setPropEhSocio1(checked)
    if (checked) {
      setEmp(e => ({
        ...e,
        emp_proprietario_nome: (cli.cli_nome_completo as string) || '',
        emp_proprietario_cpf:  (cli.cli_cpf as string) || '',
      }))
    }
  }

  const nExtra = temSocios ? Math.max(0, numSocios - 1) : 0
  const somaExtras = socios.slice(0, nExtra).reduce((sum, x) => sum + (Number(x.participacao) || 0), 0)

  function montarPayload(): Obj {
    // Sócio 1 é sempre o próprio cliente — montado a partir dos dados do cliente.
    const socio1: Obj = {
      doc_url: cli.cli_doc_url ?? '', cert_url: cli.cli_cert_url ?? '', cert_senha: cli.cli_cert_senha ?? '',
    }
    CLI_TO_SOCIO.forEach(([ck, sk]) => { socio1[sk] = cli[ck] ?? '' })
    socio1.participacao = nExtra > 0 ? Math.max(0, 100 - somaExtras) : 100
    const extras = socios.slice(0, nExtra)
    const filiaisOut = temFiliais ? filiais.filter(f => String(f.cnpj ?? '').trim() || String(f.fantasia ?? '').trim()) : []
    return { id: clienteId, lead_id: leadId, ...cli, ...emp, socios: [socio1, ...extras], emp_tem_filiais: temFiliais, emp_filiais: filiaisOut }
  }

  async function persistir(): Promise<string | null> {
    if (somaExtras > 100) { alert(`A soma da participação dos sócios é ${somaExtras}% — não pode passar de 100%.`); return null }
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

  async function handleExportar() {
    if (!clienteId) { alert('Salve o cadastro antes de exportar.'); return }
    setExportando(true)
    try {
      const r = await fetch(`/api/clientes/${clienteId}/exportar`)
      if (!r.ok) throw new Error()
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cadastro_${String(emp.emp_nome || cli.cli_nome_completo || 'cliente').replace(/[^a-zA-Z0-9]+/g, '_')}.pdf`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch { alert('Não foi possível exportar o cadastro.') }
    finally { setExportando(false) }
  }

  async function handleEnviarAssinatura() {
    if (!leadId) { alert('Este cadastro não está vinculado a um lead.'); return }
    setEnviandoAssinatura(true)
    try {
      await enviarParaAssinatura(leadId)
      const c = await getContratoByLead(leadId)
      setContrato(c)
      alert('Contrato enviado! A Nauta já assinou e o sócio receberá o e-mail para assinar.')
    } catch (e) { alert('Erro: ' + (e instanceof Error ? e.message : '')) }
    finally { setEnviandoAssinatura(false) }
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

  if (loading) return <div className="flex justify-center py-24"><Loader2 size={24} className="animate-spin text-[color:var(--sys-accent)]" /></div>

  const reqKeys = new Set(requiredKeysFor(tipo))
  const socioTabs = temSocios ? Array.from({ length: Math.max(0, numSocios - 1) }, (_, i) => `Sócio ${i + 2}`) : []
  const passos = [
    'Dados do cliente', 'Dados da empresa',
    ...socioTabs, 'Arquivos',
    ...(temFiliais ? ['Filiais'] : []),
    ...(histLeadId ? ['Histórico'] : []),
  ]
  const stepClamped = Math.min(step, passos.length - 1)
  const atual = passos[stepClamped]
  const setFilialK = (i: number, k: string, v: unknown) => setFiliais(fs => fs.map((f, j) => j === i ? { ...f, [k]: v } : f))
  async function onFilialCNPJ(i: number, raw: string) {
    const masked = maskCNPJ(raw)
    setFilialK(i, 'cnpj', masked)
    if (masked.replace(/\D/g, '').length === 14) {
      setFilialBuscando(i)
      const d = await fetchCNPJ(masked)
      if (d) setFiliais(fs => fs.map((f, j) => j === i ? {
        ...f, cnpj: masked,
        fantasia: f.fantasia || d.nome_fantasia || d.razao_social,
        municipio: f.municipio || d.municipio,
        estado: f.estado || d.uf,
        telefone: f.telefone || d.telefone,
      } : f))
      setFilialBuscando(null)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <h1 className="text-2xl font-black text-white mb-1" style={{ letterSpacing: '-0.02em' }}>Cadastro de cliente</h1>
      <p className="text-gray-500 text-sm mb-2">{leadId ? 'Vinculado ao lead selecionado' : clienteId ? 'Editando cadastro existente' : 'Novo cadastro'}</p>
      {tipo && (
        <p className="text-xs mb-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--sys-accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--sys-accent) 25%, transparent)', color: 'var(--sys-accent)' }}>
          Contrato: <b>{TIPO_LABEL[tipo]}</b> · campos com <span className="text-red-400">*</span> são obrigatórios
        </p>
      )}

      {/* Stepper (quebra linha, sem corte) */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {passos.map((p, i) => (
          <button key={p} onClick={() => setStep(i)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{ background: stepClamped === i ? 'color-mix(in srgb, var(--sys-accent) 15%, transparent)' : 'var(--sys-surface-2)', color: stepClamped === i ? 'var(--sys-accent)' : '#6b7280', border: stepClamped === i ? '1px solid color-mix(in srgb, var(--sys-accent) 30%, transparent)' : '1px solid transparent' }}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: stepClamped >= i ? 'var(--sys-accent)' : 'var(--sys-border-2)', color: stepClamped >= i ? '#fff' : '#9ca3af' }}>
              {p === 'Arquivos' ? <Folder size={11} /> : p === 'Filiais' ? <Building2 size={11} /> : p === 'Histórico' ? <Clock size={11} /> : i + 1}
            </span>
            {p}
          </button>
        ))}
      </div>

      <div className="rounded-2xl p-4 mb-4 space-y-2.5" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
        {atual === 'Dados do cliente' && (
          <>
            <p className="text-xs text-gray-500 mb-1">O cliente é sempre o <b className="text-gray-300">Sócio 1</b> da empresa.</p>
            <div className="grid grid-cols-12 gap-x-3 gap-y-2.5">
              {CLI_FIELDS.map(([k, label, type, span]) => (
                <div key={k} className={colSpan(span)}>
                  <SmartField label={label} type={type} required={reqKeys.has(k)}
                    value={(cli[k] as string) || ''}
                    onChange={v => setCliK(k, v)}
                    onCEPFill={type === 'cep' ? makeCEPFill(setCliK, 'cli_') : undefined}
                    disabled={readOnly}
                  />
                </div>
              ))}
              {/* Telefone unificado (mesmo valor da empresa e do WhatsApp do lead) */}
              <div className={colSpan(4)}>
                <SmartField label="Telefone / WhatsApp" type="phone"
                  value={(emp.emp_telefone as string) || ''}
                  onChange={v => setEmpK('emp_telefone', v)}
                  disabled={readOnly}
                />
              </div>
            </div>
            <PessoaUploads docKey="cli_doc_url" certKey="cli_cert_url" senhaKey="cli_cert_senha" data={cli} set={setCliK} disabled={readOnly} />
          </>
        )}

        {atual === 'Dados da empresa' && (
          <div className="grid grid-cols-12 gap-x-3 gap-y-2.5">
            {EMP_FIELDS.map(([k, label, type, span]) => (
              <div key={k} className={colSpan(span)}>
                <SmartField label={label} type={type} required={reqKeys.has(k)}
                  value={(emp[k] as string) || ''}
                  onChange={v => setEmpK(k, v)}
                  onCEPFill={type === 'cep' ? makeCEPFill(setEmpK, 'emp_') : undefined}
                  onCNPJFill={type === 'cnpj' ? makeCNPJFill(setEmpK) : undefined}
                  disabled={readOnly}
                />
              </div>
            ))}
            {/* Usa gás GLP */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">Usa gás GLP?</label>
              <div className="flex gap-2">
                {[['Sim', true], ['Não', false]].map(([l, val]) => (
                  <button key={String(l)} type="button" disabled={readOnly} onClick={() => setEmpK('emp_usa_glp', val)}
                    className="flex-1 h-10 rounded-lg text-sm font-bold transition-all"
                    style={{ background: emp.emp_usa_glp === val ? 'var(--sys-accent)' : 'var(--sys-surface-3)', color: emp.emp_usa_glp === val ? '#fff' : '#9ca3af', border: '1px solid var(--sys-border-2)' }}>
                    {l as string}
                  </button>
                ))}
              </div>
            </div>
            <label className="col-span-12 flex items-center gap-2 cursor-pointer p-2.5 rounded-xl" style={{ background: 'color-mix(in srgb, var(--sys-accent) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--sys-accent) 20%, transparent)' }}>
              <input type="checkbox" checked={propEhSocio1} disabled={readOnly} onChange={e => togglePropSocio1(e.target.checked)} className="w-4 h-4 accent-[var(--sys-accent)]" />
              <span className="text-sm text-gray-300">O proprietário do imóvel é o próprio cliente / Sócio 1 (preenche nome e CPF automaticamente)</span>
            </label>

            {/* Essa empresa terá sócios? */}
            <div className="col-span-12 p-3 rounded-xl" style={{ background: 'var(--sys-surface-2)', border: '1px solid var(--sys-border-2)' }}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={temSocios} disabled={readOnly}
                  onChange={e => { setTemSocios(e.target.checked); if (e.target.checked && numSocios < 2) setNumSocios(2) }}
                  className="w-4 h-4 accent-[var(--sys-accent)]" />
                <span className="text-sm text-gray-300">Essa empresa terá sócios? <span className="text-gray-500">(o cliente já é o Sócio 1)</span></span>
              </label>
              {temSocios && (
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <label className="text-xs font-semibold text-gray-400">Quantidade total de sócios:</label>
                  <select value={numSocios} disabled={readOnly} onChange={e => setNumSocios(Number(e.target.value))}
                    className="h-10 px-3 rounded-lg text-sm text-white outline-none" style={FS}>
                    {[2, 3, 4, 5].map(n => <option key={n} value={n} className="text-gray-900 bg-white">{n} sócios</option>)}
                  </select>
                  <span className="text-xs text-gray-500">→ habilita as abas: {socioTabs.join(', ')}</span>
                </div>
              )}
            </div>

            <label className="col-span-12 flex items-center gap-2 cursor-pointer p-2.5 rounded-xl" style={{ background: 'color-mix(in srgb, var(--sys-accent) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--sys-accent) 20%, transparent)' }}>
              <input type="checkbox" checked={temFiliais} disabled={readOnly}
                onChange={e => { setTemFiliais(e.target.checked); if (e.target.checked && filiais.length === 0) setFiliais([{}]) }}
                className="w-4 h-4 accent-[var(--sys-accent)]" />
              <span className="text-sm text-gray-300">Essa empresa tem filiais? (abre a aba <b>Filiais</b> para cadastrar os CNPJs)</span>
            </label>
          </div>
        )}

        {atual?.startsWith('Sócio ') && (() => {
          const socioNum = parseInt(atual.split(' ')[1], 10) // 2..5
          const idx = socioNum - 2                            // índice em `socios`
          return (
            <>
              <p className="text-sm text-gray-400 mb-2">Dados do <b className="text-white">Sócio {socioNum}</b>. O <b className="text-white">Sócio 1</b> é o próprio cliente (aba “Dados do cliente”).</p>
              <div className="grid grid-cols-12 gap-x-3 gap-y-2.5">
                {SOCIO_FIELDS.map(([k, label, type, span]) => (
                  <div key={k} className={colSpan(span)}>
                    <SmartField label={label} type={type}
                      required={REQ_SOCIO.includes(k)}
                      value={(socios[idx]?.[k] as string) || ''}
                      onChange={v => setSocioK(idx, k, v)}
                      disabled={readOnly}
                    />
                  </div>
                ))}
              </div>
              <PessoaUploads docKey="doc_url" certKey="cert_url" senhaKey="cert_senha" data={socios[idx] || {}} set={(k, v) => setSocioK(idx, k, v)} disabled={readOnly} />
              <p className="text-xs pt-1" style={{ color: somaExtras > 100 ? '#f87171' : '#6b7280' }}>
                Soma da participação dos sócios 2 a {numSocios}: <b>{somaExtras}%</b>{somaExtras > 100 ? ' — excede 100%!' : ` · o Sócio 1 (cliente) fica com ${Math.max(0, 100 - somaExtras)}%`}
              </p>
            </>
          )
        })()}

        {atual === 'Arquivos' && (
          <div className="space-y-5">
            {!clienteId ? (
              <p className="text-gray-500 text-sm py-8 text-center">Salve o cadastro primeiro para gerenciar os arquivos do cliente.</p>
            ) : (
              <>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Documentos do cadastro</p>
                  {(() => {
                    const docs: { nome: string; url: string }[] = []
                    if (contrato) {
                      const u = contrato.autentique_status === 'assinado' && contrato.autentique_url ? contrato.autentique_url : contrato.pdf_url
                      if (u) docs.push({ nome: 'Contrato.pdf', url: u })
                    }
                    if (cli.cli_doc_url) docs.push({ nome: 'Documento do cliente', url: cli.cli_doc_url as string })
                    if (cli.cli_cert_url) docs.push({ nome: 'Certificado do cliente', url: cli.cli_cert_url as string })
                    socios.slice(0, nExtra).forEach((sx, i) => {
                      if (sx.doc_url) docs.push({ nome: `Documento Sócio ${i + 2}`, url: sx.doc_url as string })
                      if (sx.cert_url) docs.push({ nome: `Certificado Sócio ${i + 2}`, url: sx.cert_url as string })
                    })
                    return docs.length ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1">
                        {docs.map((d, idx) => <FileTile key={idx} nome={d.nome} url={d.url} />)}
                      </div>
                    ) : <p className="text-gray-600 text-xs">Nenhum documento do cadastro ainda.</p>
                  })()}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Arquivos enviados</p>
                    <label className="inline-flex items-center gap-1.5 text-xs font-bold px-3 h-9 rounded-lg cursor-pointer text-white" style={{ background: 'linear-gradient(135deg, var(--sys-accent), var(--sys-accent-2))' }}>
                      {uploadingArq ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Enviar arquivo
                      <input type="file" className="hidden" onChange={handleUploadArquivo} disabled={uploadingArq} />
                    </label>
                  </div>
                  {(() => {
                    const visiveis = arquivos // senha do gov visível a todos os usuários
                    return visiveis.length === 0 ? (
                      <p className="text-gray-600 text-xs">Nenhum arquivo enviado.</p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1">
                        {visiveis.map(a => (
                          <FileTile key={a.id} nome={a.nome}
                            url={a.restrito ? `/api/clientes/${clienteId}/arquivos/${a.id}` : a.url}
                            restrito={a.restrito}
                            onDelete={podeExcluir ? () => handleExcluirArquivo(a.id, a.nome) : undefined} />
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </>
            )}
          </div>
        )}

        {atual === 'Filiais' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-bold text-white flex items-center gap-2"><Building2 size={16} className="text-[color:var(--sys-accent)]" /> Filiais da empresa <span className="text-gray-500 font-normal">({filiais.length})</span></p>
              <button type="button" disabled={readOnly} onClick={() => setFiliais(fs => [...fs, {}])}
                className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-bold text-white disabled:opacity-60" style={{ background: 'linear-gradient(135deg, var(--sys-accent), #6355e0)' }}>
                <Plus size={14} /> Adicionar filial
              </button>
            </div>
            {filiais.length === 0 ? (
              <p className="text-gray-600 text-sm py-6 text-center">Nenhuma filial cadastrada. Clique em “Adicionar filial” — ao digitar o CNPJ, o resto preenche sozinho.</p>
            ) : filiais.map((f, i) => (
              <div key={i} className="rounded-xl p-3 grid grid-cols-12 gap-2.5" style={{ background: 'var(--sys-surface-2)', border: '1px solid var(--sys-border)' }}>
                <div className="col-span-12 sm:col-span-6">
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">CNPJ da filial</label>
                  <div className="relative">
                    <input value={(f.cnpj as string) || ''} disabled={readOnly} placeholder="00.000.000/0001-00" inputMode="numeric"
                      onChange={e => onFilialCNPJ(i, e.target.value)}
                      className="w-full h-10 px-3 rounded-lg text-sm text-white placeholder-gray-600 outline-none" style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }} />
                    {filialBuscando === i && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-500">buscando…</span>}
                  </div>
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">Nome fantasia</label>
                  <input value={(f.fantasia as string) || ''} disabled={readOnly} onChange={e => setFilialK(i, 'fantasia', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm text-white outline-none" style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }} />
                </div>
                <div className="col-span-7 sm:col-span-5">
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">Município</label>
                  <input value={(f.municipio as string) || ''} disabled={readOnly} onChange={e => setFilialK(i, 'municipio', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-sm text-white outline-none" style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }} />
                </div>
                <div className="col-span-5 sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">UF</label>
                  <input value={(f.estado as string) || ''} disabled={readOnly} maxLength={2} onChange={e => setFilialK(i, 'estado', e.target.value.toUpperCase())}
                    className="w-full h-10 px-3 rounded-lg text-sm text-white outline-none uppercase" style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }} />
                </div>
                <div className="col-span-9 sm:col-span-4">
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">Telefone</label>
                  <input value={(f.telefone as string) || ''} disabled={readOnly} onChange={e => setFilialK(i, 'telefone', maskPhone(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg text-sm text-white outline-none" style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }} />
                </div>
                <div className="col-span-3 sm:col-span-1 flex items-end">
                  <button type="button" disabled={readOnly} onClick={() => setFiliais(fs => fs.filter((_, j) => j !== i))}
                    className="h-10 w-full rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 disabled:opacity-40"
                    style={{ background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }} title="Remover filial"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {atual === 'Histórico' && histLeadId && (
          <HistoricoCliente leadId={histLeadId} />
        )}
      </div>

      {savedMsg && <p className="text-sm text-[#22c55e] mb-4 flex items-center gap-2"><Check size={15} /> {savedMsg}</p>}

      {/* Barra de ações — todos na mesma linha */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={handleEnviarLink} disabled={saving}
          className="inline-flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: 'rgba(124,111,255,0.9)' }}>
          <Link2 size={15} /> Enviar link de cadastro
        </button>

        {leadId && contrato?.autentique_status === 'assinado' ? (
          <a href={contrato.autentique_url!} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
            <FileText size={15} /> Baixar contrato assinado
          </a>
        ) : leadId && contrato?.autentique_status === 'pendente' ? (
          <span className="inline-flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
            <Loader2 size={15} className="animate-spin" /> Aguardando assinatura…
          </span>
        ) : leadId ? (
          <button onClick={handleEnviarAssinatura} disabled={enviandoAssinatura}
            className="inline-flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #7c6fff, #6355e0)' }}>
            {enviandoAssinatura ? <Loader2 size={15} className="animate-spin" /> : <><Send size={15} /> Enviar contrato para assinatura</>}
          </button>
        ) : null}

        <button onClick={() => router.push('/sistema/clientes/consultar')}
          className="inline-flex items-center gap-2 px-4 h-11 rounded-xl text-sm text-gray-300" style={FS}>
          <X size={15} /> Cancelar
        </button>

        {readOnly ? (
          <button onClick={() => setReadOnly(false)}
            className="inline-flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, var(--sys-accent), var(--sys-accent-2))' }}>
            <Pencil size={15} /> Editar
          </button>
        ) : (
          <button onClick={async () => { await handleSalvar(false); if (!saving) setReadOnly(true) }} disabled={saving}
            className="inline-flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <><Save size={15} /> Salvar</>}
          </button>
        )}

        {clienteId && !savedMsg && (
          <button onClick={handleExcluir}
            className="inline-flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            <Trash2 size={15} /> Excluir
          </button>
        )}

        {clienteId && (
          <button onClick={handleExportar} disabled={exportando}
            className="inline-flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-semibold text-gray-200 disabled:opacity-60" style={FS}>
            {exportando ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Exportar Cadastro
          </button>
        )}

        <button onClick={() => setStep(Math.max(0, stepClamped - 1))} disabled={stepClamped === 0}
          className="inline-flex items-center gap-2 px-4 h-11 rounded-xl text-sm text-gray-300 disabled:opacity-40" style={FS}>
          <ArrowLeft size={15} /> Voltar
        </button>

        {stepClamped < passos.length - 1 && (
          <button onClick={() => setStep(Math.min(passos.length - 1, stepClamped + 1))}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--sys-accent), var(--sys-accent-2))' }}>
            Próximo <ArrowRight size={15} />
          </button>
        )}
      </div>

      {/* Link gerado */}
      {linkUrl && (
        <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl max-w-xl" style={{ background: 'var(--sys-surface-2)', border: '1px solid var(--sys-border-2)' }}>
          <span className="text-xs text-gray-300 truncate flex-1">{linkUrl}</span>
          <button onClick={() => navigator.clipboard?.writeText(linkUrl)} className="text-[color:var(--sys-accent)] hover:text-white" title="Copiar"><Copy size={14} /></button>
        </div>
      )}
    </div>
  )
}

export default function CadastrarClientePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Loader2 size={24} className="animate-spin text-[color:var(--sys-accent)]" /></div>}>
      <Wizard />
    </Suspense>
  )
}
