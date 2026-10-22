// Janelas do modulo Alvaras: licenca, inativacao, corrigir tipo, importar planilha, nova legalizacao, cartao.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, useToast } from '../../components/ui';
import { Botao, Campo, INP, erroMsg } from '../societario/modais';
import { mascaraMoeda, moedaParaNumero, numeroParaMoeda } from '../societario/comum';
import { ORGAOS_LISTA } from './dados';
import {
  LICENCAS, LIC_SITUACOES, MOTIVOS_INATIVACAO, COLUNAS_XLS, alvApi, xlsx, baixarPlanilha, nomeLic, dataBR, hojeISO,
  type Licenca, type Legalizacao, type EmpresaMin,
} from './comum';

export { Botao, INP, erroMsg };

// Select de empresa com filtro por digitacao
export function SelectEmpresa({ empresas, valor, onMudar, placeholder = '— escolher —' }: { empresas: EmpresaMin[]; valor: string; onMudar: (id: string) => void; placeholder?: string }) {
  const [q, setQ] = useState('');
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? empresas.filter((e) => e.razaoSocial.toLowerCase().includes(t) || e.cnpj.includes(t.replace(/\D/g, '') || '§')) : empresas;
  }, [q, empresas]);
  return (
    <div className="space-y-1">
      <input className={INP} placeholder="Filtrar por nome ou CNPJ" value={q} onChange={(e) => setQ(e.target.value)} />
      <select className={INP} value={valor} onChange={(e) => onMudar(e.target.value)} size={Math.min(6, Math.max(2, lista.length + 1))}>
        <option value="">{placeholder}</option>
        {lista.slice(0, 300).map((e) => <option key={e.id} value={e.id}>{e.razaoSocial}{e.ativo ? '' : ' (inativa)'}</option>)}
      </select>
    </div>
  );
}

// ─── Licenca (novo / editar) ────────────────────────────────────────────────
export function LicencaModal({ licenca, aberto, empresas, onFechar, onSalvo, podeOperar }: { licenca: Licenca | null; aberto: boolean; empresas: EmpresaMin[]; onFechar: () => void; onSalvo: () => void; podeOperar: boolean }) {
  const toast = useToast();
  const vazio = { empresaId: '', tipo: 'Alvará de Funcionamento', orgao: 'Prefeitura', protocolo: '', situacao: 'Em preparação', emissao: '', validade: '', responsavel: '', taxa: '', observacao: '' };
  const [f, setF] = useState(vazio);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!aberto) return;
    setF(licenca ? {
      empresaId: licenca.empresaId ?? '', tipo: licenca.tipo, orgao: licenca.orgao ?? '', protocolo: licenca.protocolo ?? '', situacao: licenca.situacao,
      emissao: licenca.emissao?.slice(0, 10) ?? '', validade: licenca.validade?.slice(0, 10) ?? '', responsavel: licenca.responsavel ?? '',
      taxa: numeroParaMoeda(licenca.taxa), observacao: licenca.observacao ?? '',
    } : vazio);
  }, [aberto, licenca]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  async function salvar() {
    if (!f.empresaId) return toast('erro', 'Preencha: Cliente.');
    setBusy(true);
    try {
      await alvApi.salvarLicenca(licenca?.id ?? null, {
        empresaId: f.empresaId, tipo: f.tipo, orgao: f.orgao || null, protocolo: f.protocolo || null, situacao: f.situacao,
        emissao: f.emissao || null, validade: f.validade || null, responsavel: f.responsavel || null,
        taxa: f.taxa ? moedaParaNumero(f.taxa) : null, observacao: f.observacao || null,
      });
      toast('ok', 'Registro salvo.'); onSalvo(); onFechar();
    } catch (e) { toast('erro', erroMsg(e)); } finally { setBusy(false); }
  }
  async function excluir() {
    if (!licenca || !confirm(`Excluir o registro ${nomeLic(licenca)} — ${licenca.tipo}? Não tem desfazer.`)) return;
    try { await alvApi.excluirLicenca(licenca.id); toast('ok', 'Registro excluído.'); onSalvo(); onFechar(); } catch (e) { toast('erro', erroMsg(e)); }
  }
  return (
    <Modal aberto={aberto} titulo={licenca ? `Alvará / licença — ${nomeLic(licenca)}` : 'Novo alvará / licença'} onFechar={onFechar} largura="max-w-2xl">
      <fieldset disabled={!podeOperar} className="grid grid-cols-2 gap-3">
        <Campo label="Cliente *" className="col-span-2"><SelectEmpresa empresas={empresas} valor={f.empresaId} onMudar={(v) => set('empresaId', v)} /></Campo>
        <Campo label="Licença / tipo"><select className={INP} value={f.tipo} onChange={(e) => set('tipo', e.target.value)}>{LICENCAS.map((x) => <option key={x}>{x}</option>)}</select></Campo>
        <Campo label="Órgão"><select className={INP} value={f.orgao} onChange={(e) => set('orgao', e.target.value)}><option value="">—</option>{ORGAOS_LISTA.map((x) => <option key={x}>{x}</option>)}{f.orgao && !ORGAOS_LISTA.includes(f.orgao) && <option>{f.orgao}</option>}</select></Campo>
        <Campo label="Protocolo / nº"><input className={INP} value={f.protocolo} onChange={(e) => set('protocolo', e.target.value)} /></Campo>
        <Campo label="Situação"><select className={INP} value={f.situacao} onChange={(e) => set('situacao', e.target.value)}>{LIC_SITUACOES.map((x) => <option key={x}>{x}</option>)}</select></Campo>
        <Campo label="Emissão"><input type="date" className={INP} value={f.emissao} onChange={(e) => set('emissao', e.target.value)} /></Campo>
        <Campo label="Validade (em branco = sem prazo de renovação)"><input type="date" className={INP} value={f.validade} onChange={(e) => set('validade', e.target.value)} /></Campo>
        <Campo label="Responsável"><input className={INP} value={f.responsavel} onChange={(e) => set('responsavel', e.target.value)} /></Campo>
        <Campo label="Taxa paga (R$)"><input className={INP} value={f.taxa} placeholder="0,00" onChange={(e) => set('taxa', mascaraMoeda(e.target.value))} /></Campo>
        <Campo label="Observações" className="col-span-2"><textarea className={INP} rows={3} value={f.observacao} onChange={(e) => set('observacao', e.target.value)} /></Campo>
      </fieldset>
      <div className="mt-5 flex justify-center gap-2">
        {podeOperar && licenca && <Botao tipo="excluir" onClick={excluir}>Excluir</Botao>}
        <Botao tipo="cancelar" onClick={onFechar}>{podeOperar ? 'Cancelar' : 'Fechar'}</Botao>
        {podeOperar && <Botao tipo="salvar" onClick={salvar} disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</Botao>}
      </div>
    </Modal>
  );
}

// ─── Inativar / reativar empresa ────────────────────────────────────────────
export function InativarModal({ alvo, onFechar, onFeito, licencas, legalizacoes }: { alvo: { empresaId: string; nome: string; inativo: boolean } | null; onFechar: () => void; onFeito: () => void; licencas: Licenca[]; legalizacoes: Legalizacao[] }) {
  const toast = useToast();
  const [motivo, setMotivo] = useState(MOTIVOS_INATIVACAO[0]);
  if (!alvo) return null;
  const nl = licencas.filter((l) => l.empresaId === alvo.empresaId).length;
  const ng = legalizacoes.filter((c) => c.empresaId === alvo.empresaId && c.etapa !== 'Concluído').length;
  async function confirmar() {
    try {
      await alvApi.inativar(alvo!.empresaId, alvo!.inativo ? null : motivo);
      toast('ok', alvo!.inativo ? `Alvarás de ${alvo!.nome} reativados.` : `Alvarás de ${alvo!.nome} inativados.`); onFeito(); onFechar();
    } catch (e) { toast('erro', erroMsg(e)); }
  }
  return (
    <Modal aberto onFechar={onFechar} titulo={alvo.inativo ? 'Reativar empresa' : 'Inativar empresa'}>
      <p className="mb-3 text-center text-[13px] text-slate-600"><b>{alvo.nome}</b><br />{nl} licença(s) e {ng} processo(s) em andamento.</p>
      {alvo.inativo
        ? <p className="text-center text-[13px] text-slate-600">As licenças e cartões voltam para os painéis, alertas e Kanban.</p>
        : <>
          <p className="mb-2 text-center text-[13px] text-slate-600">Nada é apagado: as licenças e cartões saem dos painéis e alertas até reativar.</p>
          <Campo label="Motivo"><select className={INP} value={motivo} onChange={(e) => setMotivo(e.target.value)}>{MOTIVOS_INATIVACAO.map((m) => <option key={m}>{m}</option>)}</select></Campo>
        </>}
      <div className="mt-4 flex justify-center gap-2">
        <Botao tipo="cancelar" onClick={onFechar}>Cancelar</Botao>
        <Botao tipo={alvo.inativo ? 'salvar' : 'excluir'} onClick={confirmar}>{alvo.inativo ? 'Reativar' : 'Inativar'}</Botao>
      </div>
    </Modal>
  );
}

// ─── Corrigir tipo em lote ──────────────────────────────────────────────────
export function CorrigirTipoModal({ aberto, licencas, onFechar, onFeito }: { aberto: boolean; licencas: Licenca[]; onFechar: () => void; onFeito: () => void }) {
  const toast = useToast();
  const tipos = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of licencas) m.set(l.tipo || '', (m.get(l.tipo || '') ?? 0) + 1);
    return [...m.entries()];
  }, [licencas]);
  const [de, setDe] = useState('');
  const [para, setPara] = useState<string>(LICENCAS[0]);
  useEffect(() => { if (aberto) setDe(tipos[0]?.[0] ?? ''); }, [aberto, tipos]);
  async function aplicar() {
    try { const r = await alvApi.corrigirTipo(de, para); toast('ok', `${r.alterados} registro(s) corrigido(s).`); onFeito(); onFechar(); } catch (e) { toast('erro', erroMsg(e)); }
  }
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Corrigir tipo em lote">
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Trocar todos que estão como"><select className={INP} value={de} onChange={(e) => setDe(e.target.value)}>{tipos.map(([t, n]) => <option key={t} value={t}>{t || '—'} ({n})</option>)}</select></Campo>
        <Campo label="Para"><select className={INP} value={para} onChange={(e) => setPara(e.target.value)}>{LICENCAS.map((x) => <option key={x}>{x}</option>)}</select></Campo>
      </div>
      <div className="mt-4 flex justify-center gap-2"><Botao tipo="cancelar" onClick={onFechar}>Cancelar</Botao><Botao tipo="salvar" onClick={aplicar}>Aplicar</Botao></div>
    </Modal>
  );
}

// ─── Planilha: modelo, exportar, importar ───────────────────────────────────
export async function modeloExcel() {
  await baixarPlanilha('Modelo_Alvaras_ATUAN.xlsx', [
    { nome: 'Alvarás', linhas: [COLUNAS_XLS, ['Padaria Boa Massa ME', 'Alvará de Funcionamento', 'Prefeitura', '2026/00123', '31/12/2026', 'Deferido / emitido', 'Ana', 'Renovar em dezembro']] },
    { nome: 'Orientações', linhas: [['Coluna', 'Como preencher'],
      ['Cliente', 'Nome da empresa exatamente como está no Obrigô (razão social ou nome fantasia).'],
      ['Licença / tipo', `Um destes: ${LICENCAS.join(', ')}.`],
      ['Órgão', 'Prefeitura, Corpo de Bombeiros, Vigilância Sanitária Municipal…'],
      ['Protocolo / nº', 'Número do protocolo ou do alvará.'],
      ['Validade', 'dd/mm/aaaa. Em branco = sem prazo de renovação.'],
      ['Situação', `${LIC_SITUACOES.slice(0, 4).join(', ')}…`],
      ['Atualizar sem duplicar', 'Mesmo cliente + tipo + protocolo atualiza o registro existente; os campos em branco não apagam nada.']] },
  ]);
}
export async function exportarExcel(licencas: Licenca[]) {
  await baixarPlanilha(`Alvaras_ATUAN_${hojeISO()}.xlsx`, [{
    nome: 'Alvarás',
    linhas: [[...COLUNAS_XLS, 'Inativa'], ...licencas.map((l) => [nomeLic(l), l.tipo, l.orgao ?? '', l.protocolo ?? '', l.validade ? dataBR(l.validade) : '', l.situacao, l.responsavel ?? '', l.observacao ?? '', l.inativo ? 'sim' : ''])],
  }]);
}
export function BotaoImportar({ onFeito }: { onFeito: () => void }) {
  const toast = useToast();
  const ref = useRef<HTMLInputElement>(null);
  async function ler(arq: File) {
    try {
      const X = await xlsx();
      const wb = X.read(await arq.arrayBuffer(), { type: 'array', cellDates: true });
      const aba = wb.SheetNames.find((n) => /alvar/i.test(n)) ?? wb.SheetNames[0];
      const rows = X.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[aba], { defval: '', raw: false, dateNF: 'dd/mm/yyyy' });
      const pega = (r: Record<string, unknown>, nomes: string[]) => {
        const k = Object.keys(r).find((c) => nomes.includes(c.trim().toLowerCase()));
        return k ? String(r[k] ?? '').trim() : '';
      };
      const linhas = rows.map((r) => ({
        cliente: pega(r, ['cliente', 'empresa', 'razão social', 'razao social']),
        tipo: pega(r, ['licença / tipo', 'licenca / tipo', 'tipo/licença', 'tipo', 'licença', 'licenca']),
        protocolo: pega(r, ['protocolo / nº', 'protocolo/número', 'protocolo', 'número', 'numero']),
        orgao: pega(r, ['órgão', 'orgao']), validade: pega(r, ['validade', 'vencimento']), situacao: pega(r, ['situação', 'situacao']),
        responsavel: pega(r, ['responsável', 'responsavel']), observacao: pega(r, ['observações', 'observacoes', 'obs.', 'obs']),
      }));
      const r = await alvApi.importar(linhas);
      toast('ok', `Importação concluída: ${r.novos} novo(s), ${r.atualizados} atualizado(s)${r.ignoradas ? `, ${r.ignoradas} linha(s) ignorada(s)` : ''}.`);
      if (r.semCadastro.length) alert(`Estas empresas não foram encontradas no Obrigô e as linhas foram ignoradas:\n\n${r.semCadastro.join('\n')}\n\nCadastre a empresa (ou corrija o nome na planilha) e importe de novo.`);
      onFeito();
    } catch (e) { toast('erro', erroMsg(e)); }
  }
  return (
    <>
      <input ref={ref} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const a = e.target.files?.[0]; e.target.value = ''; if (a) ler(a); }} />
      <Botao tipo="info" onClick={() => ref.current?.click()}>↑ Importar Excel</Botao>
    </>
  );
}

// ─── Nova legalizacao ───────────────────────────────────────────────────────
export function NovaLegalizacaoModal({ aberto, empresas, onFechar, onCriada }: { aberto: boolean; empresas: EmpresaMin[]; onFechar: () => void; onCriada: (c: Legalizacao) => void }) {
  const toast = useToast();
  const [emp, setEmp] = useState('');
  useEffect(() => { if (aberto) setEmp(''); }, [aberto]);
  async function criar() {
    if (!emp) return toast('erro', 'Escolha a empresa.');
    try { const c = await alvApi.novaLegalizacao(emp); toast('ok', 'Legalização criada — marque os alvarás.'); onCriada(c); onFechar(); } catch (e) { toast('erro', erroMsg(e)); }
  }
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Nova legalização">
      <Campo label="Empresa"><SelectEmpresa empresas={empresas} valor={emp} onMudar={setEmp} /></Campo>
      <div className="mt-4 flex justify-center gap-2"><Botao tipo="cancelar" onClick={onFechar}>Cancelar</Botao><Botao tipo="salvar" onClick={criar}>Criar</Botao></div>
    </Modal>
  );
}

// ─── Ficha do cartao ────────────────────────────────────────────────────────
export function CartaoModal({ cartao, onFechar, onSalvo, podeOperar, onInativar }: { cartao: Legalizacao | null; onFechar: () => void; onSalvo: () => void; podeOperar: boolean; onInativar: (c: Legalizacao) => void }) {
  const toast = useToast();
  const [alv, setAlv] = useState<string[]>([]);
  const [tipo, setTipo] = useState('');
  const [obs, setObs] = useState('');
  const [proto, setProto] = useState('');
  const [orgao, setOrgao] = useState('');
  useEffect(() => {
    if (!cartao) return;
    setAlv(cartao.alvarasPrevistos ?? []); setTipo(cartao.tipo); setObs(cartao.observacao ?? ''); setProto(cartao.protocolo ?? ''); setOrgao(cartao.orgao ?? '');
  }, [cartao]);
  if (!cartao) return null;
  const c = cartao;
  const iniciar = c.etapa === 'A iniciar';
  async function salvar() {
    try {
      const r = await alvApi.salvarCartao(c.id, iniciar ? { alvaras: alv, observacao: obs } : { tipo, observacao: obs, protocolo: proto, orgao });
      toast('ok', iniciar ? `${r.gerados} alvará(s) enviado(s) para “Consulta / protocolo”.` : 'Alterações salvas.'); onSalvo(); onFechar();
    } catch (e) { toast('erro', erroMsg(e)); }
  }
  return (
    <Modal aberto onFechar={onFechar} titulo={`Cartão · ${nomeLic(c)}`} largura="max-w-xl">
      <p className="-mt-2 mb-3 text-center text-[13px] text-slate-500">{c.tipoProcesso} · etapa: {c.etapa}</p>
      <fieldset disabled={!podeOperar} className="space-y-3">
        {iniciar ? (
          <div>
            <div className="mb-1 text-center text-[13px] font-medium text-slate-700">Quais alvarás esta empresa vai precisar?</div>
            <div className="mx-auto grid w-fit grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
              {LICENCAS.map((l) => (
                <label key={l} className="flex items-center gap-2">
                  <input type="checkbox" className="accent-marca-600" checked={alv.includes(l)} disabled={(c.alvarasGerados ?? []).includes(l)}
                    onChange={(e) => setAlv((x) => (e.target.checked ? [...x, l] : x.filter((y) => y !== l)))} /> {l}
                </label>
              ))}
            </div>
            <p className="mt-1 text-center text-[11px] text-slate-400">Cada alvará marcado vira um cartão em “Consulta / protocolo”. Se a empresa já tem esse alvará cadastrado, o cartão renova o existente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Tipo de alvará">
              <select className={INP} value={tipo} disabled={c.etapa !== 'Consulta / protocolo'} onChange={(e) => setTipo(e.target.value)}>{LICENCAS.map((x) => <option key={x}>{x}</option>)}</select>
              {c.etapa === 'Consulta / protocolo' && <span className="text-[11px] text-slate-400">Pode corrigir agora; nas próximas etapas trava.</span>}
            </Campo>
            <Campo label="Órgão"><select className={INP} value={orgao} onChange={(e) => setOrgao(e.target.value)}><option value="">—</option>{ORGAOS_LISTA.map((x) => <option key={x}>{x}</option>)}</select></Campo>
            <Campo label="Protocolo" className="col-span-2"><input className={INP} value={proto} onChange={(e) => setProto(e.target.value)} /></Campo>
          </div>
        )}
        <Campo label="Observações"><textarea className={INP} rows={4} value={obs} onChange={(e) => setObs(e.target.value)} /></Campo>
      </fieldset>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {podeOperar && c.empresaId && <Botao tipo="neutro" onClick={() => { onFechar(); onInativar(c); }}>{c.inativo ? '▶ Reativar empresa' : '⏸ Inativar empresa'}</Botao>}
        <Botao tipo="cancelar" onClick={onFechar}>Fechar</Botao>
        {podeOperar && <Botao tipo="salvar" onClick={salvar}>Salvar</Botao>}
      </div>
    </Modal>
  );
}
