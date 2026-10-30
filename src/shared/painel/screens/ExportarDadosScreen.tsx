// src/shared/painel/screens/ExportarDadosScreen.tsx
// Exportação de dados em CSV para pesquisa (Admin e Nutricionista).
// Os dados saem do banco já anonimizados: só o código do participante.
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { PainelLayout } from '../PainelLayout';
import { IntroSecao } from '../components/IntroSecao';
import { CartaoSecao } from '../components/CartaoSecao';
import { ChipsFiltro, Selo, VazioPainel } from '../components/ControlesLista';
import { AppText } from '../../ui/AppText';
import { AppButton } from '../../ui/AppButton';
import { typography } from '../../theme/typography';
import type { ConfigPainel } from '../types';
import { dataCurta } from '../formatadores';
import { mascaraDataBR, paraISO, parseDataBR, ultimosDias, type Intervalo } from '../periodo';
import {
  CONJUNTOS, buscarConjunto, csvDicionario, csvDoConjunto, listarExportacoesRecentes, nomeArquivo,
  type ConjuntoExport, type ExportacaoRecente, type Periodo,
} from '../services/exportacaoService';
import type { Separador } from '../utils/csv';
import { baixarTexto } from '../utils/baixarArquivo';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';

type ModoPeriodo = 'tudo' | '7' | '30' | '90' | 'personalizado';
type Estado = { fase: 'fazendo' | 'ok' | 'erro'; texto: string };

const OPCOES_PERIODO = [
  { chave: 'tudo', label: 'Tudo' },
  { chave: '7', label: '7 dias' },
  { chave: '30', label: '30 dias' },
  { chave: '90', label: '90 dias' },
  { chave: 'personalizado', label: 'Personalizado' },
];
const OPCOES_SEPARADOR = [
  { chave: ';', label: 'Ponto e vírgula (Excel no Brasil)' },
  { chave: ',', label: 'Vírgula (padrão internacional)' },
];

const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));
const milhar = (n: number) => n.toLocaleString('pt-BR');

function validarPersonalizado(ini: string | null, fim: string | null): string | null {
  if (!ini || !fim) return 'Use o formato DD/MM/AAAA nas duas datas.';
  if (fim < ini) return 'A data final precisa ser depois da inicial.';
  if (fim > paraISO(new Date())) return 'A data final não pode ser no futuro.';
  return null;
}

export default function ExportarDadosScreen({ config }: { config: ConfigPainel }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const [modo, setModo] = useState<ModoPeriodo>('tudo');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [sep, setSep] = useState<Separador>(';');
  const [dicionario, setDicionario] = useState(true);
  const [marcados, setMarcados] = useState<Set<string>>(new Set(CONJUNTOS.map((c) => c.chave)));
  const [estados, setEstados] = useState<Record<string, Estado>>({});
  const [exportando, setExportando] = useState(false);
  const [erroPeriodo, setErroPeriodo] = useState<string | null>(null);
  const [recentes, setRecentes] = useState<ExportacaoRecente[] | null>(null);

  const carregarRecentes = useCallback(() => {
    listarExportacoesRecentes().then(setRecentes).catch(() => setRecentes([]));
  }, []);
  useFocusEffect(useCallback(() => { carregarRecentes(); }, [carregarRecentes]));

  const alternar = (chave: string) =>
    setMarcados((s) => {
      const n = new Set(s);
      n.has(chave) ? n.delete(chave) : n.add(chave);
      return n;
    });
  const todosMarcados = marcados.size === CONJUNTOS.length;

  const periodoEscolhido = useMemo((): { ok: true; periodo: Periodo } | { ok: false; erro: string } => {
    if (modo === 'tudo') return { ok: true, periodo: null };
    if (modo === 'personalizado') {
      const ini = parseDataBR(de);
      const fim = parseDataBR(ate);
      const erro = validarPersonalizado(ini, fim);
      return erro ? { ok: false, erro } : { ok: true, periodo: { inicio: ini!, fim: fim! } as Intervalo };
    }
    return { ok: true, periodo: ultimosDias(Number(modo)) };
  }, [modo, de, ate]);

  function trocarModo(m: string) {
    setModo(m as ModoPeriodo);
    setErroPeriodo(null);
  }

  async function exportar() {
    if (!periodoEscolhido.ok) return setErroPeriodo(periodoEscolhido.erro);
    setErroPeriodo(null);
    const periodo = periodoEscolhido.periodo;
    const hoje = paraISO(new Date());
    const escolhidos: ConjuntoExport[] = CONJUNTOS.filter((c) => marcados.has(c.chave));
    if (!escolhidos.length) return;

    setExportando(true);
    setEstados({});
    const marcar = (chave: string, e: Estado) => setEstados((s) => ({ ...s, [chave]: e }));

    for (const c of escolhidos) {
      try {
        marcar(c.chave, { fase: 'fazendo', texto: 'Buscando dados...' });
        const linhas = await buscarConjunto(c, periodo, (n, total) =>
          marcar(c.chave, { fase: 'fazendo', texto: `Buscando... ${milhar(n)} de ${milhar(total)}` })
        );
        await baixarTexto(nomeArquivo(c.chave, periodo, hoje), csvDoConjunto(c, linhas, sep));
        marcar(c.chave, { fase: 'ok', texto: linhas.length ? `${milhar(linhas.length)} linhas` : 'Sem dados no período (arquivo só com o cabeçalho)' });
        await pausa(400); // evita o navegador bloquear vários downloads seguidos
      } catch (e: any) {
        marcar(c.chave, { fase: 'erro', texto: e?.message ?? 'Não foi possível exportar.' });
      }
    }

    if (dicionario) {
      try {
        await baixarTexto(`nutriteens_dicionario_de_dados.csv`, csvDicionario(escolhidos, sep));
      } catch { /* o dicionário é um extra: falhar aqui não invalida os dados */ }
    }
    setExportando(false);
    carregarRecentes();
  }

  return (
    <PainelLayout config={config} titulo="Exportar dados" subtitulo="Arquivos CSV anonimizados para pesquisa e análise">
      <IntroSecao
        chave="exportar_dados"
        titulo="Como exportar"
        linhas={[
          'Escolha o período, o formato e quais conjuntos de dados quer. Cada conjunto vira um arquivo CSV.',
          'Os arquivos trazem só o código do participante (NT-000001): sem nome, e-mail, apelido, escola ou data de nascimento.',
          'Use os arquivos apenas para a pesquisa e guarde-os em local seguro. Cada exportação fica registrada.',
          'O navegador pode pedir permissão para baixar vários arquivos de uma vez; aceite.',
        ]}
      />

      <CartaoSecao titulo="Período" subtitulo="Quais dias entram nos arquivos" ajuda="'Tudo' exporta o histórico completo. Cada conjunto explica abaixo como o período é aplicado.">
        <ChipsFiltro opcoes={OPCOES_PERIODO} valor={modo} onChange={trocarModo} />
        {modo === 'personalizado' && (
          <View style={styles.linha}>
            <TextInput value={de} onChangeText={(t) => setDe(mascaraDataBR(t))} placeholder="De DD/MM/AAAA" placeholderTextColor={tema.placeholder}
              keyboardType="number-pad" maxLength={10} style={styles.input} accessibilityLabel="Data inicial" />
            <TextInput value={ate} onChangeText={(t) => setAte(mascaraDataBR(t))} placeholder="Até DD/MM/AAAA" placeholderTextColor={tema.placeholder}
              keyboardType="number-pad" maxLength={10} style={styles.input} accessibilityLabel="Data final" />
          </View>
        )}
        {!!erroPeriodo && <AppText style={styles.erro}>{erroPeriodo}</AppText>}
      </CartaoSecao>

      <CartaoSecao titulo="Formato" subtitulo="Como o CSV é montado">
        <ChipsFiltro opcoes={OPCOES_SEPARADOR} valor={sep} onChange={(c) => setSep(c as Separador)} />
        <Pressable onPress={() => setDicionario((v) => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: dicionario }} style={styles.linhaCheck}>
          <Ionicons name={dicionario ? 'checkbox' : 'square-outline'} size={22} color={tema.texto} />
          <AppText style={styles.checkTexto}>Incluir o dicionário de dados (um arquivo explicando cada coluna)</AppText>
        </Pressable>
      </CartaoSecao>

      <CartaoSecao
        titulo="Conjuntos de dados"
        subtitulo={`${marcados.size} de ${CONJUNTOS.length} selecionados`}
        direita={
          <Pressable onPress={() => setMarcados(todosMarcados ? new Set() : new Set(CONJUNTOS.map((c) => c.chave)))} accessibilityRole="button">
            <AppText style={styles.link}>{todosMarcados ? 'Limpar' : 'Selecionar todos'}</AppText>
          </Pressable>
        }
      >
        {CONJUNTOS.map((c) => {
          const marcado = marcados.has(c.chave);
          const est = estados[c.chave];
          return (
            <Pressable key={c.chave} onPress={() => !exportando && alternar(c.chave)} accessibilityRole="checkbox" accessibilityState={{ checked: marcado, disabled: exportando }} style={styles.conjunto}>
              <Ionicons name={marcado ? 'checkbox' : 'square-outline'} size={22} color={tema.texto} style={{ marginTop: 1 }} />
              <View style={styles.conjuntoCorpo}>
                <AppText style={styles.conjuntoTitulo}>{c.titulo}</AppText>
                <AppText style={styles.conjuntoDescricao}>{c.descricao}</AppText>
                <AppText style={styles.conjuntoPeriodo}>Período: {c.periodo}</AppText>
                {!!est && (
                  <View style={styles.estado}>
                    <Selo texto={est.fase === 'ok' ? 'Baixado' : est.fase === 'erro' ? 'Erro' : 'Em andamento'} tom={est.fase === 'ok' ? 'ok' : est.fase === 'erro' ? 'erro' : 'info'} />
                    <AppText style={[styles.conjuntoPeriodo, est.fase === 'erro' && { color: tema.erro }]}>{est.texto}</AppText>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
        <AppButton
          label={exportando ? 'EXPORTANDO...' : `EXPORTAR ${marcados.size} ARQUIVO${marcados.size === 1 ? '' : 'S'}`}
          fullWidth={false}
          size="compact"
          disabled={exportando || marcados.size === 0}
          style={{ paddingHorizontal: 20, minHeight: 46, alignSelf: 'flex-start' }}
          onPress={exportar}
        />
      </CartaoSecao>

      <CartaoSecao titulo="Últimas exportações" subtitulo="Registro de quem exportou e quando" ajuda="Administração vê as exportações de todos; nutricionistas veem só as próprias.">
        {recentes === null ? (
          <AppText style={styles.conjuntoPeriodo}>Carregando...</AppText>
        ) : recentes.length === 0 ? (
          <VazioPainel titulo="Nenhuma exportação ainda" texto="Quando você exportar, o registro aparece aqui." />
        ) : (
          recentes.map((r, i) => {
            const titulo = CONJUNTOS.find((c) => c.chave === r.conjunto)?.titulo ?? r.conjunto;
            const faixa = r.inicio && r.fim ? `${dataCurta(r.inicio)} a ${dataCurta(r.fim)}` : 'Tudo';
            return (
              <View key={`${r.criadoEm}-${i}`} style={styles.recente}>
                <AppText style={styles.conjuntoTitulo}>{titulo}</AppText>
                <AppText style={styles.conjuntoPeriodo}>
                  {faixa} · {milhar(r.linhas ?? 0)} linhas · {dataCurta(r.criadoEm)}{r.quem ? ` · ${r.quem}` : ''}
                </AppText>
              </View>
            );
          })
        )}
      </CartaoSecao>
    </PainelLayout>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    minWidth: 150, flexGrow: 1, borderWidth: 1.5, borderColor: t.cardBorda, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, fontFamily: typography.regular, fontSize: 14, color: t.textoCorpo,
  },
  erro: { fontFamily: typography.regular, fontSize: 12, color: t.erro },
  linhaCheck: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  checkTexto: { flex: 1, fontFamily: typography.regular, fontSize: 13, color: t.texto },
  link: { fontFamily: typography.bold, fontSize: 13, color: t.texto },
  conjunto: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.linhaSuave },
  conjuntoCorpo: { flex: 1, minWidth: 0, gap: 2 },
  conjuntoTitulo: { fontFamily: typography.bold, fontSize: 14, color: t.texto },
  conjuntoDescricao: { fontFamily: typography.regular, fontSize: 13, color: t.textoCorpo },
  conjuntoPeriodo: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave },
  estado: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  recente: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: t.linhaSuave, gap: 2 },
}) as const;
