import React from 'react';
import { colors } from '../theme/colors';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';

// Define a tela de splash que será exibida enquanto o aplicativo carrega
export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/img/splash.png')} // Mascote
        style={styles.mascote}
        resizeMode="contain"
      />
      <Image
        source={require('../../../assets/img/logo.png')} // Logo NutriTeens
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={styles.loader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascote: {
    width: 130,
    height: 130,
    marginBottom: 12,
  },
  logo: {
    width: 200,
    height: 60,
    marginBottom: 20,
  },
  loader: {
    marginTop: 24,
  },
});