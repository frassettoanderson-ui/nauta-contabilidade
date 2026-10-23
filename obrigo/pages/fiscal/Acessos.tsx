// Situação Fiscal › Relatório de acessos — o mesmo relatório do pé da tela de puxar, com endereço
// no menu: é onde se volta dias depois para ver de quem faltou procuração.
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { useAuth, temPermissao } from '../../lib/auth';
import { Botao } from '../societario/modais';
import { Anel } from '../societario/Kanban';
import { COR, digits, falhasDoJob, useFiscal } from './comum';
import { RelatorioAcessos, useExecucoes, useNomePorCnpj } from './Puxar';

export default function AcessosEcac() {
  const { sessao } = useAuth();
  const navigate = useNavigate();
  const { carteira, recarregar } = useFiscal();
  const ex = useExecucoes();
  const nomePorCnpj = useNomePorCnpj(carteira);

  let falhas = 0, baixados = 0;
  const empresas = new Set<string>();
  ex.execucoes.forEach((j) => {
    baixados += Number(j.summary?.baixados || (j.pdfs || []).length) || 0;
    falhasDoJob(j, nomePorCnpj).forEach((f) => { falhas++; empresas.add(digits(f.cnpj)); });
  });
  const tentativas = baixados + falhas;
  const pct = tentativas ? Math.round((baixados / tentativas) * 100) : 100;

  return (
    <div className="-m-6 min-h-full space-y-3 bg-fundo p-4 text-[13px]">
      <div className="grid grid-cols-1 gap-3 rounded-lg p-4 text-white md:grid-cols-[auto_1fr]" style={{ background: COR.marinho }}>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white p-1"><Anel pct={pct} /></div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-300">Situação Fiscal · e-CAC</div>
            <div className="text-lg font-semibold">Relatório de acessos</div>
            <div className="text-[12px] text-slate-300">{baixados} relatório(s) baixado(s) em {ex.execucoes.length} execução(ões)</div>
            <div className="text-[12px] text-slate-300">a ponte guarda os 15 pedidos mais recentes</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { t: 'Sem acesso', n: falhas, d: falhas ? 'tentativas que falharam' : 'nenhuma falha registrada', c: COR.erro },
            { t: 'Empresas afetadas', n: empresas.size, d: empresas.size ? 'clientes a regularizar' : 'nada pendente', c: COR.aviso },
            { t: 'Baixados', n: baixados, d: 'relatórios trazidos do e-CAC', c: COR.ok },
          ].map((k) => <div key={k.t} className="rounded bg-white/10 p-2 text-center"><div className="text-[11px] text-slate-300">{k.t}</div><div className="text-xl font-semibold" style={{ color: k.c }}>{k.n}</div><div className="text-[11px] text-slate-300">{k.d}</div></div>)}
        </div>
      </div>
      <div className="flex justify-end"><Botao tipo="info" onClick={() => navigate('/fiscal/puxar')}><Upload size={13} /> Ir para Puxar do e-CAC</Botao></div>
      <RelatorioAcessos titulo="Execuções do robô" {...ex} nomePorCnpj={nomePorCnpj} podeOperar={temPermissao(sessao, 'ecac_operar')} aoReimportar={recarregar} />
    </div>
  );
}
