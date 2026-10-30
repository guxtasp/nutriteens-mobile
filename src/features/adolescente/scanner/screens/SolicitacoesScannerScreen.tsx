// src/features/adolescente/scanner/screens/SolicitacoesScannerScreen.tsx
// Painel (nutricionista e admin): pedidos de cadastro do scanner. Aprovar grava o produto com fonte 'EQUIPE'.
import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PainelLayout } from '../../../../shared/painel/PainelLayout';
import { EstadoCarregando, EstadoErro } from '../../../../shared/painel/components/EstadosPainel';
import { Selo, VazioPainel } from '../../../../shared/painel/components/ControlesLista';
import type { ConfigPainel } from '../../../../shared/painel/types';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { LabeledInput } from '../../../../shared/ui/LabeledInput';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import type { ClassificacaoNova } from '../../alimentacao/utils/regraFeedbackRefeicao';
import { CATEGORIAS_TROCA, CategoriaTroca, ROTULO_CATEGORIA } from '../../trocas/utils/trocas';
import { listarSolicitacoes, resolverSolicitacao, SolicitacaoScanner } from '../services/solicitacoesService';
import { ROTULO_PROCESSAMENTO } from '../utils/scanner';
import type { TemaPainel } from '../../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../../shared/painel/tema/TemaPainelContext';

const NIVEIS = Object.keys(ROTULO_PROCESSAMENTO) as ClassificacaoNova[];

function Chip({ rotulo, ativo, onPress }: { rotulo: string; ativo: boolean; onPress: () => void }) {
  const styles = useEstilos(criarEstilos);
  return (
    <Pressable onPress={onPress} style={[styles.chip, ativo && styles.chipAtivo]} accessibilityRole="button" accessibilityState={{ selected: ativo }}>
      <AppText style={[styles.chipTexto, ativo && { fontFamily: typography.bold }]}>{rotulo}</AppText>
    </Pressable>
  );
}

function Cartao({ s, onResolvida }: { s: SolicitacaoScanner; onResolvida: () => void }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState(s.nomeInformado ?? s.produtoAtualNome ?? '');
  const [marca, setMarca] = useState(s.marcaInformada ?? '');
  const [nova, setNova] = useState<ClassificacaoNova | null>(null);
  const [categoria, setCategoria] = useState<CategoriaTroca | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function decidir(acao: 'APROVAR' | 'REJEITAR') {
    if (ocupado) return;
    if (acao === 'APROVAR' && nome.trim().length < 2) { setErro('Informe o nome do produto.'); return; }
    setOcupado(true); setErro(null);
    try {
      await resolverSolicitacao(s.id, acao === 'APROVAR' ? { acao, nome, marca, nova, categoria } : { acao });
      onResolvida();
    } catch (e) {
      console.error('Scanner: não resolveu a solicitação:', e);
      setErro('Não deu para salvar agora. Tente de novo.');
      setOcupado(false);
    }
  }

  return (
    <View style={styles.card}>
      <Pressable onPress={() => setAberto((v) => !v)} accessibilityRole="button" style={styles.topo}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText style={styles.nome}>{s.nomeInformado ?? 'Sem nome informado'}{s.marcaInformada ? ` · ${s.marcaInformada}` : ''}</AppText>
          <AppText style={styles.suave}>Código {s.codigoBarras}</AppText>
        </View>
        <View style={{ gap: 4, alignItems: 'flex-end' }}>
          <Selo texto={s.pedidos === 1 ? '1 pedido' : `${s.pedidos} pedidos`} tom={s.pedidos > 1 ? 'info' : 'neutro'} />
          <Selo texto={s.motivo === 'FICHA_INCOMPLETA' ? 'ficha incompleta' : 'não encontrado'} tom="aviso" />
        </View>
      </Pressable>

      {!!s.candidatoNome && (
        <AppText style={styles.suave}>
          Sugestão de quem pediu (não confirmada): {s.candidatoNome}{s.candidatoCodigo ? ` · código ${s.candidatoCodigo}` : ''}
        </AppText>
      )}
      {!!s.produtoAtualNome && <AppText style={styles.suave}>Hoje na base: {s.produtoAtualNome} ({s.produtoAtualFonte})</AppText>}

      {aberto && (
        <View style={{ gap: 12, marginTop: 6 }}>
          <LabeledInput label="Nome" value={nome} onChangeText={setNome} maxLength={200} />
          <LabeledInput label="Marca" value={marca} onChangeText={setMarca} maxLength={120} />
          <AppText style={styles.secao}>Nível de processamento</AppText>
          <View style={styles.chips}>
            <Chip rotulo="Sem classificação" ativo={nova === null} onPress={() => setNova(null)} />
            {NIVEIS.map((n) => <Chip key={n} rotulo={ROTULO_PROCESSAMENTO[n]} ativo={nova === n} onPress={() => setNova(n)} />)}
          </View>
          <AppText style={styles.secao}>Categoria de troca</AppText>
          <View style={styles.chips}>
            <Chip rotulo="Nenhuma" ativo={categoria === null} onPress={() => setCategoria(null)} />
            {CATEGORIAS_TROCA.map((c) => <Chip key={c} rotulo={ROTULO_CATEGORIA[c]} ativo={categoria === c} onPress={() => setCategoria(c)} />)}
          </View>
          {!!erro && <AppText style={styles.erro}>{erro}</AppText>}
          <View style={styles.acoes}>
            <AppButton label={ocupado ? 'Salvando...' : 'Cadastrar produto'} onPress={() => decidir('APROVAR')} disabled={ocupado} />
            <AppButton label="Rejeitar pedido" backgroundColor={tema.card} textColor={tema.texto} outlineColor={tema.texto}
              onPress={() => decidir('REJEITAR')} disabled={ocupado} />
          </View>
        </View>
      )}
    </View>
  );
}

export default function SolicitacoesScannerScreen({ config }: { config: ConfigPainel }) {
  const [lista, setLista] = useState<SolicitacaoScanner[] | null>(null);
  const [erro, setErro] = useState(false);

  const carregar = useCallback(() => {
    setErro(false);
    listarSolicitacoes().then(setLista).catch((e) => { console.error('Scanner: fila indisponível:', e); setErro(true); });
  }, []);
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  return (
    <PainelLayout config={config} titulo="Produtos do scanner" subtitulo="Pedidos de cadastro de produtos que o scanner não encontrou">
      {erro ? <EstadoErro mensagem="Não deu para carregar os pedidos." onTentar={carregar} />
        : lista === null ? <EstadoCarregando />
        : lista.length === 0 ? <VazioPainel titulo="Nenhum pedido pendente" texto="Quando alguém escanear um produto que não está na base, o pedido aparece aqui." />
        : <View style={{ gap: 12 }}>{lista.map((s) => <Cartao key={s.id} s={s} onResolvida={carregar} />)}</View>}
    </PainelLayout>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  card: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: 2, borderColor: t.cardBorda, padding: 14, gap: 8 },
  topo: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  nome: { fontFamily: typography.bold, fontSize: 15, color: t.texto },
  suave: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave },
  secao: { fontFamily: typography.bold, fontSize: 13, color: t.texto },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1.5, borderColor: t.chipBorda, paddingHorizontal: 12, paddingVertical: 6 },
  chipAtivo: { backgroundColor: colors.primary, borderColor: colors.primaryShadow },
  chipTexto: { fontFamily: typography.regular, fontSize: 12, color: t.texto },
  erro: { fontFamily: typography.regular, fontSize: 13, color: t.erro },
  acoes: { gap: 10 },
}) as const;
