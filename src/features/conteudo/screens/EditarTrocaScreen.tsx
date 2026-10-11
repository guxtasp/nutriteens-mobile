// src/features/conteudo/screens/EditarTrocaScreen.tsx
// Editar a justificativa de uma troca: o que o adolescente ganha (frase) e a dica prática.
// A categoria, o alimento de destino e o texto "o que muda" não são editados aqui.
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
import { buscarTrocaEditavel, salvarTroca, type TrocaEditavel } from '../services/edicaoService';
import { obterPapelAtual } from '../services/conteudoService';
import type { Papel } from '../utils/regrasAprovacao';
import { AvisoEdicao, BarraSalvar, campoMultilinha } from '../components/CamposEdicao';
import { CONTEXTO_CATEGORIA, ROTULO_CATEGORIA, type CategoriaTroca } from '../../adolescente/trocas/utils/trocas';

type Props = { config: ConfigPainel; route: { params: { trocaId: string } } };
const MAX_FRASE = 240;
const MAX_DICA = 220;

export default function EditarTrocaScreen({ config, route }: Props) {
  const { trocaId } = route.params;
  const navigation = useNavigation<any>();
  const [papel, setPapel] = useState<Papel | null>(null);
  const [original, setOriginal] = useState<TrocaEditavel | null>(null);
  const [frase, setFrase] = useState('');
  const [dica, setDica] = useState('');
  const [rapida, setRapida] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { obterPapelAtual().then(setPapel); }, []);

  const carregar = useCallback(async () => {
    try {
      const t = await buscarTrocaEditavel(trocaId);
      setOriginal(t);
      setFrase(t.frase);
      setDica(t.dica);
      setRapida(t.rapida);
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível abrir a alternativa.');
    } finally {
      setCarregando(false);
    }
  }, [trocaId]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  async function salvar() {
    if (frase.trim().length < 20) return setErro('Escreva o que o adolescente ganha com a alternativa (pelo menos 20 letras).');
    if (frase.trim().length > MAX_FRASE) return setErro(`A justificativa passou de ${MAX_FRASE} caracteres.`);
    if (dica.trim().length > MAX_DICA) return setErro(`A dica passou de ${MAX_DICA} caracteres.`);
    setOcupado(true);
    setErro(null);
    setMsg(null);
    try {
      await salvarTroca(trocaId, { frase, dica, rapida });
      await carregar();
      setMsg('Alternativa salva.');
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível salvar.');
    } finally {
      setOcupado(false);
    }
  }

  const categoria = original?.categoria as CategoriaTroca | undefined;
  const rotulo = categoria ? ROTULO_CATEGORIA[categoria] ?? categoria : '';

  return (
    <PainelLayout config={config} titulo="Editar alternativa" subtitulo={original ? `${rotulo} → ${original.destinoNome}` : undefined} voltar>
      {carregando ? (
        <EstadoCarregando />
      ) : !original ? (
        <EstadoErro mensagem={erro ?? 'Alternativa não encontrada.'} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : (
        <>
          <AvisoEdicao papel={papel} />

          <CartaoSecao titulo="Justificativa" subtitulo="É o que o adolescente lê ao tocar na alternativa" ajuda="O adolescente vê três blocos: 'O que muda' (texto fixo da categoria, abaixo), 'O que você ganha' (a justificativa) e 'Dica pra fazer'. Escreva em linguagem simples, sem julgar e sem falar de calorias.">
            <View style={styles.contexto}>
              <AppText style={styles.contextoTitulo}>O que muda (fixo da categoria {rotulo})</AppText>
              <AppText style={styles.contextoTexto}>{categoria ? CONTEXTO_CATEGORIA[categoria] : '—'}</AppText>
            </View>

            <LabeledInput label={`O que você ganha com ${original.destinoNome}`} value={frase} onChangeText={setFrase} multiline maxLength={MAX_FRASE} style={campoMultilinha} />
            <AppText style={styles.contador}>{frase.trim().length}/{MAX_FRASE}</AppText>

            <LabeledInput label="Dica pra fazer (opcional)" value={dica} onChangeText={setDica} multiline maxLength={MAX_DICA} style={{ minHeight: 72, textAlignVertical: 'top' }} />
            <AppText style={styles.contador}>{dica.trim().length}/{MAX_DICA}</AppText>

            <View style={{ gap: 6 }}>
              <AppText style={styles.rotulo}>Rápido de levar?</AppText>
              <View style={styles.linha}>
                {[{ v: true, l: 'Sim' }, { v: false, l: 'Não' }].map((o) => (
                  <Pressable key={o.l} onPress={() => setRapida(o.v)} accessibilityRole="button" style={[styles.chip, rapida === o.v && styles.chipOn]}>
                    <AppText style={[styles.chipTexto, rapida === o.v && { color: colors.white }]}>{o.l}</AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          </CartaoSecao>

          <BarraSalvar rotulo="SALVAR ALTERNATIVA" ocupado={ocupado} onSalvar={salvar} onCancelar={() => navigation.goBack()} erro={erro} mensagem={msg} />
        </>
      )}
    </PainelLayout>
  );
}

const styles = StyleSheet.create({
  rotulo: { fontFamily: typography.regular, fontSize: 14, color: colors.primaryDark },
  contador: { fontFamily: typography.regular, fontSize: 11, color: painel.textoSuave, textAlign: 'right', marginTop: -2 },
  contexto: { backgroundColor: '#F4F8F5', borderRadius: 12, padding: 12, gap: 2 },
  contextoTitulo: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
  contextoTexto: { fontFamily: typography.regular, fontSize: 13, lineHeight: 19, color: colors.textOnLight },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 20, borderWidth: 2, borderColor: painel.cardBorda, justifyContent: 'center', backgroundColor: painel.card },
  chipOn: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  chipTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
});
