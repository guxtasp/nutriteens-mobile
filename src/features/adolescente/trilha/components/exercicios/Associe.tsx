// src/features/adolescente/trilha/components/exercicios/Associe.tsx
import React, { ReactNode, useMemo, useState } from 'react';
import { Pressable, View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { AppText } from '../../../../../shared/ui/AppText';
import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';
import type { ParAssocie } from '../../services/trilhaService';
import { BALANCO, PULINHO, atrasoCascata } from './animacoes';

type Props = {
  pares: ParAssocie[]; // cada par: { id, esquerda, direita } — id é o gabarito de qual liga com qual
  resposta: Record<string, string>; // parId da esquerda -> parId do item de direita escolhido
  respondido: boolean;
  onMudar: (novaResposta: Record<string, string>) => void;
};

function pseudoAleatorio(seed: number) {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}

// Cada ligação ganha um número e uma cor, iguais nos dois lados, pra dar pra
// ver quem está ligado com quem (o número também ajuda quem não distingue cores).
const CORES_LIGACAO = ['#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];

function embaralhar<T extends { id: string }>(itens: T[]): T[] {
  return itens
    .map((item, i) => ({ item, chave: pseudoAleatorio(i + item.id.length + 3) }))
    .sort((a, b) => a.chave - b.chave)
    .map((x) => x.item);
}

type ItemAnimadoProps = {
  indice: number;
  lado: 'esquerda' | 'direita';
  ativo?: boolean;
  acertou?: boolean;
  errou?: boolean;
  disabled?: boolean;
  onPress: () => void;
  estilo: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * Um item de coluna. Entra deslizando (a esquerda vem da esquerda, a direita
 * da direita); o item ativo cresce um pouco; ao responder, o certo pulsa e
 * o errado balança.
 */
function ItemAnimado({ indice, lado, ativo, acertou, errou, disabled, onPress, estilo, children }: ItemAnimadoProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: lado === 'esquerda' ? -18 : 18 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 280, delay: atrasoCascata(indice) }}
    >
      <MotiView
        animate={{
          scale: acertou ? PULINHO : ativo ? 1.04 : 1,
          translateX: errou ? BALANCO : 0,
        }}
        transition={{ type: 'timing', duration: errou ? 380 : 220 }}
      >
        <Pressable disabled={disabled} onPress={onPress} style={estilo}>
          {children}
        </Pressable>
      </MotiView>
    </MotiView>
  );
}

/**
 * "Associe": duas colunas, sem drag-and-drop — toca um item da esquerda
 * (fica destacado), depois toca um da direita pra ligar os dois. Tocar de
 * novo num item da esquerda já ligado permite refazer a ligação dele antes
 * de responder. A coluna da direita é embaralhada; a da esquerda mantém a
 * ordem de cadastro dos pares.
 */
export default function Associe({ pares, resposta, respondido, onMudar }: Props) {
  const [ladoEsquerdoAtivo, setLadoEsquerdoAtivo] = useState<string | null>(null);
  const direitaEmbaralhada = useMemo(() => embaralhar(pares), [pares]);

  // quais ids de direita já estão usados em alguma ligação (pra não deixar
  // ligar dois itens da esquerda no mesmo item da direita)
  const direitaUsada = new Set(Object.values(resposta));

  const indiceDoPar = (parId: string) => pares.findIndex((p) => p.id === parId);
  const corDoPar = (parId: string) => CORES_LIGACAO[indiceDoPar(parId) % CORES_LIGACAO.length];
  const numeroDoPar = (parId: string) => String(indiceDoPar(parId) + 1);

  function handleTocarEsquerda(parId: string) {
    if (respondido) return;
    Haptics.selectionAsync();
    setLadoEsquerdoAtivo(parId === ladoEsquerdoAtivo ? null : parId);
  }

  function handleTocarDireita(direitaId: string) {
    if (respondido || !ladoEsquerdoAtivo) return;
    if (direitaUsada.has(direitaId) && resposta[ladoEsquerdoAtivo] !== direitaId) return;

    Haptics.selectionAsync();
    const novaResposta = { ...resposta, [ladoEsquerdoAtivo]: direitaId };
    onMudar(novaResposta);
    setLadoEsquerdoAtivo(null);
  }

  return (
    <View style={styles.container}>
      <AppText style={styles.instrucao}>
        {ladoEsquerdoAtivo ? 'Agora toque o par certo à direita' : 'Toque um item da esquerda pra começar'}
      </AppText>

      <View style={styles.colunas}>
        <View style={styles.coluna}>
          {pares.map((par, indice) => {
            const ativo = ladoEsquerdoAtivo === par.id;
            const ligado = !!resposta[par.id];
            const acertou = respondido && resposta[par.id] === par.id;
            const errou = respondido && resposta[par.id] !== par.id;

            return (
              <ItemAnimado
                key={par.id}
                indice={indice}
                lado="esquerda"
                ativo={ativo}
                acertou={acertou}
                errou={errou}
                disabled={respondido}
                onPress={() => handleTocarEsquerda(par.id)}
                estilo={[
                  styles.item,
                  ativo && styles.itemAtivo,
                  ligado && !respondido && !ativo && styles.itemLigado,
                  ligado && !respondido && !ativo && { borderColor: corDoPar(par.id) },
                  acertou && styles.itemCerto,
                  errou && styles.itemErrado,
                ]}
              >
                {ligado && <BadgeLigacao numero={numeroDoPar(par.id)} cor={corDoPar(par.id)} />}
                <AppText style={styles.itemTexto}>{par.esquerda}</AppText>
              </ItemAnimado>
            );
          })}
        </View>

        <View style={styles.coluna}>
          {direitaEmbaralhada.map((par, indice) => {
            // essa entrada da direita está ligada a algum item da esquerda?
            const ligadaDe = Object.entries(resposta).find(([, direitaId]) => direitaId === par.id)?.[0];
            const ligada = !!ligadaDe;
            const acertou = respondido && ligadaDe === par.id;
            const errou = respondido && ligada && ligadaDe !== par.id;
            const desabilitadaPorOutraLigacao = ligada && (!ladoEsquerdoAtivo || resposta[ladoEsquerdoAtivo] !== par.id);

            return (
              <ItemAnimado
                key={par.id}
                indice={indice}
                lado="direita"
                acertou={acertou}
                errou={errou}
                disabled={respondido || (desabilitadaPorOutraLigacao && !ladoEsquerdoAtivo)}
                onPress={() => handleTocarDireita(par.id)}
                estilo={[
                  styles.item,
                  ligada && !respondido && styles.itemLigado,
                  ligada && !respondido && { borderColor: corDoPar(ligadaDe!) },
                  acertou && styles.itemCerto,
                  errou && styles.itemErrado,
                ]}
              >
                {ligada && <BadgeLigacao numero={numeroDoPar(ligadaDe!)} cor={corDoPar(ligadaDe!)} />}
                <AppText style={styles.itemTexto}>{par.direita}</AppText>
              </ItemAnimado>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/** O número colorido da ligação "estoura" (mola) quando aparece. */
function BadgeLigacao({ numero, cor }: { numero: string; cor: string }) {
  return (
    <MotiView
      from={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', damping: 10, stiffness: 240 }}
      style={[styles.badge, { backgroundColor: cor }]}
    >
      <AppText style={styles.badgeTexto}>{numero}</AppText>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24 },
  instrucao: {
    fontFamily: typography.regular,
    fontSize: 13,
    color: colors.placeholder,
    textAlign: 'center',
    marginBottom: 14,
  },
  colunas: { flexDirection: 'row', gap: 12 },
  coluna: { flex: 1, gap: 12 },
  item: {
    borderWidth: 1.5,
    borderColor: colors.exercicioBorda,
    borderBottomWidth: 4,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTexto: { fontFamily: typography.bold, fontSize: 11, color: colors.white },
  itemAtivo: { borderColor: colors.primaryDark, backgroundColor: 'rgba(27, 67, 50, 0.06)' },
  itemLigado: { borderColor: colors.primary },
  itemCerto: { borderColor: colors.primary, backgroundColor: 'rgba(139, 207, 74, 0.16)' },
  itemErrado: { borderColor: colors.exercicioErro, backgroundColor: 'rgba(255, 69, 64, 0.10)', borderBottomColor: colors.exercicioErro },
  itemTexto: {
    fontFamily: typography.semiBold,
    fontSize: 13,
    color: colors.exercicioTexto,
    textAlign: 'center',
    flexShrink: 1,
  },
});