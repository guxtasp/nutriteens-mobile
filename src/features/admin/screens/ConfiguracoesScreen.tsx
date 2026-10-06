// src/features/admin/screens/ConfiguracoesScreen.tsx
// Preferências do painel que existem de verdade hoje: conta atual, reexibir as dicas
// ("i" e cartões de introdução) e sair.
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { LinhaInfo } from '../../../shared/painel/components/ControlesLista';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { painel } from '../../../shared/painel/painelTheme';
import { supabase } from '../../../lib/supabase';
import { ADMIN_PAINEL } from '../navigation/adminMenu';

const PREFIXO_INTRO = 'painel_intro_v1_';

export default function ConfiguracoesScreen() {
  const { session, signOut } = useAuth();
  const [nome, setNome] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user.id) return;
    supabase.from('profiles').select('nome').eq('id', session.user.id).single().then(({ data }) => setNome(data?.nome ?? null));
  }, [session?.user.id]);

  async function reexibirDicas() {
    try {
      const chaves = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIXO_INTRO));
      if (chaves.length > 0) await AsyncStorage.multiRemove(chaves);
      setAviso('Pronto: os cartões de introdução vão aparecer de novo ao abrir cada área.');
    } catch {
      setAviso('Não foi possível redefinir as dicas neste aparelho.');
    }
  }

  return (
    <PainelLayout config={ADMIN_PAINEL} titulo="Configurações" subtitulo="Sua conta e preferências do painel">
      <CartaoSecao titulo="Conta" ajuda="Dados da conta que está usando o painel agora.">
        <LinhaInfo rotulo="Nome" valor={nome} />
        <LinhaInfo rotulo="E-mail" valor={session?.user.email} />
        <LinhaInfo rotulo="Papel" valor="Administrador" />
      </CartaoSecao>

      <CartaoSecao titulo="Dicas do painel" ajuda={'Os cartões verdes de introdução somem depois de "Entendi". Aqui você pode trazê-los de volta.'}>
        <AppText style={styles.texto}>Mostrar novamente os cartões de introdução de cada área.</AppText>
        <View style={styles.linha}>
          <AppButton
            label="MOSTRAR DICAS DE NOVO"
            fullWidth={false}
            size="compact"
            outlineColor={colors.primaryDark}
            textColor={colors.primaryDark}
            style={styles.botao}
            onPress={reexibirDicas}
          />
        </View>
        {!!aviso && <AppText style={styles.aviso}>{aviso}</AppText>}
      </CartaoSecao>

      <CartaoSecao titulo="Sessão">
        <View style={styles.linha}>
          <AppButton
            label="SAIR DA CONTA"
            fullWidth={false}
            size="compact"
            backgroundColor={colors.primaryDark}
            textColor={colors.white}
            shadowColor="#123024"
            style={styles.botao}
            onPress={() => signOut().catch((e) => console.error('Erro ao sair:', e))}
          />
        </View>
      </CartaoSecao>
    </PainelLayout>
  );
}

const styles = StyleSheet.create({
  texto: { fontFamily: typography.regular, fontSize: 13, color: painel.textoSuave },
  linha: { flexDirection: 'row' },
  botao: { paddingHorizontal: 18, minHeight: 44 },
  aviso: { fontFamily: typography.semiBold, fontSize: 13, color: '#2F6B12' },
});
