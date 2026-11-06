// src/features/adolescente/social/components/JuntosCard.tsx
//
// "Fizemos juntos": aparece só quando você e pelo menos um amigo mantiveram a sequência no mesmo dia. Nunca mostra
// quem não manteve. Abre o sheet de presente: reenviar uma cartinha REPETIDA (recebida mais de uma vez) a um
// amigo com quem você fez junto. Sem sorteio, sem texto livre, 1 presente por amigo por dia.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../../../shared/audio/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { turma, sombraCartao } from '../theme/turma';
import { buscarJuntosHoje, buscarRepetidas, presentearCartinha } from '../services/cartinhaService';
import type { AmigoSocial } from '../services/socialService';
import { ehErroRestricaoSocial } from '../utils/moderacao';
import {
  CARTINHAS_CELEBRAR,
  mensagemPresente,
  resumoJuntos,
  totalRepetidas,
  type AmigoJuntos,
  type Repetidas,
  type TipoCartinha,
} from '../utils/cartinhas';
import { AvatarSocialView } from './AvatarSocialView';
import CartinhaArte from './CartinhaArte';

type Props = { amigos: AmigoSocial[]; refreshToken: number; onMandarCartinha: (amigo: AmigoSocial) => void };

export default function JuntosCard({ amigos, refreshToken, onMandarCartinha }: Props) {
  const [juntos, setJuntos] = useState<AmigoJuntos[]>([]);
  const [aberto, setAberto] = useState(false);

  const carregar = useCallback(() => {
    let vivo = true;
    buscarJuntosHoje()
      .then((j) => vivo && setJuntos(j))
      .catch(() => vivo && setJuntos([]));
    return () => {
      vivo = false;
    };
  }, []);
  useFocusEffect(carregar);
  useEffect(carregar, [carregar, refreshToken, amigos.length]);

  const amigosJuntos = juntos
    .map((j) => ({ ...j, amigo: amigos.find((a) => a.amizadeId === j.amizadeId) }))
    .filter((j): j is AmigoJuntos & { amigo: AmigoSocial } => !!j.amigo);
  if (amigosJuntos.length === 0) return null;

  const { titulo, sub } = resumoJuntos(amigosJuntos.length);

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setAberto(true)}
        accessibilityRole="button"
        accessibilityLabel={`${titulo} ${sub} Toque para dar um presente.`}
        style={[estilos.sombra, sombraCartao]}
      >
        <LinearGradient colors={['#FFF1DC', '#FFE0B8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.cartao}>
          <View style={estilos.avatares}>
            {amigosJuntos.slice(0, 3).map((j, i) => (
              <View key={j.amizadeId} style={[estilos.avatarBorda, i > 0 && { marginLeft: -14 }]}>
                <AvatarSocialView avatar={j.amigo.avatar} size="small" />
              </View>
            ))}
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={estilos.titulo}>{titulo}</AppText>
            <AppText style={estilos.sub}>{sub}</AppText>
          </View>
          <View style={estilos.chama}>
            <Ionicons name="flame" size={22} color={turma.chama} />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {aberto && (
        <PresenteSheet
          amigosJuntos={amigosJuntos}
          onFechar={() => {
            setAberto(false);
            carregar();
          }}
          onMandarCartinha={(a) => {
            setAberto(false);
            onMandarCartinha(a);
          }}
        />
      )}
    </>
  );
}

type Linha = AmigoJuntos & { amigo: AmigoSocial };

function PresenteSheet({
  amigosJuntos,
  onFechar,
  onMandarCartinha,
}: {
  amigosJuntos: Linha[];
  onFechar: () => void;
  onMandarCartinha: (a: AmigoSocial) => void;
}) {
  const [lista, setLista] = useState(amigosJuntos);
  const [escolhido, setEscolhido] = useState<string>(
    (amigosJuntos.find((j) => !j.presenteado) ?? amigosJuntos[0]).amizadeId
  );
  const [repetidas, setRepetidas] = useState<Repetidas | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  useEffect(() => {
    let vivo = true;
    buscarRepetidas()
      .then((r) => vivo && setRepetidas(r))
      .catch(() => vivo && setRepetidas({}));
    return () => {
      vivo = false;
    };
  }, []);

  const atual = lista.find((j) => j.amizadeId === escolhido) ?? lista[0];
  const total = repetidas ? totalRepetidas(repetidas) : 0;

  async function dar(tipo: TipoCartinha) {
    if (enviando || atual.presenteado) return;
    setEnviando(true);
    setAviso(null);
    try {
      const r = await presentearCartinha(atual.amizadeId, tipo);
      setAviso({ ok: r === 'enviada', texto: mensagemPresente(r, atual.amigo.apelido) });
      if (r === 'enviada') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setLista((l) => l.map((j) => (j.amizadeId === atual.amizadeId ? { ...j, presenteado: true } : j)));
        setRepetidas((rep) => {
          const n = { ...(rep ?? {}) };
          const q = (n[tipo] ?? 0) - 1;
          if (q > 0) n[tipo] = q;
          else delete n[tipo];
          return n;
        });
      }
    } catch (e) {
      setAviso({
        ok: false,
        texto: ehErroRestricaoSocial(e)
          ? 'Seu espaço de amigos está em pausa por enquanto, então não dá para dar presente.'
          : 'Algo deu errado. Tente de novo daqui a pouco.',
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onFechar}>
      <View style={estilos.raiz}>
        <Pressable style={estilos.fundo} onPress={onFechar} accessibilityLabel="Fechar" />
        <View style={estilos.caixa}>
          <View style={estilos.puxador} />
          <AppText style={estilos.caixaTitulo}>Fizemos juntos!</AppText>
          <AppText style={estilos.caixaSub}>
            Quando duas pessoas mantêm a sequência no mesmo dia, dá para dar de presente uma cartinha repetida.
          </AppText>

          {lista.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.amigosLinha}>
              {lista.map((j) => (
                <TouchableOpacity
                  key={j.amizadeId}
                  onPress={() => {
                    setEscolhido(j.amizadeId);
                    setAviso(null);
                  }}
                  style={[estilos.amigoChip, j.amizadeId === atual.amizadeId && estilos.amigoChipAtivo]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: j.amizadeId === atual.amizadeId }}
                  accessibilityLabel={j.amigo.apelido}
                >
                  <AvatarSocialView avatar={j.amigo.avatar} size="small" />
                  <AppText style={estilos.amigoNome} numberOfLines={1}>
                    {j.amigo.apelido}
                  </AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {aviso && (
            <View style={[estilos.aviso, aviso.ok ? estilos.avisoOk : estilos.avisoInfo]} accessibilityRole="alert">
              <Ionicons name={aviso.ok ? 'gift' : 'information-circle'} size={22} color={aviso.ok ? '#3E8E2F' : colors.primaryDark} />
              <AppText style={estilos.avisoTexto}>{aviso.texto}</AppText>
            </View>
          )}

          {repetidas === null ? (
            <ActivityIndicator color={colors.primaryDark} style={{ marginVertical: 24 }} />
          ) : atual.presenteado ? (
            <AppText style={estilos.vazio}>
              Você já deu um presente para {atual.amigo.apelido} hoje. Amanhã tem mais!
            </AppText>
          ) : total === 0 ? (
            <View>
              <AppText style={estilos.vazio}>
                Você ainda não tem cartinhas repetidas. Quando receber a mesma cartinha duas vezes, ela vira presente.
              </AppText>
              <TouchableOpacity style={estilos.botao} onPress={() => onMandarCartinha(atual.amigo)} accessibilityRole="button">
                <Ionicons name="mail" size={18} color={colors.primaryDark} />
                <AppText style={estilos.botaoTexto}>Mandar uma cartinha para {atual.amigo.apelido}</AppText>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <AppText style={estilos.grupo}>Suas repetidas: toque para dar</AppText>
              <View style={estilos.grade}>
                {CARTINHAS_CELEBRAR.filter((c) => (repetidas[c.tipo] ?? 0) > 0).map((c) => (
                  <TouchableOpacity
                    key={c.tipo}
                    style={estilos.celula}
                    disabled={enviando}
                    onPress={() => void dar(c.tipo)}
                    accessibilityRole="button"
                    accessibilityLabel={`Dar ${c.titulo} de presente para ${atual.amigo.apelido}. Você tem ${repetidas[c.tipo]} repetida.`}
                  >
                    <CartinhaArte cartinha={c} />
                    <View style={estilos.contador}>
                      <AppText style={estilos.contadorTexto}>x{repetidas[c.tipo]}</AppText>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity style={estilos.fechar} onPress={onFechar} accessibilityRole="button">
            <AppText style={estilos.fecharTexto}>Fechar</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  sombra: { marginBottom: 14, borderRadius: turma.raioCartao },
  cartao: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: turma.raioCartao, padding: 14, borderWidth: 1, borderColor: '#FFD9A6' },
  avatares: { flexDirection: 'row', alignItems: 'center' },
  avatarBorda: { borderRadius: 24, borderWidth: 2, borderColor: '#fff' },
  titulo: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },
  sub: { fontSize: 12, color: turma.textoSuave, marginTop: 2 },
  chama: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.75)', alignItems: 'center', justifyContent: 'center' },

  raiz: { flex: 1, justifyContent: 'flex-end' },
  fundo: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  caixa: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28, maxHeight: '88%' },
  puxador: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#D5DDD8', marginBottom: 14 },
  caixaTitulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark },
  caixaSub: { fontSize: 13, color: '#6B7280', marginTop: 2, marginBottom: 10 },
  amigosLinha: { gap: 8, paddingVertical: 4, marginBottom: 6 },
  amigoChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, paddingLeft: 4, paddingRight: 12, borderRadius: 999, borderWidth: 1.5, borderColor: '#E4EAE6', backgroundColor: '#fff' },
  amigoChipAtivo: { borderColor: colors.primary, backgroundColor: '#F1F9E8' },
  amigoNome: { fontFamily: typography.semiBold, fontSize: 13, color: colors.primaryDark, maxWidth: 110 },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, padding: 12, marginVertical: 8 },
  avisoOk: { backgroundColor: '#E8F5DF' },
  avisoInfo: { backgroundColor: '#EEF4F0' },
  avisoTexto: { flex: 1, fontSize: 14, color: colors.primaryDark },
  vazio: { fontSize: 14, color: '#4B5563', marginVertical: 14 },
  grupo: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark, marginTop: 8, marginBottom: 8 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  celula: { width: '30.5%' },
  contador: { position: 'absolute', top: 6, left: 6, backgroundColor: colors.primaryDark, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  contadorTexto: { fontFamily: typography.bold, fontSize: 11, color: '#fff' },
  botao: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 12 },
  botaoTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark },
  fechar: { alignItems: 'center', marginTop: 12, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#D1D5DB' },
  fecharTexto: { fontFamily: typography.semiBold, fontSize: 14, color: '#4B5563' },
});
