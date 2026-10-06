// src/features/conteudo/screens/EditarLicaoScreen.tsx
// Editar uma lição existente (título, XP, texto, enunciados e alternativas) ou criar uma
// lição de leitura nova dentro de um módulo. Só altera o que mudou, para não subir a versão
// do conteúdo à toa. Estruturas complexas (pares, colunas) ficam como estão.
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { AppText } from '../../../shared/ui/AppText';
import { LabeledInput } from '../../../shared/ui/LabeledInput';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { painel } from '../../../shared/painel/painelTheme';
import type { ConfigPainel } from '../../../shared/painel/types';
import {
  LicaoEditavel, buscarLicaoEditavel, criarLicaoLeitura, salvarLicao, salvarOpcao, salvarQuestao,
} from '../services/edicaoService';
import { obterPapelAtual } from '../services/conteudoService';
import { ROTULO_FORMATO } from '../utils/descreverQuestao';
import type { Papel } from '../utils/regrasAprovacao';
import { AvisoEdicao, BarraSalvar, campoMultilinha, numeroOuNulo } from '../components/CamposEdicao';

type Props = { config: ConfigPainel; route: { params?: { licaoId?: string; moduloId?: string; proximaOrdem?: number } } };

const FORMATOS_COM_CORRETA = ['multipla_escolha', 'verdadeiro_falso', 'completar'];

export default function EditarLicaoScreen({ config, route }: Props) {
  const { licaoId, moduloId, proximaOrdem } = route.params ?? {};
  const criando = !licaoId;
  const navigation = useNavigation<any>();
  const [papel, setPapel] = useState<Papel | null>(null);
  const [licao, setLicao] = useState<LicaoEditavel | null>(null);
  const [titulo, setTitulo] = useState('');
  const [xp, setXp] = useState('10');
  const [texto, setTexto] = useState('');
  const [enunciados, setEnunciados] = useState<Record<string, string>>({});
  const [cartoes, setCartoes] = useState<Record<string, string>>({});
  const [opcoes, setOpcoes] = useState<Record<string, { texto: string; correta: boolean }>>({});
  const [carregando, setCarregando] = useState(!criando);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { obterPapelAtual().then(setPapel); }, []);

  const carregar = useCallback(async () => {
    if (!licaoId) return;
    try {
      const l = await buscarLicaoEditavel(licaoId);
      setLicao(l);
      setTitulo(l.titulo);
      setXp(String(l.xp));
      setTexto(typeof l.conteudo?.texto === 'string' ? l.conteudo.texto : '');
      setEnunciados(Object.fromEntries(l.questoes.map((q) => [q.id, q.enunciado])));
      setCartoes(Object.fromEntries(l.questoes.filter((q) => q.formato === 'cartao').map((q) => [q.id, String(q.dadosExtra?.texto ?? '')])));
      setOpcoes(Object.fromEntries(l.questoes.flatMap((q) => q.opcoes.map((o) => [o.id, { texto: o.texto, correta: o.correta }]))));
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível abrir a lição.');
    } finally {
      setCarregando(false);
    }
  }, [licaoId]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  async function salvar() {
    const xpNum = numeroOuNulo(xp);
    if (titulo.trim().length < 2) return setErro('Dê um título à lição.');
    if (xpNum == null || xpNum < 0 || xpNum > 500) return setErro('XP deve ser um número entre 0 e 500.');
    setOcupado(true);
    setErro(null);
    setMsg(null);
    try {
      if (criando) {
        if (!moduloId) throw new Error('Módulo não informado.');
        if (texto.trim().length < 10) throw new Error('Escreva o texto da lição (mínimo de 10 letras).');
        await criarLicaoLeitura(moduloId, { titulo, texto, xp: xpNum, ordem: proximaOrdem ?? 1 });
        navigation.goBack();
        return;
      }
      if (!licao) return;
      let alterou = false;
      const textoMudou = typeof licao.conteudo?.texto === 'string' && texto !== licao.conteudo.texto;
      if (titulo.trim() !== licao.titulo || xpNum !== licao.xp || textoMudou) {
        await salvarLicao(licao.id, {
          titulo,
          xp: xpNum,
          conteudo: textoMudou ? { ...(licao.conteudo ?? {}), texto } : undefined,
        });
        alterou = true;
      }
      for (const q of licao.questoes) {
        const novoEnun = (enunciados[q.id] ?? q.enunciado).trim();
        const novoCartao = q.formato === 'cartao' ? cartoes[q.id] ?? '' : null;
        const cartaoMudou = novoCartao !== null && novoCartao !== String(q.dadosExtra?.texto ?? '');
        if (novoEnun !== q.enunciado || cartaoMudou) {
          if (novoEnun.length === 0) throw new Error('O enunciado não pode ficar vazio.');
          await salvarQuestao(q.id, { enunciado: novoEnun, dadosExtra: cartaoMudou ? { ...q.dadosExtra, texto: novoCartao } : undefined });
          alterou = true;
        }
        for (const o of q.opcoes) {
          const novo = opcoes[o.id];
          if (novo && (novo.texto.trim() !== o.texto || novo.correta !== o.correta)) {
            if (novo.texto.trim().length === 0) throw new Error('Uma alternativa ficou vazia.');
            await salvarOpcao(o.id, novo);
            alterou = true;
          }
        }
        if (FORMATOS_COM_CORRETA.includes(q.formato) && q.opcoes.length > 0 && !q.opcoes.some((o) => (opcoes[o.id]?.correta ?? o.correta))) {
          throw new Error(`A pergunta "${q.enunciado.slice(0, 40)}" ficou sem resposta correta marcada.`);
        }
      }
      await carregar();
      setMsg(alterou ? 'Lição salva.' : 'Nada para salvar: nenhuma alteração.');
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível salvar.');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <PainelLayout config={config} titulo={criando ? 'Nova lição de leitura' : 'Editar lição'} subtitulo={licao?.titulo} voltar>
      {carregando ? (
        <EstadoCarregando />
      ) : !criando && !licao ? (
        <EstadoErro mensagem={erro ?? 'Lição não encontrada.'} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : (
        <>
          <AvisoEdicao papel={papel} />
          <CartaoSecao titulo="Lição" ajuda="Título e XP aparecem para o adolescente. XP é a pontuação ganha ao concluir a lição.">
            <LabeledInput label="Título" value={titulo} onChangeText={setTitulo} maxLength={120} />
            <LabeledInput label="XP ao concluir" value={xp} onChangeText={setXp} keyboardType="numeric" maxLength={3} />
            {(criando || typeof licao?.conteudo?.texto === 'string') && (
              <LabeledInput label="Texto da lição" value={texto} onChangeText={setTexto} multiline style={campoMultilinha} placeholder="Escreva o conteúdo que o adolescente vai ler" />
            )}
            {criando && <AppText style={styles.suave}>A lição será criada com um cartão de leitura. Perguntas e outros formatos são adicionados pela equipe técnica.</AppText>}
          </CartaoSecao>

          {!criando && licao && licao.questoes.map((q, i) => (
            <CartaoSecao
              key={q.id}
              titulo={`Passo ${i + 1} · ${ROTULO_FORMATO[q.formato] ?? q.formato}`}
              ajuda="Corrija o enunciado e as alternativas. Marque a(s) resposta(s) correta(s) tocando no círculo."
            >
              <LabeledInput label={q.formato === 'cartao' ? 'Título do cartão' : 'Enunciado'} value={enunciados[q.id] ?? ''} onChangeText={(t) => setEnunciados((a) => ({ ...a, [q.id]: t }))} multiline style={{ minHeight: 64, textAlignVertical: 'top' }} />
              {q.formato === 'cartao' && (
                <LabeledInput label="Texto do cartão" value={cartoes[q.id] ?? ''} onChangeText={(t) => setCartoes((a) => ({ ...a, [q.id]: t }))} multiline style={campoMultilinha} />
              )}
              {q.opcoes.map((o) => {
                const marcavel = FORMATOS_COM_CORRETA.includes(q.formato);
                const atual = opcoes[o.id] ?? { texto: o.texto, correta: o.correta };
                return (
                  <View key={o.id} style={styles.opcao}>
                    {marcavel && (
                      <Pressable
                        onPress={() => setOpcoes((a) => ({ ...a, [o.id]: { ...atual, correta: !atual.correta } }))}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: atual.correta }}
                        accessibilityLabel="Resposta correta"
                        style={[styles.marca, atual.correta && styles.marcaOn]}
                      >
                        {atual.correta && <AppText style={styles.marcaCheck}>✓</AppText>}
                      </Pressable>
                    )}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <LabeledInput label="" value={atual.texto} onChangeText={(t) => setOpcoes((a) => ({ ...a, [o.id]: { ...atual, texto: t } }))} />
                    </View>
                  </View>
                );
              })}
              {!['cartao', 'multipla_escolha', 'verdadeiro_falso', 'completar', 'ordene', 'enquete'].includes(q.formato) && (
                <AppText style={styles.suave}>Neste formato, pares, colunas e demais dados ficam como estão; aqui só o texto pode ser corrigido.</AppText>
              )}
            </CartaoSecao>
          ))}

          <BarraSalvar rotulo={criando ? 'CRIAR LIÇÃO' : 'SALVAR LIÇÃO'} ocupado={ocupado} onSalvar={salvar} onCancelar={() => navigation.goBack()} erro={erro} mensagem={msg} />
        </>
      )}
    </PainelLayout>
  );
}

const styles = StyleSheet.create({
  suave: { fontFamily: typography.regular, fontSize: 12, color: painel.textoSuave, lineHeight: 17 },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  marca: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: painel.cardBorda, alignItems: 'center', justifyContent: 'center', marginTop: -10 },
  marcaOn: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  marcaCheck: { color: colors.white, fontFamily: typography.bold, fontSize: 14 },
});
