// src/features/admin/screens/NutricionistasScreen.tsx
// Contas de nutricionistas e o trabalho de cada uma no fluxo de conteúdo.
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { IntroSecao } from '../../../shared/painel/components/IntroSecao';
import { GridResponsiva } from '../../../shared/painel/components/GridResponsiva';
import { AjudaInfo } from '../../../shared/painel/components/AjudaInfo';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { VazioPainel } from '../../../shared/painel/components/ControlesLista';
import { dataCurta, ultimoAcessoTexto } from '../../../shared/painel/formatadores';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { painel } from '../../../shared/painel/painelTheme';
import { ADMIN_PAINEL } from '../navigation/adminMenu';
import { NutricionistaResumo, listarNutricionistas } from '../services/gestaoAdminService';

function Numero({ valor, rotulo, ajuda }: { valor: number; rotulo: string; ajuda: string }) {
  return (
    <View style={styles.numero}>
      <AppText style={styles.numeroValor}>{valor}</AppText>
      <View style={styles.numeroRotuloLinha}>
        <AppText style={styles.numeroRotulo}>{rotulo}</AppText>
        <AjudaInfo titulo={rotulo} texto={ajuda} />
      </View>
    </View>
  );
}

export default function NutricionistasScreen() {
  const navigation = useNavigation<any>();
  const [itens, setItens] = useState<NutricionistaResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setItens(await listarNutricionistas());
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível carregar as nutricionistas.');
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
    <PainelLayout config={ADMIN_PAINEL} titulo="Nutricionistas" subtitulo="Quem responde tecnicamente pelo conteúdo nutricional">
      <IntroSecao
        chave="admin_nutricionistas"
        titulo="Equipe de nutrição"
        linhas={[
          'As nutricionistas são as responsáveis técnicas: só elas aprovam, rejeitam e publicam conteúdo.',
          'Cada cartão mostra quanto a pessoa criou, revisou e publicou. Toque para ver os detalhes da conta.',
          'Contas de nutricionista são criadas fora do aplicativo (papel protegido no banco).',
        ]}
      />
      {carregando ? (
        <EstadoCarregando />
      ) : erro ? (
        <EstadoErro mensagem={erro} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : itens.length === 0 ? (
        <VazioPainel titulo="Nenhuma nutricionista cadastrada" texto="Quando houver contas com o papel Nutricionista, elas aparecem aqui." />
      ) : (
        <GridResponsiva minItem={300} gap={12} maxColunas={3}>
          {itens.map((n) => (
            <Pressable key={n.id} accessibilityRole="button" onPress={() => navigation.navigate('UsuarioDetalhe', { id: n.id })} style={styles.card}>
              <AppText style={styles.nome} numberOfLines={2}>{n.nome ?? n.apelido ?? 'Sem nome'}</AppText>
              <AppText style={styles.meta}>Desde {dataCurta(n.criadoEm)} · {ultimoAcessoTexto(n.ultimoAcesso)}</AppText>
              <View style={styles.numeros}>
                <Numero valor={n.conteudosCriados} rotulo="Criados" ajuda="Trilhas e receitas criadas por esta pessoa." />
                <Numero valor={n.revisoesFeitas} rotulo="Revisados" ajuda="Conteúdos em que esta pessoa foi a última a revisar (aprovar ou rejeitar)." />
                <Numero valor={n.publicados} rotulo="Publicados" ajuda="Conteúdos que esta pessoa publicou para os adolescentes." />
              </View>
            </Pressable>
          ))}
        </GridResponsiva>
      )}
    </PainelLayout>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: painel.card, borderRadius: painel.cardRaio, borderWidth: 2, borderColor: painel.cardBorda, padding: 16, gap: 8, minWidth: 0 },
  nome: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  meta: { fontFamily: typography.regular, fontSize: 12, color: painel.textoSuave },
  numeros: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 6 },
  numero: { minWidth: 80 },
  numeroValor: { fontFamily: typography.bold, fontSize: 22, color: colors.primaryDark },
  numeroRotuloLinha: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  numeroRotulo: { fontFamily: typography.regular, fontSize: 12, color: painel.textoSuave },
});
