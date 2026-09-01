import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootNavigator';
import { colors } from '../../../shared/theme/colors';
import { AppButton } from '../../../shared/ui/AppButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen({ navigation }: Props) {
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
});