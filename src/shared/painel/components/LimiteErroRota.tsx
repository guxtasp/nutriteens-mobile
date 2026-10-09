// src/shared/painel/components/LimiteErroRota.tsx
//
// Rede de segurança no nível da ROTA (navigator.screenLayout). O LimiteErro de
// dentro do PainelLayout só protege o conteúdo; se a tela estourar ANTES de
// renderizar o layout (hook, params ausentes, import quebrado), a tela inteira
// ficava branca. Aqui qualquer erro vira: menu + mensagem real do erro.
import React from 'react';
import { PainelLayout } from '../PainelLayout';
import type { ConfigPainel } from '../types';
import { EstadoErro } from './EstadosPainel';
import { LimiteErro } from './LimiteErro';

export function criarScreenLayout(config: ConfigPainel) {
  return function ScreenLayoutPainel({ children, route }: { children: React.ReactElement; route: { key: string } }) {
    return (
      <LimiteErro
        chaveReset={route.key}
        fallback={(erro, tentar) => (
          <PainelLayout config={config} titulo="Algo deu errado">
            <EstadoErro mensagem={`Esta tela encontrou um problema: ${erro.message || 'erro desconhecido'}`} onTentar={tentar} />
          </PainelLayout>
        )}
      >
        {children}
      </LimiteErro>
    );
  };
}
