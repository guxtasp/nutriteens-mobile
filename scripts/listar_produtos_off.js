// listar_produtos_off.js — lista produtos BRASILEIROS com dados completos na Open Food Facts.
// Uso: node listar_produtos_off.js        (Node 18+)
// "Completo" = tem nome, marca, NOVA (1 a 4), ingredientes, açúcar, sal e gordura saturada por 100 g,
// e o código de barras tem dígito verificador válido. Os filtros são feitos aqui, não na API.
const fs = require('fs');

const CATEGORIAS = [
  'sodas', 'salty-snacks', 'biscuits', 'sausages', 'chocolates',
  'instant-chocolate-powders', 'breads', 'rices', 'milks', 'yogurts',
];
const POR_CATEGORIA = 5;
const CAMPOS = 'code,product_name,product_name_pt,brands,nova_group,nutriments,ingredients_text_pt,ingredients_text';

function checksumOk(c) {
  if (!/^\d+$/.test(c) || ![8, 12, 13, 14].includes(c.length)) return false;
  const d = c.split('').map(Number);
  const v = d.pop();
  const s = d.reverse().reduce((a, x, i) => a + x * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (s % 10)) % 10 === v;
}

const num = (v) => { const x = typeof v === 'string' ? Number(v) : v; return typeof x === 'number' && Number.isFinite(x) ? x : null; };

function completo(p) {
  const n = p.nutriments || {};
  const nome = p.product_name_pt || p.product_name;
  const nova = Number(p.nova_group);
  return !!nome && !!p.brands && nova >= 1 && nova <= 4 && checksumOk(String(p.code))
    && !!(p.ingredients_text_pt || p.ingredients_text)
    && num(n.sugars_100g) !== null && num(n.salt_100g) !== null && num(n['saturated-fat_100g']) !== null;
}

async function buscar(cat) {
  const url = 'https://world.openfoodfacts.org/api/v2/search'
    + `?countries_tags=en:brazil&categories_tags=en:${cat}&sort_by=unique_scans_n&page_size=100&fields=${CAMPOS}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'NutriTeens/1.0 (app educativo)' } });
  if (!res.ok) throw new Error(`${cat}: HTTP ${res.status}`);
  return (await res.json()).products || [];
}

(async () => {
  const saida = [];
  for (const cat of CATEGORIAS) {
    try {
      const itens = (await buscar(cat)).filter(completo).slice(0, POR_CATEGORIA);
      for (const p of itens) {
        const n = p.nutriments;
        saida.push({
          categoria: cat, codigo: String(p.code), nome: p.product_name_pt || p.product_name, marca: String(p.brands).split(',')[0].trim(),
          nova: Number(p.nova_group), acucar_g: num(n.sugars_100g), sal_g: num(n.salt_100g), gordura_sat_g: num(n['saturated-fat_100g']),
        });
      }
      console.log(`${cat}: ${itens.length} completos`);
    } catch (e) {
      console.error(`Falhou em ${cat}:`, e.message);
    }
  }
  console.log('\n| Categoria | Código | Produto | Marca | NOVA | Açúcar | Sal | Gord. sat. |\n|---|---|---|---|---|---|---|---|');
  for (const s of saida) console.log(`| ${s.categoria} | ${s.codigo} | ${s.nome} | ${s.marca} | ${s.nova} | ${s.acucar_g} | ${s.sal_g} | ${s.gordura_sat_g} |`);
  fs.writeFileSync('lista_off_brasil.json', JSON.stringify(saida, null, 2));
  console.log(`\n${saida.length} produtos salvos em lista_off_brasil.json`);
})();
