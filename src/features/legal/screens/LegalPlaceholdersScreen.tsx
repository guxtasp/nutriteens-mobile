import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BackButton } from '../../../shared/ui/BackButton';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';

export default function LegalPlaceholderScreen({ navigation, route }: any) {
  const title = route?.params?.title ?? 'Em breve';

  return (
    <View style={styles.container}>
      <BackButton onPress={() => navigation.goBack()} style={styles.backButton} />
      <AppText style={styles.title}>{title}</AppText>
      <AppText style={styles.body}>
        Este conteúdo ainda está sendo preparado. Em breve você poderá ler o texto completo aqui.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 32,
  },
  title: {
    fontFamily: typography.bold,
    fontSize: 22,
    color: colors.primaryDark,
    marginBottom: 16,
  },
  body: {
    fontFamily: typography.regular,
    fontSize: 15,
    color: colors.primaryDark,
    lineHeight: 22,
  },
});