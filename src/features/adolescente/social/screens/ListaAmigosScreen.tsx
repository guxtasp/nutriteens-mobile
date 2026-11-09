// src/features/adolescente/social/screens/ListaAmigosScreen.tsx
//
// "Sua turma": lista completa de amigos, para qualquer quantidade. Carrega de 30 em 30 e a busca por
// apelido consulta o servidor. Reaproveita ScreenHeader, AbasSegmentadas, AvatarSocialView e EnviarCartinhaSheet.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { listarAmigosPagina, type AmigoDaLista, type FiltroAmigos } from '../services/socialService';
import { turma, HOJE } from '../theme/turma';
import AbasSegmentadas from '../components/AbasSegmentadas';
import { AvatarSocialView } from '../components/AvatarSocialView';
import { EnviarCartinhaSheet } from '../components/EnviarCartinhaSheet';

type Nav = NativeStackNavigationProp<AdolescenteStackParamList>;

const TAMANHO_PAGINA = 30;
const ABAS: { chave: FiltroAmigos; rotulo: string }[] = [
  { chave: 'todos', rotulo: 'Todos' },
  { chave: 'hoje', rotulo: HOJE.filtro },
  { chave: 'recentes', rotulo: 'Mais recentes' },
];

type Item = { tipo: 'letra'; letra: string; id: string } | { tipo: 'amigo'; amigo: AmigoDaLista; id: string };

function inicial(apelido: string): string {
  const c = apelido.trim().charAt(0).toUpperCase();
  return /[A-ZÀ-Ý]/.test(c) ? c.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '#';
}

export default function ListaAmigosScreen() {
  const navigation = useNavigation<Nav>();
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [filtro, setFiltro] = useState<FiltroAmigos>('todos');
  const [amigos, setAmigos] = useState<AmigoDaLista[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState(false);
  const [amigoCartinha, setAmigoCartinha] = useState<{ amizadeId: string; apelido: string } | null>(null);
  // descarta respostas de buscas antigas (digitou de novo antes de chegar)
  const versao = useRef(0);

  // debounce da busca
  useEffect(() => {
    const t = setTimeout(() => setBuscaAplicada(busca), 350);
    return () => clearTimeout(t);
  }, [busca]);

  useEffect(() => {
    const minha = ++versao.current;
    setCarregando(true);
    setErro(false);
    listarAmigosPagina(buscaAplicada, filtro, 0, TAMANHO_PAGINA)
      .then((r) => {
        if (minha !== versao.current) return;
        setAmigos(r.itens);
        setTotal(r.total);
      })
      .catch(() => minha === versao.current && setErro(true))
      .finally(() => minha === versao.current && setCarregando(false));
  }, [buscaAplicada, filtro]);

  const carregarMais = useCallback(() => {
    if (carregando || carregandoMais || amigos.length >= total) return;
    const minha = versao.current;
    setCarregandoMais(true);
    listarAmigosPagina(buscaAplicada, filtro, amigos.length, TAMANHO_PAGINA)
      .then((r) => {
        if (minha !== versao.current) return;
        setAmigos((atual) => {
          const ids = new Set(atual.map((a) => a.amizadeId));
          return [...atual, ...r.itens.filter((a) => !ids.has(a.amizadeId))];
        });
        setTotal(r.total);
      })
      .catch(() => undefined)
      .finally(() => setCarregandoMais(false));
  }, [carregando, carregandoMais, amigos.length, total, buscaAplicada, filtro]);

  // A-Z só quando a ordem é alfabética; em "Mais recentes" a lista segue a ordem de chegada.
  const itens = useMemo<Item[]>(() => {
    if (filtro === 'recentes') return amigos.map((a) => ({ tipo: 'amigo', amigo: a, id: a.amizadeId }));
    const saida: Item[] = [];
    let atual = '';
    for (const a of amigos) {
      const l = inicial(a.apelido);
      if (l !== atual) {
        atual = l;
        saida.push({ tipo: 'letra', letra: l, id: `letra-${l}` });
      }
      saida.push({ tipo: 'amigo', amigo: a, id: a.amizadeId });
    }
    return saida;
  }, [amigos, filtro]);

  const nTotal = total.toLocaleString('pt-BR');

  function renderItem({ item }: { item: Item }) {
    if (item.tipo === 'letra') return <AppText style={estilos.letra}>{item.letra}</AppText>;
    const a = item.amigo;
    return (
      <TouchableOpacity
        style={estilos.linha}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('PerfilAmigo', { amizadeId: a.amizadeId, apelido: a.apelido, avatar: a.avatar })}
        accessibilityRole="button"
        accessibilityLabel={`Ver perfil de ${a.apelido}${a.mantemHoje ? ', cumpriu o dia hoje' : ''}`}
      >
        <View style={[estilos.anel, a.mantemHoje && estilos.anelAtivo]}>
          <AvatarSocialView avatar={a.avatar} size="small" />
        </View>
        <View style={{ flex: 1 }}>
          <AppText style={estilos.nome} numberOfLines={1}>{a.apelido}</AppText>
          {a.mantemHoje && <AppText style={estilos.hoje}>{HOJE.selo}</AppText>}
        </View>
        <TouchableOpacity
          style={estilos.carta}
          onPress={() => setAmigoCartinha({ amizadeId: a.amizadeId, apelido: a.apelido })}
          accessibilityRole="button"
          accessibilityLabel={`Mandar cartinha para ${a.apelido}`}
        >
          <Ionicons name="mail-outline" size={20} color="#C2477D" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top']}>
      <ScreenHeader titulo="Sua turma" subtitulo={`${nTotal} ${total === 1 ? 'amigo' : 'amigos'}`} onVoltar={() => navigation.goBack()} style={{ paddingHorizontal: 20 }} />

      <View style={estilos.topo}>
        <View style={estilos.busca}>
          <Ionicons name="search" size={20} color="#5A6B64" />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar amigo pelo apelido"
            placeholderTextColor="#8A9A93"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            style={estilos.buscaInput}
            accessibilityLabel="Buscar amigo pelo apelido"
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')} hitSlop={10} accessibilityLabel="Limpar busca">
              <Ionicons name="close-circle" size={18} color="#8A9A93" />
            </TouchableOpacity>
          )}
        </View>
        <AbasSegmentadas abas={ABAS} atual={filtro} aoMudar={setFiltro} cor={colors.primaryDark} />
      </View>

      {carregando ? (
        <ActivityIndicator color={colors.primaryDark} style={{ marginTop: 40 }} />
      ) : erro ? (
        <AppText style={estilos.aviso}>Não foi possível carregar sua turma. Tente de novo daqui a pouco.</AppText>
      ) : amigos.length === 0 ? (
        <AppText style={estilos.aviso}>
          {buscaAplicada ? 'Ninguém com esse apelido na sua turma.' : filtro === 'hoje' ? 'Ninguém da turma cumpriu o dia ainda. Bora abrir o caminho!' : 'Sua turma ainda está vazia.'}
        </AppText>
      ) : (
        <FlatList
          data={itens}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          onEndReached={carregarMais}
          onEndReachedThreshold={0.6}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={estilos.lista}
          ListFooterComponent={
            carregandoMais ? <AppText style={estilos.rodape}>Carregando mais amigos...</AppText> : null
          }
        />
      )}

      <EnviarCartinhaSheet amigo={amigoCartinha} onFechar={() => setAmigoCartinha(null)} />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: turma.fundo },
  topo: { paddingHorizontal: 20, gap: 12, marginBottom: 6 },
  busca: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 14, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: turma.borda },
  buscaInput: { flex: 1, fontFamily: typography.regular, fontSize: 15, color: colors.primaryDark, paddingVertical: 8 },
  lista: { paddingHorizontal: 20, paddingBottom: 40 },
  letra: { fontFamily: typography.bold, fontSize: 14, color: turma.textoSuave, marginTop: 16, marginBottom: 6 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, paddingHorizontal: 12, marginBottom: 8, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: turma.borda },
  anel: { padding: 2, borderRadius: 26, borderWidth: 2, borderColor: 'transparent' },
  anelAtivo: { borderColor: colors.primary },
  nome: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },
  hoje: { fontFamily: typography.semiBold, fontSize: 12, color: '#C2610F', marginTop: 1 },
  carta: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FCE6EF', alignItems: 'center', justifyContent: 'center' },
  aviso: { fontFamily: typography.regular, fontSize: 14, lineHeight: 20, color: turma.textoSuave, textAlign: 'center', marginTop: 40, paddingHorizontal: 32 },
  rodape: { fontFamily: typography.regular, fontSize: 13, color: turma.textoSuave, textAlign: 'center', paddingVertical: 16 },
});
