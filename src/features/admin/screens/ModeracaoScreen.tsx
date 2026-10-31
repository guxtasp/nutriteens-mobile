// src/features/admin/screens/ModeracaoScreen.tsx
// Denúncias e bloqueios do módulo social. A equipe decide (advertir, sem ação, improcedente), pode avisar o
// adolescente no app e restringir a conta no social por 1 a 30 dias. Tudo via funções do banco restritas ao Admin.
import React, { useCallback, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { IntroSecao } from '../../../shared/painel/components/IntroSecao';
import { CartaoKpi } from '../../../shared/painel/components/CartaoKpi';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { GridResponsiva } from '../../../shared/painel/components/GridResponsiva';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { ChipsFiltro, Selo, VazioPainel } from '../../../shared/painel/components/ControlesLista';
import { tempoRelativo } from '../../../shared/painel/formatadores';
import { AppText } from '../../../shared/ui/AppText';
import { typography } from '../../../shared/theme/typography';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';
import { ADMIN_PAINEL } from '../navigation/adminMenu';
import { AppButton } from '../../../shared/ui/AppButton';
import { DecisaoDenuncia, DenunciaSocial, ResumoModeracao, buscarModeracao, levantarRestricaoSocial, resolverDenuncia } from '../services/gestaoAdminService';

const ROTULO_DECISAO: Record<DecisaoDenuncia, string> = { SEM_ACAO: 'Sem ação necessária', ADVERTENCIA: 'Advertência registrada', IMPROCEDENTE: 'Improcedente / duplicada' };
const OP_DECISAO: { chave: DecisaoDenuncia; rotulo: string; ajuda: string }[] = [
  { chave: 'ADVERTENCIA', rotulo: 'Advertir', ajuda: 'Registra a advertência. Abaixo você escolhe se o adolescente é avisado no app e se a conta no social fica restrita.' },
  { chave: 'SEM_ACAO', rotulo: 'Sem ação', ajuda: 'Analisada: não há o que fazer agora.' },
  { chave: 'IMPROCEDENTE', rotulo: 'Improcedente', ajuda: 'Sem fundamento ou repetida.' },
];
const OP_RESTRICAO: { dias: number | null; rotulo: string }[] = [
  { dias: null, rotulo: 'Sem restrição' }, { dias: 1, rotulo: '1 dia' }, { dias: 7, rotulo: '7 dias' }, { dias: 15, rotulo: '15 dias' }, { dias: 30, rotulo: '30 dias' },
];
const DIA_MS = 24 * 60 * 60 * 1000;
function dataCurta(iso: string) { return new Date(iso).toLocaleDateString('pt-BR'); }
const OP_FILTRO = [{ chave: 'ABERTA', label: 'Abertas' }, { chave: 'RESOLVIDA', label: 'Resolvidas' }, { chave: 'TODAS', label: 'Todas' }];

function CartaoDenuncia({ d, aoResolver }: { d: DenunciaSocial; aoResolver: () => void }) {
  const styles = useEstilos(criarEstilos);
  const navigation = useNavigation<any>();
  const { tema } = useTemaPainel();
  const [decisao, setDecisao] = useState<DecisaoDenuncia | null>(null);
  const [nota, setNota] = useState('');
  const [avisar, setAvisar] = useState(true);
  const [dias, setDias] = useState<number | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function registrar() {
    if (!decisao) return;
    if (!confirmando) { setConfirmando(true); return; } // 2 toques: a decisão é definitiva
    setOcupado(true);
    setErro(null);
    try {
      await resolverDenuncia(d.id, decisao, nota, decisao === 'ADVERTENCIA' ? { avisar, restringirDias: dias } : {});
      aoResolver();
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível registrar a decisão.');
      setConfirmando(false);
    } finally {
      setOcupado(false);
    }
  }

  const atrasada = d.status === 'ABERTA' && Date.now() - new Date(d.criadoEm).getTime() > 7 * DIA_MS;
  const restrito = !!d.restritoAte && new Date(d.restritoAte).getTime() > Date.now();

  async function levantar() {
    setOcupado(true);
    setErro(null);
    try {
      await levantarRestricaoSocial(d.denunciadoId);
      aoResolver();
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível levantar a restrição.');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <View style={styles.item}>
      <View style={styles.topo}>
        <Pressable onPress={() => navigation.navigate('UsuarioDetalhe', { id: d.denunciadoId })} accessibilityRole="button" style={{ flexShrink: 1, minHeight: 32, justifyContent: 'center' }}>
          <AppText style={styles.denunciado}>{d.denunciado ?? 'Usuário removido'}</AppText>
        </Pressable>
        {d.totalDoDenunciado >= 2 && <Selo texto={`${d.totalDoDenunciado} denúncias`} tom="aviso" />}
        {atrasada && <Selo texto="Atrasada (7+ dias)" tom="aviso" />}
        {restrito && <Selo texto={`Restrito até ${dataCurta(d.restritoAte!)}`} tom="erro" />}
        <Selo texto={d.status === 'ABERTA' ? 'Aberta' : 'Resolvida'} tom={d.status === 'ABERTA' ? 'erro' : 'ok'} />
        <AppText style={styles.quando}>{tempoRelativo(d.criadoEm)}</AppText>
      </View>
      <AppText style={styles.motivo}>{d.motivo}</AppText>
      <AppText style={styles.quem}>Denunciado por {d.denunciante ?? 'usuário removido'}</AppText>

      {d.status === 'RESOLVIDA' ? (
        <View style={styles.resolucao}>
          <AppText style={styles.resolucaoTitulo}>{d.decisao ? ROTULO_DECISAO[d.decisao] : 'Resolvida'}</AppText>
          <AppText style={styles.quem}>Por {d.resolvidoPor ?? 'equipe'}{d.resolvidoEm ? ` · ${tempoRelativo(d.resolvidoEm)}` : ''}</AppText>
          {!!d.notaEquipe && <AppText style={styles.motivo}>{d.notaEquipe}</AppText>}
          {restrito && (
            <View style={{ flexDirection: 'row', marginTop: 6 }}>
              <AppButton label="LEVANTAR RESTRIÇÃO" fullWidth={false} size="compact" disabled={ocupado} backgroundColor={tema.botaoFundo} textColor={tema.botaoTexto} shadowColor={tema.botaoSombra} onPress={levantar} />
            </View>
          )}
          {!!erro && <AppText style={styles.erro}>{erro}</AppText>}
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <AppText style={styles.rotulo}>Decisão da equipe</AppText>
          <View style={styles.opcoes}>
            {OP_DECISAO.map((o) => (
              <Pressable key={o.chave} onPress={() => { setDecisao(o.chave); setConfirmando(false); }} accessibilityRole="button" accessibilityState={{ selected: decisao === o.chave }}
                style={[styles.opcao, decisao === o.chave && styles.opcaoOn]}>
                <AppText style={[styles.opcaoTexto, decisao === o.chave && { color: tema.botaoTexto }]}>{o.rotulo}</AppText>
              </Pressable>
            ))}
          </View>
          {!!decisao && <AppText style={styles.quem}>{OP_DECISAO.find((o) => o.chave === decisao)?.ajuda}</AppText>}
          {decisao === 'ADVERTENCIA' && (
            <View style={{ gap: 8 }}>
              <AppText style={styles.rotulo}>Restringir a conta no social?</AppText>
              <View style={styles.opcoes}>
                {OP_RESTRICAO.map((o) => (
                  <Pressable key={o.rotulo} onPress={() => { setDias(o.dias); setConfirmando(false); }} accessibilityRole="button" accessibilityState={{ selected: dias === o.dias }}
                    style={[styles.opcao, dias === o.dias && styles.opcaoOn]}>
                    <AppText style={[styles.opcaoTexto, dias === o.dias && { color: tema.botaoTexto }]}>{o.rotulo}</AppText>
                  </Pressable>
                ))}
              </View>
              {dias !== null ? (
                <AppText style={styles.quem}>Durante {dias} {dias === 1 ? 'dia' : 'dias'} a pessoa não envia nem aceita pedidos, não reage, não convida para Chama Dupla nem envia receita; o código de amizade dela deixa de valer. O adolescente é avisado no app.</AppText>
              ) : (
                <Pressable onPress={() => { setAvisar((v) => !v); setConfirmando(false); }} accessibilityRole="checkbox" accessibilityState={{ checked: avisar }} style={{ minHeight: 40, justifyContent: 'center' }}>
                  <AppText style={styles.quem}>{avisar ? '☑' : '☐'} Avisar o adolescente no app (mensagem padrão, sem citar quem denunciou)</AppText>
                </Pressable>
              )}
            </View>
          )}
          <TextInput value={nota} onChangeText={setNota} placeholder="Nota da equipe (opcional, até 500 caracteres)" placeholderTextColor={tema.placeholder}
            style={styles.input} multiline maxLength={500} accessibilityLabel="Nota da equipe" />
          {!!erro && <AppText style={styles.erro}>{erro}</AppText>}
          <View style={{ flexDirection: 'row' }}>
            <AppButton label={confirmando ? 'TOQUE DE NOVO PARA CONFIRMAR' : 'REGISTRAR DECISÃO'} fullWidth={false} size="compact" disabled={!decisao || ocupado}
              backgroundColor={decisao ? tema.botaoFundo : undefined} textColor={tema.botaoTexto} shadowColor={tema.botaoSombra} onPress={registrar} />
          </View>
        </View>
      )}
    </View>
  );
}

export default function ModeracaoScreen() {
  const styles = useEstilos(criarEstilos);
  const navigation = useNavigation<any>();
  const [r, setR] = useState<ResumoModeracao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('ABERTA');

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

  const visiveis = (r?.denuncias ?? []).filter((d) => filtro === 'TODAS' || d.status === filtro);

  return (
    <PainelLayout config={ADMIN_PAINEL} titulo="Moderação" subtitulo="Denúncias e bloqueios entre adolescentes">
      <IntroSecao
        chave="admin_moderacao"
        titulo="Cuidado com o módulo social"
        linhas={[
          'Quando um adolescente denuncia outro no módulo de amizades, a denúncia chega aqui com o motivo escrito por ele.',
          'Reincidente = usuário denunciado 2 vezes ou mais. Toque no nome do denunciado para ver a conta.',
          'Para cada denúncia aberta, a equipe registra uma decisão (advertir, sem ação ou improcedente) e uma nota. A decisão é definitiva e fica gravada com nome e data.',
          'Na advertência você pode avisar o adolescente no app e restringir a conta no social por 1 a 30 dias. Restrição bloqueia contato novo (pedidos, aceites, reações, Chama Dupla, receita); ver amigos, bloquear e denunciar continuam livres. O social não tem texto livre, então o risco está no contato entre usuários.',
          'Denúncia aberta há mais de 7 dias aparece como atrasada: a lei pede resposta rápida a conteúdo que viole direitos de crianças e adolescentes.',
        ]}
      />
      {carregando ? (
        <EstadoCarregando />
      ) : erro || !r ? (
        <EstadoErro mensagem={erro ?? 'Sem dados.'} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : (
        <>
          <GridResponsiva minItem={150} gap={12} maxColunas={4}>
            <CartaoKpi titulo="Abertas" valor={r.denunciasAbertas} icone="flag" alerta={r.denunciasAbertas > 0} ajuda="Denúncias que ainda esperam decisão da equipe." />
            <CartaoKpi titulo="Atrasadas" valor={r.abertasAtrasadas} icone="alarm-outline" alerta={r.abertasAtrasadas > 0} ajuda="Denúncias abertas há mais de 7 dias sem decisão." />
            <CartaoKpi titulo="Contas restritas" valor={r.restricoesAtivas} icone="lock-closed-outline" ajuda="Usuários com restrição social em vigor agora." />
            <CartaoKpi titulo="Denúncias (total)" valor={r.totalDenuncias} icone="flag-outline" ajuda="Todas as denúncias já feitas no módulo social." />
            <CartaoKpi titulo="Últimos 30 dias" valor={r.denuncias30d} icone="time-outline" alerta={r.denuncias30d > 0} ajuda="Denúncias feitas no último mês." />
            <CartaoKpi titulo="Reincidentes" valor={r.reincidentes} icone="warning-outline" alerta={r.reincidentes > 0} ajuda="Usuários denunciados 2 vezes ou mais." />
            <CartaoKpi titulo="Bloqueios" valor={r.totalBloqueios} icone="ban-outline" ajuda="Quantas vezes adolescentes bloquearam outros adolescentes." />
          </GridResponsiva>

          <CartaoSecao titulo="Denúncias" subtitulo="Abertas primeiro, da mais nova para a mais antiga" ajuda="Cada cartão mostra quem denunciou, quem foi denunciado e o motivo informado. Nas abertas, registre a decisão da equipe.">
            <View style={{ marginBottom: 10 }}>
              <ChipsFiltro opcoes={OP_FILTRO} valor={filtro} onChange={setFiltro} />
            </View>
            {visiveis.length === 0 ? (
              <VazioPainel
                titulo={r.denuncias.length === 0 ? 'Nenhuma denúncia' : filtro === 'ABERTA' ? 'Nenhuma denúncia aberta' : 'Nada neste filtro'}
                texto={r.denuncias.length === 0 ? 'Ótimo sinal: ninguém denunciou ninguém até agora.' : 'Tudo o que chegou já foi analisado.'}
              />
            ) : (
              <View style={{ gap: 10 }}>
                {visiveis.map((d) => <CartaoDenuncia key={d.id} d={d} aoResolver={carregar} />)}
              </View>
            )}
          </CartaoSecao>
        </>
      )}
    </PainelLayout>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  item: { borderWidth: 2, borderColor: t.cardBorda, borderRadius: 14, padding: 12, gap: 6 },
  topo: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  denunciado: { fontFamily: typography.bold, fontSize: 14, color: t.texto },
  quando: { fontFamily: typography.regular, fontSize: 11, color: t.textoSuave, marginLeft: 'auto' },
  motivo: { fontFamily: typography.regular, fontSize: 13, color: t.textoCorpo, lineHeight: 19 },
  rotulo: { fontFamily: typography.bold, fontSize: 12, color: t.texto },
  opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcao: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2, borderColor: t.cardBorda, backgroundColor: t.card, justifyContent: 'center' },
  opcaoOn: { backgroundColor: t.botaoFundo, borderColor: t.texto },
  opcaoTexto: { fontFamily: typography.bold, fontSize: 12, color: t.texto },
  input: { minHeight: 64, borderWidth: 2, borderColor: t.cardBorda, borderRadius: 12, padding: 10, fontFamily: typography.regular, fontSize: 13, color: t.textoCorpo, textAlignVertical: 'top' },
  erro: { fontFamily: typography.regular, fontSize: 12, color: t.erro },
  resolucao: { backgroundColor: t.superficieSuave, borderRadius: 12, padding: 10, gap: 3 },
  resolucaoTitulo: { fontFamily: typography.bold, fontSize: 13, color: t.texto },
  quem: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave },
}) as const;
