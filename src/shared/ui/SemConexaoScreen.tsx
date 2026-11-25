// src/shared/ui/SemConexaoScreen.tsx
//
// Mostrada pelo RootNavigator quando existe uma sessão salva mas não foi
// possível carregar a conta (internet ruim ou sem sinal). Antes, esse caso
// caía na tela de login como se o usuário tivesse sido deslogado.
import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { BroxisPose } from './BroxisPose';
import { TelaBase } from './TelaBase';
import { RodapeAcoes } from './RodapeAcoes';

type Props = {
  tentando: boolean;
  onTentarNovamente: () => void;
  onSair: () => void;
};

export default function SemConexaoScreen({ tentando, onTentarNovamente, onSair }: Props) {
  return (
    // fica FORA do NavigationContainer (o RootNavigator mostra antes de carregar a conta):
    // a TelaBase funciona sem navegação. Rolável só para fonte grande/tela baixa.
    <TelaBase
      rolavel
      conteudoStyle={styles.centro}
      rodape={
        <RodapeAcoes semDivisoria espacoMin={24} style={styles.rodape}>
          <AppButton
            label={tentando ? 'TENTANDO...' : 'TENTAR DE NOVO'}
            backgroundColor={colors.primaryDark}
            textColor={colors.white}
            shadowColor="#123024"
            fullWidth
            disabled={tentando}
            onPress={onTentarNovamente}
          />
          <AppText style={styles.sair} onPress={onSair} accessibilityRole="button">
            Sair da conta
          </AppText>
        </RodapeAcoes>
      }
    >
      <BroxisPose pose="pensativo" tamanho={170} style={styles.broxis} />
      <AppText style={styles.titulo}>Sem conexão por enquanto</AppText>
      <AppText style={styles.texto}>
        Não conseguimos carregar a sua conta agora. Você continua conectado(a): assim que a
        internet voltar, entramos automaticamente.
      </AppText>
      {tentando ? <ActivityIndicator color={colors.primaryDark} style={styles.carregando} /> : null}
    </TelaBase>
  );
}

const styles = StyleSheet.create({
  centro: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  titulo: {
    fontFamily: typography.bold,
    fontSize: 24,
    lineHeight: 32,
    color: colors.primaryDark,
    textAlign: 'center',
    marginBottom: 12,
  },
  texto: {
    fontFamily: typography.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  carregando: { marginTop: 24 },
  broxis: { marginBottom: 16 },
  rodape: { paddingHorizontal: 24, gap: 16 },
  sair: {
    fontFamily: typography.regular,
    color: colors.primaryDark,
    textAlign: 'center',
    textDecorationLine: 'underline',
    paddingVertical: 12,
    minHeight: 44,
  },
});