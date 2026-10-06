// src/features/conteudo/screens/ConteudoDetalheScreen.tsx
// Abre um conteúdo (trilha ou receita) COMPLETO, em qualquer status, antes de qualquer ação.
// VER ≠ EDITAR ≠ APROVAR: Admin e Nutricionista leem tudo; só a nutricionista decide.
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { Colunas } from '../../../shared/painel/components/Colunas';
import { AjudaInfo } from '../../../shared/painel/components/AjudaInfo';
import { IntroSecao } from '../../../shared/painel/components/IntroSecao';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { painel } from '../../../shared/painel/painelTheme';
import type { ConfigPainel } from '../../../shared/painel/types';
import {
  buscarDetalhe,
  transicionar,
  type CorpoReceita,
  type CorpoTrilha,
  type DetalheConteudo,
} from '../services/fluxoService';
import { obterPapelAtual } from '../services/conteudoService';
import {
  ACAO_LABEL,
  ACOES_DECISAO,
  STATUS_AJUDA,
  STATUS_LABEL,
  TIPO_LABEL,
  acoesPermitidas,
  avisoEdicao,
  formatarDataHora,
  permissoes,
  rotuloAcao,
  tomDoStatus,
  validarMotivo,
  type AcaoFluxo,
  type PapelPainel,
  type TomStatus,
} from '../utils/fluxo';

type Props = { config: ConfigPainel; route: { params: { tipo: 'TRILHA' | 'RECEITA'; conteudoId: string } } };

const COR_TOM: Record<TomStatus, { fundo: string; texto: string }> = {
  neutro: { fundo: '#EEF0EF', texto: '#4B4B4B' },
  espera: { fundo: colors.warningSoft, texto: colors.warningShadow },
  ok: { fundo: colors.exercicioAcertoFundo, texto: colors.primaryDark },
  publicado: { fundo: colors.primaryDark, texto: colors.white },
  erro: { fundo: colors.exercicioErroSuave, texto: colors.error },
};
const ROTULO_LICAO: Record<string, string> = { conteudo: 'Conteúdo', quiz: 'Quiz', atividade_rastreavel: 'Hábito' };
const ROTULO_DIFICULDADE: Record<string, string> = { FACIL: 'Fácil', MEDIO: 'Médio', DIFICIL: 'Difícil' };

const CONFIRMACAO: Partial<Record<AcaoFluxo, string>> = {
  APROVAR: 'Confirmar aprovação? Depois de aprovado, o conteúdo ainda precisa ser publicado para os adolescentes verem.',
  PUBLICAR: 'Confirmar? O conteúdo passa a aparecer para os adolescentes no aplicativo.',
  ARQUIVAR: 'Confirmar arquivamento? O conteúdo deixa de aparecer para os adolescentes (pode ser reaberto depois).',
  ENVIAR: 'Enviar para revisão da nutricionista? Você poderá acompanhar o resultado aqui.',
  REABRIR: 'Reabrir como rascunho para poder ajustar e enviar de novo?',
};

function CorpoTrilhaView({ corpo, navigation }: { corpo: CorpoTrilha; navigation: any }) {
  const totalLicoes = corpo.modulos.reduce((s, m) => s + m.licoes.length, 0);
  return (
    <View style={{ gap: 10 }}>
      {!!corpo.descricao && <AppText style={styles.texto}>{corpo.descricao}</AppText>}
      <AppText style={styles.meta}>
        Tema: {corpo.tema} · {corpo.modulos.length} módulo(s) · {totalLicoes} lição(ões)
      </AppText>
      <AppText style={styles.dica}>Toque em uma lição para ler o texto, as perguntas e o gabarito.</AppText>
      {corpo.modulos.map((m) => (
        <View key={m.id} style={styles.bloco}>
          <AppText style={styles.blocoTitulo}>
            Módulo {m.ordem} — {m.titulo}
          </AppText>
          {m.licoes.map((l) => (
            <Pressable
              key={l.id}
              accessibilityRole="button"
              style={styles.licao}
              onPress={() => navigation.navigate('LicaoPreview', { licaoId: l.id })}
            >
              <AppText style={styles.licaoTitulo}>
                {l.ordem}. {l.titulo}
              </AppText>
              <AppText style={styles.meta}>
                {ROTULO_LICAO[l.tipo] ?? l.tipo} · {l.xp} XP  ›
              </AppText>
            </Pressable>
          ))}
          {m.licoes.length === 0 && <AppText style={styles.meta}>Módulo sem lições.</AppText>}
        </View>
      ))}
      {corpo.modulos.length === 0 && <AppText style={styles.meta}>Esta trilha ainda não tem módulos.</AppText>}
    </View>
  );
}

function CorpoReceitaView({ corpo }: { corpo: CorpoReceita }) {
  return (
    <View style={{ gap: 10 }}>
      <AppText style={styles.meta}>
        {corpo.tempo_preparo_min != null ? `${corpo.tempo_preparo_min} min` : 'Tempo não informado'} ·{' '}
        {corpo.porcoes != null ? `${corpo.porcoes} porção(ões)` : 'Porções não informadas'} ·{' '}
        {ROTULO_DIFICULDADE[corpo.dificuldade ?? ''] ?? 'Dificuldade não informada'}
      </AppText>

      <View style={styles.bloco}>
        <AppText style={styles.blocoTitulo}>Ingredientes</AppText>
        {corpo.ingredientes.length === 0 && <AppText style={styles.meta}>Nenhum ingrediente cadastrado.</AppText>}
        {corpo.ingredientes.map((i, k) => (
          <AppText key={k} style={styles.texto}>
            • {i.nome}
            {i.proporcao != null ? ` (${i.proporcao}%)` : ''}
          </AppText>
        ))}
      </View>

      {!!corpo.modo_preparo && (
        <View style={styles.bloco}>
          <AppText style={styles.blocoTitulo}>Modo de preparo (resumo)</AppText>
          <AppText style={styles.texto}>{corpo.modo_preparo}</AppText>
        </View>
      )}

      <View style={styles.bloco}>
        <AppText style={styles.blocoTitulo}>Passo a passo (guia do app)</AppText>
        {corpo.passos.length === 0 && <AppText style={styles.meta}>Nenhum passo cadastrado.</AppText>}
        {corpo.passos.map((p) => (
          <View key={p.ordem} style={{ marginTop: 6 }}>
            <AppText style={styles.licaoTitulo}>
              {p.ordem}. {p.titulo}
            </AppText>
            <AppText style={styles.texto}>{p.descricao}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ConteudoDetalheScreen({ config, route }: Props) {
  const { tipo, conteudoId } = route.params;
  const navigation = useNavigation<any>();
  const [dados, setDados] = useState<DetalheConteudo | null>(null);
  const [papel, setPapel] = useState<PapelPainel | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendente, setPendente] = useState<AcaoFluxo | null>(null);
  const [motivo, setMotivo] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [d, p] = await Promise.all([buscarDetalhe(tipo, conteudoId), obterPapelAtual()]);
      setDados(d);
      setPapel(p === 'NUTRICIONISTA' || p === 'ADMINISTRADOR' ? p : null);
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível abrir o conteúdo.');
    } finally {
      setCarregando(false);
    }
  }, [tipo, conteudoId]);

  useFocusEffect(
    useCallback(() => {
      setCarregando(true);
      carregar();
    }, [carregar])
  );

  async function confirmar(acao: AcaoFluxo) {
    if (acao === 'REJEITAR') {
      const e = validarMotivo(motivo);
      if (e) return setErroAcao(e);
    }
    setOcupado(true);
    setErroAcao(null);
    try {
      await transicionar(tipo, conteudoId, acao, acao === 'REJEITAR' ? motivo : undefined);
      setAviso(`Pronto: ${ACAO_LABEL[acao].toLowerCase()}.`);
      setPendente(null);
      setMotivo('');
      await carregar();
    } catch (e: any) {
      setErroAcao(e?.message ?? 'Não foi possível concluir a ação.');
    } finally {
      setOcupado(false);
    }
  }

  const titulo = dados ? (dados.corpo as any).titulo ?? TIPO_LABEL[tipo] : TIPO_LABEL[tipo];

  return (
    <PainelLayout config={config} titulo={titulo} subtitulo={`${TIPO_LABEL[tipo]} · leitura completa`} voltar>
      {carregando && !dados ? (
        <EstadoCarregando />
      ) : erro || !dados || !papel ? (
        <EstadoErro
          mensagem={erro ?? 'Seu perfil não tem acesso a esta área.'}
          onTentar={() => {
            setCarregando(true);
            carregar();
          }}
        />
      ) : (
        <Detalhe
          dados={dados}
          papel={papel}
          navigation={navigation}
          aviso={aviso}
          erroAcao={erroAcao}
          pendente={pendente}
          motivo={motivo}
          ocupado={ocupado}
          setMotivo={setMotivo}
          escolher={(a) => {
            setErroAcao(null);
            setAviso(null);
            setPendente(a);
          }}
          cancelar={() => {
            setPendente(null);
            setErroAcao(null);
          }}
          confirmar={confirmar}
        />
      )}
    </PainelLayout>
  );
}

function Detalhe(p: {
  dados: DetalheConteudo;
  papel: PapelPainel;
  navigation: any;
  aviso: string | null;
  erroAcao: string | null;
  pendente: AcaoFluxo | null;
  motivo: string;
  ocupado: boolean;
  setMotivo: (t: string) => void;
  escolher: (a: AcaoFluxo) => void;
  cancelar: () => void;
  confirmar: (a: AcaoFluxo) => void;
}) {
  const { dados, papel, pendente } = p;
  const tom = COR_TOM[tomDoStatus(dados.status)];
  const perm = permissoes(papel);
  const acoes = acoesPermitidas(papel, dados.status);
  const aviso = avisoEdicao(papel, dados.status);

  return (
    <>
      <IntroSecao
        chave="detalhe_conteudo"
        titulo="Leia antes de decidir"
        linhas={[
          'Esta página mostra o conteúdo completo, do jeito que os adolescentes verão. As ações ficam depois do conteúdo, de propósito.',
          'Ver, editar e aprovar são permissões diferentes: o Admin consulta e organiza; só a nutricionista aprova, rejeita e publica.',
          'Rejeitar exige um motivo, que aparece para quem criou o conteúdo.',
        ]}
      />

      <View style={styles.card}>
        <View style={styles.linha}>
          <View style={styles.chipTipo}>
            <AppText style={styles.chipTipoTexto}>{TIPO_LABEL[dados.tipo]}</AppText>
          </View>
          <View style={[styles.badge, { backgroundColor: tom.fundo }]}>
            <AppText style={[styles.badgeTexto, { color: tom.texto }]}>{STATUS_LABEL[dados.status]}</AppText>
          </View>
          <AjudaInfo titulo={STATUS_LABEL[dados.status]} texto={STATUS_AJUDA[dados.status]} />
          <AppText style={styles.versao}>versão {dados.versao}</AppText>
        </View>
        <AppText style={styles.meta}>
          Criado por {dados.criadorNome ?? 'sistema'} · {formatarDataHora(dados.criadoEm)}
        </AppText>
        {!!dados.revisadoEm && (
          <AppText style={styles.meta}>
            {dados.status === 'REJEITADO' ? 'Rejeitado' : 'Revisado'} por {dados.revisorNome ?? '—'} · {formatarDataHora(dados.revisadoEm)}
          </AppText>
        )}
        {!!dados.publicadoEm && dados.status === 'PUBLICADO' && (
          <AppText style={styles.meta}>Publicado em {formatarDataHora(dados.publicadoEm)}</AppText>
        )}
        <AppText style={styles.meta}>Última alteração: {formatarDataHora(dados.atualizadoEm)}</AppText>
        {dados.status === 'REJEITADO' && !!dados.motivoRejeicao && (
          <View style={styles.motivo}>
            <AppText style={styles.motivoTitulo}>Motivo da rejeição</AppText>
            <AppText style={styles.texto}>{dados.motivoRejeicao}</AppText>
          </View>
        )}
      </View>

      <Colunas bases={[420, 300]}>
        <CartaoSecao
          titulo="Conteúdo completo"
          subtitulo="Exatamente o que será avaliado"
          ajuda="Aqui você lê tudo antes de qualquer ação. Em trilhas, abra cada lição para ver texto, perguntas e gabarito."
          direita={
            perm.editar ? (
              <AppButton
                label="EDITAR"
                fullWidth={false}
                size="compact"
                outlineColor={colors.primaryDark}
                textColor={colors.primaryDark}
                style={styles.botao}
                onPress={() =>
                  dados.tipo === 'TRILHA'
                    ? p.navigation.navigate('EditarTrilha', { trilhaId: dados.conteudoId })
                    : p.navigation.navigate('EditarReceita', { receitaId: dados.conteudoId })
                }
              />
            ) : undefined
          }
        >
          {dados.tipo === 'TRILHA' ? (
            <CorpoTrilhaView corpo={dados.corpo as CorpoTrilha} navigation={p.navigation} />
          ) : (
            <CorpoReceitaView corpo={dados.corpo as CorpoReceita} />
          )}
        </CartaoSecao>

        <View style={{ gap: 16 }}>
          <CartaoSecao
            titulo="O que você pode fazer"
            ajuda="Ver, editar e aprovar são permissões separadas. Ter acesso para ler não significa poder aprovar."
          >
            <Linha ok={perm.ver} texto="Ver e ler o conteúdo completo, histórico e status" />
            <Linha ok={perm.editar} texto="Editar e organizar o conteúdo" />
            <Linha ok={perm.aprovar} texto="Aprovar ou rejeitar (validação técnica)" />
            <Linha ok={perm.publicar} texto="Publicar para os adolescentes" />
            {!perm.aprovar && (
              <AppText style={styles.dica}>Como administrador, você não assume a responsabilidade técnica: essas decisões são da nutricionista.</AppText>
            )}
            {!!aviso && <AppText style={styles.dica}>{aviso}</AppText>}
          </CartaoSecao>

          <CartaoSecao
            titulo="Histórico"
            subtitulo="Quem fez o quê, e quando"
            ajuda="Registro imutável de cada ação neste conteúdo. A mesma lista completa fica em Auditoria."
          >
            {dados.historico.length === 0 && <AppText style={styles.meta}>Sem registros.</AppText>}
            {dados.historico.map((h, i) => (
              <View key={i} style={styles.hist}>
                <AppText style={styles.histTopo}>
                  {ACAO_LABEL[h.acao as keyof typeof ACAO_LABEL] ?? h.acao}
                  {h.versao ? ` · v${h.versao}` : ''}
                </AppText>
                <AppText style={styles.meta}>
                  {h.atorNome ?? 'sistema'}
                  {h.atorPapel ? ` (${h.atorPapel === 'NUTRICIONISTA' ? 'Nutricionista' : h.atorPapel === 'ADMINISTRADOR' ? 'Administrador' : h.atorPapel})` : ''} · {formatarDataHora(h.criadoEm)}
                </AppText>
                {!!h.motivo && <AppText style={styles.texto}>{h.motivo}</AppText>}
              </View>
            ))}
          </CartaoSecao>
        </View>
      </Colunas>

      <CartaoSecao
        titulo="Ações"
        ajuda="As ações valem para o conteúdo inteiro e ficam registradas na auditoria. Leia o conteúdo acima antes de decidir."
      >
        {!!p.aviso && <AppText style={styles.ok}>{p.aviso}</AppText>}
        {!!p.erroAcao && <AppText style={styles.erro}>{p.erroAcao}</AppText>}

        {!pendente && (
          <View style={styles.acoes}>
            {acoes.map((a) => {
              const principal = ACOES_DECISAO.includes(a) && a !== 'REJEITAR' ? true : a === 'ENVIAR';
              const cor = a === 'REJEITAR' ? colors.error : colors.primaryDark;
              return (
                <AppButton
                  key={a}
                  label={rotuloAcao(a, dados.status)}
                  fullWidth={false}
                  size="compact"
                  {...(principal
                    ? { backgroundColor: colors.primaryDark, textColor: colors.white, shadowColor: '#123024' }
                    : { outlineColor: cor, textColor: cor })}
                  disabled={p.ocupado}
                  style={styles.botao}
                  onPress={() => p.escolher(a)}
                />
              );
            })}
            {acoes.length === 0 && <AppText style={styles.meta}>Nenhuma ação disponível neste status.</AppText>}
          </View>
        )}

        {!!pendente && (
          <View style={{ gap: 10 }}>
            <AppText style={styles.confirma}>
              {pendente === 'REJEITAR' ? 'O que precisa mudar? (obrigatório)' : CONFIRMACAO[pendente]}
            </AppText>
            {pendente === 'REJEITAR' && (
              <TextInput
                value={p.motivo}
                onChangeText={p.setMotivo}
                placeholder="Explique o que precisa ser corrigido"
                placeholderTextColor={colors.placeholder}
                multiline
                maxLength={2000}
                style={styles.input}
              />
            )}
            <View style={styles.acoes}>
              <AppButton
                label={p.ocupado ? 'ENVIANDO…' : `CONFIRMAR: ${rotuloAcao(pendente, dados.status)}`}
                fullWidth={false}
                size="compact"
                {...(pendente === 'REJEITAR'
                  ? { backgroundColor: colors.error, textColor: colors.white, shadowColor: '#7A2018' }
                  : { backgroundColor: colors.primaryDark, textColor: colors.white, shadowColor: '#123024' })}
                disabled={p.ocupado}
                style={styles.botao}
                onPress={() => p.confirmar(pendente)}
              />
              <AppButton
                label="CANCELAR"
                fullWidth={false}
                size="compact"
                outlineColor={colors.primaryDark}
                textColor={colors.primaryDark}
                disabled={p.ocupado}
                style={styles.botao}
                onPress={p.cancelar}
              />
            </View>
          </View>
        )}
      </CartaoSecao>
    </>
  );
}

function Linha({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <AppText style={[styles.texto, !ok && { color: painel.textoSuave }]}>
      {ok ? '✓' : '✗'} {texto}
    </AppText>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: painel.card, borderRadius: painel.cardRaio, borderWidth: 2, borderColor: painel.cardBorda,
    padding: 16, gap: 6, minWidth: 0,
  },
  linha: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  chipTipo: { backgroundColor: '#EAF5DE', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  chipTipoTexto: { fontFamily: typography.bold, fontSize: 11, color: colors.primaryDark },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeTexto: { fontFamily: typography.bold, fontSize: 11 },
  versao: { fontFamily: typography.regular, fontSize: 11, color: painel.textoSuave, marginLeft: 'auto' },
  meta: { fontFamily: typography.regular, fontSize: 12, color: painel.textoSuave },
  texto: { fontFamily: typography.regular, fontSize: 13, color: colors.textOnLight, lineHeight: 19 },
  dica: { fontFamily: typography.regular, fontSize: 12, color: painel.textoSuave, lineHeight: 17 },
  motivo: { backgroundColor: colors.exercicioErroSuave + '55', borderRadius: 12, padding: 10, gap: 2, marginTop: 6 },
  motivoTitulo: { fontFamily: typography.bold, fontSize: 12, color: colors.error },
  bloco: { borderWidth: 2, borderColor: painel.cardBorda, borderRadius: 14, padding: 12, gap: 2 },
  blocoTitulo: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark, marginBottom: 4 },
  licao: { minHeight: 44, justifyContent: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#EFEFEF' },
  licaoTitulo: { fontFamily: typography.semiBold, fontSize: 13, color: colors.textOnLight },
  hist: { borderLeftWidth: 3, borderLeftColor: painel.cardBorda, paddingLeft: 10, gap: 1 },
  histTopo: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  botao: { paddingHorizontal: 14, minHeight: 44 },
  confirma: { fontFamily: typography.semiBold, fontSize: 13, color: colors.primaryDark },
  input: {
    minHeight: 84, borderWidth: 2, borderColor: painel.cardBorda, borderRadius: 12, padding: 10,
    fontFamily: typography.regular, fontSize: 14, color: colors.textOnLight, textAlignVertical: 'top',
  },
  ok: { fontFamily: typography.semiBold, fontSize: 13, color: '#2F6B12', backgroundColor: '#E2F3D3', borderRadius: 10, padding: 10 },
  erro: { fontFamily: typography.regular, fontSize: 13, color: colors.error },
});
