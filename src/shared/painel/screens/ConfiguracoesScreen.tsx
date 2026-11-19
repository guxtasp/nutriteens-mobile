// src/shared/painel/screens/ConfiguracoesScreen.tsx
//
// Configurações do painel, para Administração e Nutricionista: conta atual, aparência
// (tema claro/escuro), regras de privacidade (LGPD) já aplicadas no banco, ajuda e sessão.
// Só mostra o que existe de verdade: a Auditoria aparece apenas para quem tem a rota no menu.
// Antes havia "Mostrar dicas de novo", que deixou de ter efeito quando as introduções viraram
// o botão "Sobre esta página" (sempre disponível); a seção foi trocada pela Ajuda.
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PainelLayout } from '../PainelLayout';
import { CartaoSecao } from '../components/CartaoSecao';
import { LinhaInfo } from '../components/ControlesLista';
import { useAuth } from '../../contexts/AuthContext';
import { AppText } from '../../ui/AppText';
import { AppButton } from '../../ui/AppButton';
import { typography } from '../../theme/typography';
import type { NomeTema, TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';
import { ALVO_TOQUE, fonte } from '../painelTheme';
import { useSairDoPainel } from '../hooks/useSairDoPainel';
import { buscarNomeDaConta } from '../services/contaService';
import type { ConfigPainel } from '../types';

type Props = { config: ConfigPainel; papel: 'ADMINISTRADOR' | 'NUTRICIONISTA' };

const OPCOES_TEMA: { nome: NomeTema; label: string; icone: 'sunny-outline' | 'moon-outline' }[] = [
  { nome: 'claro', label: 'Claro', icone: 'sunny-outline' },
  { nome: 'escuro', label: 'Escuro', icone: 'moon-outline' },
];

export default function ConfiguracoesScreen({ config, papel }: Props) {
  const styles = useEstilos(criarEstilos);
  const { tema, nome: temaAtual, definir } = useTemaPainel();
  const { session } = useAuth();
  const { sair, saindo } = useSairDoPainel();
  const navigation = useNavigation<any>();
  const [nome, setNome] = useState<string | null>(null);
  const [erroNome, setErroNome] = useState(false);

  const temRota = (rota: string) => config.itens.some((i) => i.rota === rota);

  useEffect(() => {
    const id = session?.user.id;
    if (!id) return;
    let ativo = true;
    buscarNomeDaConta(id)
      .then((n) => ativo && setNome(n))
      .catch(() => ativo && setErroNome(true));
    return () => {
      ativo = false;
    };
  }, [session?.user.id]);

  return (
    <PainelLayout config={config} titulo="Configurações" subtitulo="Sua conta e preferências do painel">
      <CartaoSecao titulo="Conta" ajuda="Dados da conta que está usando o painel agora. Papel e e-mail só mudam pela administração do banco, por segurança.">
        <LinhaInfo rotulo="Nome" valor={erroNome ? 'Não foi possível carregar' : nome} />
        <LinhaInfo rotulo="E-mail" valor={session?.user.email} />
        <LinhaInfo rotulo="Papel" valor={papel === 'ADMINISTRADOR' ? 'Administrador(a)' : 'Nutricionista'} />
      </CartaoSecao>

      <CartaoSecao titulo="Aparência" subtitulo="Fica salvo neste aparelho">
        <View style={styles.segmento} accessibilityRole="radiogroup" accessibilityLabel="Tema do painel">
          {OPCOES_TEMA.map((o) => {
            const on = o.nome === temaAtual;
            return (
              <Pressable
                key={o.nome}
                onPress={() => definir(o.nome)}
                accessibilityRole="radio"
                accessibilityState={{ checked: on, selected: on }}
                accessibilityLabel={`Tema ${o.label.toLowerCase()}`}
                style={[styles.opcao, on && styles.opcaoAtiva]}
              >
                <Ionicons name={o.icone} size={18} color={on ? tema.chipAtivoTexto : tema.chipTexto} />
                <AppText style={[styles.opcaoTexto, on && styles.opcaoTextoAtivo]}>{o.label}</AppText>
              </Pressable>
            );
          })}
        </View>
      </CartaoSecao>

      <CartaoSecao titulo="Privacidade dos participantes (LGPD)" ajuda="Regras já aplicadas no banco. Não há o que ligar ou desligar aqui: servem para a equipe saber o que cada perfil enxerga.">
        <AppText style={styles.texto}>Administração: vê adolescentes só por apelido e código. Nome real, medidas, EBIA e alimentação não aparecem.</AppText>
        <AppText style={styles.texto}>Nutricionista: a lista mostra só o primeiro nome. O nome completo e os dados clínicos aparecem ao abrir o participante, e cada abertura fica registrada.</AppText>
        <AppText style={styles.texto}>Analytics e exportação: só números agregados ou anonimizados; semanas com poucos participantes viram "sem dados".</AppText>
        {temRota('AdminAuditoria') && (
          <View style={styles.linha}>
            <AppButton
              label="VER ACESSOS NA AUDITORIA"
              fullWidth={false}
              size="compact"
              outlineColor={tema.texto}
              textColor={tema.texto}
              style={styles.botao}
              onPress={() => navigation.navigate('AdminAuditoria')}
            />
          </View>
        )}
      </CartaoSecao>

      <CartaoSecao titulo="Ajuda">
        <AppText style={styles.texto}>
          Em cada página, o botão "Sobre esta página" explica o que ela mostra e o que você pode fazer. O ícone "i" ao lado de um número explica como ele é calculado.
        </AppText>
        {temRota('GuiaCriacao') && (
          <View style={styles.linha}>
            <AppButton
              label="ABRIR GUIA: COMO CRIAR UMA TRILHA"
              fullWidth={false}
              size="compact"
              outlineColor={tema.texto}
              textColor={tema.texto}
              style={styles.botao}
              onPress={() => navigation.navigate('GuiaCriacao')}
            />
          </View>
        )}
      </CartaoSecao>

      <CartaoSecao titulo="Sessão">
        <AppText style={styles.texto}>Ao sair, você volta para a tela de entrada. Vamos pedir confirmação antes.</AppText>
        <View style={styles.linha}>
          <AppButton
            label={saindo ? 'SAINDO…' : 'SAIR DA CONTA'}
            fullWidth={false}
            size="compact"
            disabled={saindo}
            outlineColor={tema.erro}
            textColor={tema.erro}
            style={styles.botao}
            onPress={sair}
          />
        </View>
      </CartaoSecao>
    </PainelLayout>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  texto: { fontFamily: typography.regular, fontSize: fonte.apoio, color: t.textoCorpo, lineHeight: 20 },
  linha: { flexDirection: 'row', flexWrap: 'wrap' },
  botao: { paddingHorizontal: 18, minHeight: ALVO_TOQUE },
  segmento: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: t.superficieSuave, borderRadius: 12, padding: 4, gap: 4 },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: ALVO_TOQUE, paddingHorizontal: 18, borderRadius: 10 },
  opcaoAtiva: { backgroundColor: t.chipAtivoFundo },
  opcaoTexto: { fontFamily: typography.semiBold, fontSize: fonte.apoio, color: t.chipTexto },
  opcaoTextoAtivo: { color: t.chipAtivoTexto },
}) as const;
