// src/features/adolescente/social/components/PlantaJardim.tsx
//
// Planta do Jardim do grupo, desenhada em SVG (sem emoji): 5 plantas x 7 estágios, vaso com carinha.
// O estágio vem de utils/jardim.ts (`estagioDoJardim`). A planta balança de leve, "cresce" com mola quando o
// estágio muda e respeita "reduzir movimento". Sem imagens externas: tudo é forma vetorial, então nunca perde qualidade.
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { TEMAS_JARDIM, nomeDoEstagio, type TemaJardim } from '../utils/jardim';

const CX = 100;
const Y0 = 153; // linha da terra dentro do vaso (viewBox 200 x 220)

const VERDE = '#4F9A2E';
const FOLHA = '#6FBF3F';
const FOLHA_CLARA = '#9BDC66';
const FOLHA_ESC = '#3E8A28';

const VASO: Record<TemaJardim, { corpo: string; borda: string; sombra: string }> = {
  BROCOLIS: { corpo: '#F5B83D', borda: '#FFD36E', sombra: '#D9962B' },
  GIRASSOL: { corpo: '#4AA3F0', borda: '#7BC0FA', sombra: '#2F84D0' },
  TOMATEIRO: { corpo: '#8E6CF5', borda: '#B39BFA', sombra: '#6D4AD6' },
  LARANJEIRA: { corpo: '#2FB6A8', borda: '#62D3C7', sombra: '#1F9488' },
  HORTA: { corpo: '#F2689A', borda: '#FA93B8', sombra: '#D44A7E' },
};

// ───────────────────────── peças básicas ─────────────────────────

function Folha({ x, y, ang, len, cor = FOLHA, veia = FOLHA_CLARA, larg = 0.42 }: {
  x: number; y: number; ang: number; len: number; cor?: string; veia?: string; larg?: number;
}) {
  const d = `M0 0 C ${len * 0.25} ${-len * larg} ${len * 0.78} ${-len * larg * 0.9} ${len} 0 C ${len * 0.78} ${len * larg * 0.9} ${len * 0.25} ${len * larg} 0 0 Z`;
  return (
    <G transform={`translate(${x} ${y}) rotate(${ang})`}>
      <Path d={d} fill={cor} />
      <Path d={`M${len * 0.08} 0 L${len * 0.8} 0`} stroke={veia} strokeWidth={Math.max(1, len * 0.05)} strokeLinecap="round" opacity={0.85} />
    </G>
  );
}

/** Ponto da haste (curva de Bézier) na fração t (0 = terra, 1 = topo). */
function pontoHaste(h: number, curva: number, t: number): { x: number; y: number } {
  const u = 1 - t;
  const x = CX + 3 * curva * u * t * (t - u);
  const y = u * u * u * (Y0 + 2) + 3 * u * u * t * (Y0 - 0.35 * h) + 3 * u * t * t * (Y0 - 0.7 * h) + t * t * t * (Y0 - h);
  return { x, y };
}

function Haste({ h, larg, curva, cor = VERDE }: { h: number; larg: number; curva: number; cor?: string }) {
  if (h <= 0) return null;
  const d = `M${CX} ${Y0 + 2} C ${CX - curva} ${Y0 - h * 0.35} ${CX + curva} ${Y0 - h * 0.7} ${CX} ${Y0 - h}`;
  return <Path d={d} stroke={cor} strokeWidth={larg} strokeLinecap="round" fill="none" />;
}

/** Pares de folhas ao longo da haste (de baixo para cima, as de cima menores). */
function Folhas({ h, curva, pares, tam, cor, veia, tMin = 0.3, tMax = 0.92, sobeBase = 28, larg }: {
  h: number; curva: number; pares: number; tam: number; cor?: string; veia?: string; tMin?: number; tMax?: number; sobeBase?: number; larg?: number;
}) {
  const out: React.ReactElement[] = [];
  for (let i = 0; i < pares; i++) {
    const t = pares === 1 ? tMax : tMin + ((tMax - tMin) * i) / (pares - 1);
    const pd = pontoHaste(h, curva, t);
    const pe = pontoHaste(h, curva, Math.min(1, t + 0.07));
    const len = tam * (1 - i * 0.08);
    const sobe = sobeBase + i * 7;
    out.push(<Folha key={`d${i}`} x={pd.x} y={pd.y} ang={-sobe} len={len} cor={cor} veia={veia} larg={larg} />);
    out.push(<Folha key={`e${i}`} x={pe.x} y={pe.y} ang={180 + sobe} len={len * 0.95} cor={cor} veia={veia} larg={larg} />);
  }
  return <>{out}</>;
}

/** Duas folhinhas redondas no topo: o "brotinho". */
function Cotiledones({ h, curva, cor, veia }: { h: number; curva: number; cor?: string; veia?: string }) {
  const p = pontoHaste(h, curva, 1);
  return (
    <>
      <Folha x={p.x} y={p.y} ang={-28} len={20} larg={0.62} cor={cor} veia={veia} />
      <Folha x={p.x} y={p.y} ang={208} len={20} larg={0.62} cor={cor} veia={veia} />
    </>
  );
}

function Petalas({ cx, cy, n, len, larg, cor, raio, rot = 0 }: {
  cx: number; cy: number; n: number; len: number; larg: number; cor: string; raio: number; rot?: number;
}) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <G key={i} transform={`translate(${cx} ${cy}) rotate(${rot + (360 / n) * i})`}>
          <Ellipse cx={0} cy={-(raio + len * 0.5 - 2)} rx={larg} ry={len * 0.5} fill={cor} />
        </G>
      ))}
    </>
  );
}

function Florzinha({ x, y, r = 1, cor = '#FFD84A', miolo = '#F59E0B' }: { x: number; y: number; r?: number; cor?: string; miolo?: string }) {
  return (
    <>
      <Petalas cx={x} cy={y} n={5} len={8 * r} larg={3.2 * r} cor={cor} raio={2 * r} />
      <Circle cx={x} cy={y} r={2.8 * r} fill={miolo} />
    </>
  );
}

// ───────────────────────── semente (estágio 0, igual para todas) ─────────────────────────

function Semente() {
  return (
    <>
      <Ellipse cx={CX} cy={Y0 - 1} rx={20} ry={7} fill="#7A4E2A" />
      <Ellipse cx={CX - 7} cy={Y0 - 5} rx={8} ry={4} fill="#93633A" opacity={0.85} />
      <G transform={`translate(${CX} ${Y0 - 10}) rotate(-18)`}>
        <Ellipse cx={0} cy={0} rx={7} ry={10} fill="#C99A4B" />
        <Ellipse cx={-2.4} cy={-3} rx={2} ry={3.4} fill="#E6C27A" opacity={0.7} />
        <Path d="M0 -8 Q2.5 0 0 8" stroke="#A67A33" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      </G>
    </>
  );
}

// ───────────────────────── plantas ─────────────────────────

function Brocolis({ s }: { s: number }) {
  const hb = [0, 12, 24, 36, 48, 56, 62][s];
  const larg = [0, 5, 8, 11, 14, 16, 18][s];
  const tam = [0, 18, 28, 34, 38, 42, 44][s];
  const R = [0, 0, 0, 13, 19, 25, 31][s];
  const haste = '#9BCB74';
  const folha = '#3E8E41';
  const folha2 = '#4FA352';
  const veia = '#9BE08F';
  const topo = pontoHaste(hb, 0, 1);
  const cy = topo.y - R * 0.45;

  return (
    <>
      <Haste h={hb} larg={larg} curva={0} cor={haste} />
      {s >= 1 && s <= 2 && <Cotiledones h={hb} curva={0} cor={folha2} veia={veia} />}
      {s >= 2 && (
        <>
          {/* folhas do brócolis: saem da base, abertas para os lados, sem cobrir o caule */}
          <Folha x={CX} y={Y0 - hb * 0.08} ang={-22} len={tam} cor={folha} veia={veia} larg={0.4} />
          <Folha x={CX} y={Y0 - hb * 0.08} ang={202} len={tam} cor={folha} veia={veia} larg={0.4} />
        </>
      )}
      {s >= 3 && (
        <>
          <Folha x={CX} y={Y0 - hb * 0.3} ang={-52} len={tam * 0.9} cor={folha2} veia={veia} larg={0.4} />
          <Folha x={CX} y={Y0 - hb * 0.3} ang={232} len={tam * 0.9} cor={folha2} veia={veia} larg={0.4} />
        </>
      )}
      {s >= 5 && (
        <>
          <Folha x={CX} y={Y0 - hb * 0.5} ang={-74} len={tam * 0.75} cor={folha} veia={veia} larg={0.4} />
          <Folha x={CX} y={Y0 - hb * 0.5} ang={254} len={tam * 0.75} cor={folha} veia={veia} larg={0.4} />
        </>
      )}
      {s >= 3 && (
        <G>
          {/* cabeça: anel de buquês, anel de cima e o topo mais claro, como o brócolis de verdade */}
          {Array.from({ length: 9 }).map((_, k) => {
            const a = (Math.PI * 2 * k) / 9 + 0.2;
            return <Circle key={`o${k}`} cx={topo.x + Math.cos(a) * R * 0.66} cy={cy + Math.sin(a) * R * 0.42} r={R * 0.36} fill="#2B7A3F" />;
          })}
          {Array.from({ length: 6 }).map((_, k) => {
            const a = (Math.PI * 2 * k) / 6 + 0.7;
            return <Circle key={`m${k}`} cx={topo.x + Math.cos(a) * R * 0.38} cy={cy - R * 0.16 + Math.sin(a) * R * 0.26} r={R * 0.37} fill="#379A4F" />;
          })}
          <Circle cx={topo.x} cy={cy - R * 0.3} r={R * 0.4} fill="#46B25E" />
          {[[-0.3, -0.5], [0.12, -0.6], [0.35, -0.25], [-0.55, -0.1], [0.55, 0.05], [-0.1, -0.2], [0.05, 0.2]].map(([dx, dy], k) => (
            <Circle key={`h${k}`} cx={topo.x + dx * R} cy={cy + dy * R * 0.8} r={Math.max(1.2, R * 0.075)} fill="#9BE8A5" opacity={0.9} />
          ))}
        </G>
      )}
    </>
  );
}

function Girassol({ s }: { s: number }) {
  const h = [0, 16, 38, 62, 82, 94, 100][s];
  const larg = [0, 3, 4, 5, 6, 7, 8][s];
  const pares = [0, 0, 2, 3, 4, 4, 4][s];
  const top = pontoHaste(h, 4, 1);
  const flor = (n: number, len: number, lp: number, centro: number) => (
    <>
      <Petalas cx={top.x} cy={top.y} n={n} len={len} larg={lp} cor="#FFB300" raio={centro} rot={180 / n} />
      <Petalas cx={top.x} cy={top.y} n={n} len={len * 0.92} larg={lp * 0.92} cor="#FFD23F" raio={centro} />
      <Circle cx={top.x} cy={top.y} r={centro} fill="#7A4A21" />
      <Circle cx={top.x} cy={top.y} r={centro * 0.62} fill="#5A3516" opacity={0.55} />
      {[[-0.35, -0.2], [0.3, -0.3], [0, 0.1], [-0.2, 0.4], [0.4, 0.3], [0.05, -0.55]].map(([dx, dy], k) => (
        <Circle key={k} cx={top.x + dx * centro} cy={top.y + dy * centro} r={Math.max(1, centro * 0.09)} fill="#C98A3C" />
      ))}
    </>
  );
  return (
    <>
      <Haste h={h} larg={larg} curva={4} />
      {s === 1 && <Cotiledones h={h} curva={4} />}
      {pares > 0 && <Folhas h={h} curva={4} pares={pares} tam={s >= 4 ? 34 : 28} larg={0.5} />}
      {s === 3 && (
        <>
          <Petalas cx={top.x} cy={top.y} n={8} len={16} larg={4} cor="#FFC928" raio={6} />
          <Petalas cx={top.x} cy={top.y} n={8} len={12} larg={4.6} cor={FOLHA} raio={6} rot={22} />
          <Circle cx={top.x} cy={top.y} r={9} fill={FOLHA_ESC} />
        </>
      )}
      {s === 4 && (
        <>
          <Petalas cx={top.x} cy={top.y} n={8} len={12} larg={4.6} cor={FOLHA} raio={8} rot={22} />
          <Petalas cx={top.x} cy={top.y} n={10} len={20} larg={5.4} cor="#FFD23F" raio={8} />
          <Circle cx={top.x} cy={top.y} r={10} fill="#6B4A25" />
        </>
      )}
      {s === 5 && flor(14, 22, 6, 13)}
      {s === 6 && (
        <>
          {flor(16, 26, 7, 16)}
          {/* abelhinha visitando a flor */}
          <G transform={`translate(${top.x + 44} ${top.y - 24})`}>
            <Ellipse cx={0} cy={0} rx={7} ry={5} fill="#FFD23F" />
            <Rect x={-2} y={-5} width={2.4} height={10} fill="#3B2A14" />
            <Rect x={2.2} y={-4.6} width={2.4} height={9.2} fill="#3B2A14" />
            <Ellipse cx={-1} cy={-6} rx={4} ry={3} fill="#FFFFFF" opacity={0.8} />
            <Circle cx={-5} cy={-1} r={0.9} fill="#3B2A14" />
          </G>
        </>
      )}
    </>
  );
}

const SLOTS_TOMATE = [
  { t: 0.45, lado: -1, dx: 30, dy: 12 },
  { t: 0.62, lado: 1, dx: 30, dy: 14 },
  { t: 0.82, lado: -1, dx: 22, dy: 12 },
  { t: 0.3, lado: 1, dx: 28, dy: 10 },
];

function Tomateiro({ s }: { s: number }) {
  const h = [0, 16, 38, 60, 78, 88, 92][s];
  const larg = [0, 3, 4, 5, 6, 6, 6][s];
  const pares = [0, 0, 2, 3, 4, 4, 4][s];
  const qtd = [0, 0, 0, 2, 3, 4, 4][s];
  const raio = [0, 0, 0, 0, 6, 9, 12][s];
  const cor = s === 5 ? '#F2A33A' : '#E8453C';
  return (
    <>
      <Haste h={h} larg={larg} curva={4} />
      {s === 1 && <Cotiledones h={h} curva={4} />}
      {pares > 0 && <Folhas h={h} curva={4} pares={pares} tam={s >= 4 ? 32 : 26} larg={0.5} />}
      {SLOTS_TOMATE.slice(0, qtd).map((sl, k) => {
        const p = pontoHaste(h, 4, sl.t);
        const fx = p.x + sl.lado * sl.dx;
        const fy = p.y + sl.dy;
        const galho = `M${p.x} ${p.y} Q${p.x + sl.lado * sl.dx * 0.5} ${p.y - 8} ${fx} ${p.y}`;
        return (
          <G key={k}>
            <Path d={galho} stroke={VERDE} strokeWidth={3} fill="none" strokeLinecap="round" />
            <Path d={`M${fx} ${p.y} L${fx} ${fy}`} stroke={VERDE} strokeWidth={2.4} strokeLinecap="round" />
            {raio === 0 ? (
              <Florzinha x={fx} y={fy + 3} r={0.9} />
            ) : (
              <>
                <Circle cx={fx} cy={fy + raio} r={raio} fill={s === 4 ? '#7BC043' : cor} />
                <Ellipse cx={fx - raio * 0.35} cy={fy + raio * 0.55} rx={raio * 0.22} ry={raio * 0.3} fill="#FFFFFF" opacity={0.45} />
                <Ellipse cx={fx} cy={fy + 1} rx={raio * 0.55} ry={raio * 0.22} fill={FOLHA_ESC} />
              </>
            )}
          </G>
        );
      })}
      {s === 4 && <Florzinha x={pontoHaste(h, 4, 1).x} y={pontoHaste(h, 4, 1).y - 2} />}
      {s >= 5 && <Florzinha x={pontoHaste(h, 4, 1).x} y={pontoHaste(h, 4, 1).y - 2} r={0.85} />}
    </>
  );
}

function Laranjeira({ s }: { s: number }) {
  const h = [0, 16, 32, 46, 56, 60, 62][s];
  const larg = [0, 3, 4, 6, 8, 9, 9][s];
  const r = [0, 0, 0, 20, 27, 30, 31][s];
  const tronco = '#8A5A33';
  const cx = CX;
  const cy = Y0 - h - r * 0.35;
  const laranjas: [number, number][] = [[-0.55, 0.05], [0.5, -0.1], [0.05, 0.5], [-0.2, -0.55], [0.7, 0.45]];
  const flores: [number, number][] = [[-0.5, -0.1], [0.45, -0.35], [0.1, 0.45], [-0.15, -0.6], [0.65, 0.3], [-0.65, 0.4]];
  return (
    <>
      <Haste h={h} larg={larg} curva={3} cor={tronco} />
      {s === 1 && <Cotiledones h={h} curva={3} />}
      {s === 2 && <Folhas h={h} curva={3} pares={2} tam={26} larg={0.5} />}
      {s >= 3 && <Folhas h={h} curva={3} pares={2} tam={22} tMin={0.25} tMax={0.5} larg={0.5} />}
      {s >= 3 && (
        <>
          <Circle cx={cx} cy={cy - r * 0.15} r={r * 0.9} fill="#3F8F3A" />
          <Circle cx={cx - r * 0.6} cy={cy + r * 0.2} r={r * 0.7} fill="#3F8F3A" />
          <Circle cx={cx + r * 0.6} cy={cy + r * 0.2} r={r * 0.7} fill="#3F8F3A" />
          <Circle cx={cx} cy={cy + r * 0.35} r={r * 0.65} fill="#4A9E43" />
          <Circle cx={cx - r * 0.3} cy={cy - r * 0.35} r={r * 0.4} fill="#6BBF59" opacity={0.55} />
          <Circle cx={cx + r * 0.4} cy={cy - r * 0.1} r={r * 0.25} fill="#6BBF59" opacity={0.4} />
        </>
      )}
      {s === 5 && flores.map(([dx, dy], k) => <Florzinha key={k} x={cx + dx * r} y={cy + dy * r} r={0.8} cor="#FFFFFF" miolo="#FFD23F" />)}
      {s === 6 && (
        <>
          {flores.slice(0, 2).map(([dx, dy], k) => <Florzinha key={`f${k}`} x={cx + dx * r} y={cy + dy * r - 6} r={0.7} cor="#FFFFFF" miolo="#FFD23F" />)}
          {laranjas.map(([dx, dy], k) => (
            <G key={k}>
              <Circle cx={cx + dx * r} cy={cy + dy * r} r={9} fill="#FF9F1C" />
              <Ellipse cx={cx + dx * r - 3} cy={cy + dy * r - 3} rx={2.2} ry={3} fill="#FFFFFF" opacity={0.5} />
              <Ellipse cx={cx + dx * r + 1} cy={cy + dy * r - 9} rx={3} ry={1.6} fill="#2F7D32" />
            </G>
          ))}
        </>
      )}
    </>
  );
}

function Horta({ s }: { s: number }) {
  const g = [0, 0.25, 0.45, 0.62, 0.8, 0.94, 1][s];
  const XC = 56;
  const XB = 144;
  const angCenoura = [-34, -17, 0, 17, 34];
  const lenCenoura = 64 * g;
  return (
    <>
      {/* cenoura: raminhos finos com bolinhas, à esquerda */}
      {angCenoura.map((a, k) => {
        const rad = (a * Math.PI) / 180;
        const x2 = XC + Math.sin(rad) * lenCenoura;
        const y2 = Y0 - Math.cos(rad) * lenCenoura;
        return (
          <G key={k}>
            <Path d={`M${XC} ${Y0} L${x2} ${y2}`} stroke="#58B33A" strokeWidth={3} strokeLinecap="round" />
            <Circle cx={x2} cy={y2} r={Math.max(2, 5.5 * g)} fill="#6FCF4A" />
          </G>
        );
      })}

      {/* beterraba: folhas verdes com veia vermelha, à direita */}
      {[-1.5, -0.5, 0.5, 1.5].map((k, i) => (
        <Folha key={i} x={XB} y={Y0} ang={-90 + k * 26} len={48 * g} cor="#3F9D4F" veia="#E0436A" larg={0.5} />
      ))}

      {/* alface no meio */}
      {[-3, -2, -1, 0, 1, 2, 3].map((k, i) => (
        <Folha key={i} x={CX} y={Y0} ang={-90 + k * 22} len={(54 - Math.abs(k) * 3) * g} cor={Math.abs(k) >= 2 ? '#5FBF3A' : '#86D95A'} veia="#C8F2A0" larg={0.55} />
      ))}
      {[-1, 0, 1].map((k, i) => (
        <Folha key={`i${i}`} x={CX} y={Y0} ang={-90 + k * 16} len={32 * g} cor="#A8E87C" veia="#DFF8C2" larg={0.5} />
      ))}

      {/* ombros da cenoura e da beterraba aparecendo na terra quando a horta amadurece */}
      {s >= 5 && <Ellipse cx={XC} cy={Y0 - 1} rx={s === 6 ? 10 : 7} ry={s === 6 ? 5.5 : 4} fill="#FF8A1F" />}
      {s >= 5 && <Ellipse cx={XB} cy={Y0 - 1} rx={s === 6 ? 10 : 7} ry={s === 6 ? 5.5 : 4} fill="#C2185B" />}
    </>
  );
}

function Planta({ tema, s }: { tema: TemaJardim; s: number }) {
  if (s <= 0) return <Semente />;
  switch (tema) {
    case 'BROCOLIS': return <Brocolis s={s} />;
    case 'GIRASSOL': return <Girassol s={s} />;
    case 'TOMATEIRO': return <Tomateiro s={s} />;
    case 'LARANJEIRA': return <Laranjeira s={s} />;
    default: return <Horta s={s} />;
  }
}

// ───────────────────────── vaso com carinha ─────────────────────────

function Vaso({ tema, s }: { tema: TemaJardim; s: number }) {
  const v = VASO[tema];
  const escuro = '#2B2B2B';
  return (
    <>
      <Ellipse cx={CX} cy={213} rx={54} ry={6} fill="#000000" opacity={0.12} />
      <Path d="M56 160 L144 160 L134 207 Q133 213 126 213 L74 213 Q67 213 66 207 Z" fill={v.corpo} />
      <Path d="M56 160 L66 207 Q67 213 74 213 L82 213 L72 160 Z" fill={v.sombra} opacity={0.25} />
      <Rect x={48} y={150} width={104} height={18} rx={9} fill={v.borda} />
      <Rect x={48} y={160} width={104} height={8} rx={4} fill={v.corpo} opacity={0.18} />
      <Ellipse cx={CX} cy={Y0} rx={43} ry={6} fill="#6B4426" />
      <Ellipse cx={CX - 10} cy={Y0 - 1} rx={20} ry={2.4} fill="#835731" opacity={0.7} />
      {/* carinha: dorme na semente, abre os olhos quando nasce, fica feliz com a planta completa */}
      {s === 0 ? (
        <>
          <Path d="M82 186 Q86 190 90 186" stroke={escuro} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Path d="M110 186 Q114 190 118 186" stroke={escuro} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        </>
      ) : s >= 6 ? (
        <>
          <Path d="M82 188 Q86 182 90 188" stroke={escuro} strokeWidth={2.6} fill="none" strokeLinecap="round" />
          <Path d="M110 188 Q114 182 118 188" stroke={escuro} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <Circle cx={86} cy={186} r={3.4} fill={escuro} />
          <Circle cx={114} cy={186} r={3.4} fill={escuro} />
          <Circle cx={87.2} cy={184.8} r={1.1} fill="#FFFFFF" />
          <Circle cx={115.2} cy={184.8} r={1.1} fill="#FFFFFF" />
        </>
      )}
      <Path d={s >= 6 ? 'M91 193 Q100 204 109 193 Z' : 'M92 194 Q100 201 108 194'} stroke={escuro} strokeWidth={2.2} fill={s >= 6 ? '#FFFFFF' : 'none'} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={77} cy={194} r={4.6} fill="#FF7A9A" opacity={0.45} />
      <Circle cx={123} cy={194} r={4.6} fill="#FF7A9A" opacity={0.45} />
    </>
  );
}

function Estrela({ x, y, r = 1 }: { x: number; y: number; r?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${r})`}>
      <Path d="M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z" fill="#FFD95A" />
    </G>
  );
}

// ───────────────────────── componente ─────────────────────────

type Props = {
  tema: TemaJardim;
  /** 0 (semente) a 6 (planta completa) — use `estagioDoJardim(pontos).indice` */
  estagio: number;
  /** largura em dp; a altura é 1,1x */
  tamanho?: number;
  /** balanço, crescimento e brilhos. Desligue em miniaturas */
  animar?: boolean;
  /** versão apagada, para mostrar estágios que ainda vão chegar */
  silhueta?: boolean;
};

export default function PlantaJardim({ tema, estagio, tamanho = 200, animar = true, silhueta = false }: Props) {
  const s = Math.min(6, Math.max(0, Math.floor(estagio)));
  const [reduzir, setReduzir] = useState(false);
  const escala = useRef(new Animated.Value(1)).current;
  const balanco = useRef(new Animated.Value(0)).current;
  const brilho = useRef(new Animated.Value(0.4)).current;
  const estagioAnterior = useRef<number | null>(null);
  const movimento = animar && !reduzir && !silhueta;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduzir).catch(() => undefined);
  }, []);

  // cresce com mola ao abrir e sempre que o estágio muda (a planta nunca encolhe)
  useEffect(() => {
    const anterior = estagioAnterior.current;
    estagioAnterior.current = s;
    if (!movimento) { escala.setValue(1); return; }
    escala.setValue(anterior === null ? 0.86 : 0.8);
    const a = Animated.spring(escala, { toValue: 1, friction: 4, tension: 70, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [s, movimento, escala]);

  useEffect(() => {
    if (!movimento) { balanco.setValue(0); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(balanco, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(balanco, { toValue: -1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(balanco, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [movimento, balanco]);

  const comBrilho = s >= 5 && !silhueta;
  useEffect(() => {
    if (!movimento || !comBrilho) { brilho.setValue(comBrilho ? 0.9 : 0); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(brilho, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(brilho, { toValue: 0.25, duration: 900, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [movimento, comBrilho, brilho]);

  const altura = tamanho * 1.1;
  const nomeTema = TEMAS_JARDIM.find((t) => t.tema === tema)?.nome ?? 'Planta';
  const rotate = balanco.interpolate({ inputRange: [-1, 1], outputRange: ['-2.2deg', '2.2deg'] });

  return (
    <View
      style={{ width: tamanho, height: altura, opacity: silhueta ? 0.35 : 1 }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${nomeTema}, ${nomeDoEstagio(tema, s)}`}
    >
      <Svg width={tamanho} height={altura} viewBox="0 0 200 220" style={StyleSheet.absoluteFill}>
        <Vaso tema={tema} s={s} />
      </Svg>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { transform: [{ scale: escala }, { rotate }], transformOrigin: '50% 70%' }]}
      >
        <Svg width={tamanho} height={altura} viewBox="0 0 200 220">
          <Planta tema={tema} s={s} />
        </Svg>
      </Animated.View>
      {comBrilho && (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: brilho }]}>
          <Svg width={tamanho} height={altura} viewBox="0 0 200 220">
            <Estrela x={34} y={70} r={1.1} />
            <Estrela x={168} y={52} r={0.9} />
            <Estrela x={28} y={120} r={0.7} />
            <Estrela x={172} y={104} r={1} />
            {s >= 6 && <Estrela x={150} y={20} r={0.8} />}
            {s >= 6 && <Estrela x={52} y={26} r={0.8} />}
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}
