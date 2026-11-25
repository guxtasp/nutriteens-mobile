// src/features/legal/utils/__tests__/textoLegal.test.ts
import { deveMostrarReaceite, partirPendencias, separarNumeroSecao } from '../textoLegal';
import {
  DOCUMENTOS_LEGAIS,
  MUDANCAS_DA_VERSAO,
  RESUMO_COMBINADO,
  VERSAO_TERMOS,
  CONTEUDO_CONSENTIMENTO,
} from '../../data/textosLegais';

describe('partirPendencias', () => {
  it('texto sem colchetes vira um trecho só', () => {
    expect(partirPendencias('Você, sempre.')).toEqual([{ texto: 'Você, sempre.', pendente: false }]);
  });

  it('separa o trecho pendente no meio do parágrafo, mantendo os colchetes', () => {
    expect(partirPendencias('Em até [PRAZO A DEFINIR], salvo a lei.')).toEqual([
      { texto: 'Em até ', pendente: false },
      { texto: '[PRAZO A DEFINIR]', pendente: true },
      { texto: ', salvo a lei.', pendente: false },
    ]);
  });

  it('parágrafo que é só pendência', () => {
    expect(partirPendencias('[CONFIRMAR]')).toEqual([{ texto: '[CONFIRMAR]', pendente: true }]);
  });

  it('várias pendências seguidas', () => {
    const r = partirPendencias('[A][B] fim');
    expect(r.map((t) => t.pendente)).toEqual([true, true, false]);
  });

  it('colchete sem par não some do texto', () => {
    const texto = 'abre [sem fechar';
    expect(partirPendencias(texto)).toEqual([{ texto, pendente: false }]);
  });

  it('string vazia não gera trechos', () => {
    expect(partirPendencias('')).toEqual([]);
  });

  it('juntar os trechos devolve o parágrafo original em todos os documentos', () => {
    for (const doc of Object.values(DOCUMENTOS_LEGAIS)) {
      for (const secao of doc.secoes) {
        for (const p of secao.paragrafos) {
          expect(partirPendencias(p).map((t) => t.texto).join('')).toBe(p);
        }
      }
    }
  });
});

describe('separarNumeroSecao', () => {
  it('separa o número do título', () => {
    expect(separarNumeroSecao('12. Contato')).toEqual({ numero: '12', titulo: 'Contato' });
  });
  it('título sem número fica inteiro', () => {
    expect(separarNumeroSecao('Contato')).toEqual({ numero: null, titulo: 'Contato' });
  });
  it('todas as seções dos documentos são numeradas em sequência', () => {
    for (const doc of Object.values(DOCUMENTOS_LEGAIS)) {
      doc.secoes.forEach((s, i) => expect(separarNumeroSecao(s.titulo).numero).toBe(String(i + 1)));
    }
  });
});

describe('deveMostrarReaceite', () => {
  const base = { precisaReaceite: true, dispensadoNaSessao: false, rotaAtiva: 'Home' };
  it('mostra numa tela calma quando falta aceitar', () => {
    expect(deveMostrarReaceite(base)).toBe(true);
  });
  it('não mostra se já aceitou a versão atual', () => {
    expect(deveMostrarReaceite({ ...base, precisaReaceite: false })).toBe(false);
  });
  it('não mostra de novo na mesma sessão depois de dispensado', () => {
    expect(deveMostrarReaceite({ ...base, dispensadoNaSessao: true })).toBe(false);
  });
  it('some enquanto a pessoa lê o documento completo ou está numa lição', () => {
    expect(deveMostrarReaceite({ ...base, rotaAtiva: 'PoliticaPrivacidade' })).toBe(false);
    expect(deveMostrarReaceite({ ...base, rotaAtiva: 'LicaoDetalhe' })).toBe(false);
    expect(deveMostrarReaceite({ ...base, rotaAtiva: undefined })).toBe(false);
  });
});

describe('textos da versão', () => {
  it('versão 2.0 gravada no conteúdo do consentimento', () => {
    expect(VERSAO_TERMOS).toBe('2.0');
    expect(CONTEUDO_CONSENTIMENTO).toContain(VERSAO_TERMOS);
  });
  it('resumo tem 6 itens e o reaceite tem 3 mudanças', () => {
    expect(RESUMO_COMBINADO).toHaveLength(6);
    expect(MUDANCAS_DA_VERSAO).toHaveLength(3);
  });
});
