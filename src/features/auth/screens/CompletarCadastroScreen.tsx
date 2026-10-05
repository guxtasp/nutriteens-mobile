// src/features/auth/screens/CompletarCadastroScreen.tsx
//
// Segunda metade do cadastro com Google: a conta já existe no Supabase Auth
// (o Google autenticou), mas ainda não existe `profiles` — e profiles exige
// data_nascimento, que o Google não entrega. Só é montada pelo
// RootNavigator quando há sessão de login social sem profile.
// Grava profiles + consentimentos exatamente como o useSignup faz no
// cadastro por e-mail (mesma etapa_onboarding: 'TRIAGEM').
import React, { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { BackButton } from '../../../shared/ui/BackButton';
import { LabeledInput } from '../../../shared/ui/LabeledInput';
import { DateInput } from '../../../shared/ui/DateInput';
import { RadioGroup } from '../../../shared/ui/RadioGroup';
import { Checkbox } from '../../../shared/ui/Checkbox';
import { MessageBanner } from '../../../shared/ui/MessageBanner';
import { useMessageBanner } from '../../../shared/hooks/useMessageBanner';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { TIPO_ESCOLA_OPTIONS } from '../constants/tipoEscolaOptions';
import { GENERO_OPTIONS } from '../constants/generoOptions';
import { toIsoDate, validateNome, validateDataNascimento } from '../utils/signupValidators';

interface Props {
  userId: string;
  nomeSugerido: string;
  onConcluido: () => Promise<void>;
  onSair: () => void;
}

export default function CompletarCadastroScreen({ userId, nomeSugerido, onConcluido, onSair }: Props) {
  const insets = useSafeAreaInsets();
  const { definirNomeCompleto } = useAuth();
  const { message, type, showMessage, clearMessage } = useMessageBanner();

  const [nome, setNome] = useState(nomeSugerido);
  const [genero, setGenero] = useState<string | null>(null);
  const [dataNascimento, setDataNascimento] = useState('');
  const [tipoEscola, setTipoEscola] = useState<string | null>(null);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConcluir() {
    if (loading) return;

    const erroNome = validateNome(nome);
    if (erroNome) return showMessage(erroNome, 'error');
    const erroData = validateDataNascimento(dataNascimento);
    if (erroData) return showMessage(erroData, 'error');
    if (!tipoEscola) return showMessage('Selecione o tipo de escola', 'error');
    if (!genero) return showMessage('Selecione o gênero', 'error');
    if (!aceitouTermos) return showMessage('Você precisa aceitar os termos de uso para continuar', 'error');

    setLoading(true);
    try {
      const { error: erroPerfil } = await supabase.from('profiles').insert({
        id: userId,
        nome: nome.trim(),
        data_nascimento: toIsoDate(dataNascimento),
        tipo_instituicao: tipoEscola,
        genero,
        etapa_onboarding: 'TRIAGEM',
      });
      // 23505 = o profile já foi criado numa tentativa anterior (ex.: o
      // consentimento falhou depois). Segue pro consentimento em vez de travar.
      if (erroPerfil && erroPerfil.code !== '23505') {
        console.error('Erro ao salvar perfil (Google):', erroPerfil);
        showMessage('Não conseguimos salvar seu perfil. Tente de novo.', 'error');
        return;
      }

      const { count } = await supabase
        .from('consentimentos')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (!count) {
        const { error: erroConsent } = await supabase.from('consentimentos').insert({
          user_id: userId,
          aceite_termos: true,
          versao_termo: '1.0',
          conteudo: 'Termos de uso e política de privacidade versão 1.0',
        });
        if (erroConsent) {
          console.error('Erro ao salvar consentimento (Google):', erroConsent);
          showMessage('Perfil salvo, mas não registramos o aceite dos termos. Toque de novo para tentar.', 'error');
          return;
        }
      }

      definirNomeCompleto(nome.trim());
      await onConcluido(); // RootNavigator recarrega o profile e troca de stack
    } catch (e) {
      console.error('Erro inesperado ao completar cadastro:', e);
      showMessage('Algo deu errado. Tente de novo.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <MessageBanner
        message={message}
        type={type}
        onClose={clearMessage}
        style={[styles.topBanner, { top: insets.top + 12 }]}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <BackButton onPress={onSair} style={styles.BackButton} />

        <AppText style={styles.title}>Quase lá! Só faltam alguns dados =)</AppText>
        <AppText style={styles.subtitle}>
          Sua conta Google foi confirmada. Complete o cadastro para começar a sua jornada.
        </AppText>

        <LabeledInput
          label="Nome completo"
          placeholder="Digite o seu nome completo"
          value={nome}
          onChangeText={setNome}
        />
        <RadioGroup label="Qual é o seu gênero?" options={GENERO_OPTIONS} value={genero} onChange={setGenero} />
        <DateInput label="Data de nascimento" value={dataNascimento} onChangeText={setDataNascimento} />
        <RadioGroup
          label="Em que tipo de escola você estuda?"
          options={TIPO_ESCOLA_OPTIONS}
          value={tipoEscola}
          onChange={setTipoEscola}
        />

        <Checkbox
          checked={aceitouTermos}
          onChange={setAceitouTermos}
          label={
            <AppText style={styles.termsText}>
              Li e aceito os <AppText style={styles.link}>Termos de Uso</AppText> e a{' '}
              <AppText style={styles.link}>Política de Privacidade</AppText>
            </AppText>
          }
        />

        <AppButton
          label={loading ? 'SALVANDO...' : 'CONCLUIR CADASTRO'}
          backgroundColor={colors.primaryDark}
          textColor={colors.white}
          shadowColor="#123024"
          fullWidth
          onPress={handleConcluir}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, marginBottom: 70 },
  container: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  topBanner: { position: 'absolute', width: '90%', alignSelf: 'center', zIndex: 20 },
  BackButton: { marginBottom: 32 },
  title: { fontFamily: typography.bold, fontSize: 24, color: colors.primaryDark, lineHeight: 32, marginBottom: 8 },
  subtitle: { fontFamily: typography.regular, fontSize: 16, color: colors.primaryDark, marginBottom: 24 },
  link: { fontFamily: typography.bold, textDecorationLine: 'underline' },
  termsText: { fontFamily: typography.regular, fontSize: 13, color: colors.primaryDark, lineHeight: 18 },
});
