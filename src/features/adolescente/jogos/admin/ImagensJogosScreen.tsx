// Painel admin: enviar/trocar/remover a imagem de cada alimento dos jogos (Supabase Storage).
// Imagem é só ilustração; não passa pelo fluxo de aprovação de conteúdo.
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PainelLayout } from '../../../../shared/painel/PainelLayout';
import { CartaoSecao } from '../../../../shared/painel/components/CartaoSecao';
import { AppText } from '../../../../shared/ui/AppText';
import { typography } from '../../../../shared/theme/typography';
import type { ConfigPainel } from '../../../../shared/painel/types';
import { ALIMENTOS_NOVA, AlimentoNova } from '../data/alimentosNova';
import { PARES_NUTRIENTE, ParNutriente } from '../data/paresNutriente';
import ImagemAlimento from '../components/ImagemAlimento';
import { listarParesNutriente, listarAlimentosJogo, listarImagensJogo, enviarImagemJogo, removerImagemJogo, MapaImagens } from '../services/imagensJogoService';
import type { TemaPainel } from '../../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../../shared/painel/tema/TemaPainelContext';

export default function ImagensJogosScreen({ config }: { config: ConfigPainel }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const [imagens, setImagens] = useState<MapaImagens>({});
  const [alimentos, setAlimentos] = useState<AlimentoNova[]>(ALIMENTOS_NOVA);
  const [pares, setPares] = useState<ParNutriente[]>(PARES_NUTRIENTE);
  useEffect(() => { listarAlimentosJogo().then(setAlimentos); listarParesNutriente().then(setPares); }, []);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try { setImagens(await listarImagensJogo(true)); setErro(null); }
    catch (e: any) { setErro(e?.message ?? 'Não foi possível listar as imagens (o bucket "jogos" existe?).'); }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  async function escolher(id: string) {
    setMsg(null); setErro(null);
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (r.canceled || !r.assets?.[0]) return;
    const a = r.assets[0];
    setOcupado(id);
    try {
      await enviarImagemJogo(id, a.uri, a.mimeType ?? 'image/jpeg');
      await carregar();
      setMsg('Imagem salva.');
    } catch (e: any) { setErro(e?.message ?? 'Não foi possível enviar a imagem.'); }
    finally { setOcupado(null); }
  }

  async function remover(id: string) {
    setMsg(null); setErro(null); setOcupado(id);
    try { await removerImagemJogo(id); await carregar(); setMsg('Imagem removida; o jogo volta a usar o ícone.'); }
    catch (e: any) { setErro(e?.message ?? 'Não foi possível remover.'); }
    finally { setOcupado(null); }
  }

  const linha = (id: string, nome: string, item: { nome: string; icone: string; cor: string }) => (
    <View key={id} style={styles.linha}>
      <ImagemAlimento alimento={item} url={imagens[id]} tamanho={56} />
      <AppText style={styles.nome}>{nome}</AppText>
      <Pressable style={styles.botao} disabled={ocupado === id} onPress={() => escolher(id)} accessibilityRole="button">
        <AppText style={styles.botaoTexto}>{ocupado === id ? 'ENVIANDO…' : imagens[id] ? 'TROCAR' : 'ENVIAR'}</AppText>
      </Pressable>
      {!!imagens[id] && (
        <Pressable style={[styles.botao, styles.botaoSec]} disabled={ocupado === id} onPress={() => remover(id)} accessibilityRole="button">
          <AppText style={[styles.botaoTexto, { color: tema.texto }]}>REMOVER</AppText>
        </Pressable>
      )}
    </View>
  );

  return (
    <PainelLayout config={config} titulo="Imagens dos jogos" subtitulo="Opcional: sem imagem, o jogo mostra um ícone">
      {!!erro && <AppText style={styles.erro}>{erro}</AppText>}
      {!!msg && <AppText style={styles.ok}>{msg}</AppText>}
      <CartaoSecao titulo="Jogo Classificar NOVA" ajuda="Use fotos ou ilustrações quadradas, de preferência com fundo limpo. A imagem aparece no lugar do ícone assim que for salva.">
        {alimentos.map((a) => linha(a.id, a.nome, a))}
      </CartaoSecao>
      <CartaoSecao titulo="Jogo de memória (nutriente × alimento)" ajuda="Cada linha é um alimento dentro de um nutriente. A imagem aparece na carta do alimento.">
        {pares.map((p) => linha(p.id, `${p.nome} (${p.nutriente})`, p))}
      </CartaoSecao>
    </PainelLayout>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.linhaSuave, flexWrap: 'wrap' },
  nome: { flex: 1, minWidth: 120, fontFamily: typography.semiBold, fontSize: 14, color: t.texto },
  botao: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: t.botaoFundo, justifyContent: 'center' },
  botaoSec: { backgroundColor: t.card, borderWidth: 2, borderColor: t.texto },
  botaoTexto: { fontFamily: typography.bold, fontSize: 12, color: t.botaoTexto },
  erro: { fontFamily: typography.regular, fontSize: 13, color: t.erro },
  ok: { fontFamily: typography.regular, fontSize: 13, color: t.texto },
}) as const;
