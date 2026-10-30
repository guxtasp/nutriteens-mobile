// src/shared/painel/components/IntroSecao.tsx
// Mensagem introdutória de uma seção ("o que é, o que dá pra fazer, quem pode o quê").
// Aparece no primeiro acesso; "Entendi" esconde e lembra a escolha neste aparelho.
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppText } from '../../ui/AppText';
import { typography } from '../../theme/typography';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';

type Props = {
  /** identifica a seção para lembrar que já foi lida */
  chave: string;
  titulo: string;
  /** frases curtas; cada uma vira uma linha com marcador */
  linhas: string[];
};

const PREFIXO = 'painel_intro_v1_';

export function IntroSecao({ chave, titulo, linhas }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    let ativo = true;
    AsyncStorage.getItem(PREFIXO + chave)
      .then((v) => ativo && setVisivel(v !== '1'))
      .catch(() => ativo && setVisivel(true));
    return () => {
      ativo = false;
    };
  }, [chave]);

  function dispensar() {
    setVisivel(false);
    AsyncStorage.setItem(PREFIXO + chave, '1').catch(() => {});
  }

  if (!visivel) return null;
  return (
    <View style={styles.card}>
      <View style={styles.topo}>
        <Ionicons name="bulb-outline" size={20} color={tema.destaque} />
        <AppText style={styles.titulo}>{titulo}</AppText>
      </View>
      {linhas.map((l, i) => (
        <AppText key={i} style={styles.linha}>
          • {l}
        </AppText>
      ))}
      <Pressable onPress={dispensar} accessibilityRole="button" style={styles.botao}>
        <AppText style={styles.botaoTexto}>Entendi</AppText>
      </Pressable>
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  card: { backgroundColor: t.dicaFundo, borderRadius: t.cardRaio, borderWidth: 2, borderColor: t.dicaBorda, padding: 14, gap: 6, marginBottom: 12 } as const,
  topo: { flexDirection: 'row', alignItems: 'center', gap: 8 } as const,
  titulo: { flex: 1, fontFamily: typography.bold, fontSize: 14, color: t.texto } as const,
  linha: { fontFamily: typography.regular, fontSize: 13, color: t.textoCorpo, lineHeight: 19 } as const,
  botao: { alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', paddingHorizontal: 6 } as const,
  botaoTexto: { fontFamily: typography.bold, fontSize: 13, color: t.info } as const,
});
