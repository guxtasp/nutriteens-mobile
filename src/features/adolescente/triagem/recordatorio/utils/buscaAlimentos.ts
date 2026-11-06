// src/features/adolescente/triagem/recordatorio/utils/buscaAlimentos.ts
//
// Busca por nome no recordatório alimentar. Regra pura (sem React):
// ignora acento e maiúsculas, e cada palavra digitada precisa aparecer no nome
// ("arroz int" encontra "Arroz integral"; "feijao" encontra "Feijão").

export function normalizarBusca(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function filtrarAlimentosPorBusca<T extends { nome: string }>(alimentos: T[], termo: string): T[] {
  const palavras = normalizarBusca(termo).split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return alimentos;
  return alimentos.filter((a) => {
    const nome = normalizarBusca(a.nome);
    return palavras.every((p) => nome.includes(p));
  });
}
