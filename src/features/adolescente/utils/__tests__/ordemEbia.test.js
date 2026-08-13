// src/features/adolescente/utils/__tests__/ordemEbia.test.js
//
// Teste standalone, sem Jest/framework — o projeto ainda não tem setup de
// testes configurado (sem package.json de testes no zip enviado). Roda
// direto com: node src/features/adolescente/utils/__tests__/ordemEbia.test.js
//
// Reimplementa a mesma lógica de ordemEbia.ts em JS puro (o projeto usa TS
// com paths do Expo/Metro, que não rodam direto em `node` sem um bundler) —
// se/quando o projeto ganhar Jest + ts-jest, dá pra importar o .ts real e
// apagar essa cópia.

const ORDEM_EBIA = [
  'SEGURANCA_ALIMENTAR',
  'INSEGURANCA_LEVE',
  'INSEGURANCA_MODERADA',
  'INSEGURANCA_GRAVE',
];

function valoresEbiaAceitaveis(classificacao) {
  const indice = ORDEM_EBIA.indexOf(classificacao);
  if (indice === -1) return [...ORDEM_EBIA];
  return ORDEM_EBIA.slice(indice);
}

let falhas = 0;
function assertIgual(descricao, recebido, esperado) {
  const ok = JSON.stringify(recebido) === JSON.stringify(esperado);
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${descricao}`);
  if (!ok) {
    falhas++;
    console.log(`     esperado: ${JSON.stringify(esperado)}`);
    console.log(`     recebido: ${JSON.stringify(recebido)}`);
  }
}

// Adolescente sem insegurança: vê todos os níveis (nada é "restrito demais" pra ele)
assertIgual(
  'SEGURANCA_ALIMENTAR aceita os 4 níveis',
  valoresEbiaAceitaveis('SEGURANCA_ALIMENTAR'),
  ['SEGURANCA_ALIMENTAR', 'INSEGURANCA_LEVE', 'INSEGURANCA_MODERADA', 'INSEGURANCA_GRAVE']
);

// Este é o caso que provaria o bug antigo: com `.gte()` alfabético, LEVE
// (que vem antes de MODERADA no alfabeto) ficaria de fora incorretamente
// dependendo da comparação. Com a lista explícita, o resultado é sempre
// os 3 níveis de MODERADA pra cima em severidade.
assertIgual(
  'INSEGURANCA_MODERADA aceita MODERADA e GRAVE (não LEVE, não SEGURANCA)',
  valoresEbiaAceitaveis('INSEGURANCA_MODERADA'),
  ['INSEGURANCA_MODERADA', 'INSEGURANCA_GRAVE']
);

assertIgual(
  'INSEGURANCA_LEVE aceita LEVE, MODERADA e GRAVE (não SEGURANCA)',
  valoresEbiaAceitaveis('INSEGURANCA_LEVE'),
  ['INSEGURANCA_LEVE', 'INSEGURANCA_MODERADA', 'INSEGURANCA_GRAVE']
);

// Caso mais severo: só vê alimentos cadastrados pra GRAVE mesmo
assertIgual(
  'INSEGURANCA_GRAVE aceita só GRAVE',
  valoresEbiaAceitaveis('INSEGURANCA_GRAVE'),
  ['INSEGURANCA_GRAVE']
);

// Demonstra concretamente por que `.gte()` alfabético seria diferente do
// resultado certo pra este caso específico:
const alfabetica = [...ORDEM_EBIA].sort(); // como o Postgres ordenaria `text` puro
assertIgual(
  'ordem alfabética (o que .gte em texto usaria) é DIFERENTE da ordem de severidade',
  alfabetica,
  ['INSEGURANCA_GRAVE', 'INSEGURANCA_LEVE', 'INSEGURANCA_MODERADA', 'SEGURANCA_ALIMENTAR']
);
console.log(
  '     (isso prova o risco: se a coluna nivel_maximo_ebia for `text` em vez de enum,\n' +
  '     um filtro por comparação de intervalo (.gte/.lte) usaria esta ordem errada —\n' +
  '     por isso o código passou a usar .in() com lista explícita, que não depende disso)'
);

if (falhas > 0) {
  console.log(`\n${falhas} teste(s) falharam.`);
  process.exit(1);
} else {
  console.log('\nTodos os testes passaram.');
}
