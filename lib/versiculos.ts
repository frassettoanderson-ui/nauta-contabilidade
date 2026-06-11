// Versículos para a saudação do CRM (tradução Almeida — domínio público)
export interface Versiculo { texto: string; ref: string }

export const VERSICULOS: Versiculo[] = [
  { texto: 'Tudo posso naquele que me fortalece.', ref: 'Filipenses 4:13' },
  { texto: 'O Senhor é o meu pastor; nada me faltará.', ref: 'Salmos 23:1' },
  { texto: 'Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.', ref: 'Salmos 37:5' },
  { texto: 'Sede fortes e corajosos; não temais, porque o Senhor vosso Deus é convosco.', ref: 'Josué 1:9' },
  { texto: 'Lança o teu cuidado sobre o Senhor, e ele te susterá.', ref: 'Salmos 55:22' },
  { texto: 'Porque para Deus nada é impossível.', ref: 'Lucas 1:37' },
  { texto: 'O coração do homem traça o seu caminho, mas o Senhor lhe dirige os passos.', ref: 'Provérbios 16:9' },
  { texto: 'Buscai primeiro o reino de Deus, e tudo o mais vos será acrescentado.', ref: 'Mateus 6:33' },
  { texto: 'Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.', ref: 'Provérbios 3:5' },
  { texto: 'A alegria do Senhor é a vossa força.', ref: 'Neemias 8:10' },
  { texto: 'Tudo tem o seu tempo determinado debaixo do céu.', ref: 'Eclesiastes 3:1' },
  { texto: 'O temor do Senhor é o princípio da sabedoria.', ref: 'Provérbios 9:10' },
  { texto: 'Não andeis ansiosos por coisa alguma.', ref: 'Filipenses 4:6' },
  { texto: 'Aquele que começou a boa obra em vós há de completá-la.', ref: 'Filipenses 1:6' },
  { texto: 'Os que esperam no Senhor renovam as suas forças.', ref: 'Isaías 40:31' },
  { texto: 'O Senhor pelejará por vós, e vós vos calareis.', ref: 'Êxodo 14:14' },
  { texto: 'Em tudo dai graças, porque esta é a vontade de Deus.', ref: '1 Tessalonicenses 5:18' },
  { texto: 'Bem-aventurados os que têm fome e sede de justiça, porque serão fartos.', ref: 'Mateus 5:6' },
  { texto: 'Deleita-te no Senhor, e ele satisfará os desejos do teu coração.', ref: 'Salmos 37:4' },
  { texto: 'O nome do Senhor é torre forte; o justo corre para ela e está seguro.', ref: 'Provérbios 18:10' },
]

export function versiculoAleatorio(): Versiculo {
  return VERSICULOS[Math.floor(Math.random() * VERSICULOS.length)]
}
