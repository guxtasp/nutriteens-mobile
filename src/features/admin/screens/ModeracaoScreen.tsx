// src/features/admin/screens/ModeracaoScreen.tsx
// Denúncias e bloqueios do módulo social (somente leitura: o projeto ainda não tem ações
// de suspensão de conta). Leitura via função do banco restrita ao Admin.
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { IntroSecao } from '../../../shared/painel/components/IntroSecao';
import { CartaoKpi } from '../../../shared/painel/components/CartaoKpi';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { GridResponsiva } from '../../../shared/painel/components/GridResponsiva';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { Selo, VazioPainel } from '../../../shared/painel/components/ControlesLista';
import { tempoRelativo } from '../../../shared/painel/formatadores';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { painel } from '../../../shared/painel/painelTheme';
import { ADMIN_PAINEL } from '../navigation/adminMenu';
import { ResumoModeracao, buscarModeracao } from '../services/gestaoAdminService';

export default function ModeracaoScreen() {
  const navigation = useNavigation<any>();
  const [r, setR] = useState<ResumoModeracao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setR(await buscarModeracao());
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível carregar a moderação.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setCarregando(true);
      carregar();
    }, [carregar])
  );

  return (
    <PainelLayout config={ADMIN_PAINEL} titulo="Moderação" subtitulo="Denúncias e bloqueios entre adolescentes">
      <IntroSecao
        chave="admin_moderacao"
        titulo="Cuidado com o módulo social"
        linhas={[
          'Quando um adolescente denuncia outro no módulo de amizades, a denúncia chega aqui com o motivo escrito por ele.',
          'Reincidente = usuário denunciado 2 vezes ou mais. Toque no nome do denunciado para ver a conta.',
          'Esta tela é de acompanhamento: o aplicativo ainda não suspende contas automaticamente.',
        ]}
      />
      {carregando ? (
        <EstadoCarregando />
      ) : erro || !r ? (
        <EstadoErro mensagem={erro ?? 'Sem dados.'} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : (
        <>
          <GridResponsiva minItem={150} gap={12} maxColunas={4}>
            <CartaoKpi titulo="Denúncias (total)" valor={r.totalDenuncias} icone="flag-outline" ajuda="Todas as denúncias já feitas no módulo social." />
            <CartaoKpi titulo="Últimos 30 dias" valor={r.denuncias30d} icone="time-outline" alerta={r.denuncias30d > 0} ajuda="Denúncias feitas no último mês." />
            <CartaoKpi titulo="Reincidentes" valor={r.reincidentes} icone="warning-outline" alerta={r.reincidentes > 0} ajuda="Usuários denunciados 2 vezes ou mais." />
            <CartaoKpi titulo="Bloqueios" valor={r.totalBloqueios} icone="ban-outline" ajuda="Quantas vezes adolescentes bloquearam outros adolescentes." />
          </GridResponsiva>

          <CartaoSecao titulo="Denúncias recentes" subtitulo="Da mais nova para a mais antiga" ajuda="Cada cartão mostra quem denunciou, quem foi denunciado e o motivo informado.">
            {r.denuncias.length === 0 ? (
              <VazioPainel titulo="Nenhuma denúncia" texto="Ótimo sinal: ninguém denunciou ninguém até agora." />
            ) : (
              <View style={{ gap: 10 }}>
                {r.denuncias.map((d) => (
                  <View key={d.id} style={styles.item}>
                    <View style={styles.topo}>
                      <Pressable onPress={() => navigation.navigate('UsuarioDetalhe', { id: d.denunciadoId })} accessibilityRole="button" style={{ flexShrink: 1, minHeight: 32, justifyContent: 'center' }}>
                        <AppText style={styles.denunciado}>{d.denunciado ?? 'Usuário removido'}</AppText>
                      </Pressable>
                      {d.totalDoDenunciado >= 2 && <Selo texto={`${d.totalDoDenunciado} denúncias`} tom="aviso" />}
                      <AppText style={styles.quando}>{tempoRelativo(d.criadoEm)}</AppText>
                    </View>
                    <AppText style={styles.motivo}>{d.motivo}</AppText>
                    <AppText style={styles.quem}>Denunciado por {d.denunciante ?? 'usuário removido'}</AppText>
                  </View>
                ))}
              </View>
            )}
          </CartaoSecao>
        </>
      )}
    </PainelLayout>
  );
}

const styles = StyleSheet.create({
  item: { borderWidth: 2, borderColor: painel.cardBorda, borderRadius: 14, padding: 12, gap: 6 },
  topo: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  denunciado: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  quando: { fontFamily: typography.regular, fontSize: 11, color: painel.textoSuave, marginLeft: 'auto' },
  motivo: { fontFamily: typography.regular, fontSize: 13, color: colors.textOnLight, lineHeight: 19 },
  quem: { fontFamily: typography.regular, fontSize: 12, color: painel.textoSuave },
});
