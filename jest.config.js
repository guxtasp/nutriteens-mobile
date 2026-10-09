// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      // tsconfig.jest.json é isolado do tsconfig.json real do projeto
      // (padrão Expo, com jsx/paths) — não sobrescreve nem depende dele.
      tsconfig: '<rootDir>/tsconfig.jest.json',
    }],
  },
  // .png/.jpg importados via require() (padrão Expo/React Native, ex: statusDia.ts)
  // não existem como módulo JS de verdade. Usamos identity-obj-proxy (pacote
  // instalado via npm) em vez de um arquivo de mock próprio: um arquivo com
  // caminho absoluto pode falhar em ambientes Windows/OneDrive com acentos
  // ou espaços no caminho (foi o que aconteceu aqui) — um pacote resolvido
  // via node_modules não tem esse problema.
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|svg|webp)$': 'identity-obj-proxy',
  },
  // paths com @/... etc. — ajustar aqui se o projeto usar alias no tsconfig
  clearMocks: true,
};
