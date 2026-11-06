// src/shared/ui/ErrorBoundary.tsx
//
// Rede de segurança global: se uma tela lançar erro durante a renderização,
// o app mostra esta tela de recuperação em vez de fechar ou ficar em branco.
// Usa só componentes básicos do React Native (sem fontes customizadas nem
// contexts) de propósito: o fallback precisa funcionar mesmo quando o
// problema está justamente numa dessas peças.
//
// Limite conhecido: Error Boundary só pega erros de renderização/ciclo de vida.
// Erros em handlers (onPress), timers e promises continuam precisando de
// try/catch no próprio código.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = { children: React.ReactNode };
type State = { erro: Error | null; tentativa: number };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { erro: null, tentativa: 0 };

  static getDerivedStateFromError(erro: Error): Partial<State> {
    return { erro };
  }

  componentDidCatch(erro: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary capturou um erro de renderização:', erro, info.componentStack);
  }

  // Remonta toda a árvore (key nova) para descartar qualquer estado quebrado.
  private tentarNovamente = () => {
    this.setState((s) => ({ erro: null, tentativa: s.tentativa + 1 }));
  };

  render() {
    if (this.state.erro) {
      return (
        <View style={styles.tela}>
          <Text style={styles.titulo}>Ops, algo deu errado</Text>
          <Text style={styles.texto}>
            Não foi culpa sua. Seus registros já salvos continuam seguros. Toque abaixo para tentar de novo.
          </Text>
          <Pressable
            onPress={this.tentarNovamente}
            accessibilityRole="button"
            accessibilityLabel="Tentar de novo"
            style={styles.botao}
          >
            <Text style={styles.botaoTexto}>TENTAR DE NOVO</Text>
          </Pressable>
        </View>
      );
    }

    return <React.Fragment key={this.state.tentativa}>{this.props.children}</React.Fragment>;
  }
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: colors.white,
  },
  titulo: { fontSize: 22, fontWeight: '700', color: colors.primaryDark, marginBottom: 12, textAlign: 'center' },
  texto: { fontSize: 16, lineHeight: 22, color: colors.primaryDark, textAlign: 'center', marginBottom: 28 },
  botao: {
    minHeight: 48,
    paddingHorizontal: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoTexto: { color: colors.white, fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
});