// src/features/adolescente/social/screens/SocialScreen.tsx

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';

import {
  AVATARES_SOCIAIS,
  type AvatarSocial,
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
import { typography } from '../../../../shared/theme/typography';

import HomeBottomBar from '../../_shared/components/HomeBottomBar';
import QuickActionsMenu from '../../_shared/components/QuickActionsMenu';

type NavigationProp =
  NativeStackNavigationProp<AdolescenteStackParamList>;

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
  aceno: 'Aceno',
};

/**
 * O banco guarda apenas a chave do avatar:
 * "supercontente", "curioso", etc.
 *
 * Enquanto o componente visual definitivo do Broxis não está
 * acoplado aqui, usamos uma representação neutra com ícone.
 *
 * O valor salvo continua sendo exatamente a chave esperada pelo banco.
 */
function AvatarSocialView({
  avatar,
  size = 'medium',
}: {
  avatar: string | null | undefined;
  size?: 'small' | 'medium' | 'large';
}) {
  const pose = poseDoAvatar(avatar);

  const sizes = {
    small: 42,
    medium: 64,
    large: 82,
  };

  const iconSizes = {
    small: 20,
    medium: 30,
    large: 38,
  };

  const diameter = sizes[size];

  return (
    <View
      style={[
        styles.avatar,
        {
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
        },
      ]}
    >
      <Ionicons
        name="leaf"
        size={iconSizes[size]}
        color={colors.primaryDark}
      />

      {pose === 'supercontente' && (
        <View style={styles.avatarBadge}>
          <Ionicons
            name="sparkles"
            size={size === 'small' ? 9 : 12}
            color={colors.primaryDark}
          />
        </View>
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
      return 'Vocês agora são amigos! 🎉';

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
  const [renovandoCodigo, setRenovandoCodigo] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const [menuAberto, setMenuAberto] = useState(false);

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
    await carregarTudo(false);
  }, [carregarTudo]);

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

      mostrarBanner(mensagens[resultado.erro], 'error');
      return;
    }

    setSalvandoPerfil(true);

    try {
      const status = await definirPerfilSocial(
        resultado.valor,
        avatarSelecionado,
      );

      if (status === 'apelido_invalido') {
        mostrarBanner('Esse apelido não é válido.', 'error');
        return;
      }

      if (status === 'avatar_invalido') {
        mostrarBanner('Esse avatar não é válido.', 'error');
        return;
      }

      setPerfil({
        apelido: resultado.valor,
        avatar: avatarSelecionado,
      });

      mostrarBanner('Seu perfil social foi atualizado!', 'success');

      // Agora que existe apelido, o código pode ser gerado.
      if (!codigo) {
        const novoCodigo = await obterCodigoAmizade(false);
        setCodigo(novoCodigo);
      }
    } catch (error) {
      console.error(error);

      mostrarBanner(
        'Não foi possível salvar seu perfil. Tente novamente.',
        'error',
      );
    } finally {
      setSalvandoPerfil(false);
    }
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
          ? `Você e ${apelido} agora são amigos! 🎉`
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

  function renderPerfilSocial() {
    const precisaConfigurar = !perfil.apelido;

    return (
      <>
        <Text style={styles.sectionTitle}>
          Seu perfil social
        </Text>

        <View style={styles.profileCard}>
          <AvatarSocialView
            avatar={perfil.avatar ?? avatarSelecionado}
            size="large"
          />

          <View style={styles.profileInfo}>
            {perfil.apelido ? (
              <>
                <Text style={styles.profileNickname}>
                  @{perfil.apelido}
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

            <Text style={styles.inputLabel}>
              Seu apelido
            </Text>

            <TextInput
              value={apelidoDigitado}
              onChangeText={setApelidoDigitado}
              placeholder="Ex.: Guuh"
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

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.avatarSelector}
            >
              {AVATARES_SOCIAIS.map((avatar) => {
                const selecionado =
                  avatarSelecionado === avatar;

                return (
                  <TouchableOpacity
                    key={avatar}
                    style={[
                      styles.avatarOption,
                      selecionado &&
                        styles.avatarOptionSelected,
                    ]}
                    onPress={() =>
                      setAvatarSelecionado(avatar)
                    }
                  >
                    <AvatarSocialView
                      avatar={avatar}
                      size="small"
                    />

                    <Text
                      style={[
                        styles.avatarOptionText,
                        selecionado &&
                          styles.avatarOptionTextSelected,
                      ]}
                    >
                      {AVATAR_LABELS[avatar]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

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
          </View>
        )}
      </>
    );
  }

  function renderMeuCodigo() {
    if (!perfil.apelido) return null;

    return (
      <>
        <Text style={styles.sectionTitle}>
          Seu código de amizade
        </Text>

        <View style={styles.codeCard}>
          <View style={styles.codeIcon}>
            <Ionicons
              name="people"
              size={26}
              color={colors.primary}
            />
          </View>

          <Text style={styles.codeCardTitle}>
            Compartilhe para adicionar amigos
          </Text>

          <Text style={styles.codeCardDescription}>
            Esse código é diferente do seu código de
            participante.
          </Text>

          <View style={styles.codeBox}>
            {codigo ? (
              <Text style={styles.codeText}>
                {formatarCodigo(codigo.codigo)}
              </Text>
            ) : (
              <ActivityIndicator
                color={colors.primary}
              />
            )}
          </View>

          {codigo && (
            <Text style={styles.expirationText}>
              Válido até{' '}
              {codigo.expiraEm.toLocaleDateString(
                'pt-BR',
                {
                  day: '2-digit',
                  month: '2-digit',
                },
              )}
            </Text>
          )}

          <View style={styles.codeActions}>
            <TouchableOpacity
              style={styles.codeActionPrimary}
              onPress={compartilharCodigo}
              disabled={!codigo}
            >
              <Ionicons
                name="share-outline"
                size={19}
                color={colors.primaryDark}
              />

              <Text style={styles.codeActionPrimaryText}>
                Compartilhar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.codeActionSecondary}
              onPress={renovarCodigoAmizade}
              disabled={renovandoCodigo}
            >
              {renovandoCodigo ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primaryDark}
                />
              ) : (
                <Ionicons
                  name="refresh-outline"
                  size={19}
                  color={colors.primaryDark}
                />
              )}

              <Text style={styles.codeActionSecondaryText}>
                Renovar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  function renderAdicionarAmigo() {
    return (
      <>
        <Text style={styles.sectionTitle}>
          Adicionar um amigo
        </Text>

        <Text style={styles.sectionDescription}>
          Digite o código de amizade que a pessoa compartilhou
          com você.
        </Text>

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Ionicons
              name="search-outline"
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
                  @{resultadoBusca.apelido}
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

  function renderPedidosRecebidos() {
    if (pedidosRecebidos.length === 0) {
      return null;
    }

    return (
      <>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitleNoMargin}>
            Pedidos recebidos
          </Text>

          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {pedidosRecebidos.length}
            </Text>
          </View>
        </View>

        <View style={styles.listCard}>
          {pedidosRecebidos.map((pedido, index) => (
            <View
              key={pedido.amizadeId}
              style={[
                styles.personRow,
                index === pedidosRecebidos.length - 1 &&
                  styles.lastPersonRow,
              ]}
            >
              <AvatarSocialView
                avatar={pedido.avatar}
                size="small"
              />

              <View style={styles.personInfo}>
                <Text style={styles.personName}>
                  @{pedido.apelido}
                </Text>

                <Text style={styles.personSubtext}>
                  Quer ser seu amigo
                </Text>
              </View>

              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() =>
                  responderPedido(
                    pedido.amizadeId,
                    true,
                    pedido.apelido,
                  )
                }
                disabled={ocupado}
              >
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={colors.primaryDark}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() =>
                  responderPedido(
                    pedido.amizadeId,
                    false,
                    pedido.apelido,
                  )
                }
                disabled={ocupado}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color="#68777D"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.moreButton}
                onPress={() =>
                  abrirOpcoesPedido(pedido)
                }
                disabled={ocupado}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={19}
                  color="#7D898E"
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </>
    );
  }

  function renderPedidosEnviados() {
    if (pedidosEnviados.length === 0) {
      return null;
    }

    return (
      <>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitleNoMargin}>
            Pedidos enviados
          </Text>

          <View style={styles.counterMuted}>
            <Text style={styles.counterMutedText}>
              {pedidosEnviados.length}
            </Text>
          </View>
        </View>

        <View style={styles.listCard}>
          {pedidosEnviados.map((pedido, index) => (
            <View
              key={pedido.amizadeId}
              style={[
                styles.personRow,
                index === pedidosEnviados.length - 1 &&
                  styles.lastPersonRow,
              ]}
            >
              <AvatarSocialView
                avatar={pedido.avatar}
                size="small"
              />

              <View style={styles.personInfo}>
                <Text style={styles.personName}>
                  @{pedido.apelido}
                </Text>

                <Text style={styles.personSubtext}>
                  Aguardando resposta
                </Text>
              </View>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() =>
                  cancelarPedido(
                    pedido.amizadeId,
                    pedido.apelido,
                  )
                }
                disabled={ocupado}
              >
                <Text style={styles.cancelButtonText}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </>
    );
  }

  function renderAmigos() {
    return (
      <>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitleNoMargin}>
            Meus amigos
          </Text>

          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {amigos.length}
            </Text>
          </View>
        </View>

        {amigos.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="people-outline"
                size={30}
                color={colors.primaryDark}
              />
            </View>

            <Text style={styles.emptyTitle}>
              Você ainda não tem amigos
            </Text>

            <Text style={styles.emptyText}>
              Compartilhe seu código de amizade ou adicione
              alguém usando o código que recebeu.
            </Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {amigos.map((amigo, index) => (
              <View
                key={amigo.amizadeId}
                style={[
                  styles.personRow,
                  index === amigos.length - 1 &&
                    styles.lastPersonRow,
                ]}
              >
                <AvatarSocialView
                  avatar={amigo.avatar}
                  size="small"
                />

                <View style={styles.personInfo}>
                  <Text style={styles.personName}>
                    @{amigo.apelido}
                  </Text>

                  {amigo.desde && (
                    <Text style={styles.personSubtext}>
                      Amigos desde {formatarData(amigo.desde)}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() =>
                    abrirOpcoesAmigo(amigo)
                  }
                  disabled={ocupado}
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={20}
                    color="#7D898E"
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </>
    );
  }

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <SafeAreaView style={styles.screen}>
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

          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons
                name="people"
                size={25}
                color={colors.primaryDark}
              />
            </View>

            <View style={styles.headerText}>
              <Text style={styles.title}>
                Amigos
              </Text>

              <Text style={styles.subtitle}>
                Conecte-se com seus amigos usando um código.
              </Text>
            </View>
          </View>

          {carregando ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={colors.primaryDark}
              />

              <Text style={styles.loadingText}>
                Carregando seu espaço social...
              </Text>
            </View>
          ) : (
            <>
              {renderPerfilSocial()}

              {renderMeuCodigo()}

              {renderAdicionarAmigo()}

              {renderPedidosRecebidos()}

              {renderPedidosEnviados()}

              {renderAmigos()}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

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

  screen: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
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
    marginTop: 27,
    marginBottom: 11,
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
    position: 'relative',
  },

  avatarBadge: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.primary,
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

  avatarSelector: {
    gap: 9,
    paddingVertical: 5,
    paddingRight: 10,
    marginBottom: 15,
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
    borderRadius: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E9EEEA',
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

  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  rejectButton: {
    width: 36,
    height: 36,
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
    borderRadius: 19,
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
});