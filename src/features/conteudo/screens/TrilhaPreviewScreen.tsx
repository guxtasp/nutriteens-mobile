// src/features/conteudo/screens/TrilhaPreviewScreen.tsx
// Pré-visualização da trilha INTEIRA, em duas abas:
//  - "Como o adolescente vê": o mapa da trilha com o componente real do app (TrilhaCaminho),
//    como um adolescente novo o veria. Tocar em um nó abre a lição (prévia de uso);
//  - "Estrutura (revisão)": resumo (módulos, lições, passos, XP possível), lacunas e se o
//    adolescente chega a ver esta trilha hoje.
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { typography } from '../../../shared/theme/typography';
import type { ConfigPainel } from '../../../shared/painel/types';
import { TrilhaCaminho } from '../../adolescente/trilha/components/TrilhaPath';
import { buscarTrilhaEditavel, listarTrilhasOrdem, type TrilhaEditavel, type TrilhaOrdemLinha } from '../services/edicaoService';
import { AbasPrevia, type AbaPrevia } from '../components/preview/AbasPrevia';
import { QuadroCelular } from '../components/preview/QuadroCelular';
import { alertasTrilha, gruposDoCaminho, resumoTrilha } from '../utils/previa';
import { posicaoNoCaminho, textoPosicaoNoCaminho } from '../utils/trilhaEdicao';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';

type Props = { config: ConfigPainel; route: { params: { trilhaId: string; origem?: string } } };

const ROTULO_TIPO: Record<string, string> = { conteudo: 'Leitura', quiz: 'Quiz', atividade_rastreavel: 'Prática real' };

export default function TrilhaPreviewScreen({ config, route }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const { trilhaId, origem } = route.params;
  const navigation = useNavigation<any>();
  const [trilha, setTrilha] = useState<TrilhaEditavel | null>(null);
  const [trilhas, setTrilhas] = useState<TrilhaOrdemLinha[]>([]);
  const [aba, setAba] = useState<AbaPrevia>('uso');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const [t, lista] = await Promise.all([buscarTrilhaEditavel(trilhaId), listarTrilhasOrdem()]);
      setTrilha(t);
      setTrilhas(lista);
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível abrir a trilha.');
    } finally {
      setCarregando(false);
    }
  }, [trilhaId]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const dados = useMemo(() => (trilha ? { id: trilha.id, titulo: trilha.titulo, xpBonus: trilha.xpBonus, modulos: trilha.modulos } : null), [trilha]);
  const grupos = useMemo(() => (dados ? gruposDoCaminho(dados) : []), [dados]);
  const resumo = useMemo(() => (dados ? resumoTrilha(dados) : null), [dados]);
  const alertas = useMemo(() => (dados ? alertasTrilha(dados) : []), [dados]);
  const minha = trilhas.find((t) => t.id === trilhaId);
  const posicao = useMemo(() => posicaoNoCaminho(trilhas, { id: trilhaId, ordem: trilhas.find((t) => t.id === trilhaId)?.ordem ?? trilha?.ordem ?? 0, titulo: trilha?.titulo }), [trilhas, trilhaId, trilha]);

  return (
    <PainelLayout config={config} titulo="Prévia da trilha" subtitulo={trilha?.titulo} voltar>
      {carregando ? (
        <EstadoCarregando />
      ) : !trilha || !dados || !resumo ? (
        <EstadoErro mensagem={erro ?? 'Trilha não encontrada.'} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : (
        <>
          <AbasPrevia aba={aba} onTrocar={setAba} rotuloRevisao="Estrutura (revisão)" />

          {aba === 'uso' && (
            <>
              {grupos.every((g) => g.nos.length === 0) ? (
                <AppText style={styles.suave}>Esta trilha ainda não tem lições para mostrar no mapa.</AppText>
              ) : (
                <QuadroCelular altura={720}>
                  <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    <TrilhaCaminho grupos={grupos} onPressNo={(no) => navigation.navigate('LicaoPreview', { licaoId: no.id, origem })} />
                  </ScrollView>
                </QuadroCelular>
              )}
              <AppText style={[styles.suave, { textAlign: 'center' }]}>
                Assim aparece para um adolescente que ainda não começou: só a primeira lição liberada. Na prévia você pode tocar em qualquer lição para abri-la.
              </AppText>
            </>
          )}

          {aba === 'revisao' && (
            <>
              <CartaoSecao titulo="Visibilidade" ajuda="O app mostra aos adolescentes todas as trilhas publicadas, uma depois da outra, pela ordem.">
                <AppText style={styles.texto}>
                  {minha?.status === 'aprovada' ? 'Esta trilha está publicada.' : 'Esta trilha ainda não está publicada: os adolescentes não a veem.'} Ordem {minha?.ordem ?? trilha.ordem}.
                </AppText>
                <AppText style={styles.suave}>{textoPosicaoNoCaminho(posicao, minha?.status === 'aprovada')}</AppText>
              </CartaoSecao>

              <CartaoSecao titulo="Resumo">
                <AppText style={styles.texto}>{resumo.modulos} módulo(s) · {resumo.licoes} lição(ões) · {resumo.passos} passo(s)</AppText>
                <AppText style={styles.texto}>
                  XP possível: {resumo.xpTotal} ({resumo.xpLicoes} das lições + {resumo.xpBonusModulos} de bônus de módulos + {resumo.xpBonusTrilha} de bônus da trilha)
                </AppText>
                {alertas.length === 0 ? (
                  <AppText style={styles.ok}>Nenhuma lacuna encontrada na estrutura.</AppText>
                ) : (
                  <View style={styles.alertas}>
                    {alertas.map((a, i) => <AppText key={i} style={styles.alertaTexto}>⚠ {a}</AppText>)}
                  </View>
                )}
              </CartaoSecao>

              <CartaoSecao titulo="Módulos e lições" subtitulo="Toque em uma lição para a prévia dela">
                {trilha.modulos.map((m) => (
                  <View key={m.id} style={styles.modulo}>
                    <AppText style={styles.moduloTitulo}>Módulo {m.ordem} · {m.titulo}</AppText>
                    {m.licoes.length === 0 && <AppText style={styles.suave}>Sem lições.</AppText>}
                    {m.licoes.map((l) => (
                      <Pressable key={l.id} accessibilityRole="button" onPress={() => navigation.navigate('LicaoPreview', { licaoId: l.id, origem, aba: 'revisao' })} style={styles.licao}>
                        <AppText style={styles.licaoTitulo}>{l.ordem}. {l.titulo}</AppText>
                        <AppText style={styles.suave}>{ROTULO_TIPO[l.tipo] ?? l.tipo} · {l.xp} XP · {l.passos} passo(s)  ›</AppText>
                      </Pressable>
                    ))}
                  </View>
                ))}
              </CartaoSecao>
            </>
          )}

          <View style={{ flexDirection: 'row' }}>
            <AppButton label="EDITAR TRILHA" fullWidth={false} size="compact" outlineColor={tema.texto} textColor={tema.texto} style={styles.botao} onPress={() => navigation.navigate('EditarTrilha', { trilhaId, origem })} />
          </View>
        </>
      )}
    </PainelLayout>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  texto: { fontFamily: typography.regular, fontSize: 14, lineHeight: 20, color: t.textoCorpo },
  suave: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave, lineHeight: 17 },
  ok: { fontFamily: typography.semiBold, fontSize: 13, color: t.selos.ok.texto },
  alertas: { backgroundColor: t.selos.erro.fundo, borderRadius: 12, padding: 10, gap: 4 },
  alertaTexto: { fontFamily: typography.semiBold, fontSize: 12, color: t.erro },
  modulo: { borderWidth: 2, borderColor: t.cardBorda, borderRadius: 14, padding: 12, gap: 6 },
  moduloTitulo: { fontFamily: typography.bold, fontSize: 14, color: t.texto },
  licao: { minHeight: 48, justifyContent: 'center', borderTopWidth: 1, borderTopColor: t.linhaSuave, paddingVertical: 4 },
  licaoTitulo: { fontFamily: typography.semiBold, fontSize: 13, color: t.textoCorpo },
  botao: { paddingHorizontal: 14, minHeight: 44 },
}) as const;
