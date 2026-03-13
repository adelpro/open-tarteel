import { fixupConfigRules } from '@eslint/compat';
import js from '@eslint/js';
import globals from 'globals';
import nextPlugin from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';
import react from 'eslint-plugin-react';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unicorn from 'eslint-plugin-unicorn';
import prettier from 'eslint-config-prettier';
import tseslintParser from '@typescript-eslint/parser';
import tseslintPlugin from '@typescript-eslint/eslint-plugin';

const config = [
  js.configs.recommended,
  ...fixupConfigRules(prettier),
  fixupConfigRules(nextPlugin.flatConfig.coreWebVitals)[0],
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        React: 'readonly',
        NodeJS: 'readonly',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      unicorn,
      'simple-import-sort': simpleImportSort,
      '@typescript-eslint': tseslintPlugin,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': 'error',
      'unicorn/no-array-callback-reference': 'warn',
      'unicorn/no-null': 'off',
      'unicorn/no-array-for-each': 'warn',
      'unicorn/no-array-reduce': 'off',
      'unicorn/prefer-global-this': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/prevent-abbreviations': [
        'error',
        {
          allowList: {
            e2e: true,
            e: true,
            eS: true,
            eD: true,
            eN: true,
            err: true,
            args: true,
          },
          replacements: {
            props: false,
            ref: false,
            params: false,
          },
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'no-unused-vars': 'off',
      'no-empty': 'warn',
    },
  },
  {
    files: ['src/sw.ts', '**/service-worker*.ts'],
    languageOptions: {
      globals: {
        ServiceWorkerGlobalScope: 'readonly',
      },
    },
  },
  {
    files: ['vitest.config.ts'],
    rules: {
      'unicorn/prevent-abbreviations': 'off',
    },
  },
  {
    files: ['src/utils/is-valid-email.ts', 'src/utils/is-valid-magnet-uri.ts'],
    rules: {
      'no-useless-escape': 'off',
    },
  },
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
      '.husky/**',
      '.agent/**',
      '**/*.d.ts',
      'public/**',
      '.cache/**',
      '.vscode/**',
    ],
  },
];

export default config;
