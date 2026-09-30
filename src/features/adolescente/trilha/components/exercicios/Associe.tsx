// src/features/adolescente/trilha/components/exercicios/Associe.tsx
import React, { useMemo, useState } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { AppText } from '../../../../../shared/ui/AppText';
import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';
import type { ParAssocie } from '../../services/trilhaService';

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

function embaralhar<T extends { id: string }>(itens: T[]): T[] {
  return itens
    .map((item, i) => ({ item, chave: pseudoAleatorio(i + item.id.length + 3) }))
    .sort((a, b) => a.chave - b.chave)
    .map((x) => x.item);
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

  function handleTocarEsquerda(parId: string) {
    if (respondido) return;
    setLadoEsquerdoAtivo(parId === ladoEsquerdoAtivo ? null : parId);
  }

  function handleTocarDireita(direitaId: string) {
    if (respondido || !ladoEsquerdoAtivo) return;
    if (direitaUsada.has(direitaId) && resposta[ladoEsquerdoAtivo] !== direitaId) return;

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
          {pares.map((par) => {
            const ativo = ladoEsquerdoAtivo === par.id;
            const ligado = !!resposta[par.id];
            const acertou = respondido && resposta[par.id] === par.id;
            const errou = respondido && resposta[par.id] !== par.id;

            return (
              <Pressable
                key={par.id}
                disabled={respondido}
                onPress={() => handleTocarEsquerda(par.id)}
                style={[
                  styles.item,
                  ativo && styles.itemAtivo,
                  ligado && !respondido && !ativo && styles.itemLigado,
                  acertou && styles.itemCerto,
                  errou && styles.itemErrado,
                ]}
              >
                <AppText style={styles.itemTexto}>{par.esquerda}</AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.coluna}>
          {direitaEmbaralhada.map((par) => {
            // essa entrada da direita está ligada a algum item da esquerda?
            const ligadaDe = Object.entries(resposta).find(([, direitaId]) => direitaId === par.id)?.[0];
            const ligada = !!ligadaDe;
            const acertou = respondido && ligadaDe === par.id;
            const errou = respondido && ligada && ligadaDe !== par.id;
            const desabilitadaPorOutraLigacao = ligada && (!ladoEsquerdoAtivo || resposta[ladoEsquerdoAtivo] !== par.id);

            return (
              <Pressable
                key={par.id}
                disabled={respondido || (desabilitadaPorOutraLigacao && !ladoEsquerdoAtivo)}
                onPress={() => handleTocarDireita(par.id)}
                style={[
                  styles.item,
                  ligada && !respondido && styles.itemLigado,
                  acertou && styles.itemCerto,
                  errou && styles.itemErrado,
                ]}
              >
                <AppText style={styles.itemTexto}>{par.direita}</AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
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
    borderColor: '#B9C2B6',
    borderBottomWidth: 4,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    minHeight: 52,
    justifyContent: 'center',
  },
  itemAtivo: { borderColor: colors.primaryDark, backgroundColor: 'rgba(27, 67, 50, 0.06)' },
  itemLigado: { borderColor: colors.primary },
  itemCerto: { borderColor: colors.success, backgroundColor: 'rgba(16, 185, 129, 0.08)' },
  itemErrado: { borderColor: colors.error, backgroundColor: 'rgba(192, 57, 43, 0.08)', borderBottomColor: colors.error },
  itemTexto: {
    fontFamily: typography.semiBold,
    fontSize: 13,
    color: colors.textOnLight,
    textAlign: 'center',
  },
});
