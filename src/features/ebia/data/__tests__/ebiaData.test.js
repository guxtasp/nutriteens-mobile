// src/features/ebia/data/__tests__/ebiaData.test.js
//
// Testa ebiaData.ts real (compilado na hora com tsc). Rodar:
//   node src/features/ebia/data/__tests__/ebiaData.test.js

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const ARQUIVO_FONTE = path.resolve(__dirname, '../ebiaData.ts');
const DIR_SAIDA = fs.mkdtempSync(path.join(os.tmpdir(), 'ebia-data-'));

execSync(
  `npx tsc --outDir "${DIR_SAIDA}" --target es2019 --module commonjs --esModuleInterop --skipLibCheck "${ARQUIVO_FONTE}"`,
  { stdio: 'inherit' }
);

const { classificarEbia, calcularPontuacaoEbia, PERGUNTAS_EBIA } = require(path.join(DIR_SAIDA, 'ebiaData.js'));

let falhas = 0;
function checar(descricao, condicao) {
  console.log(`${condicao ? 'OK  ' : 'FAIL'} ${descricao}`);
  if (!condicao) falhas++;
}

// --- calcularPontuacaoEbia: conta só os "sim" (true) ---
checar('0 respostas sim → pontuação 0', calcularPontuacaoEbia([false, false, false, false, false]) === 0);
checar('5 respostas sim → pontuação 5', calcularPontuacaoEbia([true, true, true, true, true]) === 5);
checar('mistura → conta só os true', calcularPontuacaoEbia([true, false, true, false, false]) === 2);
checar('array vazio → pontuação 0 (não quebra)', calcularPontuacaoEbia([]) === 0);

// --- classificarEbia: limiares exatos (os "\u003c=" no código tornam a borda fácil de errar) ---
checar('pontuação 0 → SEGURANCA_ALIMENTAR', classificarEbia(0) === 'SEGURANCA_ALIMENTAR');
checar('pontuação 1 → INSEGURANCA_LEVE', classificarEbia(1) === 'INSEGURANCA_LEVE');
checar('pontuação 2 (borda superior de LEVE) → INSEGURANCA_LEVE', classificarEbia(2) === 'INSEGURANCA_LEVE');
checar('pontuação 3 (borda inferior de MODERADA) → INSEGURANCA_MODERADA', classificarEbia(3) === 'INSEGURANCA_MODERADA');
checar('pontuação 4 (borda superior de MODERADA) → INSEGURANCA_MODERADA', classificarEbia(4) === 'INSEGURANCA_MODERADA');
checar('pontuação 5 (máximo do instrumento) → INSEGURANCA_GRAVE', classificarEbia(5) === 'INSEGURANCA_GRAVE');

// --- Consistência entre as duas funções: nenhuma combinação real de respostas
//     deveria produzir uma pontuação fora do range 0-5 (o instrumento tem
//     5 perguntas — se alguém adicionar uma pergunta sem atualizar o range
//     de classificarEbia, este teste denuncia) ---
checar('PERGUNTAS_EBIA tem exatamente 5 perguntas (base do range 0-5 usado em classificarEbia)', PERGUNTAS_EBIA.length === 5);

for (let i = 0; i <= 5; i++) {
  const respostas = Array(5).fill(false).map((_, idx) => idx < i);
  const pontuacao = calcularPontuacaoEbia(respostas);
  const classificacao = classificarEbia(pontuacao);
  checar(`pontuação ${pontuacao} (${i} sim) sempre retorna uma classificação válida`, [
    'SEGURANCA_ALIMENTAR', 'INSEGURANCA_LEVE', 'INSEGURANCA_MODERADA', 'INSEGURANCA_GRAVE',
  ].includes(classificacao));
}

if (falhas > 0) {
  console.log(`\n${falhas} teste(s) falharam.`);
  process.exit(1);
} else {
  console.log('\nTodos os testes passaram.');
}
