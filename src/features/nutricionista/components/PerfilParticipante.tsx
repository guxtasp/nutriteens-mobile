// src/features/nutricionista/components/PerfilParticipante.tsx
// Cabeçalho do acompanhamento: quem é o participante, em uma olhada (sem rolar a página).
import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { typography } from '../../../shared/theme/typography';
import { Selo } from '../../../shared/painel/components/ControlesLista';
import { ultimoAcessoTexto } from '../../../shared/painel/formatadores';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos } from '../../../shared/painel/tema/TemaPainelContext';
import type { DetalheParticipante } from '../services/participantesService';
import { seloEbia } from '../screens/ParticipantesScreen';

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const a = partes[0][0] ?? '';
  const b = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (a + b).toUpperCase();
}

function Medida({ rotulo, valor }: { rotulo: string; valor: string }) {
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.medida}>
      <AppText style={styles.medidaValor}>{valor}</AppText>
      <AppText style={styles.medidaRotulo}>{rotulo}</AppText>
    </View>
  );
}

type Props = { p: DetalheParticipante; nome: string; imc: number | null };

export function PerfilParticipante({ p, nome, imc }: Props) {
  const styles = useEstilos(criarEstilos);
  const meta = [p.instituicaoEnsino, `Acesso: ${ultimoAcessoTexto(p.ultimoAcesso)}`].filter(Boolean).join(' · ');
  return (
    <View style={styles.card}>
      <View style={styles.topo}>
        <View style={styles.avatar}>
          <AppText style={styles.avatarTexto}>{iniciais(nome)}</AppText>
        </View>
        <View style={{ flex: 1, minWidth: 180, gap: 6 }}>
          <AppText style={styles.nome} numberOfLines={2}>{nome}</AppText>
          <View style={styles.selos}>
            {!!p.codigoParticipante && <Selo texto={p.codigoParticipante} tom="info" />}
            {seloEbia(p.ebia?.classificacao ?? p.classificacaoEbia)}
            {!!p.faseAtual && <Selo texto={`Fase: ${p.faseAtual}`} />}
          </View>
          <AppText style={styles.meta} numberOfLines={2}>{meta}</AppText>
        </View>
      </View>
      <View style={styles.medidas}>
        <Medida rotulo="Idade" valor={p.idade != null ? `${p.idade} anos` : '—'} />
        <Medida rotulo="Peso" valor={p.pesoKg != null ? `${p.pesoKg} kg` : '—'} />
        <Medida rotulo="Altura" valor={p.alturaCm != null ? `${p.alturaCm} cm` : '—'} />
        <Medida rotulo="IMC (ref.)" valor={imc != null ? String(imc) : '—'} />
      </View>
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  card: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: 2, borderColor: t.cardBorda, padding: 16, gap: 16 } as const,
  topo: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 } as const,
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: t.destaqueSuave, alignItems: 'center', justifyContent: 'center' } as const,
  avatarTexto: { fontFamily: typography.bold, fontSize: 20, color: t.destaque } as const,
  nome: { fontFamily: typography.bold, fontSize: 18, color: t.texto } as const,
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 } as const,
  meta: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave } as const,
  medidas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } as const,
  medida: { flexGrow: 1, flexBasis: 110, backgroundColor: t.superficieSuave, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, gap: 2 } as const,
  medidaValor: { fontFamily: typography.bold, fontSize: 16, color: t.texto } as const,
  medidaRotulo: { fontFamily: typography.regular, fontSize: 11, color: t.textoSuave } as const,
});
