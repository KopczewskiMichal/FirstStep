module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // ważne dla testowania komponentów Reacta
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    // Jeśli używasz aliasów typu @/components/...
    '^@/(.*)$': '<rootDir>/$1',
  },
};