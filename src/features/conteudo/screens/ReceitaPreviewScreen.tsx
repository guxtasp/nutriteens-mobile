// src/features/conteudo/screens/ReceitaPreviewScreen.tsx
// Pré-visualização de uma receita, em duas abas:
//  - "Como o adolescente vê": abre a MESMA ficha do aplicativo (ReceitaDetalheSheet) com a
//    receita real, em modo prévia (não registra eventos de uso);
//  - "Revisão": dados, ingredientes, passos e lacunas que o adolescente notaria.
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { typography } from '../../../shared/theme/typography';
import type { ConfigPainel } from '../../../shared/painel/types';
import ReceitaDetalheSheet from '../../adolescente/alimentacao/components/ReceitaDetalheSheet';
import type { ReceitaComAlimento } from '../../adolescente/alimentacao/services/receitasService';
import { buscarReceitaEditavel, type ReceitaEditavel } from '../services/edicaoService';
import { AbasPrevia, type AbaPrevia } from '../components/preview/AbasPrevia';
import { lacunasReceita } from '../utils/previa';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';

type Props = { config: ConfigPainel; route: { params: { receitaId: string; origem?: string } } };

const ROTULO_DIFICULDADE: Record<string, string> = { FACIL: 'Fácil', MEDIO: 'Médio', DIFICIL: 'Difícil' };

/** A ficha do adolescente só usa estes campos; o prato embutido não é lido por ela. */
function paraFichaDoApp(r: ReceitaEditavel): ReceitaComAlimento {
  return {
    id: r.id,
    titulo: r.titulo,
    modo_preparo: r.modoPreparo,
    tempo_preparo_min: r.tempoPreparoMin ?? null,
    porcoes: r.porcoes ?? 1,
    dificuldade: (r.dificuldade ?? 'FACIL') as ReceitaComAlimento['dificuldade'],
    foto_url: r.fotoUrl,
    alimento_resultante: { id: r.alimentoResultanteId, nome: r.alimentoResultanteNome, eh_prato_composto: true, acessivel_ebia: true, grupos_alimentares: [] } as any,
  };
}

export default function ReceitaPreviewScreen({ config, route }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const { receitaId, origem } = route.params;
  const navigation = useNavigation<any>();
  const [receita, setReceita] = useState<ReceitaEditavel | null>(null);
  const [aba, setAba] = useState<AbaPrevia>('uso');
  const [aberta, setAberta] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      setReceita(await buscarReceitaEditavel(receitaId));
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível abrir a receita.');
    } finally {
      setCarregando(false);
    }
  }, [receitaId]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const lacunas = useMemo(
    () => (receita ? lacunasReceita({ fotoUrl: receita.fotoUrl, modoPreparo: receita.modoPreparo, tempoPreparoMin: receita.tempoPreparoMin ?? null, porcoes: receita.porcoes ?? null, ingredientes: receita.ingredientes.length, passos: receita.passos.length }) : []),
    [receita]
  );

  return (
    <PainelLayout config={config} titulo="Prévia da receita" subtitulo={receita?.titulo} voltar>
      {carregando ? (
        <EstadoCarregando />
      ) : !receita ? (
        <EstadoErro mensagem={erro ?? 'Receita não encontrada.'} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : (
        <>
          <AbasPrevia aba={aba} onTrocar={setAba} rotuloRevisao="Revisão" />

          {aba === 'uso' && (
            <CartaoSecao titulo="Como o adolescente vê" ajuda="Abre a mesma ficha do aplicativo, com ingredientes, modo de preparo e o passo a passo. Nada é registrado.">
              <AppText style={styles.texto}>A ficha abre por cima da tela, como no aplicativo. Toque em "Passo a passo" dentro dela para ver o guia de preparo.</AppText>
              <View style={{ flexDirection: 'row' }}>
                <AppButton label="ABRIR COMO O ADOLESCENTE VÊ" fullWidth={false} size="compact" backgroundColor={tema.botaoFundo} textColor={tema.botaoTexto} shadowColor={tema.botaoSombra} style={styles.botao} onPress={() => setAberta(true)} />
              </View>
            </CartaoSecao>
          )}

          {aba === 'revisao' && (
            <>
              <CartaoSecao titulo="Dados">
                <AppText style={styles.texto}>Prato: {receita.alimentoResultanteNome || '—'}</AppText>
                <AppText style={styles.texto}>
                  {receita.tempoPreparoMin ? `${receita.tempoPreparoMin} min · ` : ''}{receita.porcoes ?? 1} porção(ões) · {ROTULO_DIFICULDADE[receita.dificuldade ?? 'FACIL'] ?? receita.dificuldade}
                </AppText>
                <AppText style={styles.texto}>{receita.modoPreparo}</AppText>
                {lacunas.length === 0 ? (
                  <AppText style={styles.ok}>Nenhuma lacuna encontrada.</AppText>
                ) : (
                  <View style={styles.alertas}>
                    {lacunas.map((l, i) => <AppText key={i} style={styles.alertaTexto}>⚠ {l}</AppText>)}
                  </View>
                )}
              </CartaoSecao>

              <CartaoSecao titulo="Ingredientes" subtitulo={`${receita.ingredientes.length} ingrediente(s)`}>
                {receita.ingredientes.length === 0 && <AppText style={styles.suave}>Nenhum ingrediente cadastrado.</AppText>}
                {receita.ingredientes.map((i) => <AppText key={i.id} style={styles.texto}>• {i.quantidade} de {i.nome}</AppText>)}
              </CartaoSecao>

              <CartaoSecao titulo="Passo a passo" subtitulo={`${receita.passos.length} passo(s)`}>
                {receita.passos.length === 0 && <AppText style={styles.suave}>Nenhum passo cadastrado.</AppText>}
                {receita.passos.map((p, k) => (
                  <View key={k} style={{ gap: 2 }}>
                    <AppText style={styles.passoTitulo}>{k + 1}. {p.titulo}</AppText>
                    <AppText style={styles.texto}>{p.descricao}</AppText>
                  </View>
                ))}
              </CartaoSecao>
            </>
          )}

          <View style={{ flexDirection: 'row' }}>
            <AppButton label="EDITAR RECEITA" fullWidth={false} size="compact" outlineColor={tema.texto} textColor={tema.texto} style={styles.botao} onPress={() => navigation.navigate('EditarReceita', { receitaId, origem })} />
          </View>

          {aberta && <ReceitaDetalheSheet receita={paraFichaDoApp(receita)} previa onFechar={() => setAberta(false)} />}
        </>
      )}
    </PainelLayout>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  texto: { fontFamily: typography.regular, fontSize: 14, lineHeight: 20, color: t.textoCorpo },
  suave: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave },
  passoTitulo: { fontFamily: typography.semiBold, fontSize: 13, color: t.texto },
  ok: { fontFamily: typography.semiBold, fontSize: 13, color: t.selos.ok.texto },
  alertas: { backgroundColor: t.selos.erro.fundo, borderRadius: 12, padding: 10, gap: 4 },
  alertaTexto: { fontFamily: typography.semiBold, fontSize: 12, color: t.erro },
  botao: { paddingHorizontal: 14, minHeight: 44 },
}) as const;
