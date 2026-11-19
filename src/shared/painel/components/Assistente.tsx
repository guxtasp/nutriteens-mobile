// src/shared/painel/components/Assistente.tsx
//
// Assistente em etapas para os cadastros do painel (alternativa, desafio, conquista, produto do
// scanner). Em vez de uma página com todos os campos, a pessoa vê uma etapa por vez, sabe em
// qual está e quantas faltam, e só avança quando a etapa está completa (o motivo aparece na
// hora). Etapas já vistas podem ser revisitadas tocando no indicador.
//
// `previa` mostra "como vai ficar no app": ao lado do formulário em telas largas e abaixo dele
// nas estreitas, sempre atualizada com o que está sendo digitado.
import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { AppText } from '../../ui/AppText';
import { AppButton } from '../../ui/AppButton';
import { typography } from '../../theme/typography';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';
import { useModoPainel } from '../hooks/useModoPainel';
import { ALVO_TOQUE, fonte } from '../painelTheme';
import { AvisoPainel, EtapasCadastro, type TomAviso } from './Formulario';

export type EtapaAssistente = {
  chave: string;
  titulo: string;
  descricao?: string;
  /** devolve o que falta para avançar (ou null se a etapa está completa) */
  validar?: () => string | null;
  conteudo: React.ReactNode;
};

type Props = {
  etapas: EtapaAssistente[];
  rotuloConcluir: string;
  onConcluir: () => void;
  onCancelar?: () => void;
  ocupado?: boolean;
  /** resultado da conclusão (erro do banco, por exemplo) */
  aviso?: { tom: TomAviso; texto: string } | null;
  previa?: React.ReactNode;
  /** desenho mais compacto, para usar dentro de um cartão de lista */
  embutido?: boolean;
};

export function Assistente({ etapas, rotuloConcluir, onConcluir, onCancelar, ocupado, aviso, previa, embutido }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const { largura } = useModoPainel();
  const [atual, setAtual] = useState(0);
  const [bloqueio, setBloqueio] = useState<string | null>(null);
  const etapa = etapas[Math.min(atual, etapas.length - 1)];
  const ultima = atual >= etapas.length - 1;
  // a prévia vai para o lado quando sobra espaço (já descontado o menu lateral)
  const lado = !!previa && largura >= (embutido ? 1240 : 1100);

  const pendencia = (i: number) => etapas[i]?.validar?.() ?? null;

  function irPara(i: number) {
    if (i <= atual) {
      setBloqueio(null);
      setAtual(i);
      return;
    }
    // avançar: todas as etapas até a de destino precisam estar completas
    for (let k = atual; k < i; k++) {
      const p = pendencia(k);
      if (p) {
        setAtual(k);
        setBloqueio(p);
        return;
      }
    }
    setBloqueio(null);
    setAtual(i);
  }

  function concluir() {
    for (let k = 0; k < etapas.length; k++) {
      const p = pendencia(k);
      if (p) {
        setAtual(k);
        setBloqueio(p);
        return;
      }
    }
    setBloqueio(null);
    onConcluir();
  }

  const formulario = (
    <View style={[styles.etapa, embutido && styles.etapaEmbutida]}>
      <View style={{ gap: 2 }}>
        <AppText style={styles.contador}>ETAPA {atual + 1} DE {etapas.length}</AppText>
        <AppText style={styles.titulo} accessibilityRole="header">{etapa.titulo}</AppText>
        {!!etapa.descricao && <AppText style={styles.descricao}>{etapa.descricao}</AppText>}
      </View>
      <View style={{ gap: 16 }}>{etapa.conteudo}</View>
      {!!bloqueio && <AvisoPainel tom="aviso" titulo="Falta completar esta etapa" texto={bloqueio} onFechar={() => setBloqueio(null)} />}
      {!!aviso && ultima && <AvisoPainel tom={aviso.tom} texto={aviso.texto} />}
      <View style={styles.rodape}>
        {atual > 0 ? (
          <AppButton label="← VOLTAR" fullWidth={false} size="compact" outlineColor={tema.texto} textColor={tema.texto} disabled={ocupado} style={styles.botao} onPress={() => irPara(atual - 1)} />
        ) : onCancelar ? (
          <AppButton label="CANCELAR" fullWidth={false} size="compact" outlineColor={tema.texto} textColor={tema.texto} disabled={ocupado} style={styles.botao} onPress={onCancelar} />
        ) : (
          <View />
        )}
        <AppButton
          label={ultima ? (ocupado ? 'SALVANDO…' : rotuloConcluir) : 'CONTINUAR →'}
          fullWidth={false}
          size="compact"
          backgroundColor={tema.botaoFundo}
          textColor={tema.botaoTexto}
          shadowColor={tema.botaoSombra}
          disabled={ocupado}
          style={styles.botao}
          onPress={() => (ultima ? concluir() : irPara(atual + 1))}
        />
      </View>
    </View>
  );

  return (
    <View style={{ gap: 14 }}>
      <EtapasCadastro
        atual={etapa.chave}
        onIr={(chave) => irPara(etapas.findIndex((e) => e.chave === chave))}
        etapas={etapas.map((e, i) => ({ chave: e.chave, rotulo: e.titulo, feita: i < atual && !pendencia(i) }))}
      />
      {lado ? (
        <View style={styles.linha}>
          <View style={{ flex: 1, minWidth: 0 }}>{formulario}</View>
          <View style={styles.colPrevia}>
            <View style={Platform.OS === 'web' ? ({ position: 'sticky', top: 16 } as any) : undefined}>{previa}</View>
          </View>
        </View>
      ) : (
        <>
          {formulario}
          {previa}
        </>
      )}
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  linha: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' } as const,
  colPrevia: { width: 360 } as const,
  etapa: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: t.borda, borderColor: t.cardBorda, padding: 20, gap: 18 } as const,
  etapaEmbutida: { padding: 16, backgroundColor: t.superficieSuave, borderColor: t.superficieSuave } as const,
  contador: { fontFamily: typography.bold, fontSize: fonte.selo, letterSpacing: 0.8, color: t.destaqueTexto } as const,
  titulo: { fontFamily: typography.bold, fontSize: 18, color: t.texto } as const,
  descricao: { fontFamily: typography.regular, fontSize: fonte.apoio, color: t.textoSuave, lineHeight: 19 } as const,
  rodape: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 4, borderTopWidth: 1, borderTopColor: t.linhaSuave } as const,
  botao: { paddingHorizontal: 18, minHeight: ALVO_TOQUE, marginTop: 12 } as const,
});
