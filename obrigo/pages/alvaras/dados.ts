// Dados de referencia do modulo Alvaras — transcritos do painel da Atuan (dados-alvaras.js / dominio.js).
// Escopo: Imbituba/SC.
export const LICENCAS = [
 "Alvará de Funcionamento",
 "Bombeiros (AVCB)",
 "Vigilância Sanitária",
 "Polícia Civil",
 "Ambiental",
 "Outro"
] as const;
export const LIC_SITUACOES = [
 "Em preparação",
 "Protocolado / em análise",
 "Em exigência",
 "Deferido / emitido",
 "A renovar",
 "Vencido",
 "Indeferido"
];
export const ORGAOS_LISTA = [
 "Prefeitura",
 "Corpo de Bombeiros",
 "Vigilância Sanitária Municipal",
 "Polícia Civil",
 "Órgão ambiental",
 "Junta Comercial",
 "Receita Federal",
 "Outro"
];
export const ETAPAS_LEGAL = [
 "A iniciar",
 "Consulta / protocolo",
 "Aguardando análise do órgão",
 "Alvará emitido",
 "Concluído"
] as const;
export const UFM: Record<string, { v: number; src: string }> = {
 "2020": {
  "v": 3.45,
  "src": "Decreto PMI nº 230/2019"
 },
 "2021": {
  "v": 3.63,
  "src": "Decreto PMI nº 272/2020"
 },
 "2025": {
  "v": 4.64,
  "src": "Decreto PMI nº 227/2024"
 },
 "2026": {
  "v": 4.83,
  "src": "Decreto PMI nº 288/2025"
 }
};
export const TAXAS: { key: string; name: string; group: string; legal: string }[] = [
 {
  "key": "loc",
  "name": "TFLE — Fiscalização para Localização (abertura)",
  "group": "licenca",
  "legal": "IN SEFAZ 004/2022 + LC 3.019/2006, art. 332, I — soma da UFM de todos os CNAEs (art. 7º §2º)."
 },
 {
  "key": "tfle",
  "name": "TFFE — Fiscalização para Funcionamento (renovação anual)",
  "group": "licenca",
  "legal": "IN SEFAZ 004/2022 + LC 3.019/2006, art. 332, II — soma da UFM de todos os CNAEs."
 },
 {
  "key": "sanit",
  "name": "Vigilância Sanitária",
  "group": "extra",
  "legal": "LC 3.019/2006 — taxa de licença sanitária. Confirmar Anexo."
 },
 {
  "key": "public",
  "name": "Publicidade / Anúncios",
  "group": "extra",
  "legal": "LC 3.019/2006 — taxa de licença de publicidade. Confirmar Anexo."
 },
 {
  "key": "amb",
  "name": "Licença Ambiental Municipal",
  "group": "extra",
  "legal": "LC 3.019/2006 / licenciamento ambiental. Confirmar Anexo."
 },
 {
  "key": "obra",
  "name": "Regularização de Obras / Habite-se",
  "group": "extra",
  "legal": "LC nº 4.725/2016 — Regularização de Obras. Confirmar tabela."
 }
];
export const MATRIZ: { a: string; r: string; lic: string[]; o: string[] }[] = [
 {
  "a": "Comércio varejista em geral (loja, boutique)",
  "r": "Baixo risco",
  "lic": [
   "Consulta de viabilidade",
   "Registro JUCESC + CNPJ",
   "Inscrição Municipal",
   "Alvará de Localização e Funcionamento",
   "AVCB conforme área/lotação"
  ],
  "o": [
   "Prefeitura/SEDURB",
   "JUCESC",
   "SEFAZ",
   "CBMSC"
  ]
 },
 {
  "a": "Restaurante, lanchonete, padaria, mercado (alimentos)",
  "r": "Alto risco",
  "lic": [
   "Consulta de viabilidade",
   "Registro JUCESC + CNPJ",
   "Inscrição Municipal",
   "Alvará de Localização",
   "Alvará Sanitário (Vigilância)",
   "AVCB / Bombeiros"
  ],
  "o": [
   "Prefeitura/SEDURB",
   "Vigilância Sanitária",
   "CBMSC",
   "JUCESC"
  ]
 },
 {
  "a": "Bar / distribuidora de bebidas",
  "r": "Médio risco",
  "lic": [
   "Consulta de viabilidade",
   "Inscrição Municipal",
   "Alvará de Localização",
   "Licença Sanitária",
   "AVCB"
  ],
  "o": [
   "Prefeitura/SEDURB",
   "Vigilância Sanitária",
   "CBMSC"
  ]
 },
 {
  "a": "Salão de beleza, barbearia, estética, tatuagem",
  "r": "Alto risco",
  "lic": [
   "Consulta de viabilidade",
   "Inscrição Municipal",
   "Alvará de Localização",
   "Licença Sanitária (obrigatória)"
  ],
  "o": [
   "Prefeitura/SEDURB",
   "Vigilância Sanitária"
  ]
 },
 {
  "a": "Farmácia / drogaria",
  "r": "Alto risco",
  "lic": [
   "Consulta de viabilidade",
   "Inscrição Municipal",
   "Alvará de Localização",
   "Licença Sanitária",
   "Autorização/registro conselho (CRF)",
   "AVCB"
  ],
  "o": [
   "Vigilância Sanitária",
   "Prefeitura/SEDURB",
   "CBMSC"
  ]
 },
 {
  "a": "Clínica / consultório de saúde",
  "r": "Alto risco",
  "lic": [
   "Consulta de viabilidade",
   "Inscrição Municipal",
   "Alvará de Localização",
   "Licença Sanitária",
   "Registro no conselho de classe",
   "AVCB"
  ],
  "o": [
   "Vigilância Sanitária",
   "Prefeitura/SEDURB",
   "CBMSC"
  ]
 },
 {
  "a": "Serviços profissionais / escritório (contábil, advocacia, TI)",
  "r": "Baixo risco",
  "lic": [
   "Consulta de viabilidade",
   "Registro JUCESC + CNPJ",
   "Inscrição Municipal (ISS)",
   "Alvará de Localização"
  ],
  "o": [
   "Prefeitura/SEDURB",
   "JUCESC",
   "SEFAZ"
  ]
 },
 {
  "a": "Indústria / fabricação",
  "r": "Alto risco",
  "lic": [
   "Consulta de viabilidade",
   "Registro JUCESC + CNPJ",
   "Inscrição Municipal",
   "Alvará de Localização",
   "Licença Ambiental (IMA)",
   "AVCB",
   "Licença Sanitária (se alimentos/saúde)"
  ],
  "o": [
   "IMA/SC",
   "Prefeitura/SEDURB",
   "CBMSC",
   "Vigilância Sanitária"
  ]
 },
 {
  "a": "Construção civil / obras",
  "r": "Médio risco",
  "lic": [
   "Alvará de Construção",
   "ART/RRT do responsável técnico",
   "Habite-se ao final",
   "Regularização (LC 4.725/2016) se obra existente"
  ],
  "o": [
   "Prefeitura/SEDURB"
  ]
 },
 {
  "a": "Oficina mecânica / funilaria / lava-rápido",
  "r": "Médio risco",
  "lic": [
   "Consulta de viabilidade",
   "Inscrição Municipal",
   "Alvará de Localização",
   "Licença Ambiental",
   "AVCB"
  ],
  "o": [
   "Prefeitura/SEDURB",
   "IMA/SC",
   "CBMSC"
  ]
 },
 {
  "a": "Transporte / logística / depósito",
  "r": "Médio risco",
  "lic": [
   "Consulta de viabilidade",
   "Inscrição Municipal",
   "Alvará de Localização",
   "Licença Ambiental (se resíduos/combustível)",
   "AVCB"
  ],
  "o": [
   "Prefeitura/SEDURB",
   "IMA/SC",
   "CBMSC"
  ]
 },
 {
  "a": "Comércio na faixa de areia / praia (sazonal)",
  "r": "Médio risco",
  "lic": [
   "Alvará específico SETUR (editais anuais)",
   "Licença Sanitária (se alimentos)"
  ],
  "o": [
   "SETUR/SEDETUR",
   "Vigilância Sanitária"
  ]
 },
 {
  "a": "Publicidade / anúncio em fachada ou via pública",
  "r": "Baixo risco",
  "lic": [
   "Licença de Publicidade/Anúncios",
   "Aprovação municipal do engenho publicitário"
  ],
  "o": [
   "Prefeitura/SEDURB"
  ]
 },
 {
  "a": "MEI — Microempreendedor Individual",
  "r": "Baixo risco",
  "lic": [
   "Consulta de viabilidade",
   "CCMEI (CNPJ)",
   "Inscrição Municipal",
   "Alvará (isenção de taxas — Lei 5.134/2020)",
   "Licença Sanitária (se alimentos/saúde)"
  ],
  "o": [
   "Sala do Empreendedor",
   "Prefeitura/SEDURB",
   "Vigilância Sanitária"
  ]
 }
];
export const FLUXO: { n: string; t: string; d: string }[] = [
 {
  "n": "1",
  "t": "Consulta prévia de viabilidade",
  "d": "Verifique se o endereço permite a atividade (uso e ocupação do solo) e se a atividade é liberada. Fluxo online pelo REDESIM/SC integrado à SEDURB. É a condição para todo o resto."
 },
 {
  "n": "2",
  "t": "Registro na JUCESC + CNPJ",
  "d": "Constituição/alteração na Junta Comercial de SC e inscrição no CNPJ (Receita Federal), pelo coletor nacional REDESIM."
 },
 {
  "n": "3",
  "t": "Inscrição Municipal (SEFAZ)",
  "d": "Cadastro do contribuinte no município para ISS e lançamento da TFLE. Base: LC 3.019/2006."
 },
 {
  "n": "4",
  "t": "Licenças específicas",
  "d": "Conforme a atividade: Vigilância Sanitária (alimentos, saúde, estética), Licença Ambiental (IMA/SC) e vistoria do Corpo de Bombeiros (AVCB/CBMSC)."
 },
 {
  "n": "5",
  "t": "Emissão do Alvará de Localização e Funcionamento",
  "d": "Prefeitura emite o alvará após as etapas acima. Recolhimento da taxa de licença (calculada em UFM). MEI/novos podem ser isentos (Lei 5.134/2020)."
 },
 {
  "n": "6",
  "t": "Renovação anual e vencimentos",
  "d": "TFLE lançada anualmente (com IPTU/ISS/COLIX). Controle validade de licença sanitária, ambiental e AVCB para renovar antes de vencer."
 }
];
export const ORGAOS: { n: string; d: string; c: string[]; u: string }[] = [
 {
  "n": "Sala do Empreendedor de Imbituba",
  "d": "Orientação e apoio à abertura, alteração e baixa; MEI. Atendimento presencial (térreo da Prefeitura) e online.",
  "c": [
   "Tel: (48) 3355-8144",
   "empreendedor@imbituba.sc.gov.br"
  ],
  "u": "https://www.imbituba.sc.gov.br/cms/pagina/ver/codMapaItem/145189"
 },
 {
  "n": "Prefeitura / SEDURB",
  "d": "Uso e ocupação do solo, consulta de viabilidade e emissão do Alvará de Localização e Funcionamento.",
  "c": [
   "Tel: (48) 3355-8100"
  ],
  "u": "https://imbituba.atende.net/autoatendimento/servicos"
 },
 {
  "n": "SEFAZ / SEFIN (Fazenda)",
  "d": "Inscrição Municipal, ISS, TFLE e demais tributos. Portal do ISS / NFS-e.",
  "c": [
   "Portal do ISS"
  ],
  "u": "http://iss.imbituba.sc.gov.br/"
 },
 {
  "n": "Vigilância Sanitária Municipal",
  "d": "Licença/Alvará sanitário para alimentos, saúde, estética e afins. Vistoria do estabelecimento.",
  "c": [
   "Via protocolo da Prefeitura"
  ],
  "u": "https://imbituba.atende.net/autoatendimento/servicos"
 },
 {
  "n": "JUCESC — Junta Comercial de SC",
  "d": "Registro de empresas (constituição, alteração, baixa) e integração com CNPJ via REDESIM.",
  "c": [
   "Portal REGIN/REDESIM"
  ],
  "u": "https://www.jucesc.sc.gov.br/"
 },
 {
  "n": "Corpo de Bombeiros (CBMSC)",
  "d": "Análise de projeto e vistoria para o AVCB (Atestado de Vistoria). Competência estadual.",
  "c": [
   "Sistemas online CBMSC"
  ],
  "u": "https://www.cbm.sc.gov.br/"
 },
 {
  "n": "IMA/SC — Meio Ambiente",
  "d": "Licenciamento ambiental estadual para atividades potencialmente poluidoras.",
  "c": [
   "Sistema de licenciamento IMA"
  ],
  "u": "https://www.ima.sc.gov.br/"
 },
 {
  "n": "SETUR / SEDETUR",
  "d": "Comércio na faixa de areia e atividades turísticas — regulado por editais anuais.",
  "c": [
   "Editais publicados no site"
  ],
  "u": "https://www.imbituba.sc.gov.br/"
 },
 {
  "n": "Protocolo online / Autoatendimento",
  "d": "Abertura e acompanhamento de protocolos junto à Prefeitura de Imbituba.",
  "c": [
   "Portal de autoatendimento"
  ],
  "u": "https://imbituba.atende.net/autoatendimento/servicos"
 }
];
export const CHECKLISTS: Record<string, string[]> = {
 "Abertura de empresa (estabelecimento fixo)": [
  "Consulta de viabilidade (endereço + atividade) aprovada",
  "Contrato social / requerimento registrado na JUCESC",
  "CNPJ emitido (Receita Federal)",
  "Inscrição Municipal realizada (SEFAZ)",
  "Enquadramento tributário definido (Simples/Presumido/Real)",
  "Licença Sanitária, se atividade exigir",
  "Licença Ambiental (IMA), se atividade exigir",
  "Vistoria/AVCB do Corpo de Bombeiros, se exigido",
  "Alvará de Localização e Funcionamento emitido",
  "Taxas municipais recolhidas (ou isenção Lei 5.134/2020 confirmada)"
 ],
 "Renovação de alvará (TFLE)": [
  "Conferir dados cadastrais e atividade atual",
  "Emitir/recolher a guia da TFLE",
  "Verificar validade da Licença Sanitária",
  "Verificar validade do AVCB (Bombeiros)",
  "Verificar validade da Licença Ambiental",
  "Atualizar o registro no controle de vencimentos"
 ],
 "Licença Sanitária": [
  "Verificar exigências do ramo (roteiro de inspeção)",
  "Reunir documentos (contrato, responsável técnico se exigido)",
  "Protocolar pedido / agendar vistoria",
  "Recolher taxa de licença sanitária",
  "Acompanhar exigências e emissão",
  "Registrar validade para renovação"
 ],
 "Alteração de endereço": [
  "Nova consulta de viabilidade no novo endereço",
  "Alteração contratual na JUCESC",
  "Atualizar CNPJ e Inscrição Municipal",
  "Solicitar novo Alvará de Localização",
  "Transferir/atualizar licenças (sanitária, ambiental, bombeiros)",
  "Providenciar baixa do alvará no endereço antigo"
 ],
 "Baixa / encerramento": [
  "Distrato/encerramento registrado na JUCESC",
  "Baixa na Receita Federal (CNPJ)",
  "Baixa da Inscrição Municipal e quitação de tributos",
  "Cancelamento das licenças (sanitária, ambiental, alvará)",
  "Guardar comprovantes e encerrar o controle"
 ],
 "MEI — Microempreendedor Individual": [
  "Consulta de viabilidade do endereço",
  "Emissão do CCMEI (formalização)",
  "Inscrição Municipal",
  "Alvará (verificar isenção de taxas — Lei 5.134/2020)",
  "Licença Sanitária, se alimentos/saúde"
 ]
};
