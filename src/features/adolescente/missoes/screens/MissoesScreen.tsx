import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { BackButton } from '../../../../shared/ui/BackButton';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useMissoes } from '../hooks/useMissoes';
import { MissaoProgressoCard } from '../components/MissaoProgressoCard';
import { textoPrazo } from '../utils/periodos';
import type { MissoesDoPeriodo } from '../services/missoesPeriodicasService';
import { registrarEvento } from '../../../../shared/analytics/analytics';

type Aba = 'DIARIAS' | 'SEMANAIS' | 'MENSAIS';
const ABAS: { chave: Aba; rotulo: string }[] = [
  { chave: 'DIARIAS', rotulo: 'Diárias' },
  { chave: 'SEMANAIS', rotulo: 'Semanais' },
  { chave: 'MENSAIS', rotulo: 'Mensais' },
];
const FUNDO = '#F3F8EE';

export default function MissoesScreen() {
  const navigation = useNavigation();
  const [aba, setAba] = useState<Aba>('DIARIAS');
  const { hoje, historico, semana, mes, recarregar } = useMissoes();

  useFocusEffect(
    useCallback(() => {
      registrarEvento('desafio_visualizado');
    }, [])
  );

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <AppText style={styles.titulo}>Missões</AppText>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.abas}>
        {ABAS.map((a) => (
          <Pressable key={a.chave} onPress={() => setAba(a.chave)} style={[styles.aba, aba === a.chave && styles.abaAtiva]}>
            <AppText style={[styles.abaTexto, aba === a.chave && styles.abaTextoAtivo]}>{a.rotulo}</AppText>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        {aba === 'DIARIAS' && (
          <>
            <AppText style={styles.secao}>HOJE</AppText>
            {hoje.carregando ? (
              <ActivityIndicator color={colors.primaryDark} style={{ marginVertical: 30 }} />
            ) : hoje.erro || !hoje.dados ? (
              <Falha texto="Não consegui carregar a missão de hoje." onTentar={recarregar} />
            ) : (
              <MissaoProgressoCard
                icone={hoje.dados.missao.icone}
                titulo={hoje.dados.missao.titulo}
                descricao={hoje.dados.missao.descricao}
                progresso={hoje.dados.progresso}
                pontos={hoje.dados.missao.pontosRecompensa}
                pontosCreditados={hoje.dados.progresso.concluida}
                rodape="Vale até meia-noite"
              />
            )}

            {!historico.carregando && !historico.erro && (historico.dados?.length ?? 0) > 0 && (
              <>
                <AppText style={styles.secao}>ÚLTIMOS DIAS</AppText>
                <View style={styles.historico}>
                  {historico.dados!.map((h) => (
                    <View key={h.data} style={styles.historicoLinha}>
                      <AppText style={styles.historicoData}>{formatarDia(h.data)}</AppText>
                      <AppText style={styles.historicoTitulo} numberOfLines={1}>
                        {h.icone ?? '🎯'} {h.titulo}
                      </AppText>
                      <Ionicons
                        name={h.cumprida ? 'checkmark-circle' : 'close-circle'}
                        size={22}
                        color={h.cumprida ? colors.success : colors.trilhaNoBloqueadoIcone}
                      />
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {aba === 'SEMANAIS' && <ListaPeriodo secao={semana} periodo="SEMANAL" onTentar={recarregar} />}
        {aba === 'MENSAIS' && <ListaPeriodo secao={mes} periodo="MENSAL" onTentar={recarregar} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function Falha({ texto, onTentar }: { texto: string; onTentar: () => void }) {
  return (
    <View style={styles.falha}>
      <AppText style={styles.erro}>{texto}</AppText>
      <Pressable onPress={onTentar} style={styles.botaoTentar}>
        <AppText style={styles.botaoTentarTexto}>Tentar de novo</AppText>
      </Pressable>
    </View>
  );
}

function ListaPeriodo({
  secao,
  periodo,
  onTentar,
}: {
  secao: { dados: MissoesDoPeriodo | null; erro: boolean; carregando: boolean };
  periodo: 'SEMANAL' | 'MENSAL';
  onTentar: () => void;
}) {
  const nome = periodo === 'SEMANAL' ? 'semanais' : 'mensais';
  if (secao.carregando) return <ActivityIndicator color={colors.primaryDark} style={{ marginTop: 40 }} />;
  if (secao.erro || !secao.dados) return <Falha texto={`Não consegui carregar as missões ${nome}.`} onTentar={onTentar} />;
  const dados = secao.dados;
  if (dados.missoes.length === 0) {
    return <AppText style={styles.erro}>Ainda não há missões {nome} por aqui.</AppText>;
  }
  const feitas = dados.missoes.filter((m) => m.progresso.concluida).length;
  return (
    <>
      <AppText style={styles.resumo}>
        {feitas} de {dados.missoes.length} concluídas · {textoPrazo(dados.intervalo.diasRestantes, periodo)}
      </AppText>
      {dados.missoes.map((m) => (
        <MissaoProgressoCard
          key={m.def.codigo}
          icone={m.def.icone}
          titulo={m.def.titulo}
          descricao={m.def.descricao}
          progresso={m.progresso}
          pontos={m.def.pontos}
          pontosCreditados={m.pontosCreditados}
          rodape={textoPrazo(dados.intervalo.diasRestantes, periodo)}
        />
      ))}
    </>
  );
}

function formatarDia(iso: string): string {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: FUNDO },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 30, marginBottom: 8, paddingHorizontal: 20 },
  titulo: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: typography.bold, color: colors.primaryDark },
  abas: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#E3E8E5', borderRadius: 14, padding: 4 },
  aba: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 11 },
  abaAtiva: { backgroundColor: '#fff' },
  abaTexto: { fontSize: 13, fontFamily: typography.semiBold, color: colors.placeholder },
  abaTextoAtivo: { color: colors.primaryDark, fontFamily: typography.bold },
  conteudo: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60 },
  secao: { fontSize: 13, fontFamily: typography.bold, color: colors.primaryDark, marginBottom: 10, marginTop: 6 },
  resumo: { fontSize: 12, fontFamily: typography.semiBold, color: colors.placeholder, marginBottom: 12 },
  erro: { textAlign: 'center', color: colors.trilhaChipTexto, fontSize: 13 },
  falha: { alignItems: 'center', gap: 12, marginVertical: 30 },
  botaoTentar: { backgroundColor: colors.primaryDark, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 10 },
  botaoTentarTexto: { fontSize: 13, fontFamily: typography.bold, color: '#fff' },
  historico: { backgroundColor: '#fff', borderRadius: 18, paddingVertical: 6, paddingHorizontal: 14 },
  historicoLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  historicoData: { width: 44, fontSize: 12, fontFamily: typography.semiBold, color: colors.placeholder },
  historicoTitulo: { flex: 1, fontSize: 13, fontFamily: typography.semiBold, color: colors.primaryDark },
});
