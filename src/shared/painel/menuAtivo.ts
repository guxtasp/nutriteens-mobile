// src/shared/painel/menuAtivo.ts
// Decide qual item do menu lateral fica marcado. Telas compartilhadas (detalhe, edição,
// prévia) podem ser abertas a partir de listas diferentes; o parâmetro `origem` guarda a
// rota da lista de onde o usuário veio, para o menu não marcar o item errado.
type ItemMenuMinimo = { rota: string; rotasFilhas?: string[] };

export function rotaMenuAtiva(config: { itens: ItemMenuMinimo[] }, nomeRota: string, origem?: unknown): string | null {
  if (typeof origem === 'string' && config.itens.some((i) => i.rota === origem)) return origem;
  const item = config.itens.find((i) => i.rota === nomeRota || !!i.rotasFilhas?.includes(nomeRota));
  return item ? item.rota : null;
}
