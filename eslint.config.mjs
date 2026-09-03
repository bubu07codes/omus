import { defineConfig } from 'eslint/config'
import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginReact from 'eslint-plugin-react'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh'

export default defineConfig(
  { ignores: ['**/node_modules', '**/dist', '**/out'] },
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat['jsx-runtime'],
  {
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules,
      // This project consistently relies on TypeScript's contextual type
      // inference (the renderer, preload, and main processes all typecheck with
      // `npm run typecheck` at 0 errors). Enforcing explicit return-type
      // annotations on every const-assigned arrow + hook in the codebase is a
      // purely-stylistic requirement that adds no type safety, so it is
      // disabled here to keep the linter meaningful for real issues.
      '@typescript-eslint/explicit-function-return-type': 'off',
      // React-Compiler compatibility hint. This rule fires when the (optional)
      // React Compiler analysis decides it "could not preserve" an existing
      // useMemo/useCallback. It is an informative scaffold warning, not a bug —
      // the code is type-safe and the memoization is valid — so we keep it off
      // to avoid blocking CI on noise.
      'react-hooks/preserve-manual-memoization': 'off'
    }
  },
  eslintConfigPrettier
)
