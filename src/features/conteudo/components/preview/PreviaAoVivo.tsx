// src/features/conteudo/components/preview/PreviaAoVivo.tsx
// Prévia AO VIVO: mostra, nos componentes reais do app do adolescente, o que está sendo
// editado AGORA (rascunho, sem salvar) — serve para criar e para alterar. Acompanha a
// digitação com um pequeno atraso e reinicia quando o conteúdo muda. Por padrão começa no
// bloco selecionado (como "clicar num bloco do Scratch para executá-lo").
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import type { LicaoEmEdicao } from '../../utils/passosEdicao';
import { assinaturaAoVivo, paraPreviaAoVivo, recortarDesde } from '../../utils/blocos';
import type { LicaoEditavel } from '../../services/edicaoService';
import { useDebounced } from '../../hooks/useDebounced';
import LicaoUsoPreview from './LicaoUsoPreview';
import { QuadroCelular } from './QuadroCelular';

const AVISO = 'AO VIVO · mostra o que você está editando. Nada é salvo e não gera XP.';

type Props = {
  estado: LicaoEmEdicao;
  /** índice (0-based) do bloco selecionado, ou null */
  selecionado: number | null;
  altura?: number;
};

export default function PreviaAoVivo({ estado, selecionado, altura = 640 }: Props) {
  const atrasado = useDebounced(estado, 300);
  const [doSelecionado, setDoSelecionado] = useState(true);

  const { licao, incompletos } = useMemo(() => paraPreviaAoVivo(atrasado), [atrasado]);
  const desde = doSelecionado ? selecionado : null;
  const recortada = useMemo(() => recortarDesde(licao, desde), [licao, desde]);
  const chave = useMemo(() => assinaturaAoVivo(recortada), [recortada]);

  const atualizando = atrasado !== estado;
  const qtdIncompletos = incompletos.filter(Boolean).length;
  const vazio = recortada.tipo === 'quiz' && recortada.questoes.length === 0;

  return (
    <View style={styles.raiz}>
      <View style={styles.topo}>
        <View style={styles.aoVivo}>
          <View style={[styles.ponto, atualizando && styles.pontoAtualizando]} />
          <AppText style={styles.aoVivoTexto}>{atualizando ? 'ATUALIZANDO…' : 'AO VIVO'}</AppText>
        </View>
        {licao.questoes.length > 1 && (
          <Pressable
            onPress={() => setDoSelecionado((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Alternar onde a prévia começa"
            style={styles.alternar}
          >
            <AppText style={styles.alternarTexto}>{doSelecionado && selecionado !== null ? 'Começa no bloco selecionado' : 'Começa do início'}</AppText>
          </Pressable>
        )}
      </View>

      {vazio ? (
        <QuadroCelular aviso={AVISO} altura={altura}>
          <View style={styles.vazio}>
            <AppText style={styles.vazioTitulo}>Nenhum bloco ainda</AppText>
            <AppText style={styles.vazioTexto}>Adicione blocos da paleta e eles aparecem aqui, do jeito que o adolescente vê.</AppText>
          </View>
        </QuadroCelular>
      ) : (
        <LicaoUsoPreview key={chave} licao={recortada as unknown as LicaoEditavel} aviso={AVISO} altura={altura} />
      )}

      {qtdIncompletos > 0 && (
        <AppText style={styles.alerta}>
          ⚠ {qtdIncompletos} bloco(s) incompleto(s): aparecem como um cartão de aviso no celular até você terminar de preencher.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: 8, width: '100%', maxWidth: 400, alignSelf: 'center' },
  topo: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  aoVivo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ponto: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  pontoAtualizando: { backgroundColor: '#FFAB19' },
  aoVivoTexto: { fontFamily: typography.bold, fontSize: 12, letterSpacing: 0.6, color: colors.primaryDark },
  alternar: { minHeight: 36, paddingHorizontal: 12, borderRadius: 18, borderWidth: 2, borderColor: '#D9D9D9', justifyContent: 'center', backgroundColor: colors.white },
  alternarTexto: { fontFamily: typography.semiBold, fontSize: 12, color: colors.primaryDark },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 28 },
  vazioTitulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark },
  vazioTexto: { fontFamily: typography.regular, fontSize: 14, lineHeight: 20, color: '#6B7280', textAlign: 'center' },
  alerta: { fontFamily: typography.regular, fontSize: 12, color: '#7A5B00', backgroundColor: '#FFF4CC', borderRadius: 10, padding: 10, lineHeight: 17 },
});
