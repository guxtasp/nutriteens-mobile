// src/features/conteudo/screens/EditarReceitaScreen.tsx
// Criar uma receita nova ou editar título, tempo, porções, dificuldade, modo de preparo e passos.
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { CampoBusca } from '../../../shared/painel/components/ControlesLista';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { LabeledInput } from '../../../shared/ui/LabeledInput';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { painel } from '../../../shared/painel/painelTheme';
import type { ConfigPainel } from '../../../shared/painel/types';
import {
  PassoEditavel, ReceitaEditavel, buscarReceitaEditavel, criarReceita, listarPratos, removerPasso, salvarPasso, salvarReceita,
} from '../services/edicaoService';
import { obterPapelAtual } from '../services/conteudoService';
import type { Papel } from '../utils/regrasAprovacao';
import { AvisoEdicao, BarraSalvar, campoMultilinha, numeroOuNulo } from '../components/CamposEdicao';

type Props = { config: ConfigPainel; route: { params?: { receitaId?: string } } };
const DIFICULDADES = [
  { chave: 'FACIL', label: 'Fácil' },
  { chave: 'MEDIO', label: 'Médio' },
  { chave: 'DIFICIL', label: 'Difícil' },
];

export default function EditarReceitaScreen({ config, route }: Props) {
  const receitaId = route.params?.receitaId;
  const criando = !receitaId;
  const navigation = useNavigation<any>();
  const [papel, setPapel] = useState<Papel | null>(null);
  const [original, setOriginal] = useState<ReceitaEditavel | null>(null);
  const [titulo, setTitulo] = useState('');
  const [modo, setModo] = useState('');
  const [tempo, setTempo] = useState('');
  const [porcoes, setPorcoes] = useState('');
  const [dificuldade, setDificuldade] = useState('FACIL');
  const [passos, setPassos] = useState<PassoEditavel[]>([]);
  const [removidos, setRemovidos] = useState<string[]>([]);
  const [buscaPrato, setBuscaPrato] = useState('');
  const [pratos, setPratos] = useState<{ id: string; nome: string }[]>([]);
  const [prato, setPrato] = useState<{ id: string; nome: string } | null>(null);
  const [carregando, setCarregando] = useState(!criando);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { obterPapelAtual().then(setPapel); }, []);

  useEffect(() => {
    if (!criando) return;
    const t = setTimeout(() => {
      listarPratos(buscaPrato).then(setPratos).catch((e) => setErro(e?.message ?? 'Não foi possível buscar pratos.'));
    }, 300);
    return () => clearTimeout(t);
  }, [criando, buscaPrato]);

  const carregar = useCallback(async () => {
    if (!receitaId) return;
    try {
      const r = await buscarReceitaEditavel(receitaId);
      setOriginal(r);
      setTitulo(r.titulo);
      setModo(r.modoPreparo);
      setTempo(r.tempoPreparoMin != null ? String(r.tempoPreparoMin) : '');
      setPorcoes(r.porcoes != null ? String(r.porcoes) : '');
      setDificuldade(r.dificuldade);
      setPassos(r.passos);
      setRemovidos([]);
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível abrir a receita.');
    } finally {
      setCarregando(false);
    }
  }, [receitaId]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const mudarPasso = (i: number, campo: 'titulo' | 'descricao', v: string) =>
    setPassos((a) => a.map((p, k) => (k === i ? { ...p, [campo]: v } : p)));
  const novoPasso = () => setPassos((a) => [...a, { id: null, ordem: a.length + 1, titulo: '', descricao: '' }]);
  const tirarPasso = (i: number) =>
    setPassos((a) => {
      const p = a[i];
      if (p?.id) setRemovidos((r) => [...r, p.id as string]);
      return a.filter((_, k) => k !== i).map((x, k) => ({ ...x, ordem: k + 1 }));
    });

  async function salvar() {
    if (titulo.trim().length < 3) return setErro('Dê um título com pelo menos 3 letras.');
    if (modo.trim().length < 10) return setErro('Escreva o modo de preparo (resumo).');
    if (criando && !prato) return setErro('Escolha o prato que esta receita produz.');
    if (passos.some((p) => p.titulo.trim().length === 0 || p.descricao.trim().length === 0)) return setErro('Todo passo precisa de título e descrição (ou remova o passo).');
    const dados = { titulo, modoPreparo: modo, tempoPreparoMin: numeroOuNulo(tempo), porcoes: numeroOuNulo(porcoes), dificuldade };
    setOcupado(true);
    setErro(null);
    setMsg(null);
    try {
      let id = receitaId;
      if (criando) {
        id = await criarReceita(prato!.id, dados);
      } else if (original) {
        const mudou =
          titulo.trim() !== original.titulo || modo.trim() !== original.modoPreparo.trim() ||
          dados.tempoPreparoMin !== original.tempoPreparoMin || dados.porcoes !== original.porcoes || dificuldade !== original.dificuldade;
        if (mudou) await salvarReceita(original.id, dados);
      }
      for (const rid of removidos) await removerPasso(rid);
      for (const p of passos) {
        const antes = original?.passos.find((x) => x.id === p.id);
        if (!antes || antes.ordem !== p.ordem || antes.titulo !== p.titulo.trim() || antes.descricao !== p.descricao.trim()) {
          await salvarPasso(id!, p);
        }
      }
      if (criando) {
        navigation.replace('EditarReceita', { receitaId: id });
      } else {
        await carregar();
        setMsg('Receita salva.');
      }
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível salvar.');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <PainelLayout config={config} titulo={criando ? 'Nova receita' : 'Editar receita'} subtitulo={criando ? 'A receita nasce como rascunho' : original?.titulo} voltar>
      {carregando ? (
        <EstadoCarregando />
      ) : !criando && !original ? (
        <EstadoErro mensagem={erro ?? 'Receita não encontrada.'} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : (
        <>
          <AvisoEdicao papel={papel} />

          {criando && (
            <CartaoSecao titulo="Prato que a receita produz" ajuda="Toda receita está ligada a um prato do catálogo de alimentos (prato composto). Se o prato não existe, peça para cadastrá-lo em Alimentos.">
              {prato ? (
                <View style={styles.pratoEscolhido}>
                  <AppText style={styles.pratoNome}>{prato.nome}</AppText>
                  <Pressable onPress={() => setPrato(null)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
                    <AppText style={styles.link}>Trocar</AppText>
                  </Pressable>
                </View>
              ) : (
                <>
                  <CampoBusca valor={buscaPrato} onChange={setBuscaPrato} placeholder="Buscar prato (ex.: arroz com feijão)" />
                  {pratos.length === 0 && <AppText style={styles.suave}>Nenhum prato composto encontrado. Cadastre o prato em Alimentos primeiro.</AppText>}
                  {pratos.map((p) => (
                    <Pressable key={p.id} onPress={() => setPrato(p)} accessibilityRole="button" style={styles.prato}>
                      <AppText style={styles.pratoNome}>{p.nome}</AppText>
                    </Pressable>
                  ))}
                </>
              )}
            </CartaoSecao>
          )}

          <CartaoSecao titulo="Dados da receita" ajuda="Informações mostradas ao adolescente na receita.">
            <LabeledInput label="Título" value={titulo} onChangeText={setTitulo} maxLength={120} />
            <View style={styles.linha}>
              <View style={{ flex: 1, minWidth: 140 }}><LabeledInput label="Tempo (min)" value={tempo} onChangeText={setTempo} keyboardType="numeric" maxLength={3} /></View>
              <View style={{ flex: 1, minWidth: 140 }}><LabeledInput label="Porções" value={porcoes} onChangeText={setPorcoes} keyboardType="numeric" maxLength={2} /></View>
            </View>
            <View style={{ gap: 6 }}>
              <AppText style={styles.rotulo}>Dificuldade</AppText>
              <View style={styles.linha}>
                {DIFICULDADES.map((d) => (
                  <Pressable key={d.chave} onPress={() => setDificuldade(d.chave)} accessibilityRole="button" style={[styles.chip, dificuldade === d.chave && styles.chipOn]}>
                    <AppText style={[styles.chipTexto, dificuldade === d.chave && { color: colors.white }]}>{d.label}</AppText>
                  </Pressable>
                ))}
              </View>
            </View>
            <LabeledInput label="Modo de preparo (resumo)" value={modo} onChangeText={setModo} multiline style={campoMultilinha} />
          </CartaoSecao>

          <CartaoSecao titulo="Passo a passo" subtitulo="Guia que o adolescente segue ao cozinhar" ajuda="Cada passo tem título curto e descrição. A ordem é a da lista.">
            {passos.length === 0 && <AppText style={styles.suave}>Nenhum passo ainda.</AppText>}
            {passos.map((p, i) => (
              <View key={p.id ?? `novo-${i}`} style={styles.passo}>
                <AppText style={styles.passoNum}>Passo {p.ordem}</AppText>
                <LabeledInput label="Título" value={p.titulo} onChangeText={(t) => mudarPasso(i, 'titulo', t)} maxLength={80} />
                <LabeledInput label="Descrição" value={p.descricao} onChangeText={(t) => mudarPasso(i, 'descricao', t)} multiline style={{ minHeight: 72, textAlignVertical: 'top' }} />
                <View style={{ flexDirection: 'row' }}>
                  <AppButton label="REMOVER PASSO" fullWidth={false} size="compact" outlineColor={colors.error} textColor={colors.error} style={styles.botao} onPress={() => tirarPasso(i)} />
                </View>
              </View>
            ))}
            <View style={{ flexDirection: 'row' }}>
              <AppButton label="+ ADICIONAR PASSO" fullWidth={false} size="compact" outlineColor={colors.primaryDark} textColor={colors.primaryDark} style={styles.botao} onPress={novoPasso} />
            </View>
          </CartaoSecao>

          <BarraSalvar rotulo={criando ? 'CRIAR RECEITA' : 'SALVAR RECEITA'} ocupado={ocupado} onSalvar={salvar} onCancelar={() => navigation.goBack()} erro={erro} mensagem={msg} />
        </>
      )}
    </PainelLayout>
  );
}

const styles = StyleSheet.create({
  rotulo: { fontFamily: typography.regular, fontSize: 14, color: colors.primaryDark },
  suave: { fontFamily: typography.regular, fontSize: 12, color: painel.textoSuave },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 20, borderWidth: 2, borderColor: painel.cardBorda, justifyContent: 'center', backgroundColor: painel.card },
  chipOn: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  chipTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
  passo: { borderWidth: 2, borderColor: painel.cardBorda, borderRadius: 14, padding: 12, gap: 4 },
  passoNum: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark },
  botao: { paddingHorizontal: 14, minHeight: 44 },
  prato: { minHeight: 48, justifyContent: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#EFEFEF' },
  pratoEscolhido: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pratoNome: { fontFamily: typography.semiBold, fontSize: 14, color: colors.textOnLight, flexShrink: 1 },
  link: { fontFamily: typography.bold, fontSize: 13, color: colors.info },
});
