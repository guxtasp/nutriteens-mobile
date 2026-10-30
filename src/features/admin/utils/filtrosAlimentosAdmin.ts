// src/features/admin/utils/filtrosAlimentosAdmin.ts
// Filtros da lista de alimentos do painel. Funções puras (testáveis no jest).
import type { Alimento, ClassificacaoNova, GrupoAlimentar, TipoRefeicaoRecordatorio } from '../services/alimentosAdminService';
import { precisaRevisaoNutricional } from '../services/alimentosAdminService';

export type FiltroTipo = 'TODOS' | 'INGREDIENTE' | 'PRATO';
export type FiltroOrigem = 'TODAS' | 'EQUIPE' | 'ADOLESCENTE' | 'REVISAR';
export type FiltroRecordatorio = 'TODOS' | 'SEM' | TipoRefeicaoRecordatorio;
export type FiltroReceita = 'TODOS' | 'COM' | 'SEM';

export type FiltrosAlimentos = {
  busca: string;
  tipo: FiltroTipo;
  origem: FiltroOrigem;
  nova: ClassificacaoNova | null;
  grupo: GrupoAlimentar | null;
  recordatorio: FiltroRecordatorio;
  receita: FiltroReceita;
};

export const FILTROS_VAZIOS: FiltrosAlimentos = {
  busca: '', tipo: 'TODOS', origem: 'TODAS', nova: null, grupo: null, recordatorio: 'TODOS', receita: 'TODOS',
};

export const ROTULO_NOVA: Record<ClassificacaoNova, string> = {
  IN_NATURA: 'In natura',
  INGREDIENTE_CULINARIO: 'Ingrediente culinário',
  PROCESSADO: 'Processado',
  ULTRAPROCESSADO: 'Ultraprocessado',
};

export const ROTULO_GRUPO: Record<GrupoAlimentar, string> = {
  CEREAIS_E_TUBERCULOS: 'Cereais e tubérculos',
  LEGUMES_E_VERDURAS: 'Legumes e verduras',
  FRUTAS: 'Frutas',
  LEITE_E_DERIVADOS: 'Leite e derivados',
  CARNES_E_OVOS: 'Carnes e ovos',
  LEGUMINOSAS: 'Leguminosas',
  OLEAGINOSAS_E_SEMENTES: 'Oleaginosas e sementes',
  OLEOS_E_GORDURAS: 'Óleos e gorduras',
  ACUCARES_E_DOCES: 'Açúcares e doces',
  BEBIDAS: 'Bebidas',
};

export const ROTULO_REFEICAO: Record<TipoRefeicaoRecordatorio, string> = {
  CAFE_DA_MANHA: 'Café da manhã',
  LANCHE_MANHA: 'Lanche da manhã',
  ALMOCO: 'Almoço',
  LANCHE_TARDE: 'Lanche da tarde',
  JANTAR: 'Jantar',
  CEIA: 'Ceia',
};

/** minúsculas e sem acento: "maçã" casa com "maca" */
export function normalizar(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function filtrarAlimentos(lista: Alimento[], f: FiltrosAlimentos): Alimento[] {
  const termo = normalizar(f.busca);
  return lista.filter((a) => {
    if (termo && !normalizar(a.nome).includes(termo)) return false;
    if (f.tipo === 'PRATO' && !a.eh_prato_composto) return false;
    if (f.tipo === 'INGREDIENTE' && a.eh_prato_composto) return false;
    if (f.origem === 'EQUIPE' && a.criado_por !== null) return false;
    if (f.origem === 'ADOLESCENTE' && a.criado_por === null) return false;
    if (f.origem === 'REVISAR' && !precisaRevisaoNutricional(a)) return false;
    if (f.nova && a.classificacao_nova !== f.nova) return false;
    if (f.grupo && !(a.grupos_alimentares ?? []).includes(f.grupo)) return false;
    const refeicoes = a.tipos_refeicao_recordatorio ?? [];
    if (f.recordatorio === 'SEM' && refeicoes.length > 0) return false;
    if (f.recordatorio !== 'TODOS' && f.recordatorio !== 'SEM' && !refeicoes.includes(f.recordatorio)) return false;
    if (f.receita === 'COM' && !a.tem_receita) return false;
    if (f.receita === 'SEM' && a.tem_receita) return false;
    return true;
  });
}

/** quantos filtros (fora a busca) estão ligados */
export function contarFiltros(f: FiltrosAlimentos): number {
  return [f.tipo !== 'TODOS', f.origem !== 'TODAS', f.nova !== null, f.grupo !== null, f.recordatorio !== 'TODOS', f.receita !== 'TODOS']
    .filter(Boolean).length;
}
