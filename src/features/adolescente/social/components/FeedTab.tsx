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
import JardimBotao from './JardimBotao';
import { BroxisMascot } from '../../../../shared/ui/BroxisMascot';
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
          <Ionicons name="eye-off-outline" size={18} color="#5F7167" />
          <Text style={styles.consentimentoCompactoTexto}>Suas conquistas não aparecem para os amigos.</Text>
          <JardimBotao
            variante="suave"
            tamanho="pequeno"
            bloco={false}
            label="ATIVAR"
            desabilitado={salvandoConsentimento}
            onPress={() => void alterarConsentimento(true)}
          />
        </View>
      );
    }

    return (
      <View style={styles.consentimentoCard}>
        <View style={styles.consentimentoTopo}>
          <View style={styles.consentimentoSelo}><Ionicons name="people" size={20} color={colors.primaryDark} /></View>
          <Text style={[styles.consentimentoTitulo, { flex: 1, marginBottom: 0 }]}>Mostrar minhas conquistas aos amigos?</Text>
        </View>
        <Text style={styles.consentimentoTexto}>
          Seus amigos poderiam ver quando você ganha uma insígnia, conclui lições, mantém a sequência ou faz uma receita.
          Nunca aparecem o que você comeu, peso, escola ou dados pessoais. Você pode parar quando quiser.
        </Text>

        <View style={{ gap: 8 }}>
          <JardimBotao
            variante="primario"
            icone="checkmark"
            label="SIM, COMPARTILHAR"
            carregando={salvandoConsentimento}
            onPress={() => void alterarConsentimento(true)}
          />
          <JardimBotao
            variante="contorno"
            label="AGORA NÃO"
            desabilitado={salvandoConsentimento}
            onPress={() => void alterarConsentimento(false)}
          />
        </View>
      </View>
    );
  }

  function renderVazio() {
    if (amigos.length === 0) {
      return (
        <View style={styles.vazio}>
          <BroxisMascot pose="curioso" size={110} entrance="nenhuma" showParticles={false} />
          <Text style={styles.vazioTitulo}>Seu feed fica animado com amigos</Text>
          <Text style={styles.vazioTexto}>
            Adicione amigos pelo código de amizade para ver as conquistas deles e comemorar juntos.
          </Text>
          <JardimBotao variante="primario" icone="person-add" label="ADICIONAR AMIGOS" onPress={onIrParaAmigos} />
        </View>
      );
    }

    return (
      <View style={styles.vazio}>
        <BroxisMascot pose="calmo" size={110} entrance="nenhuma" showParticles={false} />
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
        <JardimBotao
          variante="texto"
          tamanho="pequeno"
          icone="eye-off-outline"
          label="Parar de compartilhar minhas conquistas"
          desabilitado={salvandoConsentimento}
          onPress={confirmarParar}
          style={{ marginTop: 6 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  consentimentoCard: {
    backgroundColor: '#EEF8E4',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D3EBBC',
    padding: 16,
    marginBottom: 16,
  },
  consentimentoTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  consentimentoSelo: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D9EFC5',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EAE6',
    borderRadius: 18,
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
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E4EAE6',
    padding: 22,
    gap: 4,
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
