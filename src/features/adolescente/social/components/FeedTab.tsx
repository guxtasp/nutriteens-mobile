// src/features/adolescente/social/components/FeedTab.tsx
//
// Aba "Feed" da tela Social: faixa de amigos, consentimento para compartilhar
// as próprias conquistas (opt-in, desligado por padrão) e a lista de atividades
// com reações prontas. Não tem ScrollView próprio: roda dentro da rolagem da
// SocialScreen (que também cuida do "puxar para atualizar").
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../shared/theme/colors';
import { registrarEvento } from '../../../../shared/analytics/analytics';
import {
  buscarAmigosHoje,
  buscarFeed,
  buscarFeedVisivel,
  definirFeedVisivel,
  reagirAoEvento,
} from '../services/feedService';
import type { AmigoSocial } from '../services/socialService';
import { aplicarReacao, type EventoFeed, type Reacao } from '../utils/feed';
import { AmigosStrip } from './AmigosStrip';
import { FeedCard } from './FeedCard';

type Props = {
  amigos: AmigoSocial[];
  /** sem apelido não dá para compartilhar: o perfil social é configurado na aba Amigos */
  temApelido: boolean;
  /** muda a cada "puxar para atualizar" da tela */
  refreshToken: number;
  onAbrirAmigo: (amigo: Pick<AmigoSocial, 'amizadeId' | 'apelido' | 'avatar'>) => void;
  onIrParaAmigos: () => void;
  onEditarPerfil: () => void;
};

export function FeedTab({ amigos, temApelido, refreshToken, onAbrirAmigo, onIrParaAmigos, onEditarPerfil }: Props) {
  const [eventos, setEventos] = useState<EventoFeed[]>([]);
  const [visivel, setVisivel] = useState<boolean | null>(null);
  const [mantiveramHoje, setMantiveramHoje] = useState<Record<string, boolean>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvandoConsentimento, setSalvandoConsentimento] = useState(false);
  const [reagindoIds, setReagindoIds] = useState<string[]>([]);
  const vistoRegistrado = useRef(false);

  const carregar = useCallback(async (mostrarLoading: boolean) => {
    if (mostrarLoading) setCarregando(true);
    try {
      const [lista, consentimento, hoje] = await Promise.all([
        buscarFeed(),
        buscarFeedVisivel(),
        buscarAmigosHoje().catch(() => ({} as Record<string, boolean>)),
      ]);
      setEventos(lista);
      setVisivel(consentimento);
      setMantiveramHoje(hoje);
      setErro(null);
    } catch (e) {
      console.error('Erro ao carregar o feed:', e);
      setErro('Não foi possível carregar o feed. Puxe para baixo para tentar de novo.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar(eventos.length === 0);
    // recarrega quando a tela puxa para atualizar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregar, refreshToken]);

  useEffect(() => {
    if (!vistoRegistrado.current) {
      vistoRegistrado.current = true;
      registrarEvento('feed_visualizado');
    }
  }, []);

  // ------------------------------------------------------------------
  // Consentimento
  // ------------------------------------------------------------------

  function avisarSemApelido() {
    Alert.alert('Escolha um apelido', 'Para compartilhar suas conquistas você precisa de um apelido e um avatar.', [
      { text: 'Agora não', style: 'cancel' },
      { text: 'Escolher apelido', onPress: onEditarPerfil },
    ]);
  }

  async function alterarConsentimento(novo: boolean) {
    if (novo && !temApelido) {
      avisarSemApelido();
      return;
    }

    setSalvandoConsentimento(true);
    try {
      const status = await definirFeedVisivel(novo);
      if (status === 'sem_apelido') {
        avisarSemApelido();
        return;
      }
      setVisivel(novo);
      await carregar(false);
    } catch (e) {
      console.error('Erro ao salvar consentimento do feed:', e);
      Alert.alert('Feed', 'Não foi possível salvar sua escolha. Tente novamente.');
    } finally {
      setSalvandoConsentimento(false);
    }
  }

  function confirmarParar() {
    Alert.alert(
      'Parar de compartilhar?',
      'Suas atividades somem do feed dos seus amigos e as reações que você recebeu também. Você pode voltar a compartilhar quando quiser.',
      [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Parar de compartilhar', style: 'destructive', onPress: () => void alterarConsentimento(false) },
      ]
    );
  }

  // ------------------------------------------------------------------
  // Reações (otimistas; se o banco recusar, volta ao estado anterior)
  // ------------------------------------------------------------------

  async function reagir(evento: EventoFeed, reacao: Reacao) {
    if (reagindoIds.includes(evento.id)) return;

    const anterior = evento;
    setReagindoIds((ids) => [...ids, evento.id]);
    setEventos((lista) => lista.map((e) => (e.id === evento.id ? aplicarReacao(e, reacao) : e)));

    const desfazer = () => setEventos((lista) => lista.map((e) => (e.id === evento.id ? anterior : e)));

    try {
      const status = await reagirAoEvento(evento.id, reacao);
      if (status === 'limite') {
        desfazer();
        Alert.alert('Calma aí!', 'Você já reagiu bastante hoje. Volte amanhã para reagir de novo.');
      } else if (status === 'indisponivel' || status === 'invalida') {
        desfazer();
        void carregar(false);
      }
    } catch (e) {
      console.error('Erro ao reagir:', e);
      desfazer();
    } finally {
      setReagindoIds((ids) => ids.filter((id) => id !== evento.id));
    }
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  function renderConsentimento() {
    if (visivel === true) return null;

    if (visivel === false) {
      return (
        <View style={styles.consentimentoCompacto}>
          <Text style={styles.consentimentoCompactoTexto}>Suas conquistas não aparecem para os amigos.</Text>
          <TouchableOpacity
            onPress={() => void alterarConsentimento(true)}
            disabled={salvandoConsentimento}
            accessibilityRole="button"
          >
            <Text style={styles.link}>Ativar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.consentimentoCard}>
        <Text style={styles.consentimentoTitulo}>Mostrar minhas conquistas aos amigos?</Text>
        <Text style={styles.consentimentoTexto}>
          Seus amigos poderiam ver quando você ganha uma insígnia, conclui lições, mantém a sequência ou faz uma receita.
          Nunca aparecem o que você comeu, peso, escola ou dados pessoais. Você pode parar quando quiser.
        </Text>

        <TouchableOpacity
          style={styles.botaoPrimario}
          onPress={() => void alterarConsentimento(true)}
          disabled={salvandoConsentimento}
          accessibilityRole="button"
        >
          {salvandoConsentimento ? (
            <ActivityIndicator color={colors.primaryDark} />
          ) : (
            <Text style={styles.botaoPrimarioTexto}>Sim, compartilhar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoSecundario}
          onPress={() => void alterarConsentimento(false)}
          disabled={salvandoConsentimento}
          accessibilityRole="button"
        >
          <Text style={styles.botaoSecundarioTexto}>Agora não</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderVazio() {
    if (amigos.length === 0) {
      return (
        <View style={styles.vazio}>
          <View style={styles.vazioIcone}>
            <Ionicons name="people-outline" size={30} color={colors.primaryDark} />
          </View>
          <Text style={styles.vazioTitulo}>Seu feed fica animado com amigos</Text>
          <Text style={styles.vazioTexto}>
            Adicione amigos pelo código de amizade para ver as conquistas deles e comemorar juntos.
          </Text>
          <TouchableOpacity style={styles.botaoPrimario} onPress={onIrParaAmigos} accessibilityRole="button">
            <Text style={styles.botaoPrimarioTexto}>Adicionar amigos</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.vazio}>
        <View style={styles.vazioIcone}>
          <Ionicons name="newspaper-outline" size={30} color={colors.primaryDark} />
        </View>
        <Text style={styles.vazioTitulo}>Ainda sem novidades</Text>
        <Text style={styles.vazioTexto}>
          Quando seus amigos concluírem lições, ganharem insígnias ou fizerem receitas, tudo aparece aqui.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <AmigosStrip amigos={amigos} mantiveramHoje={mantiveramHoje} onAbrirAmigo={onAbrirAmigo} />

      {renderConsentimento()}

      {erro && <Text style={styles.erro}>{erro}</Text>}

      {carregando ? (
        <View style={styles.carregando}>
          <ActivityIndicator size="large" color={colors.primaryDark} />
        </View>
      ) : eventos.length === 0 ? (
        renderVazio()
      ) : (
        eventos.map((evento) => (
          <FeedCard
            key={evento.id}
            evento={evento}
            reagindo={reagindoIds.includes(evento.id)}
            onReagir={reagir}
            onAbrirAutor={(e) =>
              e.amizadeId && onAbrirAmigo({ amizadeId: e.amizadeId, apelido: e.apelido, avatar: e.avatar })
            }
          />
        ))
      )}

      {visivel === true && (
        <TouchableOpacity
          style={styles.parar}
          onPress={confirmarParar}
          disabled={salvandoConsentimento}
          accessibilityRole="button"
        >
          <Text style={styles.pararTexto}>Parar de compartilhar minhas conquistas</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  consentimentoCard: {
    backgroundColor: '#EAF5DF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  consentimentoTitulo: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 6,
  },
  consentimentoTexto: {
    fontSize: 14,
    lineHeight: 20,
    color: '#3F5247',
    marginBottom: 14,
  },
  consentimentoCompacto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#F1F5EE',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  consentimentoCompactoTexto: {
    flex: 1,
    fontSize: 13,
    color: '#5F7167',
  },
  link: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
    textDecorationLine: 'underline',
  },
  botaoPrimario: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
  },
  botaoPrimarioTexto: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  botaoSecundario: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  botaoSecundarioTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5F7167',
  },
  carregando: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  erro: {
    fontSize: 13,
    color: colors.error,
    marginBottom: 12,
  },
  vazio: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4ECDF',
    padding: 22,
  },
  vazioIcone: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF5DF',
    marginBottom: 12,
  },
  vazioTitulo: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primaryDark,
    textAlign: 'center',
    marginBottom: 6,
  },
  vazioTexto: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5F7167',
    textAlign: 'center',
    marginBottom: 16,
  },
  parar: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  pararTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: '#87959A',
    textDecorationLine: 'underline',
  },
});
