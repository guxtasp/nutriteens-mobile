// src/features/admin/components/IngredientesPratoSection.tsx
// Ingredientes de um prato composto: buscar no catálogo, ajustar a proporção e salvar.
// A proporção é relativa (1 = uma parte); a barra ao lado mostra quanto cada ingrediente
// representa do prato, para a pessoa não precisar fazer a conta. A gravação é a RPC
// substituir_ingredientes_prato (liberada no banco para administração e nutricionista).
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { typography } from '../../../shared/theme/typography';
import { CampoBusca } from '../../../shared/painel/components/ControlesLista';
import { AvisoPainel, type TomAviso } from '../../../shared/painel/components/Formulario';
import { ALVO_TOQUE, fonte } from '../../../shared/painel/painelTheme';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';
import {
  buscarAlimentosParaSelecao,
  buscarIngredientesDoPrato,
  salvarIngredientesDoPrato,
  IngredientePrato,
  Alimento,
} from '../services/alimentosAdminService';

type Props = {
  pratoId: string | null; // null = alimento ainda não foi salvo
  /** avisa quantos ingredientes já estão SALVOS (para o indicador de etapas) */
  onQuantidade?: (n: number) => void;
};

const PASSO = 0.5;
const fmt = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

export default function IngredientesPratoSection({ pratoId, onQuantidade }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const [ingredientes, setIngredientes] = useState<IngredientePrato[]>([]);
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<Alimento[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [buscou, setBuscou] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [carregado, setCarregado] = useState(false);
  const [textos, setTextos] = useState<Record<string, string>>({}); // o que está sendo digitado (permite "0,5")
  const [sujo, setSujo] = useState(false);
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tom: TomAviso; texto: string } | null>(null);

  useEffect(() => {
    if (!pratoId) return;
    buscarIngredientesDoPrato(pratoId)
      .then((l) => {
        setIngredientes(l);
        onQuantidade?.(l.length);
      })
      .catch((e) => setMsg({ tom: 'erro', texto: e?.message ?? '' }))
      .finally(() => setCarregado(true));
  }, [pratoId]);

  useEffect(() => {
    if (!busca.trim()) {
      setResultados([]);
      setBuscou(false);
      return;
    }
    setBuscando(true);
    const timeout = setTimeout(() => {
      buscarAlimentosParaSelecao(busca)
        .then((r) => setResultados(r))
        .catch(() => setResultados([]))
        .finally(() => {
          setBuscou(true);
          setBuscando(false);
        });
    }, 300);
    return () => clearTimeout(timeout);
  }, [busca]);

  function mudou() {
    setSujo(true);
    setMsg(null);
  }

  function adicionar(alimento: Alimento) {
    if (ingredientes.some((i) => i.ingrediente_id === alimento.id)) return;
    mudou();
    setIngredientes((atual) => [...atual, { ingrediente_id: alimento.id, proporcao: 1, nome: alimento.nome }]);
    setBusca('');
    setResultados([]);
  }

  function remover(id: string) {
    mudou();
    setRemovendo(null);
    setIngredientes((atual) => atual.filter((i) => i.ingrediente_id !== id));
  }

  function definirProporcao(id: string, valor: number, texto?: string) {
    mudou();
    setTextos((t) => ({ ...t, [id]: texto ?? fmt(valor) }));
    setIngredientes((atual) => atual.map((i) => (i.ingrediente_id === id ? { ...i, proporcao: valor } : i)));
  }

  const salvarAgora = useCallback(async () => {
    if (!pratoId) return;
    if (ingredientes.some((i) => !(i.proporcao > 0))) {
      setMsg({ tom: 'aviso', texto: 'Informe uma proporção maior que zero em todos os ingredientes.' });
      return;
    }
    setSalvando(true);
    setMsg(null);
    try {
      await salvarIngredientesDoPrato(pratoId, ingredientes.map((i) => ({ ingrediente_id: i.ingrediente_id, proporcao: i.proporcao })));
      setSujo(false);
      onQuantidade?.(ingredientes.length);
      setMsg({ tom: 'ok', texto: ingredientes.length ? `Ingredientes salvos (${ingredientes.length}).` : 'O prato ficou sem ingredientes.' });
    } catch (e: any) {
      setMsg({ tom: 'erro', texto: e?.message ?? '' });
    } finally {
      setSalvando(false);
    }
  }, [pratoId, ingredientes, onQuantidade]);

  const disponiveis = resultados.filter((r) => r.id !== pratoId && !ingredientes.some((i) => i.ingrediente_id === r.id));
  const total = ingredientes.reduce((s, i) => s + (i.proporcao > 0 ? i.proporcao : 0), 0);

  if (!pratoId) {
    return <AvisoPainel tom="info" texto="Salve o prato primeiro para poder adicionar os ingredientes." />;
  }

  return (
    <View style={styles.container}>
      <View style={{ gap: 8 }}>
        <CampoBusca valor={busca} onChange={setBusca} placeholder="Buscar ingrediente no catálogo (ex.: arroz)" />
        {buscando && <ActivityIndicator color={tema.destaqueTexto} style={{ alignSelf: 'flex-start' }} />}
        {disponiveis.length > 0 && (
          <View style={styles.resultadosBox}>
            {disponiveis.map((item) => (
              <Pressable
                key={item.id}
                style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [styles.resultadoItem, hovered && { backgroundColor: tema.superficieSuave }]}
                onPress={() => adicionar(item)}
                accessibilityRole="button"
                accessibilityLabel={`Adicionar ${item.nome} ao prato`}
              >
                <AppText style={styles.resultadoTexto} numberOfLines={1}>{item.nome}</AppText>
                <View style={styles.addBox}>
                  <Ionicons name="add-circle" size={18} color={tema.destaqueTexto} />
                  <AppText style={styles.addTexto}>Adicionar</AppText>
                </View>
              </Pressable>
            ))}
          </View>
        )}
        {buscou && !buscando && busca.trim() !== '' && disponiveis.length === 0 && (
          <AppText style={styles.vazio}>
            {resultados.length > 0
              ? 'Todos os alimentos encontrados já estão no prato.'
              : 'Nenhum alimento com esse nome. Cadastre o ingrediente na aba Alimentos do Catálogo e volte aqui.'}
          </AppText>
        )}
      </View>

      <View style={styles.cabecalhoLista}>
        <AppText style={styles.label}>No prato ({ingredientes.length})</AppText>
        <AppText style={styles.dica}>Proporção: 1 = uma parte</AppText>
      </View>

      {!carregado ? (
        <ActivityIndicator color={tema.destaqueTexto} />
      ) : ingredientes.length === 0 ? (
        <View style={styles.vazioBox}>
          <Ionicons name="restaurant-outline" size={22} color={tema.textoSuave} />
          <AppText style={styles.vazio}>Nenhum ingrediente ainda. Busque acima e toque em "Adicionar".</AppText>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {ingredientes.map((item) => {
            const pct = total > 0 && item.proporcao > 0 ? Math.round((item.proporcao / total) * 100) : 0;
            const nome = item.nome ?? 'Ingrediente';
            return (
              <View key={item.ingrediente_id} style={styles.linhaIngrediente}>
                <View style={{ flex: 1, minWidth: 140, gap: 4 }}>
                  <AppText style={styles.nomeIngrediente} numberOfLines={1}>{nome}</AppText>
                  <View style={styles.barra} accessibilityLabel={`${pct}% do prato`}>
                    <View style={[styles.barraCheia, { width: `${pct}%` }]} />
                  </View>
                  <AppText style={styles.dica}>{pct}% do prato</AppText>
                </View>
                <View style={styles.stepper}>
                  <Pressable
                    onPress={() => definirProporcao(item.ingrediente_id, Math.max(PASSO, item.proporcao - PASSO))}
                    accessibilityRole="button"
                    accessibilityLabel={`Diminuir proporção de ${nome}`}
                    style={styles.stepperBotao}
                  >
                    <Ionicons name="remove" size={18} color={tema.texto} />
                  </Pressable>
                  <TextInput
                    style={styles.inputProporcao}
                    keyboardType="decimal-pad"
                    value={textos[item.ingrediente_id] ?? fmt(item.proporcao)}
                    onChangeText={(t) => definirProporcao(item.ingrediente_id, parseFloat(t.replace(',', '.')) || 0, t)}
                    accessibilityLabel={`Proporção de ${nome}`}
                  />
                  <Pressable
                    onPress={() => definirProporcao(item.ingrediente_id, item.proporcao + PASSO)}
                    accessibilityRole="button"
                    accessibilityLabel={`Aumentar proporção de ${nome}`}
                    style={styles.stepperBotao}
                  >
                    <Ionicons name="add" size={18} color={tema.texto} />
                  </Pressable>
                </View>
                {removendo === item.ingrediente_id ? (
                  <View style={styles.confirma}>
                    <AppButton label="REMOVER" fullWidth={false} size="compact" outlineColor={tema.erro} textColor={tema.erro} style={styles.botaoMini} onPress={() => remover(item.ingrediente_id)} />
                    <AppButton label="NÃO" fullWidth={false} size="compact" outlineColor={tema.texto} textColor={tema.texto} style={styles.botaoMini} onPress={() => setRemovendo(null)} />
                  </View>
                ) : (
                  <Pressable onPress={() => setRemovendo(item.ingrediente_id)} accessibilityRole="button" accessibilityLabel={`Remover ${nome} do prato`} style={styles.lixeira}>
                    <Ionicons name="trash-outline" size={18} color={tema.erro} />
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      )}

      {!!msg && <AvisoPainel tom={msg.tom} texto={msg.texto} onFechar={() => setMsg(null)} />}

      <View style={styles.rodape}>
        {sujo && (
          <View style={styles.pendente}>
            <Ionicons name="ellipse" size={8} color={tema.alertaTexto} />
            <AppText style={styles.pendenteTexto}>Mudanças ainda não salvas</AppText>
          </View>
        )}
        <AppButton
          label={salvando ? 'SALVANDO…' : 'SALVAR INGREDIENTES'}
          fullWidth={false}
          size="compact"
          backgroundColor={tema.botaoFundo}
          textColor={tema.botaoTexto}
          shadowColor={tema.botaoSombra}
          disabled={salvando || !sujo}
          style={styles.botao}
          onPress={salvarAgora}
        />
      </View>
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  container: { gap: 14 },
  label: { fontFamily: typography.bold, fontSize: fonte.apoio, color: t.texto },
  dica: { fontFamily: typography.regular, fontSize: fonte.selo, color: t.textoSuave },
  resultadosBox: { borderWidth: t.borda, borderColor: t.cardBorda, borderRadius: 12, overflow: 'hidden', backgroundColor: t.card },
  resultadoItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8,
    minHeight: ALVO_TOQUE, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: t.linhaSuave,
  },
  resultadoTexto: { flex: 1, fontFamily: typography.medium, fontSize: fonte.apoio, color: t.textoCorpo },
  addBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addTexto: { fontFamily: typography.bold, fontSize: fonte.legenda, color: t.destaqueTexto },
  cabecalhoLista: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  vazioBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: t.borda, borderStyle: 'dashed', borderColor: t.chipBorda },
  vazio: { flex: 1, fontFamily: typography.regular, fontSize: fonte.legenda, color: t.textoSuave },
  linhaIngrediente: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10,
    padding: 10, borderRadius: 12, backgroundColor: t.superficieSuave,
  },
  nomeIngrediente: { fontFamily: typography.semiBold, fontSize: fonte.apoio, color: t.texto },
  barra: { height: 6, borderRadius: 3, backgroundColor: t.linhaSuave, overflow: 'hidden' },
  barraCheia: { height: 6, borderRadius: 3, backgroundColor: t.destaque },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: t.borda, borderColor: t.campoBorda, borderRadius: 10, backgroundColor: t.card, overflow: 'hidden' },
  stepperBotao: { width: ALVO_TOQUE, height: ALVO_TOQUE, alignItems: 'center', justifyContent: 'center' },
  inputProporcao: { width: 52, height: ALVO_TOQUE, textAlign: 'center', fontFamily: typography.semiBold, fontSize: fonte.corpo, color: t.textoCorpo, borderLeftWidth: 1, borderRightWidth: 1, borderColor: t.cardBorda },
  lixeira: { width: ALVO_TOQUE, height: ALVO_TOQUE, alignItems: 'center', justifyContent: 'center' },
  confirma: { flexDirection: 'row', gap: 6 },
  botaoMini: { paddingHorizontal: 12, minHeight: ALVO_TOQUE },
  rodape: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 12 },
  pendente: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pendenteTexto: { fontFamily: typography.semiBold, fontSize: fonte.legenda, color: t.alertaTexto },
  botao: { paddingHorizontal: 18, minHeight: ALVO_TOQUE },
}) as const;
