export const colors = {
  // Marca
  primary: '#8BCF4A',       
  primaryDark: '#1B4332',  
  primaryShadow: '#5B8C1A',

  // Texto
  white: '#FFFFFF',
  textOnDarkMuted: '#D1D5DB',
  textOnLight: '#111827',
  placeholder: '#9AA5A0',

  // Superfícies
  background: '#155946',

  // Estados
  error: '#C0392B',
  info: '#3B82F6',
  success: '#10B981',

  trilhaCeu: '#6ACAF0', 
  trilhaTrilhoBloqueadoSombra: '#515151',
  trilhaTrilhoBloqueado: '#818280',
  


  // Prática Real pendente (nó "em aberto" no caminho da trilha — ver
  // seção 5 do modelo-pedagogico-trilha.md). Âmbar pra diferenciar do
  // verde (concluída/atual normal) sem parecer erro (vermelho).
  warning: '#F5A623',
  warningShadow: '#B8770F',
  warningSoft: 'rgba(245, 166, 35, 0.16)',
} as const;

export type ColorKey = keyof typeof colors;
