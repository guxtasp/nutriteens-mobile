// src/features/conteudo/components/SeletorAlimento.tsx
// Escolher um alimento do catálogo por busca (usado ao criar alternativa).
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { LabeledInput } from '../../../shared/ui/LabeledInput';
import { typography } from '../../../shared/theme/typography';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';
import { listarAlimentosBusca } from '../services/edicaoService';
import { useDebounced } from '../hooks/useDebounced';

type Alimento = { id: string; nome: string };
type Props = {
  rotulo: string;
  dica?: string;
  escolhido: Alimento | null;
  onEscolher: (a: Alimento | null) => void;
  /** Permite limpar a escolha (campo opcional). */
  opcional?: boolean;
};

export function SeletorAlimento({ rotulo, dica, escolhido, onEscolher, opcional }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const [busca, setBusca] = useState('');
  const termo = useDebounced(busca, 300);
  const [lista, setLista] = useState<Alimento[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (escolhido || termo.trim().length < 2) { setLista([]); return; }
    let vivo = true;
    setCarregando(true);
    listarAlimentosBusca(termo)
      .then((r) => { if (vivo) setLista(r); })
      .catch(() => { if (vivo) setLista([]); })
      .finally(() => { if (vivo) setCarregando(false); });
    return () => { vivo = false; };
  }, [termo, escolhido]);

  if (escolhido) {
    return (
      <View style={{ gap: 6 }}>
        <AppText style={styles.rotulo}>{rotulo}</AppText>
        <View style={styles.linha}>
          <View style={[styles.chip, styles.chipOn]}>
            <AppText style={[styles.chipTexto, { color: tema.botaoTexto }]}>{escolhido.nome}</AppText>
          </View>
          <Pressable onPress={() => { onEscolher(null); setBusca(''); }} accessibilityRole="button" accessibilityLabel={`Trocar ${rotulo}`} style={styles.chip}>
            <AppText style={styles.chipTexto}>{opcional ? 'Remover' : 'Trocar'}</AppText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      <LabeledInput label={rotulo} value={busca} onChangeText={setBusca} placeholder="Digite 2 letras ou mais para buscar" autoCapitalize="none" />
      {!!dica && <AppText style={styles.dica}>{dica}</AppText>}
      {carregando && <AppText style={styles.dica}>Buscando…</AppText>}
      {!carregando && termo.trim().length >= 2 && lista.length === 0 && <AppText style={styles.dica}>Nenhum alimento encontrado.</AppText>}
      <View style={styles.linha}>
        {lista.map((a) => (
          <Pressable key={a.id} onPress={() => onEscolher(a)} accessibilityRole="button" style={styles.chip}>
            <AppText style={styles.chipTexto}>{a.nome}</AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  rotulo: { fontFamily: typography.regular, fontSize: 14, color: t.texto },
  dica: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 20, borderWidth: 2, borderColor: t.cardBorda, justifyContent: 'center', backgroundColor: t.card },
  chipOn: { backgroundColor: t.botaoFundo, borderColor: t.texto },
  chipTexto: { fontFamily: typography.bold, fontSize: 12, color: t.texto },
}) as const;
