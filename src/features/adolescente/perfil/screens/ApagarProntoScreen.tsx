// src/features/adolescente/perfil/screens/ApagarProntoScreen.tsx
//
// "Apagar meus dados", passo 3: a conta já não existe no servidor. Esta tela é a única da pilha
// (navigation.reset); o botão encerra a sessão local e o RootNavigator volta ao Onboarding.
//
// A referência dizia "Mandamos a confirmação pro seu e-mail", mas nada envia e-mail (não há serviço
// de e-mail no projeto e mandar o e-mail seria uma chamada a terceiro com dado da pessoa). No lugar,
// mostramos o código do registro anônimo da exclusão: é a prova que a pessoa pode citar à equipe.
import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { SpeechBubble } from '../../../../shared/ui/SpeechBubble';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { encerrarSessaoLocal } from '../services/excluirContaService';
import { CONTATO_PESQUISA, PRONTO_TEXTO, PRONTO_TITULO } from '../data/textosExclusao';

type Props = NativeStackScreenProps<AdolescenteStackParamList, 'ApagarPronto'>;

const BROXIS = require('../../../../../assets/img/mascot/broxis-aceno.png');

export default function ApagarProntoScreen({ route }: Props) {
  const { codigo } = route.params;
  const { userId } = useAuth();
  const [saindo, setSaindo] = useState(false);

  async function voltarProInicio() {
    if (saindo) return;
    setSaindo(true);
    try {
      await encerrarSessaoLocal(userId);
      // o SIGNED_OUT troca a pilha sozinho; esta tela desmonta
    } catch {
      setSaindo(false);
    }
  }

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.centro}>
        <SpeechBubble typewriter={false} tailPosition="bottom" style={styles.balao}>
          <View accessible accessibilityLiveRegion="polite">
            <AppText style={styles.titulo} accessibilityRole="header">
              {PRONTO_TITULO}
            </AppText>
            <AppText style={styles.texto}>{PRONTO_TEXTO}</AppText>
          </View>
        </SpeechBubble>
        <Image source={BROXIS} style={styles.broxis} resizeMode="contain" accessibilityLabel="Bróxis acenando tchau" />
        {codigo && (
          <AppText style={styles.nota} accessibilityLabel={`Código da sua solicitação: ${codigo.split('').join(' ')}`}>
            Código da sua solicitação: <AppText style={styles.codigo}>{codigo}</AppText>
          </AppText>
        )}
        <AppText style={styles.nota}>Dúvidas: {CONTATO_PESQUISA}</AppText>
      </View>

      <View style={styles.rodape}>
        {saindo ? (
          <ActivityIndicator color={colors.primaryDark} style={styles.carregando} accessibilityLabel="Saindo" />
        ) : (
          <AppButton
            label="VOLTAR PRO INÍCIO"
            backgroundColor={colors.primaryDark}
            textColor={colors.white}
            shadowColor={colors.primaryDarkShadow}
            onPress={voltarProInicio}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 18 },
  balao: { maxWidth: 300, paddingVertical: 16, paddingHorizontal: 20 },
  titulo: { fontFamily: typography.bold, fontSize: 19, color: colors.primaryDark, textAlign: 'center' },
  texto: { fontFamily: typography.regular, fontSize: 15, lineHeight: 22, color: colors.primaryDark, textAlign: 'center', marginTop: 6 },
  broxis: { width: 150, height: 170 },
  nota: { fontFamily: typography.regular, fontSize: 12.5, lineHeight: 18, color: colors.textoSuave, textAlign: 'center', maxWidth: 300 },
  codigo: { fontFamily: typography.bold, letterSpacing: 1, color: colors.primaryDark },
  rodape: { paddingHorizontal: 20, paddingBottom: 20 },
  carregando: { height: 56 },
});
