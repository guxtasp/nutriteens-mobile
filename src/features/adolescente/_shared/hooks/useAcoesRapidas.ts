// Navegação do menu de ações rápidas (+): alimentação, água ou atividade.
// Antes cada tela repetia este mesmo handler; aqui fica em um lugar só.
import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';

export type AcaoRapida = 'alimentacao' | 'agua' | 'atividade';

export function useAcoesRapidas() {
  const navigation = useNavigation<NativeStackNavigationProp<AdolescenteStackParamList>>();
  return useCallback((opcao: AcaoRapida) => {
    if (opcao === 'atividade') navigation.navigate('AtividadeFisica');
    else if (opcao === 'agua') navigation.navigate('ConsumoAgua');
    else navigation.navigate('TipoRefeicao');
  }, [navigation]);
}
