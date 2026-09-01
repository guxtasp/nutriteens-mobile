// src/features/adolescente/screens/ProfileScreen.tsx
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {AppText} from '../../../../shared/ui/AppText';
import {BackButton} from '../../../../shared/ui/BackButton';
import {LogoutButton} from '../../../../shared/ui/LogoutButton';
import { BroxisMascot } from '../../../../shared/ui/BroxisMascot';
import ChatFab from '../../_shared/components/ChatFab';
import { usePerfilUsuario } from '../hooks/usePerfilUsuario';
import { calcularIdade } from '../../../../shared/utils/calcularIdade';
import { colors } from '../../../../shared/theme/colors';
import { useNavigation } from '@react-navigation/native';
import { typography } from '../../../../shared/theme/typography';

export default function ProfileScreen() {
  const { perfil, carregando } = usePerfilUsuario();
  const navigation = useNavigation();
  const primeiroNome = perfil?.nome?.trim().split(' ')[0] ?? 'Usuário';
  const idade = perfil?.dataNascimento ? calcularIdade(perfil.dataNascimento) : null;
  const dataFormatada = perfil?.dataNascimento
    ? new Date(perfil.dataNascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    : null;

  return (
    <SafeAreaView style={styles.tela}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.headerTextos}>
            <AppText style={styles.titulo}>Perfil do Usuário</AppText>
            <AppText style={styles.subtitulo}>Informações gerais</AppText>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.avatarWrapper}>
            <BroxisMascot size={92} pose="supercontente" entrance="fade" showParticles={false} />
          </View>

          <AppText style={styles.nome}>{primeiroNome}</AppText>

          {/* TODO: seção de amigos/código de amizade — feature ainda não implementada no banco
          <View style={styles.linha}>
            <AppText style={styles.label}>Código da amizade</AppText>
            <AppText style={styles.valor}>{codigoAmizade}</AppText>
          </View>
          */}

          {dataFormatada && (
            <View style={styles.linha}>
              <AppText style={styles.label}>Data de Nascimento</AppText>
              <AppText style={styles.valor}>{dataFormatada}</AppText>
            </View>
          )}
          {idade && (
            <View style={styles.linha}>
              <AppText style={styles.label}>Idade</AppText>
              <AppText style={styles.valor}>{idade}</AppText>
            </View>
          )}
          {perfil?.tipoInstituicao && (
            <View style={styles.linha}>
              <AppText style={styles.label}>Instituição</AppText>
              <AppText style={styles.valor}>{perfil.tipoInstituicao}</AppText>
            </View>
          )}
        </View>

        <LogoutButton />
      </ScrollView>

      <ChatFab />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.white ?? '#FFFFFF',
  },
  conteudo: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 30,
  },
  headerTextos: {
    flex: 1,
    alignItems: 'center',
    marginRight: 44, // compensa a largura do BackButton pra centralizar o título
  },
  titulo: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: colors.primaryDark ?? '#1F5D3E',
  },
  subtitulo: {
    fontSize: 12,
    color: colors.primaryDark ?? '#8A9A91',
  },
  card: {
    backgroundColor: colors.primaryDark ?? colors.primaryShadow,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 4,
  },
  nome: {
    fontSize: 26,
    fontFamily: typography.bold,
    color: colors.primary ?? '#1F5D3E',
    marginBottom: 16,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: typography.bold,
    color: '#FFFFFF',
  },
  valor: {
    fontSize: 15,
    fontFamily: typography.bold,
    color: colors.primary ?? '#1F5D3E',
  },
});