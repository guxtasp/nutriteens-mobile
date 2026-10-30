// src/features/conteudo/components/CampoImagem.tsx
// Campo de foto: escolher da galeria/computador (envia para o Storage) ou colar um link.
import React, { useState } from 'react';
import { Image, Pressable, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { typography } from '../../../shared/theme/typography';
import { enviarFotoReceita } from '../services/imagemReceitaService';
import { urlValida } from '../utils/receitaEdicao';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';

type Props = {
  rotulo: string;
  valor: string;
  onChange: (url: string) => void;
  /** proporção da foto na escolha/recorte */
  proporcao?: [number, number];
  /** miniatura menor (fotos dos passos) */
  compacto?: boolean;
};

export function CampoImagem({ rotulo, valor, onChange, proporcao = [4, 3], compacto }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarLink, setMostrarLink] = useState(false);
  const tem = urlValida(valor);

  async function escolher() {
    setErro(null);
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: proporcao, quality: 0.7 });
      if (r.canceled || !r.assets?.[0]) return;
      const a = r.assets[0];
      setEnviando(true);
      onChange(await enviarFotoReceita(a.uri, a.mimeType ?? 'image/jpeg'));
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível enviar a foto.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={styles.raiz}>
      <AppText style={styles.rotulo}>{rotulo}</AppText>
      <View style={styles.linha}>
        <View style={[styles.miniatura, compacto && styles.miniaturaCompacta, { aspectRatio: proporcao[0] / proporcao[1] }]}>
          {tem ? <Image source={{ uri: valor.trim() }} style={styles.imagem} resizeMode="cover" accessibilityLabel="Prévia da foto" /> : <AppText style={styles.semFoto}>Sem foto</AppText>}
        </View>
        <View style={styles.botoes}>
          <AppButton label={enviando ? 'ENVIANDO…' : tem ? 'TROCAR FOTO' : 'ENVIAR FOTO'} fullWidth={false} size="compact" backgroundColor={tema.botaoFundo} textColor={tema.botaoTexto} shadowColor={tema.botaoSombra} disabled={enviando} style={styles.botao} onPress={escolher} />
          {!!valor && (
            <AppButton label="REMOVER" fullWidth={false} size="compact" outlineColor={tema.erro} textColor={tema.erro} disabled={enviando} style={styles.botao} onPress={() => { setErro(null); onChange(''); }} />
          )}
          <Pressable onPress={() => setMostrarLink((m) => !m)} accessibilityRole="button" hitSlop={6}>
            <AppText style={styles.link}>{mostrarLink ? 'Esconder link' : 'Usar um link'}</AppText>
          </Pressable>
        </View>
      </View>
      {mostrarLink && (
        <TextInput value={valor} onChangeText={onChange} placeholder="https://..." placeholderTextColor={tema.placeholder} autoCapitalize="none" keyboardType="url" style={styles.input} accessibilityLabel={`${rotulo} (link)`} />
      )}
      {!!valor && !tem && <AppText style={styles.erro}>O link precisa começar com http:// ou https://.</AppText>}
      {!!erro && <AppText style={styles.erro}>{erro}</AppText>}
      <AppText style={styles.ajuda}>JPG, PNG ou WebP, até 3 MB.</AppText>
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  raiz: { gap: 8 },
  rotulo: { fontFamily: typography.semiBold, fontSize: 13, color: t.texto },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  miniatura: { width: 160, borderRadius: 12, overflow: 'hidden', backgroundColor: t.superficieSuave, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: t.cardBorda },
  miniaturaCompacta: { width: 110 },
  imagem: { width: '100%', height: '100%' },
  semFoto: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave },
  botoes: { gap: 8, alignItems: 'flex-start' },
  botao: { paddingHorizontal: 14, minHeight: 40 },
  link: { fontFamily: typography.bold, fontSize: 12, color: t.texto },
  input: { borderWidth: 2, borderColor: t.cardBorda, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: typography.regular, fontSize: 14, color: t.texto },
  erro: { fontFamily: typography.regular, fontSize: 12, color: t.erro },
  ajuda: { fontFamily: typography.regular, fontSize: 11, color: t.textoSuave },
}) as const;
