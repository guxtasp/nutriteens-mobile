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
} as const;

export type ColorKey = keyof typeof colors;