// src/features/adolescente/types/__tests__/statusDia.test.js
//
// Testa statusDia.ts real (compilado na hora com tsc). Rodar:
//   node src/features/adolescente/types/__tests__/statusDia.test.js
//
// Detalhe importante: statusDia.ts tem `require('...png')` no topo do
// arquivo (IMAGENS_STATUS_DIA), pra carregar os assets do Bróxis. Fora do
// bundler do Expo/Metro, `require()` de um `.png` quebra (Node não sabe
// carregar imagem). Como só queremos testar a função `calcularStatusDia`
// (lógica pura, não usa as imagens), registramos um loader fake pra
// extensão `.png` ANTES de importar o módulo compilado — só nesse
// processo de teste, não muda nada no app de verdade.
const Module = require('module');
// Intercepta ANTES da resolução de arquivo (Module._extensions só entra em
// ação depois que o Node já achou o arquivo no disco — e os .png do Bróxis
// não existem nesta pasta de teste, então precisamos parar o require()
// mais cedo, na própria chamada, não na etapa de "como ler o arquivo").
const requireOriginal = Module.prototype.require;
Module.prototype.require = function stubRequire(id) {
  if (typeof id === 'string' && id.endsWith('.png')) {
    return { __stub_png__: true };
  }
  return requireOriginal.apply(this, arguments);
};

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const ARQUIVO_FONTE = path.resolve(__dirname, '../statusDia.ts');
const DIR_SAIDA = fs.mkdtempSync(path.join(os.tmpdir(), 'status-dia-'));

// statusDia.ts usa `require(...)` direto (padrão de imagem do
// Expo/React Native), e esta compilação isolada não tem @types/node —
// sem isso o `tsc` não reconhece o global `require`. Criamos uma cópia
// temporária COM A DECLARAÇÃO AMBIENTE, na MESMA PASTA do arquivo real
// (pra `import { DiaSemanaBase } from '../../../shared/utils/data'`
// continuar resolvendo certo) — apagada no final, não é um arquivo do
// projeto, só existe durante este teste.
const conteudoOriginal = fs.readFileSync(ARQUIVO_FONTE, 'utf-8');
const ARQUIVO_TEMP = path.resolve(__dirname, '../__statusDia.temp-teste.ts');
fs.writeFileSync(ARQUIVO_TEMP, 'declare function require(id: string): any;\n' + conteudoOriginal);

try {
  execSync(
    `npx tsc --outDir "${DIR_SAIDA}" --target es2019 --module commonjs --esModuleInterop --skipLibCheck "${ARQUIVO_TEMP}"`,
    { stdio: 'inherit' }
  );
} finally {
  fs.unlinkSync(ARQUIVO_TEMP);
}

// tsc segue o import de DiaSemanaBase e replica a estrutura de pastas a
// partir da raiz comum (features/adolescente/types/... dentro de DIR_SAIDA)
const { calcularStatusDia } = require(
  path.join(DIR_SAIDA, 'features', 'adolescente', 'types', '__statusDia.temp-teste.js')
);

let falhas = 0;
function checar(descricao, condicao) {
  console.log(`${condicao ? 'OK  ' : 'FAIL'} ${descricao}`);
  if (!condicao) falhas++;
}

const HOJE = '2026-08-13';

// --- Dia no futuro: sempre 'futuro', independente de `mantido` ---
checar(
  "data futura (mantido=false) → 'futuro'",
  calcularStatusDia({ data: '2026-08-14', hojeISO: HOJE, mantido: false }) === 'futuro'
);
checar(
  "data futura (mantido=true) → 'futuro' (mantido não deveria existir ainda pra um dia futuro, mas a função não deve confiar nisso)",
  calcularStatusDia({ data: '2026-08-14', hojeISO: HOJE, mantido: true }) === 'futuro'
);

// --- Hoje: depende de `mantido` ---
checar(
  "data === hoje, mantido=true → 'hoje_mantido'",
  calcularStatusDia({ data: HOJE, hojeISO: HOJE, mantido: true }) === 'hoje_mantido'
);
checar(
  "data === hoje, mantido=false → 'hoje_pendente'",
  calcularStatusDia({ data: HOJE, hojeISO: HOJE, mantido: false }) === 'hoje_pendente'
);

// --- Dia passado: depende de `mantido` ---
checar(
  "data passada, mantido=true → 'mantido'",
  calcularStatusDia({ data: '2026-08-12', hojeISO: HOJE, mantido: true }) === 'mantido'
);
checar(
  "data passada, mantido=false → 'nao_mantido'",
  calcularStatusDia({ data: '2026-08-12', hojeISO: HOJE, mantido: false }) === 'nao_mantido'
);

// --- Comparação de datas é feita como string ISO (YYYY-MM-DD) — testa a
//     virada de mês/ano, que é o caso clássico onde comparação de string
//     pode dar errado se o formato não for sempre zero-padded ---
checar(
  "virada de mês: 2026-07-31 é passado em relação a 2026-08-01",
  calcularStatusDia({ data: '2026-07-31', hojeISO: '2026-08-01', mantido: false }) === 'nao_mantido'
);
checar(
  "virada de ano: 2025-12-31 é passado em relação a 2026-01-01",
  calcularStatusDia({ data: '2025-12-31', hojeISO: '2026-01-01', mantido: false }) === 'nao_mantido'
);
checar(
  "dia 9 (zero-padded '09') não é lido como maior que dia 10 por comparação de string",
  calcularStatusDia({ data: '2026-08-09', hojeISO: '2026-08-10', mantido: false }) === 'nao_mantido'
);

if (falhas > 0) {
  console.log(`\n${falhas} teste(s) falharam.`);
  process.exit(1);
} else {
  console.log('\nTodos os testes passaram.');
}
