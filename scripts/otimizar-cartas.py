"""
Otimiza a arte das cartas dos 10 Passos para o app.

Entrada : assets-fonte/cartas/*.png   (arte original, qualquer tamanho; NÃO vai no bundle)
Saída   : assets/img/cartas/<codigo>.webp        (cheia, 720 px de largura  -> modal)
          assets/img/cartas/<codigo>_mini.webp   (miniatura, 360 px         -> álbum)

O que faz:
  1. corta no contorno real da carta e zera o que estiver fora dele (inclui o véu
     semitransparente que a arte da carta 3 tinha no fundo);
  2. normaliza a proporção, redimensiona e converte para WebP com transparência.

Uso:  python scripts/otimizar-cartas.py        (precisa de Pillow: pip install pillow)

Se a proporção mudar, atualize PROPORCAO_CARTA em
src/features/adolescente/cartas/data/cartasArte.ts (o script imprime o valor).
"""
from pathlib import Path
from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parent.parent
ORIGENS = RAIZ / "assets-fonte" / "cartas"
DESTINO = RAIZ / "assets" / "img" / "cartas"
LARGURA_CHEIA = 720
LARGURA_MINI = 360
ALFA_CARTA = 200  # alfa a partir do qual o pixel é "carta" (e não margem/véu)


def limpar_e_cortar(im: Image.Image) -> Image.Image:
    """Corta no contorno real da carta e zera tudo que estiver fora dele."""
    alfa = im.getchannel("A")
    caixa = alfa.point(lambda v: 255 if v >= ALFA_CARTA else 0).getbbox()
    im = im.crop(caixa)

    # região "fora da carta" = pixels de alfa baixo ligados aos cantos (que são arredondados)
    baixo = im.getchannel("A").point(lambda v: 255 if v < ALFA_CARTA else 0)
    w, h = baixo.size
    for canto in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        if baixo.getpixel(canto) == 255:
            ImageDraw.floodfill(baixo, canto, 128)
    fora = baixo.point(lambda v: 255 if v == 128 else 0)
    alfa_final = im.getchannel("A")
    alfa_final.paste(0, mask=fora)
    im.putalpha(alfa_final)
    return im


def main() -> None:
    arquivos = sorted(ORIGENS.glob("*.png"))
    if not arquivos:
        raise SystemExit(f"Nenhum PNG em {ORIGENS}")

    cortadas = {a: limpar_e_cortar(Image.open(a).convert("RGBA")) for a in arquivos}

    # As artes originais têm tamanhos de carta levemente diferentes (proporção 0,67-0,70).
    # Normaliza todas para a mediana, assim o álbum fica alinhado (distorção < 3%).
    razoes = sorted(c.width / c.height for c in cortadas.values())
    proporcao = razoes[len(razoes) // 2]
    print(f"proporção largura/altura = {proporcao:.4f}   (use em PROPORCAO_CARTA)")

    DESTINO.mkdir(parents=True, exist_ok=True)
    for arq, im in cortadas.items():
        for sufixo, larg, qualidade in (("", LARGURA_CHEIA, 84), ("_mini", LARGURA_MINI, 80)):
            alt = round(larg / proporcao)
            saida = DESTINO / f"{arq.stem}{sufixo}.webp"
            im.resize((larg, alt), Image.LANCZOS).save(saida, "WEBP", quality=qualidade, method=6)
            print(f"{saida.name}: {larg}x{alt}  {saida.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
