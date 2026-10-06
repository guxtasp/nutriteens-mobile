// src/features/admin/screens/UsuariosScreen.tsx
// Lista de usuários do Admin: dados reais (via função do banco), busca, filtro por papel,
// ordenação e "carregar mais". Toque abre os detalhes. Tabela no desktop, cartões no celular.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { IntroSecao } from '../../../shared/painel/components/IntroSecao';
import { AjudaInfo } from '../../../shared/painel/components/AjudaInfo';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import {
  CampoBusca, ChipsFiltro, RodapeLista, Selo, VazioPainel,
} from '../../../shared/painel/components/ControlesLista';
import { useListaPaginada } from '../../../shared/painel/hooks/useListaPaginada';
import { useModoPainel } from '../../../shared/painel/hooks/useModoPainel';
import { dataCurta, ultimoAcessoTexto } from '../../../shared/painel/formatadores';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { painel } from '../../../shared/painel/painelTheme';
import { ADMIN_PAINEL } from '../navigation/adminMenu';
import { Papel, UsuarioAdmin, labelPapel, listarUsuarios } from '../services/usuariosAdminService';

const FILTROS = [
  { chave: 'TODOS', label: 'Todos' },
  { chave: 'ADOLESCENTE', label: 'Adolescentes' },
  { chave: 'NUTRICIONISTA', label: 'Nutricionistas' },
  { chave: 'ADMINISTRADOR', label: 'Administradores' },
];
const ORDENS = [
  { chave: 'recentes', label: 'Mais recentes' },
  { chave: 'nome', label: 'Nome (A–Z)' },
  { chave: 'acesso', label: 'Último acesso' },
];

function nomeExibido(u: UsuarioAdmin) {
  return u.nome?.trim() || u.apelido?.trim() || 'Sem nome';
}
function SeloStatus({ u }: { u: UsuarioAdmin }) {
  return <Selo texto={u.ativo ? 'Ativo' : 'Inativo'} tom={u.ativo ? 'ok' : 'neutro'} />;
}

export default function UsuariosScreen() {
  const navigation = useNavigation<any>();
  const { modo } = useModoPainel();
  const lista = useListaPaginada<UsuarioAdmin>(
    (p) => listarUsuarios({ busca: p.busca, papel: (p.filtro as Papel) || null, ordem: p.ordem, limite: p.limite, offset: p.offset }),
    { ordemInicial: 'recentes' }
  );
  const abrir = (u: UsuarioAdmin) => navigation.navigate('UsuarioDetalhe', { id: u.id });
  const tabela = modo !== 'celular';

  return (
    <PainelLayout config={ADMIN_PAINEL} titulo="Usuários" subtitulo="Todas as contas do NutriTeens">
      <IntroSecao
        chave="admin_usuarios"
        titulo="Gerenciar usuários"
        linhas={[
          'Aqui ficam as contas de adolescentes, nutricionistas e administradores. Busque por nome, apelido ou código do participante.',
          'Ativo = usou o aplicativo nos últimos 30 dias. Toque em um usuário para ver os detalhes.',
          'Por privacidade, esta área não mostra dados de saúde nem de alimentação dos adolescentes.',
        ]}
      />

      <View style={styles.controles}>
        <CampoBusca valor={lista.busca} onChange={lista.setBusca} placeholder="Buscar por nome, apelido ou código" />
        <ChipsFiltro opcoes={FILTROS} valor={lista.filtro ?? 'TODOS'} onChange={(c) => lista.setFiltro(c === 'TODOS' ? null : c)} />
        <View style={styles.linhaOrdem}>
          <AppText style={styles.ordemRotulo}>Ordenar por</AppText>
          <ChipsFiltro opcoes={ORDENS} valor={lista.ordem} onChange={lista.setOrdem} />
        </View>
      </View>

      {lista.carregando && lista.itens.length === 0 ? (
        <EstadoCarregando />
      ) : lista.erro && lista.itens.length === 0 ? (
        <EstadoErro mensagem={lista.erro} onTentar={lista.recarregar} />
      ) : lista.itens.length === 0 ? (
        <VazioPainel
          titulo="Nenhum usuário encontrado"
          texto={lista.busca || lista.filtro ? 'Tente outra busca ou volte para "Todos".' : 'Ainda não há usuários cadastrados.'}
        />
      ) : (
        <View style={{ gap: 10 }}>
          {tabela && (
            <View style={[styles.linha, styles.cabecalho]}>
              <AppText style={[styles.th, styles.cNome]}>Nome</AppText>
              <AppText style={[styles.th, styles.cPapel]}>Papel</AppText>
              <View style={[styles.cStatus, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                <AppText style={styles.th}>Status</AppText>
                <AjudaInfo titulo="Status" texto="Ativo: usou o aplicativo nos últimos 30 dias. Inativo: sem uso nesse período." />
              </View>
              <AppText style={[styles.th, styles.cCodigo]}>Código</AppText>
              <AppText style={[styles.th, styles.cData]}>Cadastro</AppText>
              <AppText style={[styles.th, styles.cData]}>Último acesso</AppText>
            </View>
          )}
          {lista.itens.map((u) =>
            tabela ? (
              <Pressable key={u.id} onPress={() => abrir(u)} accessibilityRole="button" style={[styles.linha, styles.linhaDado]}>
                <View style={styles.cNome}>
                  <AppText style={styles.nome} numberOfLines={1}>{nomeExibido(u)}</AppText>
                  {!!u.apelido && u.nome !== u.apelido && <AppText style={styles.sub} numberOfLines={1}>@{u.apelido}</AppText>}
                </View>
                <View style={styles.cPapel}><Selo texto={labelPapel(u.papel)} tom="info" /></View>
                <View style={styles.cStatus}><SeloStatus u={u} /></View>
                <AppText style={[styles.td, styles.cCodigo]} numberOfLines={1}>{u.codigoParticipante ?? '—'}</AppText>
                <AppText style={[styles.td, styles.cData]}>{dataCurta(u.criadoEm)}</AppText>
                <AppText style={[styles.td, styles.cData]}>{ultimoAcessoTexto(u.ultimoAcesso)}</AppText>
              </Pressable>
            ) : (
              <Pressable key={u.id} onPress={() => abrir(u)} accessibilityRole="button" style={styles.card}>
                <View style={styles.cardTopo}>
                  <AppText style={[styles.nome, { flexShrink: 1 }]} numberOfLines={2}>{nomeExibido(u)}</AppText>
                  <SeloStatus u={u} />
                </View>
                <View style={styles.cardSelos}>
                  <Selo texto={labelPapel(u.papel)} tom="info" />
                  {!!u.codigoParticipante && <Selo texto={`Código ${u.codigoParticipante}`} />}
                </View>
                <AppText style={styles.sub}>
                  Cadastro {dataCurta(u.criadoEm)} · {ultimoAcessoTexto(u.ultimoAcesso)}
                </AppText>
              </Pressable>
            )
          )}
          <RodapeLista mostrados={lista.itens.length} total={lista.total} temMais={lista.temMais} carregando={lista.carregandoMais} onMais={lista.carregarMais} />
          {!!lista.erro && <AppText style={styles.erro}>{lista.erro}</AppText>}
        </View>
      )}
    </PainelLayout>
  );
}

const styles = StyleSheet.create({
  controles: { gap: 12, marginBottom: 12 },
  linhaOrdem: { gap: 6 },
  ordemRotulo: { fontFamily: typography.medium, fontSize: 12, color: painel.textoSuave },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cabecalho: { paddingHorizontal: 14 },
  linhaDado: {
    backgroundColor: painel.card, borderRadius: 14, borderWidth: 2, borderColor: painel.cardBorda,
    paddingHorizontal: 14, paddingVertical: 12, minHeight: 56,
  },
  th: { fontFamily: typography.bold, fontSize: 11, color: painel.textoSuave, textTransform: 'uppercase' },
  td: { fontFamily: typography.regular, fontSize: 13, color: colors.textOnLight },
  cNome: { flex: 3, minWidth: 0 },
  cPapel: { flex: 2, minWidth: 0 },
  cStatus: { flex: 1.4, minWidth: 0 },
  cCodigo: { flex: 1.6, minWidth: 0 },
  cData: { flex: 1.6, minWidth: 0 },
  nome: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  sub: { fontFamily: typography.regular, fontSize: 12, color: painel.textoSuave },
  card: { backgroundColor: painel.card, borderRadius: painel.cardRaio, borderWidth: 2, borderColor: painel.cardBorda, padding: 14, gap: 8, minHeight: 48 },
  cardTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardSelos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  erro: { fontFamily: typography.regular, fontSize: 12, color: colors.error, textAlign: 'center' },
});
