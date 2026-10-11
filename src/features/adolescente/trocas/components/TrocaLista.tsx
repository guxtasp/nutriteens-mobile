// Alternativas de troca. Duas apresentações:
//  - "grade": ícone + nome (retorno da refeição, espaço curto)
//  - "lista": linha com o porquê já visível (tela de sugestões)
// Tocar abre o detalhe (o que muda / o que você ganha / dica). Sem EBIA, sem caloria, sem julgamento.
import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { iconeDoDestino } from '../utils/iconesTrocas';
import { CategoriaTroca, rotulosNutrientes } from '../utils/trocas';
import TrocaDetalheSheet, { TrocaDetalhe } from './TrocaDetalheSheet';

export type AlternativaItem = TrocaDetalhe;
type Tema = 'claro' | 'escuro';

const ALTURA_TILE = 128;

export function AlternativasGrade({ itens, tema = 'claro', atrasoInicial = 0, origemNome, categoria }: {
  itens: AlternativaItem[]; tema?: Tema; atrasoInicial?: number; origemNome?: string | null; categoria?: CategoriaTroca;
}) {
  const escuro = tema === 'escuro';
  const [aberta, setAberta] = useState<AlternativaItem | null>(null);

  return (
    <>
      <View style={styles.grade}>
        {itens.map((it, i) => (
          <MotiView
            key={it.id}
            from={{ opacity: 0, translateY: 14, scale: 0.94 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: 'timing', duration: 320, delay: atrasoInicial + i * 70 }}
            style={styles.celula}
          >
            <Pressable
              onPress={() => setAberta({ ...it, categoria: it.categoria ?? categoria })}
              style={({ pressed }) => [styles.tile, escuro ? styles.tileEscuro : styles.tileClaro, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
              accessibilityLabel={`Por que ${it.nome}?`}
            >
              <Ionicons name="information-circle" size={18} color={colors.primary} style={styles.infoCanto} />
              <View style={styles.icone}>
                <MaterialCommunityIcons name={iconeDoDestino(it.nome) as any} size={28} color={colors.primary} />
              </View>
              <View style={styles.nomeBox}>
                <AppText style={styles.nome} numberOfLines={2}>{it.nome}</AppText>
              </View>
            </Pressable>
          </MotiView>
        ))}
      </View>
      <TrocaDetalheSheet item={aberta} origemNome={origemNome} onFechar={() => setAberta(null)} />
    </>
  );
}

// Tela de sugestões: cada alternativa mostra, já na lista, o que ela tem de concreto.
export function AlternativasLista({ itens, categoria }: { itens: AlternativaItem[]; categoria: CategoriaTroca }) {
  const [aberta, setAberta] = useState<AlternativaItem | null>(null);

  return (
    <>
      <View style={styles.lista}>
        {itens.map((it, i) => {
          const fontes = rotulosNutrientes(it.nutrientes, 2);
          return (
            <MotiView
              key={it.id}
              from={{ opacity: 0, translateY: 14 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 320, delay: i * 60 }}
            >
              <Pressable
                onPress={() => setAberta({ ...it, categoria })}
                style={({ pressed }) => [styles.linha, pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] }]}
                accessibilityRole="button"
                accessibilityLabel={`Por que ${it.nome}?`}
              >
                <View style={styles.linhaIcone}>
                  <MaterialCommunityIcons name={iconeDoDestino(it.nome) as any} size={30} color={colors.primary} />
                </View>
                <View style={styles.linhaTextos}>
                  <AppText style={styles.linhaNome}>{it.nome}</AppText>
                  {!!it.explicacao && <AppText style={styles.linhaFrase} numberOfLines={2}>{it.explicacao}</AppText>}
                  {(fontes.length > 0 || it.rapida) && (
                    <View style={styles.linhaChips}>
                      {fontes.map((f) => <View key={f} style={styles.chip}><AppText style={styles.chipTexto}>fonte de {f}</AppText></View>)}
                      {it.rapida && <View style={styles.chip}><AppText style={styles.chipTexto}>rápido de levar</AppText></View>}
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </Pressable>
            </MotiView>
          );
        })}
      </View>
      <TrocaDetalheSheet item={aberta} onFechar={() => setAberta(null)} />
    </>
  );
}

// Cartão do retorno da refeição: "Em vez de X, que tal:" + grade de alternativas
export default function TrocaLista({ origemNome, opcoes, tema = 'claro', categoria }: {
  origemNome: string; opcoes: AlternativaItem[]; tema?: Tema; categoria?: CategoriaTroca;
}) {
  const escuro = tema === 'escuro';
  return (
    <View style={styles.bloco}>
      <AppText style={[styles.titulo, escuro && { color: '#fff' }]}>Em vez de {origemNome}, que tal:</AppText>
      <AlternativasGrade itens={opcoes} tema={tema} atrasoInicial={200} origemNome={origemNome} categoria={categoria} />
      <AppText style={[styles.dica, escuro && { color: '#D1D5DB' }]}>Toque numa opção para ver o que muda e como fazer.</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { width: '100%' },
  titulo: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark, marginBottom: 10 },
  dica: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', textAlign: 'center', marginTop: 6 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  celula: { width: '50%', padding: 6 },
  tile: { height: ALTURA_TILE, borderRadius: 18, paddingHorizontal: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'space-between' },
  tileClaro: { backgroundColor: colors.primaryDark },
  tileEscuro: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderColor: 'rgba(139,195,74,0.55)' },
  infoCanto: { position: 'absolute', top: 8, right: 8 },
  icone: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  nomeBox: { height: 36, justifyContent: 'center', alignSelf: 'stretch' },
  nome: { fontFamily: typography.bold, fontSize: 14, lineHeight: 18, color: '#fff', textAlign: 'center' },

  lista: { gap: 12 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.primaryDark, borderRadius: 20, padding: 14 },
  linhaIcone: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  linhaTextos: { flex: 1 },
  linhaNome: { fontFamily: typography.bold, fontSize: 16, color: '#fff' },
  linhaFrase: { fontFamily: typography.regular, fontSize: 12.5, lineHeight: 17, color: '#D9E2E8', marginTop: 2 },
  linhaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  chipTexto: { fontFamily: typography.bold, fontSize: 10.5, color: '#2E3A45' },
});
