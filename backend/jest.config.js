// Unit, integración y contrato. Los E2E (servidor real) usan jest.e2e.config.js.
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['<rootDir>/test/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/test/e2e/'],
  setupFiles: ['<rootDir>/test/helpers/entorno.js'],
};
