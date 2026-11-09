// src/features/adolescente/receitas-ingredientes/components/ReceitaCasaTela.tsx
//
// Tela da receita em "Receitas com o que tenho". Tela cheia (não é mais o sheet da Alimentação):
//  - foto grande no topo e o cartão da receita subindo por cima;
//  - mostra, ingrediente por ingrediente, o que a pessoa já tem e o que falta;
//  - o modo de preparo aparece em passos numerados (e abre o "Cozinhar passo a passo" em tela cheia);
//  - botão fixo embaixo para levar a receita ao registro da refeição.
// A receita da Alimentação (ReceitaDetalheSheet) continua como era; só esta tela usa o novo visual.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { BackButton } from '../../../../shared/ui/BackButton';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { registrarEvento } from '../../../../shared/analytics/analytics';
import { buscarPassosDaReceita, type PassoReceita, type ReceitaComIngredientes } from '../../alimentacao/services/receitasService';
import { nomeLegivel, type IngredienteReceita, type ReceitaPontuada } from '../utils/combinarReceitas';
import { montarPassos } from '../utils/passosReceita';
import ModoCozinhar, { type IngredienteCozinha } from './ModoCozinhar';

type Props = {
  /** receita aberta (já com o que a pessoa tem e o que falta); null = fechada */
  item: ReceitaPontuada<ReceitaComIngredientes> | null;
  /** a pessoa informou o que tem em casa? Sem isso não faz sentido marcar "você tem" */
  temDespensa: boolean;
  onFechar: () => void;
  onEnviarParaAmigo?: (receita: ReceitaComIngredientes) => void;
  onAdicionarAoRegistro?: (receita: ReceitaComIngredientes) => void;
};

const ROTULO_DIFICULDADE: Record<string, string> = { FACIL: 'Fácil', MEDIO: 'Médio', DIFICIL: 'Difícil' };
const ALTURA_FOTO = 230;

const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const textoIngrediente = (i: IngredienteReceita) =>
  i.quantidadeTexto ? `${i.quantidadeTexto} de ${nomeLegivel(i.nome)}` : capitalizar(nomeLegivel(i.nome));

export default function ReceitaCasaTela({ item, temDespensa, onFechar, onEnviarParaAmigo, onAdicionarAoRegistro }: Props) {
  const insets = useSafeAreaInsets();
  const [passosBanco, setPassosBanco] = useState<PassoReceita[]>([]);
  const [cozinhando, setCozinhando] = useState(false);
  const cozinhouRef = useRef(false);
  const concluidaRef = useRef(false);
  const receitaId = item?.receita.id;

  // visualizada ao abrir; abandonada se abriu o passo a passo e saiu sem terminar
  useEffect(() => {
    // zera ao trocar/fechar a receita: nada da anterior fica "grudado" na próxima
    setPassosBanco([]);
    setCozinhando(false);
    cozinhouRef.current = false;
    concluidaRef.current = false;
    if (!receitaId) return;
    let ativo = true;
    registrarEvento('receita_visualizada', { receita_id: receitaId });
    // sem os passos cadastrados a tela usa o texto do modo de preparo; falhar aqui não impede de ver a receita
    buscarPassosDaReceita(receitaId).then((l) => ativo && setPassosBanco(l)).catch(() => undefined);
    return () => {
      ativo = false;
      if (cozinhouRef.current && !concluidaRef.current) {
        registrarEvento('conteudo_abandonado', { tipo: 'receita', receita_id: receitaId });
      }
    };
  }, [receitaId]);

  const passos = useMemo(
    () => (item ? montarPassos(passosBanco, item.receita.modo_preparo) : []),
    [item, passosBanco]
  );

  const ingredientesCozinha: IngredienteCozinha[] = useMemo(() => {
    if (!item) return [];
    const tenho = new Set(item.tenho.map((i) => i.alimentoId));
    return item.receita.ingredientes.map((i) => ({
      texto: textoIngrediente(i),
      tenho: temDespensa ? tenho.has(i.alimentoId) : null,
    }));
  }, [item, temDespensa]);

  if (!item) return null;
  const r = item.receita;
  const total = r.ingredientes.length;
  const tem = item.tenho.length;
  const tudo = total > 0 && item.faltam.length === 0;

  function cozinhar() {
    cozinhouRef.current = true;
    setCozinhando(true);
  }

  return (
    <Modal visible animationType="slide" statusBarTranslucent onRequestClose={cozinhando ? () => setCozinhando(false) : onFechar}>
      <View style={styles.raiz}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} bounces={false}>
          {r.foto_url ? (
            <Image source={{ uri: r.foto_url }} style={styles.foto} resizeMode="cover" />
          ) : (
            <View style={[styles.foto, styles.fotoVazia]}>
              <Ionicons name="restaurant-outline" size={48} color="#9DBB86" />
            </View>
          )}

          <View style={styles.cartao}>
            <AppText style={styles.titulo}>{r.titulo}</AppText>

            <View style={styles.infoLinha}>
              {!!r.tempo_preparo_min && (
                <View style={styles.infoChip}>
                  <Ionicons name="time-outline" size={14} color={colors.primaryDark} />
                  <AppText style={styles.infoChipTexto}>{r.tempo_preparo_min} min</AppText>
                </View>
              )}
              {!!r.porcoes && (
                <View style={styles.infoChip}>
                  <Ionicons name="people-outline" size={14} color={colors.primaryDark} />
                  <AppText style={styles.infoChipTexto}>{r.porcoes} {r.porcoes === 1 ? 'porção' : 'porções'}</AppText>
                </View>
              )}
              {!!ROTULO_DIFICULDADE[r.dificuldade] && (
                <View style={styles.infoChip}>
                  <Ionicons name="speedometer-outline" size={14} color={colors.primaryDark} />
                  <AppText style={styles.infoChipTexto}>{ROTULO_DIFICULDADE[r.dificuldade]}</AppText>
                </View>
              )}
            </View>

            {temDespensa && total > 0 && (
              <View style={[styles.situacao, tudo ? styles.situacaoOk : styles.situacaoFalta]}>
                <Ionicons name={tudo ? 'checkmark-circle' : 'basket-outline'} size={20} color={tudo ? '#1E8449' : colors.primaryDark} />
                <View style={{ flex: 1 }}>
                  <AppText style={styles.situacaoTitulo}>
                    {tudo ? 'Você tem tudo para fazer agora!' : `Você tem ${tem} de ${total} ingredientes`}
                  </AppText>
                  {!tudo && (
                    <AppText style={styles.situacaoTexto}>Falta: {item.faltam.map((i) => nomeLegivel(i.nome)).join(', ')}</AppText>
                  )}
                </View>
              </View>
            )}

            {passos.length > 0 && (
              <AppButton
                label="COZINHAR PASSO A PASSO"
                style={styles.botaoCozinhar}
                textColor={colors.primaryDark}
                onPress={cozinhar}
              />
            )}
            {!!onEnviarParaAmigo && (
              <AppButton
                label="Enviar para um amigo"
                outlineColor={colors.primary}
                borderWidth={1.5}
                textColor={colors.primaryDark}
                size="compact"
                style={styles.botaoAmigo}
                onPress={() => onEnviarParaAmigo(r)}
              />
            )}

            {total > 0 && (
              <>
                <AppText style={styles.secao}>Ingredientes</AppText>
                {r.ingredientes.map((i) => {
                  const tenho = item.tenho.some((t) => t.alimentoId === i.alimentoId);
                  return (
                    <View key={i.alimentoId} style={styles.ingredienteLinha}>
                      {temDespensa ? (
                        <Ionicons name={tenho ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={tenho ? '#1E8449' : '#B8C4BE'} />
                      ) : (
                        <View style={styles.marcador} />
                      )}
                      <AppText style={styles.ingredienteTexto}>
                        {textoIngrediente(i)}
                        {temDespensa && <AppText style={tenho ? styles.ingredienteTem : styles.ingredienteFalta}>{tenho ? '  · você tem' : '  · falta'}</AppText>}
                      </AppText>
                    </View>
                  );
                })}
              </>
            )}

            {passos.length > 0 && (
              <>
                <AppText style={styles.secao}>Modo de preparo</AppText>
                {passos.map((p, k) => (
                  <View key={k} style={styles.passoLinha}>
                    <View style={styles.passoNumero}>
                      <AppText style={styles.passoNumeroTexto}>{k + 1}</AppText>
                    </View>
                    <View style={{ flex: 1 }}>
                      {!!p.titulo && <AppText style={styles.passoTitulo}>{p.titulo}</AppText>}
                      <AppText style={styles.passoTexto}>{p.descricao}</AppText>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        </ScrollView>

        <BackButton onPress={onFechar} style={{ position: 'absolute', top: insets.top + 8, left: 16 }} />

        {!!onAdicionarAoRegistro && (
          <View style={[styles.rodape, { paddingBottom: insets.bottom + 12 }]}>
            <AppButton
              label="ADICIONAR AO REGISTRO"
              backgroundColor={colors.primaryDark}
              textColor="#fff"
              shadowColor="#0E2A20"
              onPress={() => onAdicionarAoRegistro(r)}
            />
          </View>
        )}

        {cozinhando && (
          <ModoCozinhar
            tituloReceita={r.titulo}
            passos={passos}
            ingredientes={ingredientesCozinha}
            onFechar={() => setCozinhando(false)}
            onConcluir={() => {
              if (concluidaRef.current) return;
              concluidaRef.current = true;
              registrarEvento('receita_concluida', { receita_id: r.id });
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: colors.white },
  foto: { width: '100%', height: ALTURA_FOTO, backgroundColor: '#E4F2D2' },
  fotoVazia: { alignItems: 'center', justifyContent: 'center' },
  cartao: { marginTop: -28, backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 24 },
  titulo: { fontFamily: typography.bold, fontSize: 24, color: colors.primaryDark },
  infoLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EAF6DA', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7 },
  infoChipTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark },

  situacao: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, padding: 12, marginTop: 16 },
  situacaoOk: { backgroundColor: '#E2F3D3' },
  situacaoFalta: { backgroundColor: '#F4F7F5' },
  situacaoTitulo: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  situacaoTexto: { fontFamily: typography.regular, fontSize: 12, color: '#5B6B75', marginTop: 2 },

  botaoCozinhar: { marginTop: 18 },
  botaoAmigo: { marginTop: 12, borderBottomWidth: 1.5 },

  secao: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark, marginTop: 28, marginBottom: 10 },
  ingredienteLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  marcador: { width: 8, height: 8, borderRadius: 2, backgroundColor: colors.primary, marginHorizontal: 6 },
  ingredienteTexto: { flex: 1, fontFamily: typography.regular, fontSize: 15, color: colors.primaryDark },
  ingredienteTem: { fontFamily: typography.regular, fontSize: 13, color: '#1E8449' },
  ingredienteFalta: { fontFamily: typography.regular, fontSize: 13, color: '#7A8B94' },

  passoLinha: { flexDirection: 'row', gap: 12, paddingVertical: 8 },
  passoNumero: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  passoNumeroTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark },
  passoTitulo: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark, marginBottom: 2 },
  passoTexto: { fontFamily: typography.regular, fontSize: 15, lineHeight: 23, color: '#3F5248' },

  rodape: { paddingHorizontal: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EEF2EF', backgroundColor: colors.white },
});
