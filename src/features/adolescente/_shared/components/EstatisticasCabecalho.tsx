// src/features/adolescente/_shared/components/EstatisticasCabecalho.tsx
//
// Lado direito padrão do cabeçalho das abas: XP, sequência e sino de notificações
// (mesmas cores e ícones do HomeHeader). Busca os próprios números, então qualquer
// aba pode usar: <TabHeader titulo="..." direita={<EstatisticasCabecalho />} />
import React, { useCallback, useState } from 'react';
import { Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../../../lib/supabase';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { colors } from '../../../../shared/theme/colors';
import { formatarDataISO } from '../../../../shared/utils/data';
import EstatisticaPill from '../../home/components/EstatisticaPill';
import { SinoNotificacoes } from '../../notificacoes/components/SinoNotificacoes';

const COR_XP = colors.primary;
const COR_SEQUENCIA = '#EA580C';

export default function EstatisticasCabecalho() {
  const navigation = useNavigation<NativeStackNavigationProp<AdolescenteStackParamList>>();
  const { userId } = useAuth();
  const [xp, setXp] = useState(0);
  const [sequencia, setSequencia] = useState(0);

  // Falhar aqui não pode derrubar a tela: só mantém os últimos valores.
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let ativo = true;
      (async () => {
        try {
          const [{ data: perfil, error: e1 }, { data: xpRow, error: e2 }] = await Promise.all([
            supabase.from('profiles').select('sequencia_atual, ultimo_dia_mantido').eq('id', userId).single(),
            supabase.from('xp_usuario').select('xp_total').eq('usuario_id', userId).maybeSingle(),
          ]);
          if (e1) throw e1;
          if (e2) throw e2;
          if (!ativo) return;
          const hoje = formatarDataISO(new Date());
          const ontem = formatarDataISO(new Date(Date.now() - 86400000));
          const valida = perfil.ultimo_dia_mantido === hoje || perfil.ultimo_dia_mantido === ontem;
          setSequencia(valida ? perfil.sequencia_atual ?? 0 : 0);
          setXp(xpRow?.xp_total ?? 0);
        } catch (erro) {
          console.error('Erro ao carregar XP/sequência do cabeçalho:', erro);
        }
      })();
      return () => {
        ativo = false;
      };
    }, [userId])
  );

  return (
    <>
      <EstatisticaPill
        icone={<MaterialCommunityIcons name="gift" size={18} color={COR_XP} />}
        valor={xp}
        sufixo="XP"
        cor={COR_XP}
      />
      {sequencia > 0 && (
        <Pressable
          onPress={() => navigation.navigate('Sequencia')}
          accessibilityRole="button"
          accessibilityLabel="Ver sequência"
        >
          <EstatisticaPill
            icone={<Ionicons name="flame" size={20} color={COR_SEQUENCIA} />}
            valor={sequencia}
            cor={COR_SEQUENCIA}
          />
        </Pressable>
      )}
      <SinoNotificacoes />
    </>
  );
}
