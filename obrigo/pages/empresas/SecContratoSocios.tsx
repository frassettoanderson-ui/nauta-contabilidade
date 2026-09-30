import { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useToast } from '../../components/ui';
import type { EmpresaDetalhe, Socio } from '../../lib/tipos';

// Seção "Contrato, imóveis e sócios" — dados que vieram do cadastro do ERP (Nauta/Atuan)
// e passam a viver aqui (cadastro único). Estilo denso, igual às demais seções da ficha.
const INP = 'block w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-[13px] text-slate-700 outline-none focus:border-marca-400 focus:ring-1 focus:ring-marca-100';
const LBL = 'mb-1 block text-[13px] font-bold text-slate-700';
const INTERESSES = ['Abrir minha empresa', 'Abrir MEI', 'Trocar de contador', 'Deixar de ser MEI', 'BPO Financeiro', 'Contabilidade Eleitoral', 'Outro'];
const ESTADO_CIVIL = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável'];

const fmtCep = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d; };
const fmtCpf = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 11); return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2}).*/, (_m, a, b, c, e) => `${a}.${b}.${c}${e ? `-${e}` : ''}`); };
const s = (v: unknown) => (v == null ? '' : String(v));
const socioVazio = (): Socio => ({ nomeCompleto: '', cpf: '', rg: '', nascimento: '', nomePai: '', nomeMae: '', participacao: '', estadoCivil: '', reciboIrpf: '', tituloEleitor: '', senhaGov: '', certSenha: '', email: '', telefone: '', cep: '', endereco: '', bairro: '', cidadeEstado: '' });

export default function SecContratoSocios({ empresa, podeEditar, onMudou }: { empresa: EmpresaDetalhe; podeEditar: boolean; onMudou: () => void }) {
  const toast = useToast();
  const [salvando, setSalvando] = useState(false);
  // Honorários, vencimentos, valor de abertura → foram para o Financeiro.
  // Atividade/capital/imóvel e filiais → foram para a seção "Endereço e inscrições".
  const [f, setF] = useState({
    negociacaoObs: s(empresa.negociacaoObs), interesse: s(empresa.interesse), emAbertura: !!empresa.emAbertura,
  });
  const [socios, setSocios] = useState<Socio[]>(empresa.socios?.length ? empresa.socios.map((x) => ({ ...x, participacao: s(x.participacao) })) : []);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const setSocio = (i: number, k: keyof Socio, v: string) => setSocios((xs) => xs.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  // Busca automática de endereço do sócio pelo CEP (ViaCEP), preenchendo o que estiver vazio.
  async function buscarCepSocio(i: number, cep: string) {
    const d = cep.replace(/\D/g, '');
    if (d.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const j = await r.json();
      if (j?.erro) return;
      setSocios((xs) => xs.map((x, k) => k === i ? {
        ...x,
        endereco: x.endereco || j.logradouro || '',
        bairro: x.bairro || j.bairro || '',
        cidadeEstado: x.cidadeEstado || (j.localidade ? `${j.localidade}/${j.uf}` : ''),
      } : x));
    } catch { /* ignora */ }
  }
  const somaPart = socios.reduce((a, x) => a + (Number(x.participacao) || 0), 0);

  async function salvar() {
    if (socios.some((x) => x.nomeCompleto.trim().length < 2)) return toast('erro', 'Todo sócio precisa de nome.');
    if (somaPart > 100) return toast('erro', `A soma da participação é ${somaPart}% (máx. 100%).`);
    setSalvando(true);
    try {
      await api.put(`/empresas/${empresa.id}`, {
        negociacaoObs: f.negociacaoObs || null, interesse: f.interesse || null, emAbertura: f.emAbertura,
        socios: socios.map((x) => ({ ...x, id: undefined, ordem: undefined, participacao: x.participacao === '' || x.participacao == null ? null : Number(x.participacao) })),
      });
      toast('ok', 'Contrato e sócios salvos.');
      onMudou();
    } catch (e) { toast('erro', e instanceof ApiError ? e.message : 'Erro ao salvar.'); }
    finally { setSalvando(false); }
  }

  const ro = !podeEditar;
  return (
    <div className="space-y-5">
      {/* Contrato / comercial (honorários e custos de abertura ficam no Financeiro) */}
      <div>
        <p className="mb-2 text-[12px] font-semibold text-marca-600">Contrato</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.6fr_0.8fr]">
          <div><label className={LBL}>Tipo de contrato</label>
            <select className={INP} disabled={ro} value={f.interesse} onChange={(e) => set('interesse', e.target.value)}>
              <option value="">—</option>{INTERESSES.map((x) => <option key={x} value={x}>{x}</option>)}
            </select></div>
          <div><label className={LBL}>Em abertura?</label>
            <select className={INP} disabled={ro} value={f.emAbertura ? 'sim' : 'nao'} onChange={(e) => set('emAbertura', e.target.value === 'sim')}><option value="nao">Não</option><option value="sim">Sim</option></select></div>
        </div>
        <div className="mt-3"><label className={LBL}>Condições especiais negociadas (vão para o contrato)</label>
          <textarea className={`${INP} min-h-[90px]`} disabled={ro} value={f.negociacaoObs} onChange={(e) => set('negociacaoObs', e.target.value)} /></div>
      </div>

      {/* Sócios */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[12px] font-semibold text-marca-600">Quadro societário <span className="font-normal text-slate-500">(sócio 1 = titular/administrador) · participação: {somaPart}%</span></p>
          {!ro && <button onClick={() => setSocios((xs) => [...xs, socioVazio()])} className="flex items-center gap-1 rounded bg-marca-500 px-3 py-1 text-[12px] font-medium text-white hover:bg-marca-600"><Plus size={13} /> Sócio</button>}
        </div>
        {socios.length === 0 && <p className="text-[12px] text-slate-400">Nenhum sócio cadastrado.</p>}
        <div className="space-y-3">
          {socios.map((x, i) => (
            <div key={i} className="rounded border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[12px] font-bold text-slate-700">Sócio {i + 1}{i === 0 ? ' · titular' : ''}</span>
                {!ro && <button onClick={() => setSocios((xs) => xs.filter((_, j) => j !== i))} className="text-status-danger hover:text-red-700" title="Remover"><Trash2 size={14} /></button>}
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_0.7fr]">
                <div><label className={LBL}>Nome completo</label><input className={INP} disabled={ro} value={s(x.nomeCompleto)} onChange={(e) => setSocio(i, 'nomeCompleto', e.target.value)} /></div>
                <div><label className={LBL}>CPF</label><input className={INP} disabled={ro} value={s(x.cpf)} onChange={(e) => setSocio(i, 'cpf', fmtCpf(e.target.value))} /></div>
                <div><label className={LBL}>RG</label><input className={INP} disabled={ro} value={s(x.rg)} onChange={(e) => setSocio(i, 'rg', e.target.value)} /></div>
                <div><label className={LBL}>Nascimento</label><input className={INP} disabled={ro} type="date" value={s(x.nascimento).slice(0, 10)} onChange={(e) => setSocio(i, 'nascimento', e.target.value)} /></div>
                <div><label className={LBL}>Partic. %</label><input className={INP} disabled={ro} type="number" min={0} max={100} value={s(x.participacao)} onChange={(e) => setSocio(i, 'participacao', e.target.value)} /></div>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr]">
                <div><label className={LBL}>Nome do pai</label><input className={INP} disabled={ro} value={s(x.nomePai)} onChange={(e) => setSocio(i, 'nomePai', e.target.value)} /></div>
                <div><label className={LBL}>Nome da mãe</label><input className={INP} disabled={ro} value={s(x.nomeMae)} onChange={(e) => setSocio(i, 'nomeMae', e.target.value)} /></div>
                <div><label className={LBL}>Estado civil</label>
                  <select className={INP} disabled={ro} value={s(x.estadoCivil)} onChange={(e) => setSocio(i, 'estadoCivil', e.target.value)}><option value="">—</option>{ESTADO_CIVIL.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
                <div><label className={LBL}>Recibo IRPF</label><input className={INP} disabled={ro} value={s(x.reciboIrpf)} onChange={(e) => setSocio(i, 'reciboIrpf', e.target.value)} /></div>
                <div><label className={LBL}>Título de eleitor</label><input className={INP} disabled={ro} value={s(x.tituloEleitor)} onChange={(e) => setSocio(i, 'tituloEleitor', e.target.value)} /></div>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
                <div><label className={LBL}>E-mail</label><input className={INP} disabled={ro} value={s(x.email)} onChange={(e) => setSocio(i, 'email', e.target.value)} /></div>
                <div><label className={LBL}>Telefone</label><input className={INP} disabled={ro} value={s(x.telefone)} onChange={(e) => setSocio(i, 'telefone', e.target.value)} /></div>
                <div><label className={LBL}>Senha gov.br</label><input className={INP} disabled={ro} type="password" value={s(x.senhaGov)} onChange={(e) => setSocio(i, 'senhaGov', e.target.value)} /></div>
                <div><label className={LBL}>Senha do certificado</label><input className={INP} disabled={ro} type="password" value={s(x.certSenha)} onChange={(e) => setSocio(i, 'certSenha', e.target.value)} /></div>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-[0.8fr_2fr_1.2fr_1.2fr]">
                <div><label className={LBL}>CEP</label><input className={INP} disabled={ro} inputMode="numeric" placeholder="00000-000" value={s(x.cep)} onChange={(e) => setSocio(i, 'cep', fmtCep(e.target.value))} onBlur={(e) => buscarCepSocio(i, e.target.value)} /></div>
                <div><label className={LBL}>Endereço</label><input className={INP} disabled={ro} value={s(x.endereco)} onChange={(e) => setSocio(i, 'endereco', e.target.value)} /></div>
                <div><label className={LBL}>Bairro</label><input className={INP} disabled={ro} value={s(x.bairro)} onChange={(e) => setSocio(i, 'bairro', e.target.value)} /></div>
                <div><label className={LBL}>Cidade / UF</label><input className={INP} disabled={ro} placeholder="Cidade/UF" value={s(x.cidadeEstado)} onChange={(e) => setSocio(i, 'cidadeEstado', e.target.value)} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!ro && (
        <div className="flex items-center gap-3">
          <button onClick={salvar} disabled={salvando} className="flex items-center gap-2 rounded bg-status-ok px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"><Save size={16} /> {salvando ? '...' : 'Salvar'}</button>
          {empresa.nautaClienteId && <span className="text-[11px] text-slate-400">Vinculado ao ERP — contrato, cobrança e comissões continuam sincronizados ao salvar.</span>}
        </div>
      )}
    </div>
  );
}
