import React from 'react';
import { colors } from '../theme/colors';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';

// Define a tela de splash que será exibida enquanto o aplicativo carrega
export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/img/logo.png')}
        style={styles.logo}
        resizeMode="contain" // Mantém a proporção da imagem enquanto se ajusta ao tamanho do contêiner
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
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 300,
    marginBottom: 20,
  },
  loader: {
    marginTop: 24,
  },
});