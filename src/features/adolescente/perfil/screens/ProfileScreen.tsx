// src/features/adolescente/perfil/screens/ProfileScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../../../shared/ui/AppText';
import { BackButton } from '../../../../shared/ui/BackButton';
import { LogoutButton } from '../../../../shared/ui/LogoutButton';
import { ProgressBar } from '../../../../shared/ui/ProgressBar';
import ChatFab from '../../_shared/components/ChatFab';
import { usePerfilUsuario } from '../hooks/usePerfilUsuario';
import { useGamificacao } from '../hooks/useGamificacao';
import { BroxisEvolucao } from '../components/BroxisEvolucao';
import { InsigniaTile } from '../components/InsigniaTile';
import { ConquistaBadge } from '../components/ConquistaBadge';
import { CreditosApp } from '../../../../shared/ui/CreditosApp';
import { marcarInsigniasVistas, Insignia } from '../services/gamificacaoService';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { calcularIdade } from '../../../../shared/utils/calcularIdade';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';

const FUNDO = '#F3F8EE';

export default function ProfileScreen() {
  const { userId } = useAuth();
  const navigation = useNavigation();
  const { perfil } = usePerfilUsuario();
  const { xpTotal, estado, insignias } = useGamificacao();
  const [selecionada, setSelecionada] = useState<Insignia | null>(null);

  const primeiroNome = perfil?.nome?.trim().split(' ')[0] ?? 'Usuário';
  const idade = perfil?.dataNascimento ? calcularIdade(perfil.dataNascimento) : null;
  const dataFormatada = perfil?.dataNascimento
    ? new Date(perfil.dataNascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    : null;
  const doTipo = (c: Insignia['categoria']) => insignias.filter((i) => i.categoria === c);
  const insigniasEspeciais = doTipo('insignia');
  const marcos = doTipo('marco');
  const conquistas = doTipo('conquista');
  const contagem = (l: Insignia[]) => `${l.filter((i) => i.obtida).length} de ${l.length}`;

  function abrirInsignia(i: Insignia) {
    setSelecionada(i);
    if (i.nova && userId) marcarInsigniasVistas(userId).catch(() => {});
  }

  return (
    <SafeAreaView style={styles.tela}>
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <AppText style={styles.titulo}>Perfil</AppText>
          <View style={{ width: 44 }} />
        </View>

        {/* Herói: mascote na fase atual + nome + barras */}
        <View style={styles.heroi}>
          <BroxisEvolucao fase={estado.atual.fase} />
          <View style={styles.nomeLinha}>
            <AppText style={styles.nome}>{primeiroNome}</AppText>
            <View style={styles.chipFase}>
              <AppText style={styles.chipFaseTexto}>{estado.atual.titulo}</AppText>
            </View>
          </View>

          <View style={styles.barra}>
            <AppText style={styles.barraRotulo}>XP</AppText>
            <View style={{ flex: 1 }}>
              <ProgressBar progress={estado.progresso} />
            </View>
            <AppText style={styles.barraValor}>{xpTotal}</AppText>
          </View>
        </View>

        {/* Insígnias: únicas com arte exclusiva (placeholders até o design entregar) */}
        <View style={styles.secaoTopo}>
          <AppText style={styles.secaoTitulo}>INSÍGNIAS</AppText>
          <AppText style={styles.secaoLado}>{contagem(insigniasEspeciais)}</AppText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.insigniasLinha}>
          {insigniasEspeciais.map((i) => (
            <InsigniaTile key={i.id} insignia={i} onPress={abrirInsignia} />
          ))}
        </ScrollView>

        {/* Marcos: componente padrão com destaque */}
        <View style={styles.secaoTopo}>
          <AppText style={styles.secaoTitulo}>MARCOS</AppText>
          <AppText style={styles.secaoLado}>{contagem(marcos)}</AppText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.insigniasLinha}>
          {marcos.map((i) => (
            <ConquistaBadge key={i.id} item={i} onPress={abrirInsignia} />
          ))}
        </ScrollView>

        {/* Conquistas: componente padrão simples */}
        <View style={styles.secaoTopo}>
          <AppText style={styles.secaoTitulo}>CONQUISTAS</AppText>
          <AppText style={styles.secaoLado}>{contagem(conquistas)}</AppText>
        </View>
        <View style={styles.grade}>
          {conquistas.map((i) => (
            <ConquistaBadge key={i.id} item={i} onPress={abrirInsignia} />
          ))}
        </View>

        {selecionada && (
          <View style={styles.detalheInsignia}>
            <AppText style={styles.detalheTitulo}>{selecionada.obtida ? selecionada.nome : 'Ainda bloqueada'}</AppText>
            <AppText style={styles.detalheTexto}>
              {selecionada.obtida
                ? selecionada.descricao
                : selecionada.categoria === 'insignia'
                  ? 'Continue jogando para descobrir como ganhar esta insígnia!'
                  : `Como ganhar: ${selecionada.descricao ?? 'continue jogando!'}`}
            </AppText>
          </View>
        )}

        {/* Próxima evolução (no lugar de "Certificados" da referência) */}
        <View style={styles.secaoTopo}>
          <AppText style={styles.secaoTitulo}>EVOLUÇÃO DO BROXIS</AppText>
        </View>
        <View style={styles.cardEvolucao}>
          <View style={{ flex: 1 }}>
            <AppText style={styles.evolucaoTitulo}>
              {estado.proxima ? `Rumo a ${estado.proxima.titulo}` : 'Fase máxima!'}
            </AppText>
            <AppText style={styles.evolucaoSub}>
              {estado.proxima
                ? `Faltam ${estado.xpFaltando} XP para o Broxis crescer`
                : 'Seu Broxis está completamente crescido 🎉'}
            </AppText>
            <View style={{ marginTop: 10 }}>
              <ProgressBar progress={estado.progresso} />
            </View>
          </View>
          <Ionicons name="leaf" size={40} color={colors.primary} style={{ marginLeft: 14 }} />
        </View>

        {/* Dados pessoais */}
        <View style={styles.cardDados}>
          {dataFormatada && <Linha rotulo="Data de nascimento" valor={dataFormatada} />}
          {idade ? <Linha rotulo="Idade" valor={String(idade)} /> : null}
          {perfil?.tipoInstituicao && <Linha rotulo="Instituição" valor={perfil.tipoInstituicao} />}
        </View>

        <CreditosApp />

        <LogoutButton />
      </ScrollView>
      <ChatFab />
    </SafeAreaView>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={styles.linha}>
      <AppText style={styles.label}>{rotulo}</AppText>
      <AppText style={styles.valor}>{valor}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: FUNDO },
  conteudo: { paddingHorizontal: 20, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 30, marginBottom: 8 },
  titulo: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: typography.bold, color: colors.primaryDark },
  heroi: { alignItems: 'center', marginBottom: 12 },
  nomeLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  nome: { fontSize: 24, fontFamily: typography.bold, color: colors.primaryDark },
  chipFase: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  chipFaseTexto: { fontSize: 11, fontFamily: typography.bold, color: colors.primaryDark },
  barra: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', marginTop: 14, paddingHorizontal: 8 },
  barraRotulo: { width: 28, fontSize: 12, fontFamily: typography.bold, color: colors.primaryDark },
  barraValor: { minWidth: 40, textAlign: 'right', fontSize: 12, fontFamily: typography.bold, color: colors.primaryDark },
  secaoTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10 },
  secaoTitulo: { fontSize: 14, fontFamily: typography.bold, color: colors.primaryDark },
  secaoLado: { fontSize: 12, fontFamily: typography.semiBold, color: colors.placeholder },
  insigniasLinha: { gap: 12, paddingRight: 8, paddingBottom: 10 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, columnGap: 6, justifyContent: 'flex-start' },
  detalheInsignia: { marginTop: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  detalheTitulo: { fontSize: 14, fontFamily: typography.bold, color: colors.primaryDark },
  detalheTexto: { fontSize: 12, color: colors.trilhaChipTexto, marginTop: 2 },
  cardEvolucao: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    borderRadius: 22,
    padding: 18,
  },
  evolucaoTitulo: { fontSize: 15, fontFamily: typography.bold, color: '#fff' },
  evolucaoSub: { fontSize: 12, color: colors.textOnDarkMuted, marginTop: 2 },
  cardDados: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginTop: 22, marginBottom: 20 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 5 },
  label: { fontSize: 12, fontFamily: typography.semiBold, color: colors.placeholder },
  valor: { fontSize: 14, fontFamily: typography.bold, color: colors.primaryDark },
});
