import globals from 'globals';
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{js,mjs,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'warn',
      'no-unused-vars': 'off',
      'no-console': 'off',
      'no-debugger': 'warn',
      'no-empty': 'off',
      'no-constant-binary-expression': 'off',
      'no-dupe-class-members': 'off',
      'no-case-declarations': 'off',
      'no-useless-escape': 'off',
    },
  },
  {
    files: ['**/*.mjs', 'server.mjs'],
    languageOptions: {
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'AzurTantPRO_v7_Package/', 'factory/output/'],
  },
];
