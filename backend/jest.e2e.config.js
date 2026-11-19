// E2E: viajes completos contra el servidor real levantado en un puerto efímero.
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['<rootDir>/test/e2e/**/*.e2e.test.js'],
  setupFiles: ['<rootDir>/test/helpers/entorno.js'],
  testTimeout: 30000,
};
