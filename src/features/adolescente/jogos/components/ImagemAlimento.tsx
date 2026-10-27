// Mostra a imagem enviada pelo painel; sem imagem (ou se falhar o carregamento), cai no ícone.
import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
type ItemVisual = { nome: string; icone: string; cor: string };

type Props = { alimento: ItemVisual; url?: string; tamanho?: number };

export default function ImagemAlimento({ alimento, url, tamanho = 96 }: Props) {
  const [falhou, setFalhou] = useState(false);
  const usarImagem = !!url && !falhou;
  return (
    <View style={[styles.caixa, { width: tamanho, height: tamanho, borderRadius: tamanho / 4, backgroundColor: alimento.cor + '22' }]}>
      {usarImagem ? (
        <Image source={{ uri: url }} style={{ width: tamanho, height: tamanho, borderRadius: tamanho / 4 }} resizeMode="cover" onError={() => setFalhou(true)} accessibilityLabel={alimento.nome} />
      ) : (
        <MaterialCommunityIcons name={alimento.icone as any} size={tamanho * 0.58} color={alimento.cor} accessibilityLabel={alimento.nome} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ caixa: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', alignSelf: 'center' } });
