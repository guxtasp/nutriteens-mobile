// src/shared/painel/types.ts
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type IconeNome = ComponentProps<typeof Ionicons>['name'];

export interface ItemMenu {
  rota: string;
  label: string;
  icone: IconeNome;
  /** outras rotas que mantêm este item marcado (ex.: formulário de um alimento) */
  rotasFilhas?: string[];
  /** mostra um contador ao lado do item (ex.: pedidos pendentes do scanner) */
  selo?: 'SCANNER_PENDENTES';
  /** grupo do menu (ex.: "Pessoas"); itens seguidos do mesmo grupo ficam sob um só título */
  secao?: string;
  /** rótulo curto para o menu compacto do tablet (padrão: o próprio label) */
  rotuloCurto?: string;
}

export interface ConfigPainel {
  /** rótulo do papel mostrado no menu (ex.: "Administração") */
  papelLabel: string;
  /** rota para onde "voltar" cai quando não há histórico */
  rotaInicial: string;
  itens: ItemMenu[];
  /** rota da lista de receitas deste painel (aba Receitas do Catálogo) */
  rotaReceitas: string;
}
