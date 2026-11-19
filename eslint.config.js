import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

// Configuración de ESLint para el backend. El paquete mobile usa la configuración de Expo (`npx expo lint`).
export default [
  { ignores: ['**/node_modules/**', '**/coverage/**', 'mobile/**', '.specify/**', '.claude/**'] },
  js.configs.recommended,
  {
    files: ['backend/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
    },
  },
  {
    files: ['backend/test/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
  },
  prettier,
];
