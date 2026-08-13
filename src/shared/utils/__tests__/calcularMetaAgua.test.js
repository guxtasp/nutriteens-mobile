// src/shared/utils/__tests__/calcularMetaAgua.test.js
//
// Testa calcularMetaAgua.ts real (compilado na hora com tsc). Rodar:
//   node src/shared/utils/__tests__/calcularMetaAgua.test.js

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const ARQUIVO_FONTE = path.resolve(__dirname, '../calcularMetaAgua.ts');
const DIR_SAIDA = fs.mkdtempSync(path.join(os.tmpdir(), 'meta-agua-'));

execSync(
  `npx tsc --outDir "${DIR_SAIDA}" --target es2019 --module commonjs --esModuleInterop --skipLibCheck "${ARQUIVO_FONTE}"`,
  { stdio: 'inherit' }
);

const { calcularMetaAguaMl } = require(path.join(DIR_SAIDA, 'calcularMetaAgua.js'));

let falhas = 0;
function checar(descricao, condicao) {
  console.log(`${condicao ? 'OK  ' : 'FAIL'} ${descricao}`);
  if (!condicao) falhas++;
}

// --- Caso central (dentro da faixa, sem clamp) ---
checar('70kg → 2800ml (70 × 40, bate com a referência do IOM pra 14-18a)', calcularMetaAguaMl(70) === 2800);
checar('50kg → 2000ml', calcularMetaAguaMl(50) === 2000);

// --- Clamp mínimo: peso baixo não deve gerar meta abaixo de 1500ml ---
checar('20kg (20×40=800, abaixo do mínimo) → clampa em 1500ml', calcularMetaAguaMl(20) === 1500);
checar('37.5kg (exatamente no limiar, 37.5×40=1500) → 1500ml', calcularMetaAguaMl(37.5) === 1500);

// --- Clamp máximo: peso alto não deve gerar meta acima de 3500ml ---
checar('120kg (120×40=4800, acima do máximo) → clampa em 3500ml', calcularMetaAguaMl(120) === 3500);
checar('87.5kg (exatamente no limiar, 87.5×40=3500) → 3500ml', calcularMetaAguaMl(87.5) === 3500);

// --- Robustez a erro de digitação (peso 0 ou negativo não deve gerar meta 0/negativa) ---
checar('peso 0 (erro de digitação) → clampa em 1500ml, nunca 0', calcularMetaAguaMl(0) === 1500);
checar('peso negativo (erro de digitação) → clampa em 1500ml, nunca negativo', calcularMetaAguaMl(-10) === 1500);

// --- Sempre retorna inteiro (Math.round) ---
checar('resultado é sempre um número inteiro', Number.isInteger(calcularMetaAguaMl(55.3)));

if (falhas > 0) {
  console.log(`\n${falhas} teste(s) falharam.`);
  process.exit(1);
} else {
  console.log('\nTodos os testes passaram.');
}
