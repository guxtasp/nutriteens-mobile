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
}

export interface ConfigPainel {
  /** rótulo do papel mostrado no menu (ex.: "Administração") */
  papelLabel: string;
  /** rota para onde "voltar" cai quando não há histórico */
  rotaInicial: string;
  itens: ItemMenu[];
}
