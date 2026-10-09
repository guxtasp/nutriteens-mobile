// src/shared/painel/components/LimiteErro.tsx
// Rede de segurança das telas do painel: se algo estourar na renderização, só o
// conteúdo da tela cai (o menu continua) e a mensagem real do erro aparece, em vez
// da tela inteira ficar branca.
import React from 'react';
import { EstadoErro } from './EstadosPainel';

type Props = {
  chaveReset?: string;
  /** UI exibida quando algo estoura (ex.: com o menu do painel); padrão: mensagem simples */
  fallback?: (erro: Error, tentarDeNovo: () => void) => React.ReactNode;
  children: React.ReactNode;
};
type Estado = { erro: Error | null; chave?: string };

export class LimiteErro extends React.Component<Props, Estado> {
  state: Estado = { erro: null, chave: this.props.chaveReset };

  static getDerivedStateFromError(erro: Error): Partial<Estado> {
    return { erro };
  }

  static getDerivedStateFromProps(props: Props, state: Estado): Partial<Estado> | null {
    // trocou de tela/conteúdo: tenta renderizar de novo
    if (props.chaveReset !== state.chave) return { erro: null, chave: props.chaveReset };
    return null;
  }

  componentDidCatch(erro: Error, info: React.ErrorInfo) {
    console.error('Erro ao renderizar tela do painel:', erro, info.componentStack);
  }

  render() {
    if (this.state.erro) {
      const tentar = () => this.setState({ erro: null });
      if (this.props.fallback) return this.props.fallback(this.state.erro, tentar);
      return (
        <EstadoErro
          mensagem={`Esta tela encontrou um problema: ${this.state.erro.message || 'erro desconhecido'}`}
          onTentar={() => this.setState({ erro: null })}
        />
      );
    }
    return this.props.children;
  }
}
