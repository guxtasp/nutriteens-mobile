// src/features/adolescente/home/components/ChipSemInternet.tsx
//
// Pílula "Sem internet" no mesmo estilo do XP e da sequência (borda colorida, cantos
// arredondados). Só aparece quando o app está sem conexão; ao tocar, explica o que
// isso muda — assim o adolescente entende por que está mais lento.
import React from 'react';
import { Alert, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConexao } from '../../../../shared/offline/useConexao';
import EstatisticaPill from './EstatisticaPill';

const COR_SEM_INTERNET = '#64748B';

export default function ChipSemInternet() {
  const online = useConexao();
  if (online) return null;

  return (
    <Pressable
      onPress={() =>
        Alert.alert(
          'Você está sem internet',
          'Sem problema! Você pode continuar usando o app: o que você registrar (água, comida e atividade) fica guardado no celular e é enviado sozinho quando a internet voltar.\n\nAlgumas telas mostram só o que já estava salvo, e o app pode ficar mais devagar até a conexão voltar.'
        )
      }
      accessibilityRole="button"
      accessibilityLabel="Sem internet. Toque para entender o que muda."
    >
      <EstatisticaPill
        icone={<Ionicons name="cloud-offline-outline" size={18} color={COR_SEM_INTERNET} />}
        valor="Sem internet"
        cor={COR_SEM_INTERNET}
      />
    </Pressable>
  );
}

