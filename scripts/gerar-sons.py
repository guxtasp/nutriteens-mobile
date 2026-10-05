#!/usr/bin/env python3
"""
Gera os efeitos sonoros do NutriTeens em assets/sounds/*.wav.

Uso (na raiz do projeto):  python scripts/gerar-sons.py
Só usa a biblioteca padrão do Python (sem numpy, sem pip).

Os sons são sintetizados (sinos, bolhas, "plim"). Pra trocar por sons de
verdade, é só substituir o arquivo com o MESMO nome em assets/sounds/.
"""
import math
import os
import struct
import wave

SR = 44100  # taxa de amostragem
PASTA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "sounds")

# frequências (Hz) das notas usadas
C4, D4, E4, G4 = 261.63, 293.66, 329.63, 392.00
C5, D5, E5, G5 = 523.25, 587.33, 659.25, 783.99
A5, B5, C6, E6, G6 = 880.00, 987.77, 1046.50, 1318.51, 1567.98
G3, D3 = 196.00, 146.83

SINO = ((1, 1.0), (2, 0.38), (3, 0.16), (4, 0.06))   # timbre brilhante de sino
SUAVE = ((1, 1.0), (2, 0.18))                         # timbre macio
OCO = ((1, 1.0), (3, 0.11), (5, 0.04))                # timbre "oco" (erro, sem aspereza)


def nota(freq, dur, vol=0.5, harm=SINO, ataque=0.004, queda=5.0):
    """Uma nota com ataque rápido e decaimento exponencial."""
    n = int(SR * dur)
    soma = sum(a for _, a in harm)
    out = []
    for i in range(n):
        t = i / SR
        env = min(1.0, t / ataque) * math.exp(-queda * t / dur)
        fim = min(1.0, (dur - t) / 0.012)  # some nos últimos 12 ms (evita estalo)
        s = sum(a * math.sin(2 * math.pi * freq * h * t) for h, a in harm) / soma
        out.append(vol * env * fim * s)
    return out


def sweep(f0, f1, dur, vol=0.5, queda=6.0, ataque=0.003):
    """Tom que desliza de f0 a f1 (bolhas, gotas, 'pop', virar carta)."""
    n = int(SR * dur)
    fase = 0.0
    out = []
    for i in range(n):
        t = i / SR
        f = f0 * (f1 / f0) ** (t / dur)
        fase += 2 * math.pi * f / SR
        env = min(1.0, t / ataque) * math.exp(-queda * t / dur)
        fim = min(1.0, (dur - t) / 0.008)
        out.append(vol * env * fim * math.sin(fase))
    return out


def misturar(camadas, pico=0.8):
    """Soma camadas [(atraso_em_segundos, amostras)] e normaliza o volume de pico."""
    total = max(int(SR * atraso) + len(am) for atraso, am in camadas)
    buf = [0.0] * total
    for atraso, am in camadas:
        ini = int(SR * atraso)
        for i, v in enumerate(am):
            buf[ini + i] += v
    maior = max(abs(v) for v in buf) or 1.0
    k = pico / maior
    return [v * k for v in buf]


def salvar(nome, amostras):
    os.makedirs(PASTA, exist_ok=True)
    caminho = os.path.join(PASTA, nome + ".wav")
    with wave.open(caminho, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, v)) * 32767)) for v in amostras))
    print(f"{nome}.wav  {len(amostras) / SR:.2f}s")


# ---------------------------------------------------------------- sons

def toque():
    # "tic" curtinho e macio
    return misturar([(0, sweep(900, 520, 0.07, 0.8, queda=7))], pico=0.55)


def acerto():
    # "ta-da-ding" ascendente, alegre
    return misturar([
        (0.00, nota(C5, 0.22, 0.6, SINO, queda=4)),
        (0.09, nota(E5, 0.22, 0.6, SINO, queda=4)),
        (0.18, nota(G5, 0.45, 0.7, SINO, queda=4.5)),
        (0.18, nota(C6, 0.45, 0.25, SINO, queda=5)),
    ], pico=0.7)


def erro():
    # "bu-bum" grave e arredondado: avisa sem assustar
    return misturar([
        (0.00, nota(G3, 0.20, 0.7, OCO, queda=4.5)),
        (0.13, nota(D3, 0.32, 0.7, OCO, queda=4.0)),
    ], pico=0.65)


def virar():
    # "fup" rápido de carta virando
    return misturar([(0, sweep(420, 980, 0.09, 0.8, queda=5))], pico=0.5)


def par():
    # dois "dings" de par encontrado
    return misturar([
        (0.00, nota(E5, 0.18, 0.6, SINO, queda=4)),
        (0.10, nota(B5, 0.34, 0.65, SINO, queda=4.5)),
    ], pico=0.7)


def pop():
    # "pop" de bolha (adicionar ao carrinho)
    return misturar([
        (0.00, sweep(300, 900, 0.07, 0.8, queda=5)),
        (0.00, nota(1500, 0.05, 0.12, SUAVE, queda=6)),
    ], pico=0.65)


def gota():
    # "blup" de gota d'água + marolinha
    return misturar([
        (0.00, sweep(1000, 320, 0.16, 0.8, queda=5)),
        (0.09, sweep(1250, 480, 0.12, 0.35, queda=6)),
        (0.17, sweep(1500, 700, 0.09, 0.15, queda=7)),
    ], pico=0.7)


def registro():
    # "plim" caloroso de refeição registrada
    return misturar([
        (0.00, nota(G5, 0.25, 0.55, SUAVE, queda=4)),
        (0.12, nota(C6, 0.55, 0.6, SINO, queda=4.5)),
        (0.12, nota(E6, 0.55, 0.15, SINO, queda=5)),
    ], pico=0.7)


def conquista():
    # lição completa: arpejo alegre
    return misturar([
        (0.00, nota(C5, 0.20, 0.55, SINO, queda=4)),
        (0.10, nota(E5, 0.20, 0.55, SINO, queda=4)),
        (0.20, nota(G5, 0.20, 0.55, SINO, queda=4)),
        (0.30, nota(C6, 0.70, 0.70, SINO, queda=4.5)),
        (0.30, nota(E6, 0.70, 0.22, SINO, queda=5)),
    ], pico=0.8)


def fanfarra():
    # módulo completo / meta de água: arpejo maior com brilho no final
    cam = []
    seq = [C5, E5, G5, C6, E6]
    for i, f in enumerate(seq):
        cam.append((0.10 * i, nota(f, 0.25, 0.5, SINO, queda=4)))
    cam += [
        (0.50, nota(C5, 0.95, 0.35, SINO, queda=3.5)),
        (0.50, nota(G5, 0.95, 0.40, SINO, queda=3.5)),
        (0.50, nota(C6, 0.95, 0.45, SINO, queda=3.5)),
        (0.50, nota(E6, 0.95, 0.30, SINO, queda=4)),
        (0.62, nota(G6, 0.80, 0.18, SINO, queda=5)),
    ]
    return misturar(cam, pico=0.85)


def fanfarra_trilha():
    # trilha completa: duas subidas e acorde final longo
    cam = []
    for i, f in enumerate([C5, E5, G5, C6]):
        cam.append((0.09 * i, nota(f, 0.22, 0.5, SINO, queda=4)))
    for i, f in enumerate([D5, G5, B5, E6]):
        cam.append((0.45 + 0.09 * i, nota(f, 0.22, 0.5, SINO, queda=4)))
    for i, f in enumerate([E5, G5, C6, E6, G6]):
        cam.append((0.90 + 0.08 * i, nota(f, 0.24, 0.5, SINO, queda=4)))
    for f, v in [(C5, 0.35), (G5, 0.40), (C6, 0.45), (E6, 0.32)]:
        cam.append((1.35, nota(f, 1.30, v, SINO, queda=3.2)))
    cam.append((1.45, nota(G6, 1.10, 0.20, SINO, queda=4)))
    return misturar(cam, pico=0.88)


SONS = {
    "toque": toque,
    "acerto": acerto,
    "erro": erro,
    "virar": virar,
    "par": par,
    "pop": pop,
    "gota": gota,
    "registro": registro,
    "conquista": conquista,
    "fanfarra": fanfarra,
    "fanfarraTrilha": fanfarra_trilha,
}

if __name__ == "__main__":
    for nome, fn in SONS.items():
        salvar(nome, fn())
    print(f"\nPronto! Arquivos em: {os.path.normpath(PASTA)}")