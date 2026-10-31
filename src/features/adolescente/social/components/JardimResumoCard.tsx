// src/features/adolescente/social/components/JardimResumoCard.tsx
//
// Cartão COMPACTO de um jardim na lista: a plantinha no céu da cor dela, o estágio, uma barrinha de progresso
// e quem já regou hoje. O jardim inteiro (planta grande, estágios, grupo) abre no detalhe.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { AvatarSocialView } from './AvatarSocialView';
import { AZUL_AGUA, CEU, nomeDoTema } from './JardimPecas';
import PlantaJardim from './PlantaJardim';
import { ESTAGIOS_JARDIM, estagioDoJardim, euRegueiHoje, nomeDoEstagio, progressoDoJardim, type Jardim } from '../utils/jardim';

type Props = { j: Jardim; aoAbrir: () => void };

export default function JardimResumoCard({ j, aoAbrir }: Props) {
  const estagio = estagioDoJardim(j.pontos);
  const { fracao, faltam, proximo } = progressoDoJardim(j.pontos);
  const ativos = j.membros.filter((m) => !m.pendente);
  const euRegou = euRegueiHoje(j);
  const nomeEstagio = nomeDoEstagio(j.tema, estagio.indice);

  return (
    <Pressable
      onPress={aoAbrir}
      accessibilityRole="button"
      accessibilityLabel={`${nomeDoTema(j.tema)}, ${nomeEstagio}, estágio ${estagio.indice + 1} de ${ESTAGIOS_JARDIM.length}. ${euRegou ? 'Você regou hoje.' : 'Falta regar hoje.'} Toque para abrir.`}
      style={({ pressed }) => [estilos.cartao, pressed && { transform: [{ translateY: 2 }], borderBottomWidth: 2 }]}
    >
      <LinearGradient colors={CEU[j.tema]} style={estilos.ceu}>
        <PlantaJardim tema={j.tema} estagio={estagio.indice} tamanho={76} animar={false} />
      </LinearGradient>

      <View style={estilos.corpo}>
        <View style={estilos.linha}>
          <AppText style={estilos.titulo} numberOfLines={1}>{nomeDoTema(j.tema)}</AppText>
          <View style={estilos.pontos}>
            <Ionicons name="water" size={12} color={AZUL_AGUA} />
            <AppText style={estilos.pontosTexto}>{j.pontos}</AppText>
          </View>
        </View>
        <AppText style={estilos.estagio} numberOfLines={1}>{nomeEstagio} · estágio {estagio.indice + 1} de {ESTAGIOS_JARDIM.length}</AppText>
        <View style={estilos.trilho}><View style={[estilos.cheio, { width: `${Math.max(4, Math.round(fracao * 100))}%` }]} /></View>
        <AppText style={estilos.miudo} numberOfLines={1}>
          {proximo ? `Faltam ${faltam} ${faltam === 1 ? 'regadinha' : 'regadinhas'}` : 'Jardim completo!'}
        </AppText>

        <View style={estilos.rodape}>
          <View style={estilos.avatares}>
            {ativos.slice(0, 3).map((m, i) => (
              <View key={m.apelido + (m.eu ? 'eu' : '')} style={[estilos.avatarBox, i > 0 && { marginLeft: -12 }]}>
                <AvatarSocialView avatar={m.avatar} size="small" />
                {m.regouHoje && <View style={estilos.gota}><Ionicons name="water" size={9} color={colors.white} /></View>}
              </View>
            ))}
            {ativos.length > 3 && <AppText style={estilos.mais}>+{ativos.length - 3}</AppText>}
          </View>
          {euRegou ? (
            <View style={estilos.pilulaOk}><Ionicons name="checkmark" size={13} color={colors.primaryDark} /><AppText style={estilos.pilulaOkTexto}>Regou</AppText></View>
          ) : (
            <View style={estilos.pilulaFalta}><AppText style={estilos.pilulaFaltaTexto}>Regar hoje</AppText></View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  cartao: { flexDirection: 'row', gap: 12, backgroundColor: colors.white, borderRadius: 22, borderWidth: 2, borderBottomWidth: 4, borderColor: '#E4E9E6', padding: 12 },
  ceu: { width: 92, borderRadius: 16, alignItems: 'center', justifyContent: 'flex-end', paddingTop: 8, overflow: 'hidden' },
  corpo: { flex: 1, gap: 4, minWidth: 0 },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  titulo: { flex: 1, fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  pontos: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, height: 22, borderRadius: 11, backgroundColor: '#E8F3FD' },
  pontosTexto: { fontFamily: typography.bold, fontSize: 11.5, color: '#2F7FC4' },
  estagio: { fontFamily: typography.semiBold, fontSize: 12, color: '#5A6B64' },
  trilho: { height: 8, borderRadius: 4, backgroundColor: '#F2F4F3', overflow: 'hidden', marginTop: 2 },
  cheio: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  miudo: { fontFamily: typography.regular, fontSize: 11.5, color: '#6B7B74' },
  rodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  avatares: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  mais: { fontFamily: typography.bold, fontSize: 12, color: '#5A6B64', marginLeft: 6 },
  avatarBox: { width: 42, height: 42 },
  gota: { position: 'absolute', right: -3, bottom: -3, width: 16, height: 16, borderRadius: 8, backgroundColor: AZUL_AGUA, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
  pilulaFalta: { paddingHorizontal: 10, height: 28, borderRadius: 14, backgroundColor: AZUL_AGUA, alignItems: 'center', justifyContent: 'center' },
  pilulaFaltaTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.white },
  pilulaOk: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 9, height: 28, borderRadius: 14, backgroundColor: '#EAF5DD' },
  pilulaOkTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
});
