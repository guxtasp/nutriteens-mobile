// src/features/admin/screens/UsuariosScreen.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppText } from '../../../shared/ui/AppText';
import { LabeledInput } from '../../../shared/ui/LabeledInput';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { Papel, UsuarioAdmin, labelPapel, listarUsuarios } from '../services/usuariosAdminService';

const LARGURA_DESKTOP = 760;

const FILTROS: { label: string; valor: Papel | 'TODOS' }[] = [
  { label: 'Todos', valor: 'TODOS' },
  { label: 'Adolescentes', valor: 'ADOLESCENTE' },
  { label: 'Nutricionistas', valor: 'NUTRICIONISTA' },
  { label: 'Administradores', valor: 'ADMINISTRADOR' },
];

function formatarData(iso: string | null): string {
  if (!iso) return '—';
  const data = new Date(iso);
  return data.toLocaleDateString('pt-BR');
}

function ChipFiltro({ label, ativo, onPress }: { label: string; ativo: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, ativo && styles.chipAtivo]} onPress={onPress}>
      <AppText style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{label}</AppText>
    </Pressable>
  );
}

export default function UsuariosScreen() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroPapel, setFiltroPapel] = useState<Papel | 'TODOS'>('TODOS');
  const { width } = useWindowDimensions();
  const ehDesktop = width >= LARGURA_DESKTOP;

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setCarregando(true);
      listarUsuarios().then((lista) => {
        if (ativo) {
          setUsuarios(lista);
          setCarregando(false);
        }
      });
      return () => {
        ativo = false;
      };
    }, [])
  );

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const passaPapel = filtroPapel === 'TODOS' || u.papel === filtroPapel;
      const passaBusca =
        busca.trim().length === 0 ||
        u.nome?.toLowerCase().includes(busca.trim().toLowerCase()) ||
        u.codigoParticipante?.toLowerCase().includes(busca.trim().toLowerCase());
      return passaPapel && passaBusca;
    });
  }, [usuarios, busca, filtroPapel]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AppText style={styles.titulo}>Usuários ({usuariosFiltrados.length})</AppText>
        <View style={styles.busca}>
          <LabeledInput
            label="Buscar"
            placeholder="Nome ou código..."
            value={busca}
            onChangeText={setBusca}
          />
        </View>
      </View>

      <View style={styles.filtros}>
        {FILTROS.map((f) => (
          <ChipFiltro
            key={f.valor}
            label={f.label}
            ativo={filtroPapel === f.valor}
            onPress={() => setFiltroPapel(f.valor)}
          />
        ))}
      </View>

      {carregando ? (
        <ActivityIndicator color={colors.primaryDark} style={{ marginTop: 40 }} />
      ) : usuariosFiltrados.length === 0 ? (
        <AppText style={styles.vazio}>Nenhum usuário encontrado.</AppText>
      ) : ehDesktop ? (
        <View style={styles.tabela}>
          <View style={[styles.linha, styles.linhaCabecalho]}>
            <AppText style={[styles.celulaCabecalho, styles.colNome]}>Nome</AppText>
            <AppText style={[styles.celulaCabecalho, styles.colPapel]}>Papel</AppText>
            <AppText style={[styles.celulaCabecalho, styles.colCodigo]}>Código</AppText>
            <AppText style={[styles.celulaCabecalho, styles.colInstituicao]}>Instituição</AppText>
            <AppText style={[styles.celulaCabecalho, styles.colData]}>Cadastro</AppText>
          </View>
          <FlatList
            data={usuariosFiltrados}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.linha}>
                <AppText style={[styles.celula, styles.colNome]} numberOfLines={1}>
                  {item.nome ?? '—'}
                </AppText>
                <View style={styles.colPapel}>
                  <View style={styles.badgePapel}>
                    <AppText style={styles.badgePapelTexto}>{labelPapel(item.papel)}</AppText>
                  </View>
                </View>
                <AppText style={[styles.celula, styles.colCodigo]}>{item.codigoParticipante ?? '—'}</AppText>
                <AppText style={[styles.celula, styles.colInstituicao]} numberOfLines={1}>
                  {item.instituicaoEnsino ?? '—'}
                </AppText>
                <AppText style={[styles.celula, styles.colData]}>{formatarData(item.criadoEm)}</AppText>
              </View>
            )}
          />
        </View>
      ) : (
        <FlatList
          data={usuariosFiltrados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTopo}>
                <AppText style={styles.cardNome}>{item.nome ?? '—'}</AppText>
                <View style={styles.badgePapel}>
                  <AppText style={styles.badgePapelTexto}>{labelPapel(item.papel)}</AppText>
                </View>
              </View>
              {item.codigoParticipante && (
                <AppText style={styles.cardLinha}>Código: {item.codigoParticipante}</AppText>
              )}
              {item.instituicaoEnsino && (
                <AppText style={styles.cardLinha}>{item.instituicaoEnsino}</AppText>
              )}
              <AppText style={styles.cardData}>Cadastrado em {formatarData(item.criadoEm)}</AppText>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 24, paddingTop: 20, maxWidth: 1100, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 },
  titulo: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  busca: { minWidth: 220, flexGrow: 1, maxWidth: 320 },
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#D9D9D9' },
  chipAtivo: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  chipTexto: { fontFamily: typography.medium, fontSize: 12, color: '#6B7280' },
  chipTextoAtivo: { color: colors.white },
  vazio: { fontFamily: typography.regular, fontSize: 14, color: '#8A8A8A', textAlign: 'center', marginTop: 40 },

  // Tabela (desktop)
  tabela: { flex: 1 },
  linha: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEF0EF', paddingVertical: 12 },
  linhaCabecalho: { borderBottomWidth: 2, borderBottomColor: '#D9D9D9' },
  celula: { fontFamily: typography.regular, fontSize: 13, color: colors.textOnLight, paddingRight: 8 },
  celulaCabecalho: { fontFamily: typography.bold, fontSize: 12, color: '#8A8A8A', textTransform: 'uppercase' },
  colNome: { flex: 2 },
  colPapel: { flex: 1 },
  colCodigo: { flex: 1 },
  colInstituicao: { flex: 2 },
  colData: { flex: 1 },

  badgePapel: { alignSelf: 'flex-start', backgroundColor: '#EAF5DE', borderRadius: 12, paddingVertical: 3, paddingHorizontal: 10 },
  badgePapelTexto: { fontFamily: typography.medium, fontSize: 11, color: colors.primaryDark },

  // Cards (mobile)
  lista: { paddingBottom: 40 },
  card: { borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardNome: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark, flexShrink: 1, marginRight: 8 },
  cardLinha: { fontFamily: typography.regular, fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardData: { fontFamily: typography.regular, fontSize: 11, color: '#8A8A8A', marginTop: 6 },
});