// Popula a estrutura inicial da trilha.
// Requer uma chave service role e o ID de um perfil administrador, pois
// trilhas.criado_por é obrigatório no banco.
require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH || '.env.seed' });

const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const criadoPor = process.env.TRILHA_CRIADO_POR;
const tema = process.env.TRILHA_TEMA;

if (!url || !serviceRoleKey || !criadoPor || !tema) {
  throw new Error(
    'Defina SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TRILHA_CRIADO_POR e TRILHA_TEMA no arquivo .env.seed.'
  );
}

const supabase = createClient(url, serviceRoleKey);

async function seed() {
  const { data: existente, error: erroBusca } = await supabase
    .from('trilhas')
    .select('id')
    .eq('ordem', 1)
    .maybeSingle();
  if (erroBusca) throw erroBusca;

  const idDaTrilha = existente?.id ?? (await criarTrilha());
  const modulos = [
    { trilha_id: idDaTrilha, titulo: 'A1 Abertura', ordem: 1 },
    { trilha_id: idDaTrilha, titulo: 'A2 Aprofundamento', ordem: 2 },
    { trilha_id: idDaTrilha, titulo: 'A3 Consolidação', ordem: 3 },
  ];

  for (const modulo of modulos) {
    const { data: jaExiste, error: erroModulo } = await supabase
      .from('modulos_trilha')
      .select('id')
      .eq('trilha_id', idDaTrilha)
      .eq('ordem', modulo.ordem)
      .maybeSingle();
    if (erroModulo) throw erroModulo;

    if (!jaExiste) {
      const { error: erroCriarModulo } = await supabase.from('modulos_trilha').insert(modulo);
      if (erroCriarModulo) throw erroCriarModulo;
    }
  }

  console.log(`Trilha inicial pronta: ${idDaTrilha}.`);
}

async function criarTrilha() {
  const { data, error } = await supabase
    .from('trilhas')
    .insert({
      titulo: 'Trilhas de Aprendizado',
      tema,
      ordem: 1,
      status: 'aprovada',
      criado_por: criadoPor,
      aprovado_por: criadoPor,
      aprovado_em: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

seed().catch((erro) => {
  console.error('Não foi possível criar a trilha inicial:', erro.message);
  process.exit(1);
});
