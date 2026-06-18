'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2, Check, ArrowLeft, ArrowRight, Upload, FileText, FileImage, Paperclip, Save, Trash2, Link2, Copy, X, Send, Pencil, Folder, Download, Lock } from 'lucide-react'
import { uploadDoc, saveCliente, getCliente, getClienteByLead, deleteCliente, gerarLinkCadastro, getLeadDetail, enviarParaAssinatura, getContratoByLead, listArquivos, addArquivoCliente, deleteArquivoCliente, type ContratoRow, type ArquivoRow } from '@/lib/api'
import { CLI_FIELDS, EMP_FIELDS, SOCIO_FIELDS, CLI_TO_SOCIO } from '@/lib/cadastro'
import { tipoFromInteresse, requiredKeysFor, REQ_SOCIO, TIPO_LABEL } from '@/lib/contratos'
import SmartField from '@/components/cadastro/SmartField'
import type { CEPData } from '@/lib/form-masks'

type Obj = Record<string, unknown>

const FIELD = 'w-full h-10 px-3.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none disabled:opacity-40'
const FS = { background: 'var(--sys-surface-3)', border: '1px solid var(--sys-border-2)' }
const PASSOS = ['Dados do cliente', 'Dados da empresa', 'Sócio 1', 'Sócio 2', 'Sócio 3', 'Arquivos']

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
        {busy ? <Loader2 size={15} className="animate-spin text-[#0BBCD4]" /> : url ? <FileText size={15} className="text-[#22c55e]" /> : <Upload size={15} className="text-gray-500" />}
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
  const color = restrito ? '#fbbf24' : kind === 'pdf' ? '#ef4444' : kind === 'img' ? '#22c55e' : '#0BBCD4'
  return (
    <div className="relative flex flex-col items-center text-center p-3 pt-7 rounded-xl transition-colors hover:bg-white/[0.04]"
      title={restrito ? 'Restrito · admin/gerente' : undefined}>
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
  const [clienteId, setClienteId] = useState<string | undefined>(clienteParam)
  const [linkUrl, setLinkUrl] = useState('')
  const [contrato, setContrato] = useState<ContratoRow | null>(null)
  const [enviandoAssinatura, setEnviandoAssinatura] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [arquivos, setArquivos] = useState<ArquivoRow[]>([])
  const [uploadingArq, setUploadingArq] = useState(false)

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
        setReadOnly(!abrirEditavel) // cadastro existente abre travado; com ?edit=1 (preencher) já abre liberado
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
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {PASSOS.map((p, i) => (
          <button key={p} onClick={() => setStep(i)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{ background: step === i ? 'rgba(11,188,212,0.15)' : 'var(--sys-surface-2)', color: step === i ? '#0BBCD4' : '#6b7280', border: step === i ? '1px solid rgba(11,188,212,0.3)' : '1px solid transparent' }}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: step >= i ? '#0BBCD4' : 'var(--sys-border-2)', color: step >= i ? '#fff' : '#9ca3af' }}>
              {p === 'Arquivos' ? <Folder size={11} /> : i + 1}
            </span>
            {p}
          </button>
        ))}
      </div>

      <div className="rounded-2xl p-4 mb-4 space-y-2.5" style={{ background: 'var(--sys-surface)', border: '1px solid var(--sys-border)' }}>
        {step === 0 && (
          <>
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
            </div>
            <PessoaUploads docKey="cli_doc_url" certKey="cli_cert_url" senhaKey="cli_cert_senha" data={cli} set={setCliK} disabled={readOnly} />
          </>
        )}

        {step === 1 && (
          <div className="grid grid-cols-12 gap-x-3 gap-y-2.5">
            {EMP_FIELDS.map(([k, label, type, span]) => (
              <div key={k} className={colSpan(span)}>
                <SmartField label={label} type={type} required={reqKeys.has(k)}
                  value={(emp[k] as string) || ''}
                  onChange={v => setEmpK(k, v)}
                  onCEPFill={type === 'cep' ? makeCEPFill(setEmpK, 'emp_') : undefined}
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
                    style={{ background: emp.emp_usa_glp === val ? '#0BBCD4' : 'var(--sys-surface-3)', color: emp.emp_usa_glp === val ? '#fff' : '#9ca3af', border: '1px solid var(--sys-border-2)' }}>
                    {l as string}
                  </button>
                ))}
              </div>
            </div>
            <label className="col-span-12 flex items-center gap-2 cursor-pointer p-2.5 rounded-xl" style={{ background: 'rgba(11,188,212,0.06)', border: '1px solid rgba(11,188,212,0.2)' }}>
              <input type="checkbox" checked={propEhSocio1} disabled={readOnly} onChange={e => togglePropSocio1(e.target.checked)} className="w-4 h-4 accent-[#0BBCD4]" />
              <span className="text-sm text-gray-300">O proprietário do imóvel é o Sócio 1 (preenche nome e CPF automaticamente)</span>
            </label>
          </div>
        )}

        {step >= 2 && step <= 4 && (
          <>
            {socioIdx === 0 && (
              <label className="flex items-center gap-2 mb-2 cursor-pointer p-3 rounded-xl" style={{ background: 'rgba(11,188,212,0.06)', border: '1px solid rgba(11,188,212,0.2)' }}>
                <input type="checkbox" checked={usarCliente} disabled={readOnly} onChange={e => toggleUsarCliente(e.target.checked)} className="w-4 h-4 accent-[#0BBCD4]" />
                <span className="text-sm text-gray-300">Usar os dados do cliente como Sócio 1</span>
              </label>
            )}
            {socioIdx === 1 && (
              <label className="flex items-center gap-2 mb-2 cursor-pointer p-3 rounded-xl" style={{ background: 'var(--sys-surface-2)', border: '1px solid var(--sys-border-2)' }}>
                <input type="checkbox" checked={socio2Ativo} disabled={readOnly} onChange={e => setSocio2Ativo(e.target.checked)} className="w-4 h-4 accent-[#0BBCD4]" />
                <span className="text-sm text-gray-300">Adicionar Sócio 2</span>
              </label>
            )}
            {socioIdx === 2 && (
              <label className="flex items-center gap-2 mb-2 cursor-pointer p-3 rounded-xl" style={{ background: 'var(--sys-surface-2)', border: '1px solid var(--sys-border-2)' }}>
                <input type="checkbox" checked={socio3Ativo} disabled={readOnly} onChange={e => setSocio3Ativo(e.target.checked)} className="w-4 h-4 accent-[#0BBCD4]" />
                <span className="text-sm text-gray-300">Adicionar Sócio 3</span>
              </label>
            )}

            {socioBloqueado ? (
              <p className="text-gray-600 text-sm py-6 text-center">Marque a opção acima para preencher os dados deste sócio.</p>
            ) : (
              <>
                <div className="grid grid-cols-12 gap-x-3 gap-y-2.5">
                  {SOCIO_FIELDS.map(([k, label, type, span]) => (
                    <div key={k} className={colSpan(span)}>
                      <SmartField label={label} type={type}
                        required={socioAtivo && REQ_SOCIO.includes(k)}
                        value={(socios[socioIdx]?.[k] as string) || ''}
                        onChange={v => setSocioK(socioIdx, k, v)}
                        disabled={readOnly}
                      />
                    </div>
                  ))}
                </div>
                <PessoaUploads docKey="doc_url" certKey="cert_url" senhaKey="cert_senha" data={socios[socioIdx] || {}} set={(k, v) => setSocioK(socioIdx, k, v)} disabled={readOnly} />
                <p className="text-xs pt-1" style={{ color: totalPart > 100 ? '#f87171' : '#6b7280' }}>
                  Soma da participação dos sócios: <b>{totalPart}%</b>{totalPart > 100 ? ' — excede 100%!' : ` (faltam ${Math.max(0, 100 - totalPart)}%)`}
                </p>
              </>
            )}
          </>
        )}

        {step === 5 && (
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
                    socios.forEach((sx, i) => {
                      if (sx.doc_url) docs.push({ nome: `Documento Sócio ${i + 1}`, url: sx.doc_url as string })
                      if (sx.cert_url) docs.push({ nome: `Certificado Sócio ${i + 1}`, url: sx.cert_url as string })
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
                    <label className="inline-flex items-center gap-1.5 text-xs font-bold px-3 h-9 rounded-lg cursor-pointer text-white" style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>
                      {uploadingArq ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Enviar arquivo
                      <input type="file" className="hidden" onChange={handleUploadArquivo} disabled={uploadingArq} />
                    </label>
                  </div>
                  {(() => {
                    const visiveis = arquivos.filter(a => !a.restrito || podeExcluir)
                    return visiveis.length === 0 ? (
                      <p className="text-gray-600 text-xs">Nenhum arquivo enviado.</p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1">
                        {visiveis.map(a => (
                          <FileTile key={a.id} nome={a.nome}
                            url={a.restrito ? `/api/clientes/${clienteId}/arquivos/${a.id}` : a.url}
                            restrito={a.restrito}
                            onDelete={() => handleExcluirArquivo(a.id, a.nome)} />
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </>
            )}
          </div>
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
            style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>
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

        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          className="inline-flex items-center gap-2 px-4 h-11 rounded-xl text-sm text-gray-300 disabled:opacity-40" style={FS}>
          <ArrowLeft size={15} /> Voltar
        </button>

        {step < PASSOS.length - 1 && (
          <button onClick={() => setStep(s => Math.min(PASSOS.length - 1, s + 1))}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #0BBCD4, #0999ae)' }}>
            Próximo <ArrowRight size={15} />
          </button>
        )}
      </div>

      {/* Link gerado */}
      {linkUrl && (
        <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl max-w-xl" style={{ background: 'var(--sys-surface-2)', border: '1px solid var(--sys-border-2)' }}>
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
