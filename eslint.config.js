import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const ENGINE_MESSAGE = 'The simulation engine must stay pure, deterministic and UI-free (ADR-0002 §2).';

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },
  {
    // ADR-0002 §2: the engine imports only its own files and uses no browser, timing or random APIs.
    files: ['src/simulation/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react/*', 'react-dom', 'react-dom/*', 'chart.js', 'chart.js/*', 'react-chartjs-2', 'lucide-react', '**/ui/**', '**/presentation/**'],
              message: ENGINE_MESSAGE,
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'navigator', 'performance', 'requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'setInterval', 'fetch', 'localStorage', 'sessionStorage', 'Date'].map((name) => ({
          name,
          message: ENGINE_MESSAGE,
        })),
      ],
      'no-restricted-properties': ['error', { object: 'Math', property: 'random', message: ENGINE_MESSAGE }],
    },
  },
]);
