// src/features/admin/screens/UsuarioDetalheScreen.tsx
// Detalhes de um usuário para o Admin. Só dados de gestão: nada de peso, altura, gênero,
// EBIA ou alimentação. Papel e código do participante não são editáveis pelo aplicativo
// (trigger do banco), por isso aqui não há ação de alterá-los.
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { CartaoKpi } from '../../../shared/painel/components/CartaoKpi';
import { Colunas } from '../../../shared/painel/components/Colunas';
import { GridResponsiva } from '../../../shared/painel/components/GridResponsiva';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { LinhaInfo, Selo } from '../../../shared/painel/components/ControlesLista';
import { dataCurta, ultimoAcessoTexto } from '../../../shared/painel/formatadores';
import { AppText } from '../../../shared/ui/AppText';
import { typography } from '../../../shared/theme/typography';
import { painel } from '../../../shared/painel/painelTheme';
import { ADMIN_PAINEL } from '../navigation/adminMenu';
import { DetalheUsuarioAdmin, buscarUsuario, labelPapel } from '../services/usuariosAdminService';

export default function UsuarioDetalheScreen({ route }: { route: { params: { id: string } } }) {
  const id = route.params?.id;
  const [u, setU] = useState<DetalheUsuarioAdmin | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      setU(await buscarUsuario(id));
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível abrir o usuário.');
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setCarregando(true);
      carregar();
    }, [carregar])
  );

  const titulo = u?.nome?.trim() || u?.apelido?.trim() || 'Usuário';

  return (
    <PainelLayout config={ADMIN_PAINEL} titulo={titulo} subtitulo={u ? labelPapel(u.papel) : undefined} voltar>
      {carregando && !u ? (
        <EstadoCarregando />
      ) : erro || !u ? (
        <EstadoErro mensagem={erro ?? 'Usuário não encontrado.'} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : (
        <>
          <Colunas bases={[320, 320]}>
            <CartaoSecao titulo="Cadastro" ajuda="Informações da conta usadas na gestão do sistema. Dados de saúde dos adolescentes não aparecem aqui.">
              <View style={styles.selos}>
                <Selo texto={labelPapel(u.papel)} tom="info" />
                <Selo texto={u.ativo ? 'Ativo (30 dias)' : 'Inativo'} tom={u.ativo ? 'ok' : 'neutro'} />
              </View>
              <LinhaInfo rotulo="Nome" valor={u.nome} />
              <LinhaInfo rotulo="Apelido" valor={u.apelido} />
              {u.papel === 'ADOLESCENTE' && <LinhaInfo rotulo="Código do participante" valor={u.codigoParticipante} />}
              {u.papel === 'ADOLESCENTE' && <LinhaInfo rotulo="Instituição" valor={u.instituicaoEnsino} />}
              {u.papel === 'ADOLESCENTE' && <LinhaInfo rotulo="Tipo de instituição" valor={u.tipoInstituicao} />}
              {u.papel === 'ADOLESCENTE' && <LinhaInfo rotulo="Etapa do cadastro" valor={u.etapaOnboarding} />}
              <LinhaInfo rotulo="Cadastrado em" valor={dataCurta(u.criadoEm)} />
              <LinhaInfo rotulo="Último acesso" valor={ultimoAcessoTexto(u.ultimoAcesso)} />
            </CartaoSecao>

            <CartaoSecao titulo="Administração" ajuda="Papel e código do participante só mudam direto no banco, por segurança. O aplicativo não permite alterá-los.">
              <AppText style={styles.texto}>
                O papel ({labelPapel(u.papel)}) e o código do participante são protegidos: não podem ser alterados pelo aplicativo.
              </AppText>
              {u.papel === 'ADOLESCENTE' && u.denunciasRecebidas > 0 && (
                <AppText style={styles.alerta}>
                  Este usuário recebeu {u.denunciasRecebidas} denúncia(s). Veja os motivos em Moderação.
                </AppText>
              )}
            </CartaoSecao>
          </Colunas>

          {u.papel === 'ADOLESCENTE' ? (
            <CartaoSecao titulo="Uso do aplicativo" ajuda="Resumo de engajamento. Mostra quanto a pessoa usa, não o que ela registrou.">
              <GridResponsiva minItem={150} gap={12} maxColunas={4}>
                <CartaoKpi titulo="Dias com registro" valor={u.diasComRegistro} icone="calendar-outline" />
                <CartaoKpi titulo="Lições concluídas" valor={u.licoesConcluidas} icone="school-outline" />
                <CartaoKpi titulo="Sequência atual (dias)" valor={u.sequenciaAtual} icone="flame-outline" detalhe={`Maior: ${u.maiorSequencia}`} />
                <CartaoKpi titulo="XP total" valor={u.xpTotal} icone="star-outline" detalhe={u.faseAtual ? `Fase: ${u.faseAtual}` : undefined} />
                <CartaoKpi titulo="Insígnias" valor={u.insignias} icone="ribbon-outline" />
                <CartaoKpi titulo="Amigos" valor={u.amigos} icone="people-outline" />
              </GridResponsiva>
            </CartaoSecao>
          ) : (
            <CartaoSecao titulo="Trabalho com conteúdos" ajuda="Quantos conteúdos esta pessoa criou e quantos revisou no fluxo de aprovação.">
              <GridResponsiva minItem={150} gap={12} maxColunas={3}>
                <CartaoKpi titulo="Conteúdos criados" valor={u.conteudosCriados} icone="document-text-outline" />
                <CartaoKpi titulo="Revisões feitas" valor={u.revisoesFeitas} icone="checkmark-done-outline" />
              </GridResponsiva>
            </CartaoSecao>
          )}
        </>
      )}
    </PainelLayout>
  );
}

const styles = StyleSheet.create({
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  texto: { fontFamily: typography.regular, fontSize: 13, color: painel.textoSuave, lineHeight: 19 },
  alerta: { fontFamily: typography.semiBold, fontSize: 13, color: '#9A5B00' },
});
