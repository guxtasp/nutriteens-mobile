# Gera a PROPOSTA de correção de alimento_nutrientes com mapeamento EXPLÍCITO catálogo -> linha TACO.
# Não acessa o banco. Saídas: proposta_antes_depois.csv e proposta_alimento_nutrientes.sql (revisar antes de rodar).
# Uso: python3 -I gerar_proposta.py alimentos.csv alimento_nutrientes.csv ../seed-taco/taco-dataset.json
import csv, json, sys
ali_csv, nut_csv, taco_json = sys.argv[1:4]
al = {r['nome']: r for r in csv.DictReader(open(ali_csv))}
nu = {r['alimento_id']: r for r in csv.DictReader(open(nut_csv))}
taco = {x['id']: x for x in json.load(open(taco_json))}

# catálogo -> (id TACO, líquido?, confiança). Só casos inequívocos; ambíguos ficam de fora (ver NAO_MAPEADOS).
MAPA = {
  'Feijão': (561, False, 'media'),            # carioca cozido (o seed antigo usava feijão-broto)
  'Arroz': (3, False, 'media'),               # tipo 1 cozido (catálogo não diz integral)
  'Leite': (458, True, 'alta'),               # integral (o seed antigo usava leite condensado)
  'Ovo': (488, False, 'media'),               # inteiro cozido (o seed antigo usava codorna)
  'Ovo cozido': (488, False, 'alta'),
  'Ovo frito/mexido': (490, False, 'media'),  # TACO tem só "frito"
  'Frango': (408, False, 'baixa'),            # peito sem pele cozido; "Frango" é genérico
  'Batata': (91, False, 'alta'),              # inglesa cozida (o seed antigo usava baroa)
  'Batata doce cozida': (88, False, 'alta'),
  'Açaí': (168, False, 'media'),              # polpa congelada, sem xarope
  'Carne bovina': (326, False, 'baixa'),      # acém moído cozido; corte não definido no catálogo
  'Carne suína': (432, False, 'baixa'),       # lombo assado
  'Pão francês': (53, False, 'alta'),
  'Cuscuz': (533, False, 'alta'),
  'Mandioca/aipim': (129, False, 'alta'),     # cozida
  'Abóbora/purê de abóbora': (64, False, 'media'),  # cabotian cozida
  'Brócolis': None,
}
MAPA = {k: v for k, v in MAPA.items() if v}
NAO_MAPEADOS = ['Peixe (espécie indefinida)', 'Macarrão (cozido não existe na TACO)', 'Tapioca', 'Suco natural (fruta indefinida)',
                'Fruta (banana, maçã, mamão...) (genérico)', 'Pratos compostos (usar prato_ingredientes)', 'Hambúrguer/Bolo/Geleia/Chocolate etc. (processados/ultra)']

# RDC 269/2005 (IDR adulto) e RDC 54/2012 (fonte >=15%, alto >=30% por 100 g; líquidos: metade)
IDR = {'vitamina_a': 600, 'vitamina_c': 45, 'calcio': 1000, 'ferro': 14, 'zinco': 7, 'magnesio': 260}
CAMPO = {'vitamina_a': ('rae_mcg', 're_mcg'), 'vitamina_c': ('vitaminC_mg',), 'calcio': ('calcium_mg',),
         'ferro': ('iron_mg',), 'zinco': ('zinc_mg',), 'magnesio': ('magnesium_mg',)}

def valor(x, campos):
    for c in campos:
        v = x.get(c)
        if v in ('Tr',): return 0.0
        if v in (None, '', 'NA', '*'): continue
        try: return float(v)
        except ValueError: continue
    return None   # sem dado = "não sabemos" (NULL), nunca AUSENTE

def nivel(v, idr, liquido):
    if v is None: return None
    f = 0.075 if liquido else 0.15
    pct = v / idr
    return 'ALTO_TEOR' if pct >= 2 * f else 'FONTE' if pct >= f else 'AUSENTE'

linhas, sql = [], []
for nome, (tid, liq, conf) in MAPA.items():
    a = al.get(nome)
    if not a: continue
    x = taco[tid]; atual = nu.get(a['id'])
    novo = {c: nivel(valor(x, CAMPO[c]), IDR[c], liq) for c in IDR}
    for c in IDR:
        antes = atual[c] if atual else '(sem linha)'
        linhas.append([nome, conf, tid, x['description'], c, valor(x, CAMPO[c]), antes, novo[c] or 'null', 'MUDA' if (antes != (novo[c] or 'null')) else ''])
    cols = [c for c in IDR if novo[c] is not None]
    if not cols: continue
    sets = ', '.join(f'{c} = excluded.{c}' for c in cols)
    vals = ', '.join(f"'{novo[c]}'" for c in cols)
    sql.append(f"-- {nome}  <-  TACO #{tid} {x['description']}  (confiança {conf})\n"
               f"insert into public.alimento_nutrientes (alimento_id, fonte, atualizado_em, {', '.join(cols)})\n"
               f"values ('{a['id']}', 'TACO_4ED', now(), {vals})\n"
               f"on conflict (alimento_id) do update set fonte = 'TACO_4ED', atualizado_em = now(), {sets};\n")

with open('proposta_antes_depois.csv', 'w', newline='') as f:
    w = csv.writer(f); w.writerow(['alimento', 'confianca', 'taco_id', 'taco_descricao', 'nutriente', 'valor_por_100g', 'nivel_atual_db', 'nivel_proposto', 'mudanca']); w.writerows(linhas)
with open('proposta_alimento_nutrientes.sql', 'w') as f:
    f.write("-- PROPOSTA — NÃO RODAR SEM REVISÃO. Gerada por gerar_proposta.py (mapeamento explícito catálogo -> TACO).\n"
            "-- Limiares: RDC 269/2005 (IDR adulto) + RDC 54/2012 (fonte >=15%, alto teor >=30% por 100 g; líquidos metade).\n"
            "-- Só colunas com valor na TACO são gravadas (NULL = não sabemos). Rodar primeiro com ROLLBACK, conferir, e só então trocar por COMMIT.\n"
            "-- Não toca: Cenoura, Batata doce, Grão-de-bico, Aveia, linhas INFERIDO_POR_GRUPO e itens fora do mapa.\n"
            "-- Não mapeados (ambíguos): " + '; '.join(NAO_MAPEADOS) + "\n\nbegin;\n\n" + '\n'.join(sql) +
            "\n-- conferência:\nselect a.nome, n.* from public.alimento_nutrientes n join public.alimentos a on a.id = n.alimento_id where n.fonte = 'TACO_4ED' order by a.nome;\n\nrollback;  -- trocar por commit; depois de revisar\n")
print(len(MAPA), 'alimentos mapeados;', sum(1 for l in linhas if l[-1]), 'células mudam')
