// src/features/adolescente/utils/__tests__/regraFeedbackRefeicao.test.js
//
// Testa o arquivo .ts REAL (não uma reimplementação) — compila
// regraFeedbackRefeicao.ts com o `tsc` na hora de rodar e importa o
// resultado. Assim, se alguém mudar a regra de negócio no .ts, o teste
// pega a mudança de verdade, em vez de validar uma cópia desatualizada.
//
// Como rodar (da raiz do projeto):
//   node src/features/adolescente/utils/__tests__/regraFeedbackRefeicao.test.js
//
// Pré-requisito: `npx tsc` disponível (typescript instalado, mesmo que só
// como devDependency do projeto — não precisa de nada além disso, o
// arquivo testado não importa Supabase nem React Native).

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const ARQUIVO_FONTE = path.resolve(__dirname, '../regraFeedbackRefeicao.ts');
const DIR_SAIDA = fs.mkdtempSync(path.join(os.tmpdir(), 'regra-feedback-'));

execSync(
  `npx tsc --outDir "${DIR_SAIDA}" --target es2019 --module commonjs --esModuleInterop --skipLibCheck "${ARQUIVO_FONTE}"`,
  { stdio: 'inherit' }
);

const { gerarFeedbackRefeicao } = require(path.join(DIR_SAIDA, 'regraFeedbackRefeicao.js'));

let falhas = 0;
function checar(descricao, condicao) {
  console.log(`${condicao ? 'OK  ' : 'FAIL'} ${descricao}`);
  if (!condicao) falhas++;
}

function item(classificacaoNova, ...gruposAlimentares) {
  return { classificacaoNova, gruposAlimentares };
}

// --- Trilha de processamento (NOVA) ---

{
  const r = gerarFeedbackRefeicao({
    itens: [item('IN_NATURA', 'frutas'), item('IN_NATURA', 'legumes'), item('INGREDIENTE_CULINARIO', 'graos')],
    classificacaoEbia: 'SEGURANCA_ALIMENTAR',
    lacunaNutrienteSemana: null,
  });
  checar('100% natural → nivelQualidade EXCELENTE', r.nivelQualidade === 'EXCELENTE');
  checar('100% natural → intensidade máxima (1)', r.intensidade === 1);
  checar('100% natural → dimensaoPrincipal NOVA_POSITIVO', r.dimensaoPrincipal === 'NOVA_POSITIVO');
}

{
  const r = gerarFeedbackRefeicao({
    itens: [item('ULTRAPROCESSADO', 'a'), item('ULTRAPROCESSADO', 'b'), item('IN_NATURA', 'c')],
    classificacaoEbia: 'SEGURANCA_ALIMENTAR',
    lacunaNutrienteSemana: null,
  });
  checar('2/3 ultraprocessado → nivelQualidade ATENCAO_ULTRAPROCESSADO', r.nivelQualidade === 'ATENCAO_ULTRAPROCESSADO');
  checar('2/3 ultraprocessado → dimensaoPrincipal NOVA_ATENCAO', r.dimensaoPrincipal === 'NOVA_ATENCAO');
}

{
  // precisa de proporcaoUltra < 0.5 E proporcaoNatural < 0.5 pra cair em
  // EQUILIBRADO — 1 ultra em 3 itens (33%) e 0 naturais garante isso.
  // (1 PROCESSADO + 1 IN_NATURA cairia em EXCELENTE, não EQUILIBRADO:
  // proporcaoNatural bateria exatamente 50%, que já satisfaz o `>= 0.5`
  // de EXCELENTE — bom lembrete de que o corte é por proporção, não por
  // "teve pelo menos um de cada".)
  const r = gerarFeedbackRefeicao({
    itens: [item('ULTRAPROCESSADO', 'a'), item('PROCESSADO', 'b'), item('PROCESSADO', 'c')],
    classificacaoEbia: 'SEGURANCA_ALIMENTAR',
    lacunaNutrienteSemana: null,
  });
  checar('1/3 ultra, 0 natural → nivelQualidade EQUILIBRADO', r.nivelQualidade === 'EQUILIBRADO');
}

{
  // documenta o comportamento real do corte de 50%: com só 2 itens, 1
  // PROCESSADO + 1 IN_NATURA já bate os 50% de proporcaoNatural e cai em
  // EXCELENTE — não é bug, é como o corte foi definido, mas vale deixar
  // registrado pra não virar surpresa se alguém for calibrar os limiares.
  const r = gerarFeedbackRefeicao({
    itens: [item('PROCESSADO', 'a'), item('IN_NATURA', 'b')],
    classificacaoEbia: 'SEGURANCA_ALIMENTAR',
    lacunaNutrienteSemana: null,
  });
  checar('50% natural (mesmo com o outro item só PROCESSADO) já é EXCELENTE pelo corte atual', r.nivelQualidade === 'EXCELENTE');
}

// --- EBIA calibra só o TOM da trilha de processamento, nunca vira bloco visível ---

{
  const base = {
    itens: [item('ULTRAPROCESSADO', 'a'), item('ULTRAPROCESSADO', 'b')],
    lacunaNutrienteSemana: null,
  };
  const semCobranca = gerarFeedbackRefeicao({ ...base, classificacaoEbia: 'INSEGURANCA_GRAVE' });
  const comCobranca = gerarFeedbackRefeicao({ ...base, classificacaoEbia: 'SEGURANCA_ALIMENTAR' });

  checar(
    'INSEGURANCA_GRAVE evita tom de cobrança no texto de processamento',
    semCobranca.processamento !== comCobranca.processamento
  );
  checar(
    'EBIA nunca aparece como campo separado no retorno (não existe classificacaoEbia no output)',
    !('classificacaoEbia' in semCobranca)
  );
  checar(
    'nivelQualidade é igual independente do EBIA (EBIA não muda a nota, só o tom)',
    semCobranca.nivelQualidade === comCobranca.nivelQualidade
  );
}

// --- Trilha de missão (lacuna de nutriente) ---

{
  const r = gerarFeedbackRefeicao({
    itens: [item('IN_NATURA', 'frutas')],
    classificacaoEbia: 'SEGURANCA_ALIMENTAR',
    lacunaNutrienteSemana: null,
  });
  checar('sem lacuna detectada → missao é null (não aparece bloco "tudo certo")', r.missao === null);
}

{
  const r = gerarFeedbackRefeicao({
    itens: [item('IN_NATURA', 'frutas')],
    classificacaoEbia: 'SEGURANCA_ALIMENTAR',
    lacunaNutrienteSemana: { nutriente: 'ferro', rotulo: 'ferro', sugestao: 'feijão' },
  });
  checar('com lacuna → missao preenchida', r.missao !== null);
  checar('texto da missão nunca usa linguagem de cobrança ("falta")', !r.missao.texto.toLowerCase().includes('falta de'));
  checar('missao carrega o nutriente certo', r.missao.nutriente === 'ferro');
}

// --- Caso de borda: refeição sem itens (não deve quebrar nem mentir sobre qualidade) ---

{
  const r = gerarFeedbackRefeicao({
    itens: [],
    classificacaoEbia: 'SEGURANCA_ALIMENTAR',
    lacunaNutrienteSemana: null,
  });
  checar('0 itens → não lança erro e não trava em NaN', Number.isFinite(r.intensidade));
  checar('0 itens → dimensaoPrincipal NEUTRO (não inventa avaliação sem dado)', r.dimensaoPrincipal === 'NEUTRO');
}

// --- Diversidade de grupos alimentares (dimensão nutricional) ---

{
  const r1 = gerarFeedbackRefeicao({
    itens: [item('IN_NATURA', 'frutas'), item('IN_NATURA', 'frutas')], // mesmo grupo repetido
    classificacaoEbia: 'SEGURANCA_ALIMENTAR',
    lacunaNutrienteSemana: null,
  });
  const r2 = gerarFeedbackRefeicao({
    itens: [item('IN_NATURA', 'frutas'), item('IN_NATURA', 'legumes'), item('IN_NATURA', 'graos')],
    classificacaoEbia: 'SEGURANCA_ALIMENTAR',
    lacunaNutrienteSemana: null,
  });
  checar('grupos repetidos não inflam a contagem de variedade', r1.nutricional !== r2.nutricional);
}

if (falhas > 0) {
  console.log(`\n${falhas} teste(s) falharam.`);
  process.exit(1);
} else {
  console.log('\nTodos os testes passaram.');
}
