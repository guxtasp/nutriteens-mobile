// src/features/auth/constants/generoOptions.ts
// Decisão 3.2: só Feminino, Masculino e Prefiro não informar (sem "Outro").
// O valor PREFIRO_NAO_INFORMAR precisa existir em profiles.genero no Supabase:
// ver src/features/auth/data/migration_genero_prefiro_nao_informar.sql
export const GENERO_PREFIRO_NAO_INFORMAR = 'PREFIRO_NAO_INFORMAR';

export const GENERO_OPTIONS = [
  { label: 'Feminino', value: 'FEMININO' },
  { label: 'Masculino', value: 'MASCULINO' },
  { label: 'Prefiro não informar', value: GENERO_PREFIRO_NAO_INFORMAR },
];
