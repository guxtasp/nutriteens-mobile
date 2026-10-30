import React from 'react';
import { View, Image, Pressable, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { colors } from '../../../shared/theme/colors';
import { AppButton } from '../../../shared/ui/AppButton';
import { AppText } from '../../../shared/ui/AppText';
import { typography } from '../../../shared/theme/typography';
import { acessoProfissionalDisponivel } from '../utils/acessoProfissional';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  // o acesso profissional só aparece no computador (ver acessoProfissional.ts)
  const mostrarProfissional = acessoProfissionalDisponivel(Platform.OS, width);

  return (
    <View style={styles.container}>

      <Image
        source={require('../../../../assets/img/intro.png')}
        style={styles.mascot}
        resizeMode="contain"
      />

      <View style={styles.buttons}>
        <AppButton
          label="COMEÇAR AGORA"
          backgroundColor={colors.primary}
          textColor={colors.white}
          shadowColor={colors.white}          
          onPress={() => navigation.navigate('AppPresentation')}
        />

        <AppButton
          label="JÁ TENHO UMA CONTA"
          backgroundColor={colors.white}
          textColor={colors.primary}
          shadowColor={colors.primary}
          onPress={() => navigation.navigate('Login')}
        />

        {mostrarProfissional && (
          <Pressable onPress={() => navigation.navigate('LoginProfissional')} accessibilityRole="link" style={styles.linkProfissional}>
            <AppText style={styles.linkProfissionalTexto}>Sou nutricionista ou administrador</AppText>
          </Pressable>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  mascot: {
    flex: 1,
    width: '90%',
    height: '55%',
    alignSelf: 'flex-end',
    marginTop: 24,
  },

  buttons: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100,
    gap: 16,
  },

  // entrada discreta para quem não é adolescente (tem 44 px de altura para o toque)
  linkProfissional: { minHeight: 44, justifyContent: 'center' },
  linkProfissionalTexto: {
    fontFamily: typography.semiBold,
    fontSize: 14,
    color: colors.white,
    textDecorationLine: 'underline',
  },
});