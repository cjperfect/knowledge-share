import js from '@eslint/js'
import pluginQuery from '@tanstack/eslint-plugin-query'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const WEB_FILES = ['apps/web/**/*.{ts,tsx}']
const MINI_FILES = ['apps/minip/**/*.{ts,tsx}']
const REACT_FILES = [...WEB_FILES, ...MINI_FILES]
const BACKEND_FILES = ['apps/backend/**/*.ts']

export default defineConfig(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-ssr/**',
      '**/coverage/**',
      '**/.tanstack/**',
      '**/.next/**',
      '**/__screenshots__/**',
      '**/.vitest-attachments/**',
      'apps/web/src/components/ui/**',
      'apps/web/src/routeTree.gen.ts',
      'apps/web/src/tanstack-table.d.ts',
      '.husky/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx,js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'no-console': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // 前端 / 小程序：React Hooks、react-refresh、类型导入规范
  {
    files: REACT_FILES,
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: false,
        },
      ],
    },
  },
  ...pluginQuery.configs['flat/recommended'].map((config) => ({
    ...config,
    files: WEB_FILES,
  })),

  // 后端：Node 环境，装饰器依赖运行时引用，禁用 consistent-type-imports
  {
    files: BACKEND_FILES,
    languageOptions: { globals: globals.node },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },

  // 收尾：关闭与 Prettier 冲突的格式规则
  prettier
)
