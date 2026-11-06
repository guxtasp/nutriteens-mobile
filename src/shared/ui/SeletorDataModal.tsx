// src/shared/ui/SeletorDataModal.tsx
//
// Calendário em janela (sem biblioteca nativa, funciona em Expo Go, builds e web).
// Fluxo pensado para data de nascimento: toque no "mês ano" do topo para trocar
// o ano (lista) e o mês (grade); depois toque no dia. Datas futuras ficam desativadas.
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const ANOS_PARA_TRAS = 100;
const COLUNAS_ANO = 4;
const ALTURA_LINHA_ANO = 52;

type Visao = 'dia' | 'mes' | 'ano';

/** Células do mês: null = espaço vazio antes do dia 1. */
export function celulasDoMes(ano: number, mes: number): (number | null)[] {
  const primeiro = new Date(ano, mes, 1).getDay();
  const total = new Date(ano, mes + 1, 0).getDate();
  return [...Array(primeiro).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
}

/** "DD/MM/AAAA" -> {dia, mes(0-11), ano} ou null se incompleta/inválida. */
export function lerData(texto: string): { dia: number; mes: number; ano: number } | null {
  const m = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const dia = +m[1];
  const mes = +m[2] - 1;
  const ano = +m[3];
  const d = new Date(ano, mes, dia);
  if (d.getFullYear() !== ano || d.getMonth() !== mes || d.getDate() !== dia) return null;
  return { dia, mes, ano };
}

type Props = {
  visivel: boolean;
  /** valor atual no formato DD/MM/AAAA (pode estar incompleto) */
  valor: string;
  onFechar: () => void;
  onEscolher: (formatado: string) => void;
};

export function SeletorDataModal({ visivel, valor, onFechar, onEscolher }: Props) {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const atual = lerData(valor);

  const [visao, setVisao] = useState<Visao>('dia');
  const [ano, setAno] = useState(atual?.ano ?? anoAtual - 14); // adolescentes: começa por volta dos 14 anos
  const [mes, setMes] = useState(atual?.mes ?? 0);

  // ao abrir, sincroniza com o que já foi digitado
  useEffect(() => {
    if (!visivel) return;
    const d = lerData(valor);
    setAno(d?.ano ?? anoAtual - 14);
    setMes(d?.mes ?? 0);
    setVisao(d ? 'dia' : 'ano'); // sem data ainda: começa escolhendo o ano
  }, [visivel]); // eslint-disable-line react-hooks/exhaustive-deps

  const anos = useMemo(() => Array.from({ length: ANOS_PARA_TRAS + 1 }, (_, i) => anoAtual - i), [anoAtual]);
  const celulas = useMemo(() => celulasDoMes(ano, mes), [ano, mes]);

  const mesFuturo = (a: number, m: number) => a > anoAtual || (a === anoAtual && m > hoje.getMonth());
  const diaFuturo = (d: number) => new Date(ano, mes, d) > hoje;

  function mudarMes(delta: number) {
    let m = mes + delta;
    let a = ano;
    if (m < 0) { m = 11; a -= 1; }
    if (m > 11) { m = 0; a += 1; }
    if (mesFuturo(a, m) || a < anoAtual - ANOS_PARA_TRAS) return;
    setMes(m);
    setAno(a);
  }

  function escolherDia(d: number) {
    const dd = String(d).padStart(2, '0');
    const mm = String(mes + 1).padStart(2, '0');
    onEscolher(`${dd}/${mm}/${ano}`);
    onFechar();
  }

  const indiceAno = Math.max(0, anos.indexOf(ano));
  const linhaInicial = Math.max(0, Math.floor(indiceAno / COLUNAS_ANO) - 1);

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={onFechar}>
      <Pressable style={styles.fundo} onPress={onFechar} accessibilityLabel="Fechar calendário">
        <Pressable style={styles.cartao} onPress={() => {}}>
          <View style={styles.topo}>
            {visao === 'dia' ? (
              <Pressable onPress={() => mudarMes(-1)} hitSlop={10} style={styles.seta} accessibilityRole="button" accessibilityLabel="Mês anterior">
                <Ionicons name="chevron-back" size={22} color={colors.primaryDark} />
              </Pressable>
            ) : <View style={styles.seta} />}

            <Pressable
              onPress={() => setVisao(visao === 'dia' ? 'mes' : visao === 'mes' ? 'ano' : 'dia')}
              style={styles.titulo}
              accessibilityRole="button"
              accessibilityLabel={visao === 'ano' ? 'Escolher ano' : `${MESES[mes]} de ${ano}. Toque para mudar mês e ano`}
            >
              <AppText style={styles.tituloTexto}>
                {visao === 'ano' ? 'Escolha o ano' : visao === 'mes' ? `Escolha o mês · ${ano}` : `${MESES[mes]} ${ano}`}
              </AppText>
              <Ionicons name={visao === 'dia' ? 'chevron-down' : 'chevron-up'} size={16} color={colors.primaryDark} />
            </Pressable>

            {visao === 'dia' ? (
              <Pressable
                onPress={() => mudarMes(1)}
                hitSlop={10}
                style={[styles.seta, mesFuturo(mes === 11 ? ano + 1 : ano, (mes + 1) % 12) && styles.setaOff]}
                accessibilityRole="button"
                accessibilityLabel="Próximo mês"
              >
                <Ionicons name="chevron-forward" size={22} color={colors.primaryDark} />
              </Pressable>
            ) : <View style={styles.seta} />}
          </View>

          {visao === 'ano' && (
            <FlatList
              data={anos}
              keyExtractor={(a) => String(a)}
              numColumns={COLUNAS_ANO}
              style={styles.listaAnos}
              initialScrollIndex={linhaInicial}
              // com numColumns, o "index" do getItemLayout é o da LINHA
              getItemLayout={(_, i) => ({ length: ALTURA_LINHA_ANO, offset: ALTURA_LINHA_ANO * i, index: i })}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { setAno(item); if (mesFuturo(item, mes)) setMes(hoje.getMonth()); setVisao('mes'); }}
                  style={[styles.celulaGrade, item === ano && styles.celulaAtiva]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: item === ano }}
                >
                  <AppText style={[styles.celulaTexto, item === ano && styles.celulaTextoAtivo]}>{item}</AppText>
                </Pressable>
              )}
            />
          )}

          {visao === 'mes' && (
            <View style={styles.gradeMeses}>
              {MESES_CURTOS.map((nome, i) => {
                const off = mesFuturo(ano, i);
                return (
                  <Pressable
                    key={nome}
                    disabled={off}
                    onPress={() => { setMes(i); setVisao('dia'); }}
                    style={[styles.celulaMes, i === mes && styles.celulaAtiva, off && styles.celulaOff]}
                    accessibilityRole="button"
                    accessibilityLabel={MESES[i]}
                    accessibilityState={{ selected: i === mes, disabled: off }}
                  >
                    <AppText style={[styles.celulaTexto, i === mes && styles.celulaTextoAtivo]}>{nome}</AppText>
                  </Pressable>
                );
              })}
            </View>
          )}

          {visao === 'dia' && (
            <>
              <View style={styles.linhaSemana}>
                {SEMANA.map((s, i) => (
                  <AppText key={i} style={styles.semana}>{s}</AppText>
                ))}
              </View>
              <View style={styles.gradeDias}>
                {celulas.map((d, i) =>
                  d === null ? (
                    <View key={`v${i}`} style={styles.celulaDia} />
                  ) : (
                    <Pressable
                      key={d}
                      disabled={diaFuturo(d)}
                      onPress={() => escolherDia(d)}
                      style={[styles.celulaDia, atual && atual.dia === d && atual.mes === mes && atual.ano === ano && styles.diaAtivo]}
                      accessibilityRole="button"
                      accessibilityLabel={`${d} de ${MESES[mes]} de ${ano}`}
                      accessibilityState={{ disabled: diaFuturo(d) }}
                    >
                      <AppText
                        style={[
                          styles.diaTexto,
                          diaFuturo(d) && styles.diaOff,
                          atual && atual.dia === d && atual.mes === mes && atual.ano === ano && styles.diaTextoAtivo,
                        ]}
                      >
                        {d}
                      </AppText>
                    </Pressable>
                  )
                )}
              </View>
            </>
          )}

          <Pressable onPress={onFechar} style={styles.cancelar} accessibilityRole="button">
            <AppText style={styles.cancelarTexto}>Cancelar</AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const LADO_DIA = '14.2857%';

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  cartao: { backgroundColor: colors.white ?? '#fff', borderRadius: 20, padding: 16, maxWidth: 420, width: '100%', alignSelf: 'center' },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  seta: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  setaOff: { opacity: 0.3 },
  titulo: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44 },
  tituloTexto: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark, textTransform: 'capitalize' },
  linhaSemana: { flexDirection: 'row', marginBottom: 4 },
  semana: { width: LADO_DIA, textAlign: 'center', fontFamily: typography.semiBold, fontSize: 12, color: '#7A8B94' },
  gradeDias: { flexDirection: 'row', flexWrap: 'wrap' },
  celulaDia: { width: LADO_DIA, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  diaTexto: { fontFamily: typography.regular, fontSize: 15, color: colors.primaryDark },
  diaOff: { color: '#C5CED3' },
  diaAtivo: { backgroundColor: colors.primaryDark },
  diaTextoAtivo: { color: '#fff', fontFamily: typography.bold },
  listaAnos: { height: ALTURA_LINHA_ANO * 5 },
  celulaGrade: { flex: 1 / COLUNAS_ANO, height: ALTURA_LINHA_ANO - 8, margin: 4, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D9E2E8' },
  gradeMeses: { flexDirection: 'row', flexWrap: 'wrap' },
  celulaMes: { width: '33.333%', height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  celulaAtiva: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  celulaOff: { opacity: 0.3 },
  celulaTexto: { fontFamily: typography.semiBold, fontSize: 15, color: colors.primaryDark, textTransform: 'capitalize' },
  celulaTextoAtivo: { color: '#fff' },
  cancelar: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 24, marginTop: 4 },
  cancelarTexto: { fontFamily: typography.semiBold, fontSize: 14, color: colors.primaryDark },
});
