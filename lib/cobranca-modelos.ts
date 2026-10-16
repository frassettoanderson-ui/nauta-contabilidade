// ─── Modelos de mensagem de cobrança (botão "Cobrar" / "Cobrar todos") ──────
// 5 níveis, do mais leve ao mais pesado. Sem link de pagamento: toda mensagem termina
// perguntando se pode enviar o boleto atualizado (o link vai pelo botão "Enviar link").
// Placeholders: {saudacao} {nome} {empresa} {valor} {venc} {meses}
// Client-safe (sem pg): usado na pré-visualização da tela e no envio do servidor.

export interface ModeloCobranca { id: number; titulo: string; descricao: string; texto: string }

export const MODELOS_COBRANCA: ModeloCobranca[] = [
  {
    id: 1, titulo: '1 · Lembrete gentil', descricao: 'Pode ter sido esquecimento',
    texto: '{saudacao} {nome}, tudo bem? 😊\n\nPassando para lembrar que o honorário da *{empresa}* com vencimento em *{venc}* ({valor}) ainda consta em aberto aqui no nosso sistema. Pode ter sido só um esquecimento!\n\nPodemos te enviar o boleto atualizado?',
  },
  {
    id: 2, titulo: '2 · Acompanhamento', descricao: 'Pede comprovante ou confirmação',
    texto: '{saudacao} {nome}!\n\nNotamos que o honorário da *{empresa}* vencido em *{venc}* ({valor}) segue pendente. Se você já efetuou o pagamento, por favor nos envie o comprovante para darmos baixa.\n\nCaso ainda não tenha pago, podemos te enviar o boleto atualizado?',
  },
  {
    id: 3, titulo: '3 · Cobrança firme', descricao: 'Pede regularização',
    texto: '{saudacao} {nome}.\n\nO honorário da *{empresa}* está em atraso desde *{venc}*, totalizando *{valor}*, e ainda não identificamos o pagamento. Precisamos regularizar essa pendência para manter os serviços contábeis em dia.\n\nPodemos te enviar o boleto atualizado para pagamento?',
  },
  {
    id: 4, titulo: '4 · Aviso de consequências', descricao: 'Multa, juros e suspensão dos serviços',
    texto: '{saudacao} {nome}.\n\nAinda não recebemos o pagamento do honorário da *{empresa}* em aberto desde *{venc}* ({valor}). Lembramos que, conforme o contrato, o atraso gera multa e juros e pode levar à suspensão da prestação dos serviços.\n\nQueremos resolver isso com você o quanto antes. Podemos te enviar o boleto atualizado?',
  },
  {
    id: 5, titulo: '5 · Notificação final', descricao: 'Negativação (SPC/Serasa) e protesto em cartório',
    texto: '{saudacao} {nome}.\n\n*Notificação de débito em aberto:* o honorário da *{empresa}*, em aberto desde *{venc}*, no valor de *{valor}*, permanece sem pagamento.\n\nConforme previsto em contrato, a falta de regularização autoriza o registro do débito nos órgãos de proteção ao crédito (SPC/Serasa) e o protesto do título em cartório. Para evitar essas medidas, pedimos a regularização imediata.\n\nPodemos te enviar o boleto atualizado?',
  },
]

export const saudacaoAgora = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite' }

export function preencherModelo(texto: string, v: { nome: string; empresa: string; valor: string; venc: string; meses: number }) {
  return texto
    .replace(/{saudacao}/g, saudacaoAgora()).replace(/{nome}/g, v.nome).replace(/{empresa}/g, v.empresa)
    .replace(/{valor}/g, v.valor).replace(/{venc}/g, v.venc).replace(/{meses}/g, String(v.meses))
}
