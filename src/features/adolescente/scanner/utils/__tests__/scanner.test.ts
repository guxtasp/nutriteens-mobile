import {
  avaliarOpenFoodFacts, confiancaDoCandidato, coberturaDePalavras, normalizarTexto, rankearCandidatos, variantesCodigo,
  categoriaPorTags, checksumGs1Ok, colheresDeAcucar, ingredientesPrincipais, mapearOpenFoodFacts, modoDoResultado, nivelNutriente,
  normalizarCodigo, novaDoOpenFoodFacts, pontosPositivos, resumoDiagnostico, textoAditivos,
} from '../scanner';

describe('código de barras', () => {
  it('aceita os códigos de teste (EAN-13)', () => {
    ['7891000100103', '7894900011517', '7891910000197'].forEach((c) => expect(checksumGs1Ok(c)).toBe(true));
  });
  it('aceita EAN-8', () => {
    expect(checksumGs1Ok('96385074')).toBe(true);
  });
  it('rejeita dígito verificador errado, tamanho estranho e letras', () => {
    expect(checksumGs1Ok('7891000100104')).toBe(false);
    expect(checksumGs1Ok('12345')).toBe(false);
    expect(checksumGs1Ok('78910001001AB')).toBe(false);
  });
  it('normaliza removendo não-dígitos; inválido vira null', () => {
    expect(normalizarCodigo(' 7891000100103\n')).toBe('7891000100103');
    expect(normalizarCodigo('7891000100104')).toBeNull();
    expect(normalizarCodigo('')).toBeNull();
  });
});

describe('Open Food Facts', () => {
  it('mapeia nova_group (número ou texto)', () => {
    expect(novaDoOpenFoodFacts(1)).toBe('IN_NATURA');
    expect(novaDoOpenFoodFacts(2)).toBe('INGREDIENTE_CULINARIO');
    expect(novaDoOpenFoodFacts('3')).toBe('PROCESSADO');
    expect(novaDoOpenFoodFacts(4)).toBe('ULTRAPROCESSADO');
    expect(novaDoOpenFoodFacts(undefined)).toBeNull();
    expect(novaDoOpenFoodFacts(7)).toBeNull();
  });

  it('infere categoria pelas tags, do específico para o geral', () => {
    expect(categoriaPorTags(['en:beverages', 'en:carbonated-drinks', 'en:sodas'])).toBe('REFRIGERANTE_BEBIDA');
    expect(categoriaPorTags(['en:snacks', 'en:sweet-snacks', 'en:biscuits', 'en:chocolate-biscuits'])).toBe('BISCOITO');
    expect(categoriaPorTags(['en:snacks', 'en:salty-snacks', 'en:chips-and-crisps'])).toBe('SALGADINHO');
    expect(categoriaPorTags(['en:meats', 'en:sausages'])).toBe('EMBUTIDO');
    expect(categoriaPorTags(['en:snacks', 'en:sweet-snacks', 'en:confectioneries', 'en:chocolates'])).toBe('DOCE');
    expect(categoriaPorTags(['pt:refrigerantes'])).toBe('REFRIGERANTE_BEBIDA');
    expect(categoriaPorTags(['en:sugars'])).toBeNull();
    expect(categoriaPorTags(undefined)).toBeNull();
  });

  it('mapeia o produto; prefere o nome em português; usa a primeira marca', () => {
    const p = mapearOpenFoodFacts(
      { status: 1, product: { product_name: 'Soda', product_name_pt: 'Refrigerante cola', brands: 'Marca A, Marca B', nova_group: 4, categories_tags: ['en:sodas'] } },
      '7894900011517',
    );
    expect(p?.codigoBarras).toBe('7894900011517');
    expect(p?.nome).toBe('Refrigerante cola');
    expect(p?.marca).toBe('Marca A');
    expect(p?.classificacaoNova).toBe('ULTRAPROCESSADO');
    expect(p?.categoriaTroca).toBe('REFRIGERANTE_BEBIDA');
    expect(p?.fonte).toBe('OPEN_FOOD_FACTS');
  });

  it('extrai os dados do rótulo (sem calorias)', () => {
    const p = mapearOpenFoodFacts(
      { status: 1, product: { product_name: 'Biscoito', nova_group: 4, additives_n: 5, image_front_small_url: 'https://x/y.jpg',
        ingredients_text_pt: 'Ingredientes: Farinha de trigo (com ferro), açúcar, gordura vegetal, sal.',
        nutriments: { sugars_100g: '30.456', salt_100g: 0.9, 'saturated-fat_100g': 7, fiber_100g: 2, proteins_100g: 6, 'energy-kcal_100g': 480 } } },
      '1',
    );
    expect(p?.detalhes).toEqual({
      imagemUrl: 'https://x/y.jpg', acucarG: 30.46, salG: 0.9, gorduraSatG: 7, fibraG: 2, proteinaG: 6, aditivos: 5,
      ingredientes: ['Farinha de trigo (com ferro)', 'Açúcar', 'Gordura vegetal'],
    });
  });

  it('ignora imagem não-https e números inválidos', () => {
    const p = mapearOpenFoodFacts({ status: 1, product: { product_name: 'X', image_front_small_url: 'http://x/y.jpg', nutriments: { sugars_100g: 'abc', salt_100g: -1 } } }, '1');
    expect(p?.detalhes?.imagemUrl).toBeNull();
    expect(p?.detalhes?.acucarG).toBeNull();
    expect(p?.detalhes?.salG).toBeNull();
    expect(p?.detalhes?.ingredientes).toEqual([]);
  });

  it('sem produto, status 0 ou sem nome: null (vira "não encontrado")', () => {
    expect(mapearOpenFoodFacts({ status: 0 }, '1')).toBeNull();
    expect(mapearOpenFoodFacts({ status: 1, product: { nova_group: 4 } }, '1')).toBeNull();
    expect(mapearOpenFoodFacts(null, '1')).toBeNull();
  });
});

describe('modoDoResultado', () => {
  it('ultraprocessado com categoria mostra alternativas', () => {
    expect(modoDoResultado({ classificacaoNova: 'ULTRAPROCESSADO', categoriaTroca: 'DOCE' })).toBe('ALTERNATIVAS');
  });
  it('ultraprocessado sem categoria não inventa troca', () => {
    expect(modoDoResultado({ classificacaoNova: 'ULTRAPROCESSADO', categoriaTroca: null })).toBe('SEM_CATEGORIA');
  });
  it('não ultraprocessado: mensagem positiva, mesmo que tenha categoria', () => {
    expect(modoDoResultado({ classificacaoNova: 'IN_NATURA', categoriaTroca: null })).toBe('POSITIVO');
    expect(modoDoResultado({ classificacaoNova: 'PROCESSADO', categoriaTroca: 'DOCE' })).toBe('POSITIVO');
  });
  it('sem classificação: sem conclusão', () => {
    expect(modoDoResultado({ classificacaoNova: null, categoriaTroca: 'DOCE' })).toBe('SEM_CLASSIFICACAO');
  });
});

describe('diagnóstico visual', () => {
  it('níveis por 100 g', () => {
    expect(nivelNutriente('ACUCAR', 3)).toBe('POUCO');
    expect(nivelNutriente('ACUCAR', 10)).toBe('MEDIO');
    expect(nivelNutriente('ACUCAR', 30)).toBe('BASTANTE');
    expect(nivelNutriente('SAL', 1.6)).toBe('BASTANTE');
    expect(nivelNutriente('GORDURA_SAT', 1.5)).toBe('POUCO');
    expect(nivelNutriente('SAL', null)).toBeNull();
    expect(nivelNutriente('SAL', -2)).toBeNull();
  });
  it('colheres de chá de açúcar', () => {
    expect(colheresDeAcucar(10.6)).toBe('cerca de 2,5 colheres de chá');
    expect(colheresDeAcucar(4)).toBe('cerca de 1 colher de chá');
    expect(colheresDeAcucar(0.5)).toBeNull();
    expect(colheresDeAcucar(undefined)).toBeNull();
  });
  it('pontos positivos: fibra e proteína', () => {
    expect(pontosPositivos({ fibraG: 3, proteinaG: 8 })).toEqual(['fonte de fibras', 'fonte de proteína']);
    expect(pontosPositivos({ fibraG: 2, proteinaG: 5 })).toEqual([]);
    expect(pontosPositivos(null)).toEqual([]);
  });
  it('resumo em etiquetas (máx. 4)', () => {
    expect(resumoDiagnostico({ classificacaoNova: 'ULTRAPROCESSADO', detalhes: { acucarG: 30, salG: 2, gorduraSatG: 9, fibraG: 5 } }))
      .toEqual(['Bem industrializado', 'bastante açúcar', 'bastante sal', 'bastante gordura saturada']);
    expect(resumoDiagnostico({ classificacaoNova: 'IN_NATURA', detalhes: { fibraG: 4 } })).toEqual(['Natural ou quase natural', 'fonte de fibras']);
    expect(resumoDiagnostico({ classificacaoNova: null, detalhes: null })).toEqual([]);
  });
  it('aditivos e ingredientes', () => {
    expect(textoAditivos(0)).toBe('Nenhum aditivo na lista de ingredientes');
    expect(textoAditivos(1)).toBe('1 aditivo na lista de ingredientes');
    expect(textoAditivos(4)).toBe('4 aditivos na lista de ingredientes');
    expect(textoAditivos(null)).toBeNull();
    expect(ingredientesPrincipais('a, b (c, d), e, f', 3)).toEqual(['A', 'B (c, d)', 'E']);
    expect(ingredientesPrincipais(undefined)).toEqual([]);
  });
});

describe('variantes de código (GTIN com zeros à esquerda)', () => {
  it('EAN-13 sem zero na frente não tem variante', () => {
    expect(variantesCodigo('7891000100103')).toEqual(['7891000100103']);
  });
  it('UPC-A (12) também é procurado como EAN-13 com 0 na frente', () => {
    expect(variantesCodigo('036000291452')).toEqual(['036000291452', '0036000291452']);
  });
  it('EAN-13 começando com 0 também é procurado como UPC-A', () => {
    expect(variantesCodigo('0036000291452')).toEqual(['0036000291452', '036000291452']);
  });
  it('GTIN-14 com zeros à esquerda cai para EAN-13/UPC-A, preservando o código lido primeiro', () => {
    expect(variantesCodigo('00036000291452')).toEqual(['00036000291452', '0036000291452', '036000291452']);
  });
  it('EAN-8 e códigos inválidos não geram variantes', () => {
    expect(variantesCodigo('96385074')).toEqual(['96385074']);
    expect(variantesCodigo('7891000100104')).toEqual([]);
  });
});

describe('avaliarOpenFoodFacts: inexistente x ficha incompleta', () => {
  it('status 0 ou resposta vazia = inexistente', () => {
    expect(avaliarOpenFoodFacts({ status: 0 }, '1').tipo).toBe('inexistente');
    expect(avaliarOpenFoodFacts(null, '1').tipo).toBe('inexistente');
  });
  it('existe sem nome = sem_nome (e guarda o nível, se vier)', () => {
    expect(avaliarOpenFoodFacts({ status: 1, product: { nova_group: 4 } }, '1')).toEqual({ tipo: 'sem_nome', classificacaoNova: 'ULTRAPROCESSADO' });
  });
  it('existe com nome e sem nova_group = ok com classificação nula', () => {
    const r = avaliarOpenFoodFacts({ status: 1, product: { product_name: 'Bolacha' } }, '1');
    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') expect(r.produto.classificacaoNova).toBeNull();
  });
});

describe('correspondência por nome e marca (só candidatos)', () => {
  it('normaliza acento, caixa e pontuação', () => {
    expect(normalizarTexto('  Açúcar  REFINADO, União! ')).toBe('acucar refinado uniao');
    expect(normalizarTexto(null)).toBe('');
  });
  it('cobertura ignora palavras vazias', () => {
    expect(coberturaDePalavras('suco de uva', 'Suco Uva Integral')).toBe(1);
    expect(coberturaDePalavras('suco de uva', 'Suco de Laranja')).toBeCloseTo(0.5);
    expect(coberturaDePalavras('', 'x')).toBe(0);
  });
  it('marca + nome batendo = PROVAVEL', () => {
    expect(confiancaDoCandidato({ nome: 'Achocolatado em pó', marca: 'Nescau' }, { nome: 'Achocolatado em Pó 400g', marca: 'Nestlé Nescau' })).toBe('PROVAVEL');
  });
  it('sem marca informada nunca passa de POSSIVEL', () => {
    expect(confiancaDoCandidato({ nome: 'Achocolatado em pó' }, { nome: 'Achocolatado em Pó', marca: 'Nescau' })).toBe('POSSIVEL');
  });
  it('marca diferente descarta, mesmo com nome igual', () => {
    expect(confiancaDoCandidato({ nome: 'Achocolatado em pó', marca: 'Toddy' }, { nome: 'Achocolatado em pó', marca: 'Nescau' })).toBe('DESCARTADO');
  });
  it('nome pouco parecido é descartado', () => {
    expect(confiancaDoCandidato({ nome: 'Suco de uva' }, { nome: 'Biscoito recheado', marca: null })).toBe('DESCARTADO');
  });
  it('rankeia (provável antes), remove repetidos e limita', () => {
    const lista = [
      { codigoBarras: '1', nome: 'Achocolatado em pó', marca: null, origem: 'open_food_facts' as const },
      { codigoBarras: '2', nome: 'Achocolatado em pó 400g', marca: 'Nescau', origem: 'proprio' as const },
      { codigoBarras: '2', nome: 'Achocolatado em pó 400g', marca: 'Nescau', origem: 'open_food_facts' as const },
      { codigoBarras: '3', nome: 'Biscoito', marca: null, origem: 'proprio' as const },
    ];
    const r = rankearCandidatos({ nome: 'achocolatado em po', marca: 'nescau' }, lista, 3);
    expect(r.map((c) => c.codigoBarras)).toEqual(['2', '1']);   // 2 (marca bate) vem antes de 1 (sem marca no cadastro)
    expect(r.map((c) => c.confianca)).toEqual(['PROVAVEL', 'POSSIVEL']);
  });
});
