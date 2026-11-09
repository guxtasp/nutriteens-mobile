// src/features/adolescente/receitas-ingredientes/components/ModoCozinhar.tsx
//
// "Cozinhar passo a passo" de "Receitas com o que tenho". Diferente do guia da Alimentação:
//  - tela cheia, com letra grande (dá pra ler com a mão na massa);
//  - NÃO avança sozinho: cada passo espera a pessoa tocar em "Próximo";
//  - barra de progresso por passo (toca para pular) e botão para rever os ingredientes sem sair;
//  - se o passo fala de tempo ("cozinhe por 10 minutos"), oferece um cronômetro que continua
//    rodando mesmo se a pessoa avançar de passo.
// É um overlay (não um Modal): vive dentro do Modal da receita, porque dois Modals ao mesmo tempo falham no iOS.
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Vibration, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { formatarRelogio, minutosDoPasso, type PassoCozinha } from '../utils/passosReceita';

export type IngredienteCozinha = {
  /** texto pronto: "2 de ovo" / "Sal" */
  texto: string;
  /** true = tem em casa, false = falta, null = a pessoa não informou o que tem */
  tenho: boolean | null;
};

type Props = {
  tituloReceita: string;
  passos: PassoCozinha[];
  ingredientes: IngredienteCozinha[];
  onFechar: () => void;
  /** tocou em "Terminei!" no último passo */
  onConcluir: () => void;
};

type Cronometro = { fimEm: number; passo: number; minutos: number; acabou: boolean };

export default function ModoCozinhar({ tituloReceita, passos, ingredientes, onFechar, onConcluir }: Props) {
  const insets = useSafeAreaInsets();
  const [atual, setAtual] = useState(0);
  const [verIngredientes, setVerIngredientes] = useState(false);
  const [cronometro, setCronometro] = useState<Cronometro | null>(null);
  const [agora, setAgora] = useState(Date.now());

  // relógio do cronômetro: 1 tique por segundo só enquanto há cronômetro rodando
  const rodando = cronometro !== null && !cronometro.acabou;
  useEffect(() => {
    if (!rodando) return;
    const id = setInterval(() => setAgora(Date.now()), 500);
    return () => clearInterval(id);
  }, [rodando]);

  useEffect(() => {
    if (cronometro && !cronometro.acabou && agora >= cronometro.fimEm) {
      setCronometro({ ...cronometro, acabou: true });
      Vibration.vibrate([0, 500, 250, 500]);
    }
  }, [agora, cronometro]);

  // ao sair da tela, não deixa o celular vibrando por um cronômetro esquecido
  useEffect(() => () => Vibration.cancel(), []);

  if (passos.length === 0) return null;

  const passo = passos[atual];
  const ultimo = atual === passos.length - 1;
  const minutos = minutosDoPasso(`${passo.titulo ?? ''} ${passo.descricao}`);
  const restante = cronometro && !cronometro.acabou ? Math.max(0, Math.ceil((cronometro.fimEm - agora) / 1000)) : 0;

  function iniciarCronometro() {
    if (!minutos) return;
    const agoraMs = Date.now();
    setAgora(agoraMs);
    setCronometro({ fimEm: agoraMs + minutos * 60000, passo: atual, minutos, acabou: false });
  }

  function proximo() {
    if (ultimo) {
      onConcluir();
      onFechar();
    } else {
      setAtual(atual + 1);
    }
  }

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.raiz, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topo}>
        <Pressable style={styles.botaoIcone} onPress={onFechar} accessibilityRole="button" accessibilityLabel="Sair do passo a passo" hitSlop={6}>
          <Ionicons name="close" size={22} color={colors.primaryDark} />
        </Pressable>
        <AppText style={styles.topoTitulo} numberOfLines={1}>{tituloReceita}</AppText>
        {ingredientes.length > 0 ? (
          <Pressable style={styles.botaoIcone} onPress={() => setVerIngredientes(true)} accessibilityRole="button" accessibilityLabel="Ver ingredientes" hitSlop={6}>
            <Ionicons name="list" size={22} color={colors.primaryDark} />
          </Pressable>
        ) : (
          <View style={styles.botaoIcone} />
        )}
      </View>

      <View style={styles.progresso}>
        {passos.map((_, k) => (
          <Pressable key={k} style={styles.segmentoToque} onPress={() => setAtual(k)} accessibilityRole="button" accessibilityLabel={`Ir para o passo ${k + 1}`}>
            <View style={[styles.segmento, k <= atual && styles.segmentoFeito]} />
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.corpo} contentContainerStyle={styles.corpoConteudo} showsVerticalScrollIndicator={false}>
        <AppText style={styles.contador}>PASSO {atual + 1} DE {passos.length}</AppText>

        {passo.foto_url ? (
          <Image source={{ uri: passo.foto_url }} style={styles.foto} resizeMode="cover" />
        ) : (
          <View style={styles.numeroCirculo}>
            <AppText style={styles.numeroTexto}>{atual + 1}</AppText>
          </View>
        )}

        {!!passo.titulo && <AppText style={styles.passoTitulo}>{passo.titulo}</AppText>}
        <AppText style={styles.passoTexto}>{passo.descricao}</AppText>

        {!!minutos && !cronometro && (
          <Pressable style={styles.botaoTempo} onPress={iniciarCronometro} accessibilityRole="button">
            <Ionicons name="timer-outline" size={18} color={colors.primaryDark} />
            <AppText style={styles.botaoTempoTexto}>Iniciar cronômetro de {minutos} min</AppText>
          </Pressable>
        )}
      </ScrollView>

      {cronometro && (
        <View style={[styles.cronometro, cronometro.acabou && styles.cronometroFim]}>
          <Ionicons name={cronometro.acabou ? 'notifications' : 'timer-outline'} size={20} color={cronometro.acabou ? '#fff' : colors.primaryDark} />
          <AppText style={[styles.cronometroTexto, cronometro.acabou && { color: '#fff' }]}>
            {cronometro.acabou ? `Acabou o tempo! (passo ${cronometro.passo + 1})` : `${formatarRelogio(restante)} · passo ${cronometro.passo + 1}`}
          </AppText>
          <Pressable onPress={() => { Vibration.cancel(); setCronometro(null); }} hitSlop={8} accessibilityRole="button" accessibilityLabel={cronometro.acabou ? 'Dispensar aviso' : 'Cancelar cronômetro'}>
            <Ionicons name="close-circle" size={22} color={cronometro.acabou ? '#fff' : colors.primaryDark} />
          </Pressable>
        </View>
      )}

      <View style={[styles.rodape, { paddingBottom: insets.bottom + 12 }]}>
        {atual > 0 && (
          <AppButton
            label="VOLTAR"
            fullWidth={false}
            outlineColor={colors.primaryDark}
            shadowColor="#D9E2E8"
            style={styles.botaoVoltar}
            onPress={() => setAtual(atual - 1)}
          />
        )}
        <AppButton
          label={ultimo ? 'TERMINEI!' : 'PRÓXIMO'}
          fullWidth={false}
          backgroundColor={ultimo ? colors.primaryDark : colors.primary}
          textColor={ultimo ? '#fff' : colors.primaryDark}
          shadowColor={ultimo ? '#0E2A20' : colors.primaryShadow}
          style={styles.botaoProximo}
          onPress={proximo}
        />
      </View>

      {verIngredientes && (
        <View style={StyleSheet.absoluteFillObject}>
          <Pressable style={styles.fundo} onPress={() => setVerIngredientes(false)} accessibilityLabel="Fechar ingredientes" />
          <View style={[styles.painel, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.puxador} />
            <AppText style={styles.painelTitulo}>Ingredientes</AppText>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
              {ingredientes.map((i, k) => (
                <View key={k} style={styles.painelLinha}>
                  <Ionicons
                    name={i.tenho === true ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={i.tenho === true ? '#1E8449' : '#B8C4BE'}
                  />
                  <AppText style={styles.painelTexto}>{i.texto}</AppText>
                  {i.tenho === false && <AppText style={styles.painelFalta}>falta</AppText>}
                </View>
              ))}
            </ScrollView>
            <AppButton
              label="FECHAR"
              outlineColor={colors.primaryDark}
              shadowColor="#D9E2E8"
              size="compact"
              style={{ marginTop: 12 }}
              onPress={() => setVerIngredientes(false)}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { backgroundColor: colors.white },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 12 },
  botaoIcone: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EAF6DA', alignItems: 'center', justifyContent: 'center' },
  topoTitulo: { flex: 1, textAlign: 'center', fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },

  progresso: { flexDirection: 'row', gap: 6, paddingHorizontal: 20 },
  segmentoToque: { flex: 1, paddingVertical: 8 },
  segmento: { height: 6, borderRadius: 3, backgroundColor: '#E6EDF1' },
  segmentoFeito: { backgroundColor: colors.primary },

  corpo: { flex: 1 },
  corpoConteudo: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24, alignItems: 'center' },
  contador: { fontFamily: typography.bold, fontSize: 12, color: '#7A8B94', letterSpacing: 1, marginBottom: 20 },
  foto: { width: '100%', height: 200, borderRadius: 20, marginBottom: 20, backgroundColor: '#EAF6DA' },
  numeroCirculo: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderBottomWidth: 4, borderBottomColor: colors.primaryShadow },
  numeroTexto: { fontFamily: typography.bold, fontSize: 38, color: colors.primaryDark },
  passoTitulo: { fontFamily: typography.bold, fontSize: 22, color: colors.primaryDark, textAlign: 'center', marginBottom: 10 },
  passoTexto: { fontFamily: typography.medium, fontSize: 20, lineHeight: 30, color: colors.primaryDark, textAlign: 'center' },
  botaoTempo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 24, backgroundColor: '#EAF6DA' },
  botaoTempoTexto: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },

  cronometro: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 24, marginBottom: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#EAF6DA' },
  cronometroFim: { backgroundColor: colors.warning },
  cronometroTexto: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },

  rodape: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#EEF2EF' },
  botaoVoltar: { flex: 1 },
  botaoProximo: { flex: 2 },

  fundo: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  painel: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 12 },
  puxador: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D9E2E8', alignSelf: 'center', marginBottom: 14 },
  painelTitulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark, marginBottom: 8 },
  painelLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  painelTexto: { flex: 1, fontFamily: typography.regular, fontSize: 15, color: colors.primaryDark },
  painelFalta: { fontFamily: typography.medium, fontSize: 12, color: '#7A8B94' },
});
