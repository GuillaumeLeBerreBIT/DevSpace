import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // allowConstantExport: hooks files and utility exports alongside components are intentional
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // sync-state-from-props patterns in effects are intentional (auto-select, cursor reset, etc.)
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
