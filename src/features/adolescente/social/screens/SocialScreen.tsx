// src/features/adolescente/social/screens/SocialScreen.tsx

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSituacaoModeracao } from '../hooks/useSituacaoModeracao';
import { formatarDataRestricao } from '../utils/moderacao';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';

import {
  AVATARES_SOCIAIS,
  AVATAR_SOCIAL_PADRAO,
  type AvatarSocial,
  avatarSocialValido,
  formatarCodigo,
  normalizarCodigo,
  poseDoAvatar,
  validarApelido,
} from '../utils/amizade';

import {
  ApelidoObrigatorioError,
  bloquearUsuario,
  buscarPerfilSocial,
  consultarCodigo,
  definirPerfilSocial,
  denunciarUsuario,
  listarAmigos,
  listarSolicitacoes,
  obterCodigoAmizade,
  removerAmizade,
  responderSolicitacao,
  solicitarAmizadePorCodigo,
  type AmigoSocial,
  type CodigoAmizade,
  type PerfilSocial,
  type SolicitacaoSocial,
} from '../services/socialService';

import { colors } from '../../../../shared/theme/colors';
import EstatisticasCabecalho from '../../_shared/components/EstatisticasCabecalho';
import TabHeader from '../../_shared/components/TabHeader';
import { ChamaDuplaSection } from '../components/ChamaDuplaSection';
import { FeedTab } from '../components/FeedTab';
import JardimEntradaCard from '../components/JardimEntradaCard';
import DesafioGrupoEntradaCard from '../components/DesafioGrupoEntradaCard';
import CartinhasCard from '../components/CartinhasCard';
import JuntosCard from '../components/JuntosCard';
import { EnviarCartinhaSheet } from '../components/EnviarCartinhaSheet';
import { PedidosAmizadeSheet } from '../components/PedidosAmizadeSheet';
import TurmaHero from '../components/TurmaHero';
import SeletorTurma from '../components/SeletorTurma';
import SecaoTitulo from '../components/SecaoTitulo';
import { ATIVIDADE, turma } from '../theme/turma';
import { FaixaTurma } from '../components/FaixaTurma';
import { useChamaDupla } from '../hooks/useChamaDupla';
import { typography } from '../../../../shared/theme/typography';
import { BroxisMascot } from '../../../../shared/ui/BroxisMascot';

import HomeBottomBar from '../../_shared/components/HomeBottomBar';
import QuickActionsMenu from '../../_shared/components/QuickActionsMenu';

type NavigationProp =
  NativeStackNavigationProp<AdolescenteStackParamList>;

type AbaSocial = 'feed' | 'amigos';

type BannerType = 'success' | 'error' | 'info';

type BannerState = {
  message: string;
  type: BannerType;
} | null;

const AVATAR_LABELS: Record<AvatarSocial, string> = {
  supercontente: 'Supercontente',
  orgulhoso: 'Orgulhoso',
  curioso: 'Curioso',
  calmo: 'Calmo',
  pensando: 'Pensando',
  surpreso: 'Surpreso',
};

/**
 * O banco guarda apenas a chave do avatar ("supercontente", "curioso", etc.).
 * `poseDoAvatar` traduz a chave para a pose do Broxis, que é desenhada
 * dentro de um círculo. Sem avatar válido, aparece um placeholder.
 */
function AvatarSocialView({
  avatar,
  size = 'medium',
}: {
  avatar: string | null | undefined;
  size?: 'small' | 'medium' | 'large';
}) {
  const sizes = {
    small: 42,
    medium: 64,
    large: 82,
  };

  const diameter = sizes[size];

  // Chave vazia ou de um avatar que não existe mais (ex.: "aceno"):
  // mostra um placeholder neutro até a pessoa escolher outro.
  const valido = avatarSocialValido(avatar);

  return (
    <View
      style={[
        styles.avatar,
        !valido && styles.avatarPlaceholder,
        {
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
        },
      ]}
    >
      {valido ? (
        <BroxisMascot
          pose={poseDoAvatar(avatar)}
          size={diameter}
          entrance="nenhuma"
          showParticles={false}
        />
      ) : (
        <Ionicons
          name="person"
          size={Math.round(diameter * 0.5)}
          color="#9DB08C"
        />
      )}
    </View>
  );
}

function formatarData(data: Date | null): string {
  if (!data) return '';

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function mensagemConsulta(status: string): string {
  switch (status) {
    case 'proprio':
      return 'Esse é o seu próprio código. Compartilhe esse código com quem você quer adicionar.';

    case 'limite':
      return 'Você tentou muitas vezes. Espere um pouco e tente novamente.';

    case 'invalido':
      return 'Código inválido ou expirado. Confira o código e tente novamente.';

    default:
      return 'Não foi possível consultar esse código.';
  }
}

function mensagemSolicitacao(status: string): string {
  switch (status) {
    case 'enviada':
      return 'Pedido enviado! Agora é só esperar a pessoa aceitar.';

    case 'aceita':
      return 'Vocês agora são amigos!';

    case 'ja_amigos':
      return 'Vocês já são amigos.';

    case 'proprio':
      return 'Esse é o seu próprio código.';

    case 'invalido':
      return 'Código inválido ou expirado.';

    case 'limite':
      return 'Muitas tentativas. Espere um pouco e tente novamente.';

    case 'limite_pendentes':
      return 'Você já tem muitos pedidos pendentes.';

    case 'sem_apelido':
      return 'Escolha um apelido antes de enviar pedidos de amizade.';

    default:
      return 'Não foi possível enviar o pedido.';
  }
}

export default function SocialScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { situacao: situacaoModeracao } = useSituacaoModeracao();

  const [perfil, setPerfil] = useState<PerfilSocial>({
    apelido: null,
    avatar: null,
  });

  const [codigo, setCodigo] = useState<CodigoAmizade | null>(null);

  const [pedidosRecebidos, setPedidosRecebidos] = useState<
    SolicitacaoSocial[]
  >([]);

  const [pedidosEnviados, setPedidosEnviados] = useState<
    SolicitacaoSocial[]
  >([]);

  const [amigos, setAmigos] = useState<AmigoSocial[]>([]);
  const chamaDupla = useChamaDupla();
  const [codigoAberto, setCodigoAberto] = useState(false);

  const [codigoDigitado, setCodigoDigitado] = useState('');
  const [resultadoBusca, setResultadoBusca] = useState<{
    apelido: string;
    avatar: string | null;
    codigo: string;
  } | null>(null);

  const [apelidoDigitado, setApelidoDigitado] = useState('');
  const [avatarSelecionado, setAvatarSelecionado] =
    useState<AvatarSocial>('supercontente');

  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [erroPerfil, setErroPerfil] = useState<string | null>(null);
  const [renovandoCodigo, setRenovandoCodigo] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const [menuAberto, setMenuAberto] = useState(false);

  // O feed é a tela principal; "Amigos" guarda perfil, código, pedidos e Chama em Dupla.
  const [aba, setAba] = useState<AbaSocial>('feed');
  const { width: larguraTela } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // A HomeBottomBar é desenhada por cima (padding 24 + área segura + ~60 de barra) e o botão + sobe ~36 acima dela.
  const baixoBotaoAdicionar = 24 + insets.bottom + 60 + 36 + 12;
  const [paginaAtividade, setPaginaAtividade] = useState(0);
  // 2 cartões por vez cabem com um pedaço do próximo à mostra: convida a deslizar
  const larguraCartaoAtividade = larguraTela - 40 - 28;
  const [amigoCartinha, setAmigoCartinha] = useState<{ amizadeId: string; apelido: string } | null>(null);
  const [sheetAberto, setSheetAberto] = useState(false);
  const [pedidosAberto, setPedidosAberto] = useState(false);
  // muda a cada "puxar para atualizar" para o feed recarregar junto
  const [feedToken, setFeedToken] = useState(0);

  const [banner, setBanner] = useState<BannerState>(null);

  const mostrarBanner = useCallback(
    (message: string, type: BannerType = 'info') => {
      setBanner({ message, type });

      setTimeout(() => {
        setBanner(null);
      }, 3500);
    },
    [],
  );

  // ---------------------------------------------------------
  // CARREGAMENTO
  // ---------------------------------------------------------

  const carregarTudo = useCallback(
    async (mostrarLoading = true) => {
      if (mostrarLoading) {
        setCarregando(true);
      }

      try {
        const [
          perfilAtual,
          codigoAtual,
          solicitacoes,
          amigosAtuais,
        ] = await Promise.all([
          buscarPerfilSocial(),
          obterCodigoAmizade(false).catch((error) => {
            if (error instanceof ApelidoObrigatorioError) {
              return null;
            }

            throw error;
          }),
          listarSolicitacoes(),
          listarAmigos(),
        ]);

        setPerfil(perfilAtual);
        setCodigo(codigoAtual);

        // Primeiro acesso: o perfil social (apelido e avatar) é configurado na aba Amigos.
        if (!perfilAtual.apelido) setAba('amigos');

        setApelidoDigitado(perfilAtual.apelido ?? '');

        if (perfilAtual.avatar) {
          const avatar = perfilAtual.avatar as AvatarSocial;

          if (
            (AVATARES_SOCIAIS as readonly string[]).includes(avatar)
          ) {
            setAvatarSelecionado(avatar);
          }
        }

        setPedidosRecebidos(
          solicitacoes.filter(
            (item) => item.direcao === 'recebida',
          ),
        );

        setPedidosEnviados(
          solicitacoes.filter(
            (item) => item.direcao === 'enviada',
          ),
        );

        setAmigos(amigosAtuais);
      } catch (error) {
        console.error('Erro ao carregar SocialScreen:', error);

        mostrarBanner(
          'Não foi possível carregar seus amigos. Tente novamente.',
          'error',
        );
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [mostrarBanner],
  );

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  const atualizar = useCallback(async () => {
    setAtualizando(true);
    setFeedToken((t) => t + 1);
    await Promise.all([carregarTudo(false), chamaDupla.recarregar()]);
  }, [carregarTudo, chamaDupla.recarregar]);

  // ---------------------------------------------------------
  // PERFIL SOCIAL
  // ---------------------------------------------------------

  async function salvarPerfilSocial() {
    const resultado = validarApelido(apelidoDigitado);

    if (!resultado.valido) {
      const mensagens = {
        curto: 'O apelido precisa ter pelo menos 3 caracteres.',
        longo: 'O apelido pode ter no máximo 20 caracteres.',
        caracteres:
          'Use somente letras, números, espaço, ponto, hífen ou _.',
        telefone: 'Não coloque telefone no apelido.',
      };

      setErroPerfil(mensagens[resultado.erro]);
      return;
    }

    setErroPerfil(null);
    setSalvandoPerfil(true);

    try {
      const status = await definirPerfilSocial(
        resultado.valor,
        avatarSelecionado,
      );

      if (status === 'apelido_invalido') {
        setErroPerfil('Esse apelido não é válido.');
        return;
      }

      if (status === 'avatar_invalido') {
        setErroPerfil('Esse avatar não é válido.');
        return;
      }

      setPerfil({
        apelido: resultado.valor,
        avatar: avatarSelecionado,
      });

      setEditandoPerfil(false);

      mostrarBanner('Seu perfil na Turma foi atualizado!', 'success');

      // Agora que existe apelido, o código pode ser gerado.
      if (!codigo) {
        const novoCodigo = await obterCodigoAmizade(false);
        setCodigo(novoCodigo);
      }
    } catch (error) {
      console.error(error);

      setErroPerfil('Não foi possível salvar seu perfil. Tente novamente.');
    } finally {
      setSalvandoPerfil(false);
    }
  }

  function restaurarFormularioPerfil() {
    setApelidoDigitado(perfil.apelido ?? '');
    setErroPerfil(null);

    // Avatar salvo que não existe mais (ex.: "aceno"): volta ao padrão
    // e a pessoa escolhe outro.
    setAvatarSelecionado(
      avatarSocialValido(perfil.avatar)
        ? perfil.avatar
        : AVATAR_SOCIAL_PADRAO,
    );
  }

  function iniciarEdicaoPerfil() {
    restaurarFormularioPerfil();
    setEditandoPerfil(true);
  }

  function cancelarEdicaoPerfil() {
    setEditandoPerfil(false);
    restaurarFormularioPerfil();
  }

  // ---------------------------------------------------------
  // CÓDIGO DE AMIZADE
  // ---------------------------------------------------------

  async function compartilharCodigo() {
    if (!codigo?.codigo) return;

    try {
      await Share.share({
        message:
          `Me adiciona no NutriTeens! ` +
          `Meu código de amizade é ${formatarCodigo(codigo.codigo)}.`,
      });
    } catch {
      // O usuário pode simplesmente fechar a janela de compartilhamento.
    }
  }

  async function renovarCodigoAmizade() {
    if (!perfil.apelido) {
      mostrarBanner(
        'Escolha um apelido antes de gerar seu código de amizade.',
        'info',
      );
      return;
    }

    Alert.alert(
      'Renovar código?',
      'Seu código atual deixará de funcionar e um novo código será criado.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Renovar',
          style: 'destructive',
          onPress: async () => {
            setRenovandoCodigo(true);

            try {
              const novoCodigo = await obterCodigoAmizade(true);

              setCodigo(novoCodigo);

              setResultadoBusca(null);
              setCodigoDigitado('');

              mostrarBanner(
                'Seu código de amizade foi renovado.',
                'success',
              );
            } catch (error) {
              console.error(error);

              mostrarBanner(
                'Não foi possível renovar o código.',
                'error',
              );
            } finally {
              setRenovandoCodigo(false);
            }
          },
        },
      ],
    );
  }

  // ---------------------------------------------------------
  // BUSCA POR CÓDIGO DE AMIZADE
  // ---------------------------------------------------------

  async function procurarCodigo() {
    const codigoNormalizado = normalizarCodigo(codigoDigitado);

    if (codigoNormalizado.length !== 8) {
      mostrarBanner(
        'Digite um código de amizade completo, como ABCD-7K9P.',
        'error',
      );
      return;
    }

    setBuscando(true);
    setResultadoBusca(null);

    try {
      const resultado = await consultarCodigo(codigoNormalizado);

      if (resultado.status !== 'ok') {
        mostrarBanner(
          mensagemConsulta(resultado.status),
          resultado.status === 'limite' ? 'error' : 'info',
        );

        return;
      }

      if (!resultado.apelido) {
        mostrarBanner(
          'Não foi possível encontrar o perfil social.',
          'error',
        );

        return;
      }

      setResultadoBusca({
        apelido: resultado.apelido,
        avatar: resultado.avatar,
        codigo: codigoNormalizado,
      });
    } catch (error) {
      console.error(error);

      mostrarBanner(
        'Não foi possível consultar esse código.',
        'error',
      );
    } finally {
      setBuscando(false);
    }
  }

  function limparBusca() {
    setCodigoDigitado('');
    setResultadoBusca(null);
  }

  async function enviarPedido() {
    if (!resultadoBusca) return;

    setOcupado(true);

    try {
      const status = await solicitarAmizadePorCodigo(
        resultadoBusca.codigo,
      );

      mostrarBanner(
        mensagemSolicitacao(status),
        status === 'enviada' || status === 'aceita'
          ? 'success'
          : 'info',
      );

      limparBusca();

      await carregarTudo(false);
    } catch (error) {
      console.error(error);

      mostrarBanner(
        'Não foi possível enviar o pedido. Tente novamente.',
        'error',
      );
    } finally {
      setOcupado(false);
    }
  }

  // ---------------------------------------------------------
  // PEDIDOS
  // ---------------------------------------------------------

  async function responderPedido(
    amizadeId: string,
    aceitar: boolean,
    apelido: string,
  ) {
    setOcupado(true);

    try {
      const ok = await responderSolicitacao(
        amizadeId,
        aceitar,
      );

      if (!ok) {
        mostrarBanner(
          'Esse pedido já foi respondido ou não existe mais.',
          'info',
        );

        await carregarTudo(false);
        return;
      }

      mostrarBanner(
        aceitar
          ? `Você e ${apelido} agora são amigos!`
          : 'Pedido recusado.',
        aceitar ? 'success' : 'info',
      );

      await carregarTudo(false);
    } catch (error) {
      console.error(error);

      mostrarBanner(
        'Não foi possível responder ao pedido.',
        'error',
      );
    } finally {
      setOcupado(false);
    }
  }

  async function cancelarPedido(
    amizadeId: string,
    apelido: string,
  ) {
    Alert.alert(
      'Cancelar pedido?',
      `O pedido para ${apelido} será cancelado.`,
      [
        {
          text: 'Voltar',
          style: 'cancel',
        },
        {
          text: 'Cancelar pedido',
          style: 'destructive',
          onPress: async () => {
            setOcupado(true);

            try {
              const ok = await removerAmizade(amizadeId);

              mostrarBanner(
                ok
                  ? 'Pedido cancelado.'
                  : 'O pedido já não existe mais.',
                ok ? 'success' : 'info',
              );

              await carregarTudo(false);
            } catch (error) {
              console.error(error);

              mostrarBanner(
                'Não foi possível cancelar o pedido.',
                'error',
              );
            } finally {
              setOcupado(false);
            }
          },
        },
      ],
    );
  }

  // ---------------------------------------------------------
  // AMIZADE
  // ---------------------------------------------------------

  async function desfazerAmizade(
    amizadeId: string,
    apelido: string,
  ) {
    Alert.alert(
      'Desfazer amizade?',
      `Você e ${apelido} deixarão de ser amigos.`,
      [
        {
          text: 'Voltar',
          style: 'cancel',
        },
        {
          text: 'Desfazer',
          style: 'destructive',
          onPress: async () => {
            setOcupado(true);

            try {
              const ok = await removerAmizade(amizadeId);

              mostrarBanner(
                ok
                  ? 'Amizade desfeita.'
                  : 'Essa amizade já não existe mais.',
                ok ? 'success' : 'info',
              );

              await carregarTudo(false);
            } catch (error) {
              console.error(error);

              mostrarBanner(
                'Não foi possível desfazer a amizade.',
                'error',
              );
            } finally {
              setOcupado(false);
            }
          },
        },
      ],
    );
  }

  // ---------------------------------------------------------
  // BLOQUEAR / DENUNCIAR
  // ---------------------------------------------------------

  async function bloquear(
    amizadeId: string,
    apelido: string,
  ) {
    Alert.alert(
      'Bloquear pessoa?',
      `Você não verá mais interações sociais de ${apelido}. A amizade ou pedido também será removido.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            setOcupado(true);

            try {
              const ok = await bloquearUsuario(amizadeId);

              mostrarBanner(
                ok
                  ? `${apelido} foi bloqueado.`
                  : 'Não foi possível bloquear essa pessoa.',
                ok ? 'success' : 'error',
              );

              await carregarTudo(false);
            } catch (error) {
              console.error(error);

              mostrarBanner(
                'Não foi possível bloquear essa pessoa.',
                'error',
              );
            } finally {
              setOcupado(false);
            }
          },
        },
      ],
    );
  }

  async function denunciar(
    amizadeId: string,
    apelido: string,
  ) {
    Alert.alert(
      'Denunciar pessoa',
      `Por que você quer denunciar ${apelido}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Comportamento inadequado',
          onPress: () =>
            enviarDenuncia(
              amizadeId,
              'comportamento_inadequado',
            ),
        },
        {
          text: 'Assédio ou bullying',
          onPress: () =>
            enviarDenuncia(
              amizadeId,
              'assedio_ou_bullying',
            ),
        },
        {
          text: 'Outro',
          onPress: () =>
            enviarDenuncia(amizadeId, 'outro'),
        },
      ],
    );
  }

  async function enviarDenuncia(
    amizadeId: string,
    motivo: string,
  ) {
    setOcupado(true);

    try {
      const ok = await denunciarUsuario(
        amizadeId,
        motivo,
      );

      mostrarBanner(
        ok
          ? 'Denúncia enviada. Obrigado por ajudar a manter o espaço seguro.'
          : 'Não foi possível enviar a denúncia.',
        ok ? 'success' : 'error',
      );
    } catch (error) {
      console.error(error);

      mostrarBanner(
        'Não foi possível enviar a denúncia.',
        'error',
      );
    } finally {
      setOcupado(false);
    }
  }

  function abrirOpcoesAmigo(amigo: AmigoSocial) {
    Alert.alert(
      amigo.apelido,
      'O que você deseja fazer?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Desfazer amizade',
          style: 'destructive',
          onPress: () =>
            desfazerAmizade(
              amigo.amizadeId,
              amigo.apelido,
            ),
        },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: () =>
            bloquear(
              amigo.amizadeId,
              amigo.apelido,
            ),
        },
        {
          text: 'Denunciar',
          onPress: () =>
            denunciar(
              amigo.amizadeId,
              amigo.apelido,
            ),
        },
      ],
    );
  }

  function abrirOpcoesPedido(pedido: SolicitacaoSocial) {
    Alert.alert(
      pedido.apelido,
      'O que você deseja fazer?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Aceitar',
          onPress: () =>
            responderPedido(
              pedido.amizadeId,
              true,
              pedido.apelido,
            ),
        },
        {
          text: 'Recusar',
          style: 'destructive',
          onPress: () =>
            responderPedido(
              pedido.amizadeId,
              false,
              pedido.apelido,
            ),
        },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: () =>
            bloquear(
              pedido.amizadeId,
              pedido.apelido,
            ),
        },
        {
          text: 'Denunciar',
          onPress: () =>
            denunciar(
              pedido.amizadeId,
              pedido.apelido,
            ),
        },
      ],
    );
  }

  // ---------------------------------------------------------
  // MENU INFERIOR
  // ---------------------------------------------------------

  function handleSelecionarAcao(
    opcao: 'alimentacao' | 'agua' | 'atividade',
  ) {
    setMenuAberto(false);

    if (opcao === 'atividade') {
      navigation.navigate('AtividadeFisica');
    } else if (opcao === 'agua') {
      navigation.navigate('ConsumoAgua');
    } else if (opcao === 'alimentacao') {
      navigation.navigate('TipoRefeicao');
    }
  }

  // ---------------------------------------------------------
  // COMPONENTES DA TELA
  // ---------------------------------------------------------

  function renderBanner() {
    if (!banner) return null;

    return (
      <View
        style={[
          styles.banner,
          banner.type === 'success' && styles.bannerSuccess,
          banner.type === 'error' && styles.bannerError,
          banner.type === 'info' && styles.bannerInfo,
        ]}
      >
        <Ionicons
          name={
            banner.type === 'success'
              ? 'checkmark-circle'
              : banner.type === 'error'
                ? 'alert-circle'
                : 'information-circle'
          }
          size={20}
          color={
            banner.type === 'success'
              ? '#236B35'
              : banner.type === 'error'
                ? '#B23A3A'
                : '#416B76'
          }
        />

        <Text style={styles.bannerText}>
          {banner.message}
        </Text>

        <TouchableOpacity
          onPress={() => setBanner(null)}
          hitSlop={10}
        >
          <Ionicons
            name="close"
            size={18}
            color="#68777D"
          />
        </TouchableOpacity>
      </View>
    );
  }

  /** Campos de apelido e avatar + botões. Usado no cadastro inicial e no popup. */
  function renderFormularioPerfil() {
    return (
      <>
        <Text style={styles.inputLabel}>
          Seu apelido
        </Text>

        <TextInput
          value={apelidoDigitado}
          onChangeText={(texto) => {
            setApelidoDigitado(texto);
            setErroPerfil(null);
          }}
          placeholder="Ex.: Joãozinho"
          placeholderTextColor="#9AA5AA"
          maxLength={20}
          autoCapitalize="words"
          autoCorrect={false}
          style={styles.nicknameInput}
        />

        <Text style={styles.inputCounter}>
          {apelidoDigitado.length}/20
        </Text>

        <Text style={styles.inputLabel}>
          Escolha seu avatar
        </Text>

        <View style={styles.avatarGrid}>
          {AVATARES_SOCIAIS.map((avatar) => {
            const selecionado = avatarSelecionado === avatar;

            return (
              <TouchableOpacity
                key={avatar}
                style={[
                  styles.avatarOption,
                  selecionado && styles.avatarOptionSelected,
                ]}
                onPress={() => {
                  setAvatarSelecionado(avatar);
                  setErroPerfil(null);
                }}
              >
                <AvatarSocialView
                  avatar={avatar}
                  size="small"
                />

                <Text
                  style={[
                    styles.avatarOptionText,
                    selecionado && styles.avatarOptionTextSelected,
                  ]}
                >
                  {AVATAR_LABELS[avatar]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {erroPerfil && (
          <View style={styles.formError}>
            <Ionicons
              name="alert-circle"
              size={17}
              color="#B23A3A"
            />

            <Text style={styles.formErrorText}>
              {erroPerfil}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={salvarPerfilSocial}
          disabled={salvandoPerfil}
        >
          {salvandoPerfil ? (
            <ActivityIndicator
              color={colors.primaryDark}
            />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={colors.primaryDark}
              />

              <Text style={styles.primaryButtonText}>
                Salvar perfil
              </Text>
            </>
          )}
        </TouchableOpacity>

        {editandoPerfil && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={cancelarEdicaoPerfil}
            disabled={salvandoPerfil}
          >
            <Text style={styles.secondaryButtonText}>
              Cancelar
            </Text>
          </TouchableOpacity>
        )}
      </>
    );
  }

  function renderPerfilSocial() {
    const precisaConfigurar = !perfil.apelido;

    // Já configurado: uma linha compacta (avatar, apelido, editar) com o código
    // de amizade recolhido. Só o primeiro preenchimento ocupa a tela.
    if (!precisaConfigurar) {
      return (
        <View style={styles.compactCard}>
          <View style={styles.compactRow}>
            <AvatarSocialView avatar={perfil.avatar} size="small" />

            <View style={styles.profileInfo}>
              <Text style={styles.profileNickname}>{perfil.apelido}</Text>
              <Text style={styles.profileDescription}>Seu perfil social</Text>
            </View>

            <TouchableOpacity
              style={styles.compactAction}
              onPress={iniciarEdicaoPerfil}
              accessibilityRole="button"
              accessibilityLabel="Editar apelido e avatar"
            >
              <Ionicons name="create-outline" size={17} color={colors.primaryDark} />
              <Text style={styles.compactActionText}>Editar</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.codeToggle}
            onPress={() => setCodigoAberto((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: codigoAberto }}
          >
            <Ionicons name="key-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.codeToggleText}>Meu código de amizade</Text>
            <Ionicons
              name={codigoAberto ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.primaryDark}
            />
          </TouchableOpacity>

          {codigoAberto && renderMeuCodigo()}
        </View>
      );
    }

    return (
      <>
        <Text style={styles.sectionTitle}>
          Seu perfil social
        </Text>

        <View style={styles.profileCard}>
          <AvatarSocialView
            avatar={precisaConfigurar ? avatarSelecionado : perfil.avatar}
            size="large"
          />

          <View style={styles.profileInfo}>
            {perfil.apelido ? (
              <>
                <Text style={styles.profileNickname}>
                  {perfil.apelido}
                </Text>

                <Text style={styles.profileDescription}>
                  Esse é o apelido que seus amigos verão.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.profileNickname}>
                  Escolha seu apelido
                </Text>

                <Text style={styles.profileDescription}>
                  Seu nome real não aparece na parte social.
                </Text>
              </>
            )}
          </View>

          {!precisaConfigurar && (
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={iniciarEdicaoPerfil}
              accessibilityLabel="Editar apelido e avatar"
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={colors.primaryDark}
              />
            </TouchableOpacity>
          )}
        </View>

        {precisaConfigurar && (
          <View style={styles.setupCard}>
            <Text style={styles.setupTitle}>
              Antes de adicionar amigos
            </Text>

            <Text style={styles.setupDescription}>
              Escolha um apelido e uma pose do Broxis para seu
              perfil social.
            </Text>

            {renderFormularioPerfil()}
          </View>
        )}
      </>
    );
  }

  function renderModalEditarPerfil() {
    return (
      <Modal
        visible={editandoPerfil}
        transparent
        animationType="fade"
        onRequestClose={cancelarEdicaoPerfil}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Toque fora do cartão fecha o popup */}
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={cancelarEdicaoPerfil}
            disabled={salvandoPerfil}
          />

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Editar perfil social
              </Text>

              <TouchableOpacity
                style={styles.modalClose}
                onPress={cancelarEdicaoPerfil}
                disabled={salvandoPerfil}
                hitSlop={10}
                accessibilityLabel="Fechar"
              >
                <Ionicons
                  name="close"
                  size={20}
                  color="#68777D"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalPreview}>
                <AvatarSocialView
                  avatar={avatarSelecionado}
                  size="large"
                />
              </View>

              {renderFormularioPerfil()}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  function renderMeuCodigo() {
    if (!perfil.apelido) return null;

    return (
      <View style={styles.codePanel}>
        <View style={styles.codePanelRow}>
          <View style={styles.codeBoxCompact}>
            {codigo ? (
              <Text style={styles.codeTextCompact}>{formatarCodigo(codigo.codigo)}</Text>
            ) : (
              <ActivityIndicator color={colors.primary} />
            )}
          </View>

          {codigo && (
            <Text style={styles.expirationText}>
              Válido até{' '}
              {codigo.expiraEm.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </Text>
          )}
        </View>

        <Text style={styles.codeHint}>
          Compartilhe para adicionar amigos. Não é o seu código de participante.
        </Text>

        <View style={styles.codeActions}>
          <TouchableOpacity
            style={styles.codeActionPrimary}
            onPress={compartilharCodigo}
            disabled={!codigo}
          >
            <Ionicons name="share-outline" size={19} color={colors.primaryDark} />
            <Text style={styles.codeActionPrimaryText}>Compartilhar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.codeActionSecondary}
            onPress={renovarCodigoAmizade}
            disabled={renovandoCodigo}
          >
            {renovandoCodigo ? (
              <ActivityIndicator size="small" color={colors.primaryDark} />
            ) : (
              <Ionicons name="refresh-outline" size={19} color={colors.white} />
            )}
            <Text style={styles.codeActionSecondaryText}>Renovar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderAdicionarAmigo() {
    return (
      <>
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Ionicons
              name="key-outline"
              size={20}
              color="#87959A"
            />

            <TextInput
              value={formatarCodigo(codigoDigitado)}
              onChangeText={(texto) => {
                const normalizado =
                  normalizarCodigo(texto);

                setCodigoDigitado(normalizado);
                setResultadoBusca(null);
              }}
              placeholder="ABCD-7K9P"
              placeholderTextColor="#9AA5AA"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={9}
              returnKeyType="search"
              onSubmitEditing={procurarCodigo}
              style={styles.searchInput}
            />
          </View>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={procurarCodigo}
            disabled={buscando}
          >
            {buscando ? (
              <ActivityIndicator
                color={colors.primaryDark}
              />
            ) : (
              <Ionicons
                name="arrow-forward"
                size={21}
                color={colors.primaryDark}
              />
            )}
          </TouchableOpacity>
        </View>

        {resultadoBusca && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <AvatarSocialView
                avatar={resultadoBusca.avatar}
                size="medium"
              />

              <View style={styles.resultInfo}>
                <Text style={styles.resultLabel}>
                  Encontramos!
                </Text>

                <Text style={styles.resultNickname}>
                  {resultadoBusca.apelido}
                </Text>

                <Text style={styles.resultDescription}>
                  Você encontrou essa pessoa pelo código de
                  amizade.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={enviarPedido}
              disabled={ocupado}
            >
              {ocupado ? (
                <ActivityIndicator
                  color={colors.primaryDark}
                />
              ) : (
                <>
                  <Ionicons
                    name="person-add-outline"
                    size={20}
                    color={colors.primaryDark}
                  />

                  <Text style={styles.primaryButtonText}>
                    Enviar pedido
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={limparBusca}
              disabled={ocupado}
            >
              <Text style={styles.secondaryButtonText}>
                Limpar
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  }

  function renderSeletorAba() {
    return <SeletorTurma ativa={aba} onChange={setAba} pedidos={pedidosRecebidos.length} />;
  }

  function renderAvisoPedidos() {
    if (pedidosRecebidos.length === 0) return null;
    const n = pedidosRecebidos.length;
    return (
      <TouchableOpacity
        style={styles.avisoPedidos}
        onPress={() => setPedidosAberto(true)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Você tem ${n} ${n === 1 ? 'pedido' : 'pedidos'} de amizade. Toque para ver.`}
      >
        <View style={styles.avisoPedidosIcone}>
          <Ionicons name="person-add" size={20} color={colors.primaryDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.avisoPedidosTitulo}>
            {n === 1 ? '1 pedido de amizade' : `${n} pedidos de amizade`}
          </Text>
          <Text style={styles.avisoPedidosSub}>esperando</Text>
        </View>
        <View style={styles.avisoPedidosVer}>
          <Text style={styles.avisoPedidosVerTexto}>VER</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Atalho no sheet de adicionar: as listas de pedidos agora moram na própria tela "Pedidos de amizade".
  function renderLinkPedidos() {
    const total = pedidosRecebidos.length + pedidosEnviados.length;
    if (total === 0) return null;
    return (
      <TouchableOpacity
        style={styles.linkPedidos}
        activeOpacity={0.85}
        onPress={() => {
          setSheetAberto(false);
          setPedidosAberto(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Ver pedidos de amizade. ${pedidosRecebidos.length} recebidos e ${pedidosEnviados.length} enviados.`}
      >
        <Ionicons name="mail-unread-outline" size={20} color={colors.primaryDark} />
        <View style={{ flex: 1 }}>
          <Text style={styles.linkPedidosTitulo}>Pedidos de amizade</Text>
          <Text style={styles.linkPedidosSub}>
            {pedidosRecebidos.length} {pedidosRecebidos.length === 1 ? 'recebido' : 'recebidos'} · {pedidosEnviados.length} {pedidosEnviados.length === 1 ? 'enviado' : 'enviados'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.primaryDark} />
      </TouchableOpacity>
    );
  }

  function renderSheetAdicionar() {
    return (
      <Modal
        visible={sheetAberto}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetAberto(false)}
      >
        <KeyboardAvoidingView
          style={styles.sheetOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setSheetAberto(false)}
            accessibilityLabel="Fechar"
          />

          <View style={styles.sheetCard}>
            <View style={styles.sheetAlca} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar amigos</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setSheetAberto(false)}
                hitSlop={10}
                accessibilityLabel="Fechar"
              >
                <Ionicons name="close" size={20} color="#68777D" />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {renderBanner()}

              {!!perfil.apelido && (
                <View style={styles.cartaoSheet}>
                  <View style={styles.cartaoSheetTopo}>
                    <View style={[styles.seloSheet, { backgroundColor: '#E3F2D3' }]}>
                      <Ionicons name="qr-code-outline" size={20} color={colors.primaryDark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cartaoSheetTitulo}>Seu código de amizade</Text>
                      <Text style={styles.cartaoSheetSub}>Mande para quem você quer na sua turma.</Text>
                    </View>
                  </View>
                  {renderMeuCodigo()}
                </View>
              )}

              <View style={styles.cartaoSheet}>
                <View style={styles.cartaoSheetTopo}>
                  <View style={[styles.seloSheet, { backgroundColor: '#FCE6EF' }]}>
                    <Ionicons name="person-add-outline" size={20} color="#C2477D" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartaoSheetTitulo}>Tem o código de alguém?</Text>
                    <Text style={styles.cartaoSheetSub}>Digite aqui para mandar o pedido.</Text>
                  </View>
                </View>
                {renderAdicionarAmigo()}
              </View>

              {renderLinkPedidos()}

              {!!perfil.apelido && (
                <TouchableOpacity
                  style={styles.linkPedidos}
                  activeOpacity={0.85}
                  onPress={() => {
                    setSheetAberto(false);
                    iniciarEdicaoPerfil();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Editar apelido e avatar"
                >
                  <Ionicons name="create-outline" size={20} color={colors.primaryDark} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.linkPedidosTitulo}>Meu perfil na turma</Text>
                    <Text style={styles.linkPedidosSub}>{perfil.apelido} · editar apelido e avatar</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.primaryDark} />
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TabHeader titulo="Turma" direita={<EstatisticasCabecalho />} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios' ? 'padding' : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={atualizar}
              tintColor={colors.primaryDark}
            />
          }
        >
          {renderBanner()}

          {situacaoModeracao.restritoAte && (
            <View style={[styles.banner, styles.bannerInfo]} accessibilityRole="alert">
              <Text style={styles.bannerText}>
                Seu espaço de amigos está em pausa até {formatarDataRestricao(situacaoModeracao.restritoAte)}. Você ainda vê seus amigos, mas não envia nem aceita pedidos, reage, convida para a Chama Dupla ou envia receitas.
              </Text>
            </View>
          )}

          {carregando ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={colors.primaryDark}
              />

              <Text style={styles.loadingText}>
                Carregando sua turma...
              </Text>
            </View>
          ) : (
            <>
              <TurmaHero apelido={perfil.apelido || null} amigos={amigos} refreshToken={feedToken} />

              {renderSeletorAba()}

              {aba === 'feed' ? (
                <FeedTab
                  amigos={amigos}
                  temApelido={!!perfil.apelido}
                  refreshToken={feedToken}
                  onAbrirAmigo={(amigo) =>
                    navigation.navigate('PerfilAmigo', {
                      amizadeId: amigo.amizadeId,
                      apelido: amigo.apelido,
                      avatar: amigo.avatar,
                    })
                  }
                  onIrParaAmigos={() => setAba('amigos')}
                  onEditarPerfil={iniciarEdicaoPerfil}
                />
              ) : (
                <>
                  {!perfil.apelido && renderPerfilSocial()}

                  {renderAvisoPedidos()}

                  <FaixaTurma
                    amigos={amigos}
                    refreshToken={feedToken}
                    onAbrirAmigo={(amigo) =>
                      navigation.navigate('PerfilAmigo', {
                        amizadeId: amigo.amizadeId,
                        apelido: amigo.apelido,
                        avatar: amigo.avatar,
                      })
                    }
                    onVerTodos={() => navigation.navigate('ListaAmigos')}
                  />

                  <JuntosCard
                    amigos={amigos}
                    refreshToken={feedToken}
                    onMandarCartinha={(a) => setAmigoCartinha({ amizadeId: a.amizadeId, apelido: a.apelido })}
                  />

                  <CartinhasCard />

                  <SecaoTitulo titulo="Para fazer em turma" icone="rocket" corIcone={ATIVIDADE.desafio.cor} corFundo={ATIVIDADE.desafio.fundo} />

                  <ScrollView
                    horizontal
                    pagingEnabled={false}
                    snapToInterval={larguraCartaoAtividade + 12}
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled
                    style={{ marginHorizontal: -20 }}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                    onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
                      setPaginaAtividade(Math.round(e.nativeEvent.contentOffset.x / (larguraCartaoAtividade + 12)))
                    }
                    scrollEventThrottle={16}
                  >
                    <View style={{ width: larguraCartaoAtividade }}>
                      <DesafioGrupoEntradaCard onPress={() => navigation.navigate('DesafioGrupo')} />
                    </View>
                    <View style={{ width: larguraCartaoAtividade }}>
                      <JardimEntradaCard onPress={() => navigation.navigate('Jardim')} />
                    </View>
                  </ScrollView>
                  <View style={styles.pontos} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    {[0, 1].map((i) => (
                      <View key={i} style={[styles.ponto, paginaAtividade === i && styles.pontoAtivo]} />
                    ))}
                  </View>

                  <ChamaDuplaSection chama={chamaDupla} onAbrirHome={() => navigation.navigate('Home')} />

                  {!!perfil.apelido && (
                    <>
                      <SecaoTitulo titulo="Meu perfil e código" icone="id-card" />
                      {renderPerfilSocial()}
                    </>
                  )}

                </>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {!carregando && !!perfil.apelido && (
        <View style={[styles.barraAdicionar, { bottom: baixoBotaoAdicionar }]} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.botaoAdicionar}
            onPress={() => setSheetAberto(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={
              pedidosRecebidos.length > 0
                ? `Adicionar amigos. ${pedidosRecebidos.length} ${pedidosRecebidos.length === 1 ? 'pedido esperando' : 'pedidos esperando'}`
                : 'Adicionar amigos'
            }
          >
            <View style={styles.botaoAdicionarIcone}>
              <Ionicons name="person-add" size={17} color={colors.primaryDark} />
            </View>
            <Text style={styles.botaoAdicionarTexto}>ADICIONAR AMIGOS</Text>
            {pedidosRecebidos.length > 0 && (
              <View style={styles.botaoAdicionarBadge}>
                <Text style={styles.botaoAdicionarBadgeTexto}>{pedidosRecebidos.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {renderSheetAdicionar()}

      <PedidosAmizadeSheet
        visivel={pedidosAberto}
        recebidos={pedidosRecebidos}
        enviados={pedidosEnviados}
        ocupado={ocupado}
        onFechar={() => setPedidosAberto(false)}
        onResponder={(p, aceitar) => responderPedido(p.amizadeId, aceitar, p.apelido)}
        onCancelar={(p) => cancelarPedido(p.amizadeId, p.apelido)}
        onOpcoes={abrirOpcoesPedido}
      />

      <EnviarCartinhaSheet amigo={amigoCartinha} onFechar={() => setAmigoCartinha(null)} />

      {renderModalEditarPerfil()}

      <QuickActionsMenu
        aberto={menuAberto}
        onFechar={() => setMenuAberto(false)}
        onSelecionar={handleSelecionarAcao}
      />

      <HomeBottomBar
        activeTab="social"
        menuAberto={menuAberto}
        onAbrirMenu={() =>
          setMenuAberto((valor) => !valor)
        }
      />
    </SafeAreaView>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  avisoPedidosVer: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    borderBottomWidth: 3,
    borderBottomColor: colors.primaryShadow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avisoPedidosVerTexto: {
    fontFamily: typography.bold,
    fontSize: 13,
    letterSpacing: 0.4,
    color: colors.primaryDark,
  },
  pontos: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 14 },
  ponto: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#D5DDD8' },
  pontoAtivo: { width: 22, backgroundColor: colors.primaryDark },

  // ----------------------------------------------------------
  // SELETOR FEED / AMIGOS
  // ----------------------------------------------------------
  seletor: {
    flexDirection: 'row',
    padding: 5,
    marginBottom: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EAE6',
  },

  seletorItem: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 15,
  },

  seletorItemAtivo: {
    backgroundColor: colors.primary,
    borderBottomWidth: 3,
    borderBottomColor: colors.primaryShadow,
  },

  seletorTexto: {
    fontFamily: typography.bold,
    fontSize: 15,
    color: '#6B7A74',
  },

  seletorTextoAtivo: {
    color: colors.primaryDark,
  },

  seletorBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8A1F',
  },

  seletorBadgeTexto: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },

  screen: {
    flex: 1,
    backgroundColor: turma.fundo,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 260,
  },

  // ----------------------------------------------------------
  // PERFIL COMPACTO + CÓDIGO RECOLHIDO
  // ----------------------------------------------------------

  compactCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E4EAE6',
  },

  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  compactAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: '#E7F5D8',
  },

  compactActionText: {
    fontFamily: typography.semiBold,
    fontSize: 12,
    color: colors.primaryDark,
  },

  codeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F3F1',
  },

  codeToggleText: {
    flex: 1,
    fontFamily: typography.semiBold,
    fontSize: 13,
    color: colors.primaryDark,
  },

  codePanel: {
    marginTop: 10,
  },

  codePanelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  codeBoxCompact: {
    flex: 1,
    minHeight: 58,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CFE6B8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  codeTextCompact: {
    fontFamily: typography.bold,
    fontSize: 24,
    letterSpacing: 4,
    color: colors.primaryDark,
  },

  codeHint: {
    marginTop: 8,
    fontFamily: typography.regular,
    fontSize: 12,
    color: '#7D898E',
  },

  // ----------------------------------------------------------
  // HEADER
  // ----------------------------------------------------------

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#E7F5D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontFamily: typography.bold,
    fontSize: 25,
    color: colors.primaryDark,
  },

  subtitle: {
    marginTop: 2,
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 19,
    color: '#78868B',
  },

  // ----------------------------------------------------------
  // BANNER
  // ----------------------------------------------------------

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginBottom: 15,
    gap: 9,
  },

  bannerSuccess: {
    backgroundColor: '#E5F5E8',
  },

  bannerError: {
    backgroundColor: '#FCEAEA',
  },

  bannerInfo: {
    backgroundColor: '#EAF4F6',
  },

  bannerText: {
    flex: 1,
    fontFamily: typography.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#45545A',
  },

  // ----------------------------------------------------------
  // SEÇÕES
  // ----------------------------------------------------------

  sectionTitle: {
    fontFamily: typography.bold,
    fontSize: 17,
    color: colors.primaryDark,
    marginTop: 25,
    marginBottom: 11,
  },

  sectionTitleNoMargin: {
    fontFamily: typography.bold,
    fontSize: 17,
    color: colors.primaryDark,
  },

  sectionDescription: {
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 19,
    color: '#7A888D',
    marginTop: -4,
    marginBottom: 11,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },

  counter: {
    minWidth: 25,
    height: 25,
    paddingHorizontal: 7,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  counterText: {
    fontFamily: typography.bold,
    fontSize: 12,
    color: colors.primaryDark,
  },

  counterMuted: {
    minWidth: 25,
    height: 25,
    paddingHorizontal: 7,
    borderRadius: 13,
    backgroundColor: '#E9EEEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  counterMutedText: {
    fontFamily: typography.bold,
    fontSize: 12,
    color: '#65757B',
  },

  // ----------------------------------------------------------
  // PERFIL
  // ----------------------------------------------------------

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF1EE',
  },

  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },

  profileNickname: {
    fontFamily: typography.bold,
    fontSize: 18,
    color: colors.primaryDark,
  },

  profileDescription: {
    fontFamily: typography.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#7A888D',
    marginTop: 4,
  },

  // ----------------------------------------------------------
  // AVATAR
  // ----------------------------------------------------------

  avatar: {
    backgroundColor: '#E6F4D5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  avatarPlaceholder: {
    backgroundColor: '#EEF3EA',
  },

  editProfileButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F5DA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ----------------------------------------------------------
  // CONFIGURAÇÃO DO PERFIL
  // ----------------------------------------------------------

  setupCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8EEE7',
  },

  setupTitle: {
    fontFamily: typography.bold,
    fontSize: 16,
    color: colors.primaryDark,
  },

  setupDescription: {
    fontFamily: typography.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#7A888D',
    marginTop: 5,
    marginBottom: 16,
  },

  inputLabel: {
    fontFamily: typography.bold,
    fontSize: 12.5,
    color: colors.primaryDark,
    marginBottom: 7,
  },

  nicknameInput: {
    height: 48,
    borderWidth: 1.3,
    borderColor: '#DDE5DF',
    borderRadius: 13,
    paddingHorizontal: 14,
    fontFamily: typography.regular,
    fontSize: 15,
    color: colors.primaryDark,
    backgroundColor: '#FAFCFA',
  },

  inputCounter: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 15,
    fontFamily: typography.regular,
    fontSize: 11,
    color: '#8A969A',
  },

  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 5,
    marginBottom: 6,
  },

  formError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FCEAEA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 8,
  },

  formErrorText: {
    flex: 1,
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 17,
    color: '#8F2F2F',
  },

  // ----------------------------------------------------------
  // POPUP DE EDIÇÃO
  // ----------------------------------------------------------

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 35, 28, 0.55)',
  },

  modalCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  modalTitle: {
    fontFamily: typography.bold,
    fontSize: 18,
    color: colors.primaryDark,
  },

  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0F3F1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalPreview: {
    alignItems: 'center',
    marginVertical: 10,
  },

  avatarOption: {
    width: 82,
    minHeight: 86,
    borderRadius: 15,
    backgroundColor: '#F5F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 7,
    borderWidth: 1.2,
    borderColor: '#EEF1EE',
  },

  avatarOptionSelected: {
    backgroundColor: '#E8F5DA',
    borderColor: colors.primaryDark,
  },

  avatarOptionText: {
    fontFamily: typography.regular,
    fontSize: 9.5,
    color: '#7A888D',
    textAlign: 'center',
    marginTop: 4,
  },

  avatarOptionTextSelected: {
    fontFamily: typography.bold,
    color: colors.primaryDark,
  },

  // ----------------------------------------------------------
  // CÓDIGO
  // ----------------------------------------------------------

  codeCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
  },

  codeIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  codeCardTitle: {
    fontFamily: typography.bold,
    fontSize: 17,
    color: '#FFFFFF',
    textAlign: 'center',
  },

  codeCardDescription: {
    fontFamily: typography.regular,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#C8D4D0',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 290,
  },

  codeBox: {
    minWidth: 190,
    height: 61,
    marginTop: 16,
    marginBottom: 6,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },

  codeText: {
    fontFamily: typography.bold,
    fontSize: 27,
    letterSpacing: 2,
    color: colors.primaryDark,
  },

  expirationText: {
    fontFamily: typography.regular,
    fontSize: 10.5,
    color: '#BFCBC7',
  },

  codeActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 9,
    marginTop: 15,
  },

  codeActionPrimary: {
    flex: 1,
    height: 43,
    borderRadius: 13,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  codeActionPrimaryText: {
    fontFamily: typography.bold,
    fontSize: 12.5,
    color: colors.primaryDark,
  },

  codeActionSecondary: {
    flex: 1,
    height: 43,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  codeActionSecondaryText: {
    fontFamily: typography.bold,
    fontSize: 12.5,
    color: '#FFFFFF',
  },

  // ----------------------------------------------------------
  // BUSCA
  // ----------------------------------------------------------

  searchRow: {
    flexDirection: 'row',
    gap: 9,
  },

  searchInputWrapper: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.3,
    borderColor: '#DEE6E0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  searchInput: {
    flex: 1,
    marginLeft: 9,
    fontFamily: typography.bold,
    fontSize: 16,
    letterSpacing: 1,
    color: colors.primaryDark,
  },

  searchButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderBottomWidth: 3,
    borderBottomColor: colors.primaryShadow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ----------------------------------------------------------
  // RESULTADO
  // ----------------------------------------------------------

  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E6ECE7',
  },

  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  resultInfo: {
    flex: 1,
    marginLeft: 13,
  },

  resultLabel: {
    fontFamily: typography.regular,
    fontSize: 11,
    color: '#7C898D',
  },

  resultNickname: {
    fontFamily: typography.bold,
    fontSize: 18,
    color: colors.primaryDark,
    marginTop: 2,
  },

  resultDescription: {
    fontFamily: typography.regular,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#7C898D',
    marginTop: 3,
  },

  // ----------------------------------------------------------
  // BOTÕES
  // ----------------------------------------------------------

  primaryButton: {
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 14,
  },

  primaryButtonText: {
    fontFamily: typography.bold,
    fontSize: 13.5,
    color: colors.primaryDark,
  },

  secondaryButton: {
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F0F4F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  secondaryButtonText: {
    fontFamily: typography.bold,
    fontSize: 12.5,
    color: '#66757A',
  },

  // ----------------------------------------------------------
  // LISTAS
  // ----------------------------------------------------------

  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E4EAE6',
    overflow: 'hidden',
  },

  personRow: {
    minHeight: 69,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EFF2EF',
  },

  lastPersonRow: {
    borderBottomWidth: 0,
  },

  personInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  personName: {
    fontFamily: typography.bold,
    fontSize: 14,
    color: colors.primaryDark,
  },

  personSubtext: {
    fontFamily: typography.regular,
    fontSize: 11,
    color: '#849095',
    marginTop: 2,
  },

  acceptButtonText: {
    fontFamily: typography.bold,
    fontSize: 12,
    color: colors.primaryDark,
  },

  rejectButtonText: {
    fontFamily: typography.semiBold,
    fontSize: 12,
    color: '#68777D',
  },

  acceptButton: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  rejectButton: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#EFF2F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },

  cancelButton: {
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F0F3F1',
  },

  cancelButtonText: {
    fontFamily: typography.bold,
    fontSize: 10.5,
    color: '#68777D',
  },

  // ----------------------------------------------------------
  // VAZIO
  // ----------------------------------------------------------

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9EEEA',
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#E8F5DA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    fontFamily: typography.bold,
    fontSize: 15,
    color: colors.primaryDark,
    marginTop: 12,
  },

  emptyText: {
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 18,
    color: '#7D898E',
    textAlign: 'center',
    marginTop: 5,
    maxWidth: 290,
  },

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },

  loadingText: {
    fontFamily: typography.regular,
    fontSize: 12,
    color: '#7B898E',
    marginTop: 12,
  },

  // ---- Turma (Parte 2): botão fixo, sheet e aviso de pedidos ----
  barraAdicionar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 5,
  },

  botaoAdicionar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 18,
    backgroundColor: colors.primary,
    borderBottomWidth: 4,
    borderBottomColor: colors.primaryShadow,
    shadowColor: '#1B4332',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  botaoAdicionarIcone: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  botaoAdicionarTexto: {
    fontFamily: typography.bold,
    fontSize: 15,
    letterSpacing: 0.5,
    color: colors.primaryDark,
  },

  botaoAdicionarBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8A1F',
  },

  botaoAdicionarBadgeTexto: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },

  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  sheetCard: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },

  sheetAlca: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D9E1DC',
    marginBottom: 10,
  },

  cartaoSheet: {
    marginTop: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#F6F9F5',
    borderWidth: 1,
    borderColor: '#E4EAE6',
  },

  cartaoSheetTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },

  seloSheet: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cartaoSheetTitulo: {
    fontFamily: typography.bold,
    fontSize: 16,
    color: colors.primaryDark,
  },

  cartaoSheetSub: {
    fontFamily: typography.regular,
    fontSize: 12.5,
    color: '#6B7A74',
    marginTop: 1,
  },

  linkPedidos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 14,
    minHeight: 60,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EAE6',
  },

  linkPedidosTitulo: {
    fontFamily: typography.bold,
    fontSize: 14,
    color: colors.primaryDark,
  },

  linkPedidosSub: {
    fontFamily: typography.regular,
    fontSize: 12,
    color: '#7A6A52',
    marginTop: 1,
  },

  avisoPedidos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    marginBottom: 14,
    padding: 12,
    borderRadius: 22,
    backgroundColor: '#FFF1DC',
    borderWidth: 2,
    borderColor: '#FFC773',
  },

  avisoPedidosIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD9A0',
  },

  avisoPedidosTitulo: {
    fontFamily: typography.bold,
    fontSize: 15,
    color: colors.primaryDark,
  },

  avisoPedidosSub: {
    fontSize: 12,
    color: '#7A5A22',
    marginTop: 1,
  },
});