// scripts/seed-taco/seedTaco.ts
//
// Script standalone (NÃO faz parte do bundle do app) pra rodar uma única vez
// e popular `alimento_nutrientes` a partir do dataset local `taco-dataset.json`
// (baixado de github.com/marcelosanto/tabela_taco).
//
// Como rodar:
//   1. npm install @supabase/supabase-js dotenv --save-dev   (se ainda não tiver)
//   2. Criar um .env.seed na raiz com:
//        SUPABASE_URL=https://SEU-PROJETO.supabase.co
//        SUPABASE_SERVICE_ROLE_KEY=chave-service-role   <- NUNCA a anon key, e
//        NUNCA comitar essa chave. Pegue em Supabase > Project Settings > API.
//   3. npx ts-node -r dotenv/config scripts/seed-taco/seedTaco.ts dotenv_config_path=.env.seed
//
// O que ele faz:
//   - Lê os 597 alimentos do dataset local (sem chamada de rede em runtime)
//   - Busca todos os alimentos já cadastrados em `alimentos`
//   - Casa por nome normalizado (sem acento, minúsculo, primeiro termo antes
//     da vírgula) — ex: "Arroz, integral, cozido" (TACO) casa com "Arroz" (seu catálogo)
//   - Faz upsert em `alimento_nutrientes` só pros que casaram
//   - Alimentos que não casaram (nem TACO->catálogo, nem catálogo->TACO)
//     são listados no final pra revisão manual — é esperado que sobre gente
//     dos dois lados, isso não é erro

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Faltam SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type LinhaTaco = {
  id: number;
  description: string;
  category: string;
  calcium_mg: number | string;
  iron_mg: number | string;
  zinc_mg: number | string;
  vitaminC_mg: number | string;
  rae_mcg: number | string;
  re_mcg: number | string;
};

type AlimentoDb = { id: string; nome: string };

// TACO usa "NA" (não analisado), "" (vazio) e "Tr" (traço, quantidade
// residual não mensurável) — todos viram null, exceto Tr que vira 0
// (é uma quantidade real, só que pequena demais pra ter sido medida)
function parseNumero(valor: number | string | undefined): number | null {
  if (typeof valor === 'number') return valor;
  if (valor === 'Tr') return 0;
  if (valor === 'NA' || valor === '' || valor === undefined) return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

function normalizar(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .split(',')[0] // TACO usa "Arroz, integral, cozido" -> pega só "arroz"
    .trim();
}

async function main() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const caminhoDataset = path.join(__dirname, 'taco-dataset.json');
  const tacoData: LinhaTaco[] = JSON.parse(fs.readFileSync(caminhoDataset, 'utf-8'));
  console.log(`Dataset TACO carregado: ${tacoData.length} alimentos.`);

  const { data: alimentosDb, error } = await supabase.from('alimentos').select('id, nome');
  if (error) throw error;
  console.log(`Catálogo atual (alimentos): ${(alimentosDb as AlimentoDb[]).length} itens.`);

  // agrupa a TACO por nome normalizado — pode ter mais de uma linha TACO pro
  // mesmo nome normalizado (ex: "Arroz, integral, cru" e "Arroz, integral, cozido"
  // colapsam pra "arroz"); nesse caso fica a PRIMEIRA ocorrência, e o resto é
  // ignorado — revisar manualmente se a variação (cru/cozido) importar pro app
  const tacoPorNome = new Map<string, LinhaTaco>();
  for (const linha of tacoData) {
    const chave = normalizar(linha.description);
    if (!tacoPorNome.has(chave)) tacoPorNome.set(chave, linha);
  }

  const casados: { alimentoId: string; nomeDb: string; nomeTaco: string }[] = [];
  const semCorrespondencia: string[] = [];

  for (const alimento of alimentosDb as AlimentoDb[]) {
    const chave = normalizar(alimento.nome);
    const linhaTaco = tacoPorNome.get(chave);
    if (linhaTaco) {
      casados.push({ alimentoId: alimento.id, nomeDb: alimento.nome, nomeTaco: linhaTaco.description });
    } else {
      semCorrespondencia.push(alimento.nome);
    }
  }

  console.log(`Casados por nome: ${casados.length} de ${(alimentosDb as AlimentoDb[]).length}.`);

  const linhas = casados.map(({ alimentoId, nomeTaco }) => {
    const linhaTaco = tacoPorNome.get(normalizar(nomeTaco))!;
    return {
      alimento_id: alimentoId,
      calcio_mg: parseNumero(linhaTaco.calcium_mg),
      ferro_mg: parseNumero(linhaTaco.iron_mg),
      zinco_mg: parseNumero(linhaTaco.zinc_mg),
      vitamina_c_mg: parseNumero(linhaTaco.vitaminC_mg),
      // rae_mcg (retinol activity equivalent) é a métrica de vitamina A mais
      // moderna; cai pro re_mcg (retinol equivalent, mais antigo) se a linha
      // não tiver rae_mcg preenchido
      vitamina_a_mcg: parseNumero(linhaTaco.rae_mcg) ?? parseNumero(linhaTaco.re_mcg),
    };
  });

  // upsert em lotes de 200 pra não estourar o payload de uma vez só
  const TAMANHO_LOTE = 200;
  for (let i = 0; i < linhas.length; i += TAMANHO_LOTE) {
    const lote = linhas.slice(i, i + TAMANHO_LOTE);
    const { error: erroUpsert } = await supabase
      .from('alimento_nutrientes')
      .upsert(lote, { onConflict: 'alimento_id' });
    if (erroUpsert) throw erroUpsert;
    console.log(`Upsert ${i + lote.length}/${linhas.length}...`);
  }

  console.log('\nSeed concluído.');
  console.log(`Alimentos do catálogo SEM dado de nutriente (nome não bateu com a TACO): ${semCorrespondencia.length}`);
  if (semCorrespondencia.length > 0) {
    console.log(semCorrespondencia.map((n) => ` - ${n}`).join('\n'));
    console.log('\nRevisar manualmente: podem precisar de nome ajustado no catálogo ou não existirem na TACO.');
  }
}

main().catch((erro) => {
  console.error('Erro ao rodar o seed:', erro);
  process.exit(1);
});