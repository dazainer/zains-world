import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      // Snapshot of the pre-reference-tile overworld, kept for map archaeology.
      // It is dead code that nothing imports, so linting it is just noise.
      'src/game/maps/overworld_pre_reference_tile_rebuild_2026-03-27.ts',
    ],
  },

  // Browser app code (React + game engine).
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Allow intentionally-unused args/caught errors when prefixed with _.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Vercel serverless functions and admin scripts run in Node, not the browser.
  {
    files: ['api/**/*.ts', 'scripts/**/*.{js,mjs}', '*.config.{js,ts}'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      // Server code legitimately logs to the console.
      'no-console': 'off',
    },
  },
)
