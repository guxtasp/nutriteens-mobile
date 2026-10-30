// src/shared/painel/components/FormulariosDesafio.tsx
// Formulários visuais do painel: criar/editar desafio semanal ou mensal, e
// criar/editar conquista ou marco. Sem código: é só preencher e salvar.
import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { AppButton } from '../../ui/AppButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { ChipsFiltro } from './ControlesLista';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';
import {
  CRITERIO_LABEL, ICONES_CONQUISTA, METRICA_LABEL, NUTRIENTES_DESAFIO,
  DesafioPeriodico, InsigniaPainel, salvarDesafioPeriodico, salvarInsignia,
} from '../../../features/nutricionista/services/desafiosService';

function Campo({ rotulo, dica, children }: { rotulo: string; dica?: string; children: React.ReactNode }) {
  const s = useEstilos(criarEstilos);
  return (
    <View style={{ gap: 6 }}>
      <AppText style={s.rotulo}>{rotulo}</AppText>
      {!!dica && <AppText style={s.dica}>{dica}</AppText>}
      {children}
    </View>
  );
}

function Rodape({ salvando, erro, onSalvar, onCancelar, rotulo }: { salvando: boolean; erro: string | null; onSalvar: () => void; onCancelar: () => void; rotulo: string }) {
  const s = useEstilos(criarEstilos);
  const { tema } = useTemaPainel();
  return (
    <View style={{ gap: 8 }}>
      {!!erro && <AppText style={s.erro}>{erro}</AppText>}
      <View style={s.botoes}>
        <AppButton label={salvando ? 'SALVANDO...' : rotulo} fullWidth={false} size="compact" disabled={salvando} onPress={onSalvar} style={{ paddingHorizontal: 18, minHeight: 44 }} />
        <AppButton label="CANCELAR" fullWidth={false} size="compact" outlineColor={tema.texto} textColor={tema.texto} onPress={onCancelar} style={{ paddingHorizontal: 18, minHeight: 44 }} />
      </View>
    </View>
  );
}

const METRICAS = Object.keys(METRICA_LABEL).map((k) => ({ chave: k, label: METRICA_LABEL[k] }));

export function FormDesafioPeriodico({ inicial, onSalvo, onCancelar }: { inicial?: DesafioPeriodico | null; onSalvo: () => void; onCancelar: () => void }) {
  const s = useEstilos(criarEstilos);
  const [periodo, setPeriodo] = useState<'SEMANAL' | 'MENSAL'>(inicial?.periodo ?? 'SEMANAL');
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '');
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '');
  const [icone, setIcone] = useState(inicial?.icone ?? '🎯');
  const [metrica, setMetrica] = useState(inicial?.metrica ?? 'DIAS_COM_REGISTRO');
  const [alvo, setAlvo] = useState(String(inicial?.alvo ?? 5));
  const [pontos, setPontos] = useState(String(inicial?.pontos ?? 30));
  const [nutriente, setNutriente] = useState(inicial?.nutriente ?? 'proteina');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const limite = periodo === 'SEMANAL' ? 7 : 31;
  async function salvar() {
    const alvoN = parseInt(alvo, 10);
    const pontosN = parseInt(pontos, 10);
    if (!titulo.trim() || !descricao.trim()) return setErro('Preencha o título e a descrição.');
    if (!(alvoN >= 1)) return setErro('A meta precisa ser 1 ou mais.');
    if (METRICA_DIAS.has(metrica) && alvoN > limite) return setErro(`Em um período ${periodo === 'SEMANAL' ? 'semanal' : 'mensal'} a meta de dias não pode passar de ${limite}.`);
    if (!(pontosN >= 0 && pontosN <= 1000)) return setErro('Pontos entre 0 e 1000.');
    setSalvando(true);
    setErro(null);
    try {
      await salvarDesafioPeriodico({
        codigo: inicial?.ref ?? null, periodo, titulo, descricao, icone, metrica, alvo: alvoN, pontos: pontosN,
        nutriente: metrica === 'DIAS_FONTE_NUTRIENTE' ? nutriente : null,
      });
      onSalvo();
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={s.form}>
      <AppText style={s.tituloForm}>{inicial ? 'Editar desafio' : 'Novo desafio semanal ou mensal'}</AppText>
      <Campo rotulo="Período">
        <ChipsFiltro opcoes={[{ chave: 'SEMANAL', label: 'Semanal' }, { chave: 'MENSAL', label: 'Mensal' }]} valor={periodo} onChange={(c) => setPeriodo(c as any)} />
      </Campo>
      <Campo rotulo="Título"><TextInput style={s.input} value={titulo} onChangeText={setTitulo} placeholder="Ex.: Semana hidratada" maxLength={60} /></Campo>
      <Campo rotulo="Descrição (o que o adolescente vê)"><TextInput style={[s.input, { minHeight: 64 }]} value={descricao} onChangeText={setDescricao} placeholder="Ex.: Bata sua meta de água em 5 dias da semana." multiline maxLength={160} /></Campo>
      <Campo rotulo="Emoji"><TextInput style={[s.input, { width: 90, textAlign: 'center', fontSize: 20 }]} value={icone} onChangeText={setIcone} maxLength={4} /></Campo>
      <Campo rotulo="O que o adolescente precisa fazer" dica="O app já sabe medir estas ações automaticamente.">
        <ChipsFiltro opcoes={METRICAS} valor={metrica} onChange={setMetrica} />
      </Campo>
      {metrica === 'DIAS_FONTE_NUTRIENTE' && (
        <Campo rotulo="Nutriente"><ChipsFiltro opcoes={NUTRIENTES_DESAFIO} valor={nutriente} onChange={setNutriente} /></Campo>
      )}
      <View style={s.linha}>
        <View style={{ flex: 1 }}><Campo rotulo="Meta (quantas vezes)"><TextInput style={s.input} value={alvo} onChangeText={(t) => setAlvo(t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={4} /></Campo></View>
        <View style={{ flex: 1 }}><Campo rotulo="Pontos de recompensa"><TextInput style={s.input} value={pontos} onChangeText={(t) => setPontos(t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={4} /></Campo></View>
      </View>
      <Rodape salvando={salvando} erro={erro} onSalvar={salvar} onCancelar={onCancelar} rotulo={inicial ? 'SALVAR' : 'CRIAR DESAFIO'} />
    </View>
  );
}
const METRICA_DIAS = new Set(['DIAS_AGUA_META', 'DIAS_ATIVIDADE_META', 'DIAS_COM_REGISTRO', 'DIAS_FONTE_NUTRIENTE', 'MISSOES_DIARIAS']);

const CRITERIOS = Object.keys(CRITERIO_LABEL).map((k) => ({ chave: k, label: CRITERIO_LABEL[k] }));

export function FormConquista({ inicial, onSalvo, onCancelar }: { inicial?: InsigniaPainel | null; onSalvo: () => void; onCancelar: () => void }) {
  const s = useEstilos(criarEstilos);
  const { tema } = useTemaPainel();
  const ehInsignia = inicial?.categoria === 'insignia';
  const [categoria, setCategoria] = useState<'conquista' | 'marco'>(inicial?.categoria === 'marco' ? 'marco' : 'conquista');
  const [nome, setNome] = useState(inicial?.nome ?? '');
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '');
  const [icone, setIcone] = useState(inicial?.icone ?? 'ribbon');
  const [tipo, setTipo] = useState(inicial?.tipo ?? 'licoes');
  const [min, setMin] = useState(String(inicial?.min ?? 5));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    const minN = parseInt(min, 10);
    if (!nome.trim()) return setErro('Informe o nome.');
    if (!(minN >= 1)) return setErro('A meta precisa ser 1 ou mais.');
    setSalvando(true);
    setErro(null);
    try {
      await salvarInsignia({ id: inicial?.id ?? null, categoria: ehInsignia ? 'insignia' : categoria, nome, descricao, icone, tipo, min: minN });
      onSalvo();
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={s.form}>
      <AppText style={s.tituloForm}>{inicial ? 'Editar' : 'Nova conquista ou marco'}</AppText>
      {ehInsignia ? (
        <AppText style={s.dica}>Insígnia com arte exclusiva: aqui você ajusta nome, texto e meta. A arte é do app e não muda por aqui.</AppText>
      ) : !inicial && (
        <Campo rotulo="Tipo" dica="Conquista = ação comum. Marco = grande progresso, aparece com destaque e número.">
          <ChipsFiltro opcoes={[{ chave: 'conquista', label: 'Conquista' }, { chave: 'marco', label: 'Marco' }]} valor={categoria} onChange={(c) => setCategoria(c as any)} />
        </Campo>
      )}
      <Campo rotulo="Nome"><TextInput style={s.input} value={nome} onChangeText={setNome} placeholder="Ex.: Cozinheiro de primeira" maxLength={40} /></Campo>
      <Campo rotulo="Descrição (como ganhar)"><TextInput style={[s.input, { minHeight: 56 }]} value={descricao} onChangeText={setDescricao} placeholder="Ex.: Concluiu 5 lições." multiline maxLength={120} /></Campo>
      {!ehInsignia && (
        <Campo rotulo="Ícone">
          <View style={s.icones}>
            {ICONES_CONQUISTA.map((n) => (
              <Pressable key={n} onPress={() => setIcone(n)} accessibilityLabel={`Ícone ${n}`} style={[s.icone, icone === n && s.iconeAtivo]}>
                <Ionicons name={n as any} size={22} color={icone === n ? tema.texto : tema.textoSuave} />
              </Pressable>
            ))}
          </View>
        </Campo>
      )}
      <Campo rotulo="Quando o adolescente ganha" dica="Ganha automaticamente ao atingir a meta abaixo.">
        <ChipsFiltro opcoes={CRITERIOS} valor={tipo} onChange={setTipo} />
      </Campo>
      <Campo rotulo="Meta (quantidade)"><TextInput style={[s.input, { width: 120 }]} value={min} onChangeText={(t) => setMin(t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={5} /></Campo>
      <Rodape salvando={salvando} erro={erro} onSalvar={salvar} onCancelar={onCancelar} rotulo={inicial ? 'SALVAR' : 'CRIAR'} />
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  form: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: 2, borderColor: colors.primary, padding: 16, gap: 14 },
  tituloForm: { fontFamily: typography.bold, fontSize: 16, color: t.texto },
  rotulo: { fontFamily: typography.bold, fontSize: 12, color: t.texto },
  dica: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave, lineHeight: 17 },
  input: { borderWidth: 1.5, borderColor: t.chipBorda, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: typography.regular, fontSize: 14, color: t.texto, backgroundColor: t.superficieSuave },
  linha: { flexDirection: 'row', gap: 12 },
  botoes: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  erro: { fontFamily: typography.regular, fontSize: 12, color: t.erro },
  icones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  icone: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: t.chipBorda, alignItems: 'center', justifyContent: 'center', backgroundColor: t.card },
  iconeAtivo: { borderColor: colors.primary, backgroundColor: t.destaqueSuave },
}) as const;
