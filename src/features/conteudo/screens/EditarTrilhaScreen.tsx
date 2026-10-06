// src/features/conteudo/screens/EditarTrilhaScreen.tsx
// Criar uma trilha nova ou editar título/descrição, organizar módulos e abrir cada lição para editar.
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { IntroSecao } from '../../../shared/painel/components/IntroSecao';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { LabeledInput } from '../../../shared/ui/LabeledInput';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { painel } from '../../../shared/painel/painelTheme';
import type { ConfigPainel } from '../../../shared/painel/types';
import {
  TrilhaEditavel, buscarTrilhaEditavel, criarModulo, criarTrilha, listarTemas, renomearModulo, salvarTrilha,
} from '../services/edicaoService';
import { obterPapelAtual } from '../services/conteudoService';
import type { Papel } from '../utils/regrasAprovacao';
import { AvisoEdicao, BarraSalvar, campoMultilinha } from '../components/CamposEdicao';

type Props = { config: ConfigPainel; route: { params?: { trilhaId?: string } } };

export default function EditarTrilhaScreen({ config, route }: Props) {
  const trilhaId = route.params?.trilhaId;
  const criando = !trilhaId;
  const navigation = useNavigation<any>();
  const [papel, setPapel] = useState<Papel | null>(null);
  const [trilha, setTrilha] = useState<TrilhaEditavel | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [temas, setTemas] = useState<string[]>([]);
  const [tema, setTema] = useState('');
  const [novoModulo, setNovoModulo] = useState('');
  const [nomesModulo, setNomesModulo] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(!criando);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    obterPapelAtual().then(setPapel);
    if (criando) listarTemas().then((t) => { setTemas(t); if (t[0]) setTema((atual) => atual || t[0]); }).catch((e) => setErro(e?.message ?? 'Não foi possível carregar os temas.'));
  }, [criando]);

  const carregar = useCallback(async () => {
    if (!trilhaId) return;
    try {
      const t = await buscarTrilhaEditavel(trilhaId);
      setTrilha(t);
      setTitulo(t.titulo);
      setDescricao(t.descricao ?? '');
      setNomesModulo(Object.fromEntries(t.modulos.map((m) => [m.id, m.titulo])));
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível abrir a trilha.');
    } finally {
      setCarregando(false);
    }
  }, [trilhaId]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  async function executar(fn: () => Promise<void>, sucesso: string) {
    setOcupado(true);
    setErro(null);
    setMsg(null);
    try {
      await fn();
      setMsg(sucesso);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível salvar.');
    } finally {
      setOcupado(false);
    }
  }

  async function salvar() {
    if (titulo.trim().length < 3) return setErro('Dê um título com pelo menos 3 letras.');
    if (criando) {
      if (!tema) return setErro('Escolha o tema da trilha.');
      setOcupado(true);
      setErro(null);
      try {
        const id = await criarTrilha({ titulo, descricao, tema });
        navigation.replace('EditarTrilha', { trilhaId: id });
      } catch (e: any) {
        setErro(e?.message ?? 'Não foi possível criar a trilha.');
        setOcupado(false);
      }
      return;
    }
    if (trilha && (titulo.trim() !== trilha.titulo || descricao.trim() !== (trilha.descricao ?? ''))) {
      await executar(async () => { await salvarTrilha(trilha.id, { titulo, descricao }); await carregar(); }, 'Trilha salva.');
    } else {
      setMsg('Nada para salvar: nenhuma alteração.');
    }
  }

  async function adicionarModulo() {
    if (!trilha || novoModulo.trim().length < 2) return setErro('Dê um nome ao módulo.');
    const ordem = (trilha.modulos.reduce((m, x) => Math.max(m, x.ordem), 0) || 0) + 1;
    await executar(async () => { await criarModulo(trilha.id, novoModulo, ordem); setNovoModulo(''); await carregar(); }, 'Módulo adicionado.');
  }

  async function renomear(id: string, original: string) {
    const novo = (nomesModulo[id] ?? '').trim();
    if (novo.length < 2 || novo === original) return;
    await executar(async () => { await renomearModulo(id, novo); await carregar(); }, 'Módulo renomeado.');
  }

  return (
    <PainelLayout config={config} titulo={criando ? 'Nova trilha' : 'Editar trilha'} subtitulo={criando ? 'A trilha nasce como rascunho' : trilha?.titulo} voltar>
      {carregando ? (
        <EstadoCarregando />
      ) : !criando && !trilha ? (
        <EstadoErro mensagem={erro ?? 'Trilha não encontrada.'} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : (
        <>
          <IntroSecao
            chave="editar_trilha"
            titulo="Criar e editar trilhas"
            linhas={[
              'Trilha → módulos → lições. Aqui você muda título e descrição e organiza os módulos; toque em uma lição para corrigir o texto e as perguntas.',
              'Conteúdo novo nasce como rascunho. Depois de salvar, volte à página do conteúdo para enviar para revisão (ou aprovar e publicar, se você for nutricionista).',
            ]}
          />
          <AvisoEdicao papel={papel} />

          <CartaoSecao titulo="Dados da trilha" ajuda="Título e descrição aparecem para os adolescentes quando a trilha é publicada.">
            <LabeledInput label="Título" value={titulo} onChangeText={setTitulo} placeholder="Ex.: Alimentação no dia a dia" maxLength={120} />
            <LabeledInput label="Descrição" value={descricao} onChangeText={setDescricao} placeholder="Resumo curto da trilha" multiline maxLength={500} style={campoMultilinha} />
            {criando && (
              <View style={{ gap: 6 }}>
                <AppText style={styles.rotulo}>Tema</AppText>
                {temas.length === 0 ? (
                  <AppText style={styles.suave}>Carregando temas…</AppText>
                ) : (
                  <View style={styles.chips}>
                    {temas.map((t) => (
                      <Pressable key={t} onPress={() => setTema(t)} accessibilityRole="button" style={[styles.chip, tema === t && styles.chipOn]}>
                        <AppText style={[styles.chipTexto, tema === t && { color: colors.white }]}>{t.replace(/_/g, ' ').toLowerCase()}</AppText>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}
            <BarraSalvar
              rotulo={criando ? 'CRIAR TRILHA' : 'SALVAR'}
              ocupado={ocupado}
              onSalvar={salvar}
              onCancelar={() => navigation.goBack()}
              erro={erro}
              mensagem={msg}
            />
          </CartaoSecao>

          {!criando && trilha && (
            <CartaoSecao titulo="Módulos e lições" subtitulo="Toque em uma lição para editar" ajuda="Cada módulo agrupa lições. Editar uma lição muda o texto, o XP e as perguntas existentes.">
              {trilha.modulos.length === 0 && <AppText style={styles.suave}>Esta trilha ainda não tem módulos. Adicione o primeiro abaixo.</AppText>}
              {trilha.modulos.map((m) => (
                <View key={m.id} style={styles.modulo}>
                  <LabeledInput
                    label={`Módulo ${m.ordem}`}
                    value={nomesModulo[m.id] ?? m.titulo}
                    onChangeText={(t) => setNomesModulo((a) => ({ ...a, [m.id]: t }))}
                    onBlur={() => renomear(m.id, m.titulo)}
                    maxLength={120}
                  />
                  {m.licoes.map((l) => (
                    <Pressable key={l.id} onPress={() => navigation.navigate('EditarLicao', { licaoId: l.id })} accessibilityRole="button" style={styles.licao}>
                      <AppText style={styles.licaoTitulo}>{l.ordem}. {l.titulo}</AppText>
                      <AppText style={styles.suave}>{l.tipo} · {l.xp} XP  ›</AppText>
                    </Pressable>
                  ))}
                  <View style={{ flexDirection: 'row' }}>
                    <AppButton
                      label="+ LIÇÃO DE LEITURA"
                      fullWidth={false}
                      size="compact"
                      outlineColor={colors.primaryDark}
                      textColor={colors.primaryDark}
                      style={styles.botaoPequeno}
                      onPress={() => navigation.navigate('EditarLicao', { moduloId: m.id, proximaOrdem: (m.licoes.reduce((x, l) => Math.max(x, l.ordem), 0) || 0) + 1 })}
                    />
                  </View>
                </View>
              ))}
              <LabeledInput label="Novo módulo" value={novoModulo} onChangeText={setNovoModulo} placeholder="Nome do módulo" maxLength={120} />
              <View style={{ flexDirection: 'row' }}>
                <AppButton
                  label="ADICIONAR MÓDULO"
                  fullWidth={false}
                  size="compact"
                  backgroundColor={colors.primaryDark}
                  textColor={colors.white}
                  shadowColor="#123024"
                  disabled={ocupado}
                  style={styles.botaoPequeno}
                  onPress={adicionarModulo}
                />
              </View>
            </CartaoSecao>
          )}
        </>
      )}
    </PainelLayout>
  );
}

const styles = StyleSheet.create({
  rotulo: { fontFamily: typography.regular, fontSize: 14, color: colors.primaryDark },
  suave: { fontFamily: typography.regular, fontSize: 12, color: painel.textoSuave },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2, borderColor: painel.cardBorda, justifyContent: 'center', backgroundColor: painel.card },
  chipOn: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  chipTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark, textTransform: 'capitalize' },
  modulo: { borderWidth: 2, borderColor: painel.cardBorda, borderRadius: 14, padding: 12, gap: 6 },
  licao: { minHeight: 48, justifyContent: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#EFEFEF' },
  licaoTitulo: { fontFamily: typography.semiBold, fontSize: 13, color: colors.textOnLight },
  botaoPequeno: { paddingHorizontal: 14, minHeight: 44 },
});
