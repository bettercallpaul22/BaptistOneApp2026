const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  {
    ignores: [
      'android/**',
      'ios/**',
      'node_modules/**',
      'coverage/**',
      'babel.config.js',
      'metro.config.js',
      'jest.config.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,ts,tsx}'],
    languageOptions: {
      globals: {
        __DEV__: 'readonly',
        console: 'readonly',
        jest: 'readonly',
        require: 'readonly',
        module: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
