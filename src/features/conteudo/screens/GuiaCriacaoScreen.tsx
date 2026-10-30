// src/features/conteudo/screens/GuiaCriacaoScreen.tsx
// Tela "Como criar" do painel: o passo a passo visual para montar uma trilha, para rever quando quiser.
import React, { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import type { ConfigPainel } from '../../../shared/painel/types';
import GuiaCriacao from '../components/GuiaCriacao';
import { passoValido } from '../utils/guiaCriacao';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos } from '../../../shared/painel/tema/TemaPainelContext';

type Props = { config: ConfigPainel; route: { params?: { passo?: number } } };

export default function GuiaCriacaoScreen({ config, route }: Props) {
  const navigation = useNavigation<any>();
  const rotaTrilhas = config.itens.find((i) => i.label === 'Trilhas')?.rota;

  const acoes = useMemo(
    () => ({
      trilha: { rotulo: 'CRIAR UMA TRILHA AGORA', onPress: () => navigation.navigate('EditarTrilha') },
      ...(rotaTrilhas ? { enviar: { rotulo: 'ABRIR MINHAS TRILHAS', onPress: () => navigation.navigate(rotaTrilhas) } } : {}),
    }),
    [navigation, rotaTrilhas]
  );

  return (
    <PainelLayout config={config} titulo="Como criar" subtitulo="Passo a passo visual: da trilha à publicação">
      <GuiaCriacao passoInicial={passoValido(route.params?.passo)} acoes={acoes} />
    </PainelLayout>
  );
}
