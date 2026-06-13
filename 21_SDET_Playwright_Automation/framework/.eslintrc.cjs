/**
 * ESLint config for the Playwright + TypeScript enterprise framework.
 *
 * Philosophy:
 * - Block real bugs (floating promises, banned APIs, focused tests, debugger).
 * - Permit pragmatic patterns at external-library boundaries (OTel, Zod, Playwright
 *   matcher declaration merging) — type-aware "no-unsafe-*" rules warn there, not error.
 * - Prettier owns formatting; ESLint owns correctness.
 *
 * Run with:  npm run lint
 * Auto-fix:  npm run lint:fix
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'playwright', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:playwright/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
      node: true,
    },
  },
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'playwright-report/',
    'test-results/',
    'blob-report/',
    'allure-results/',
    'allure-report/',
    'tests/broken/**',
    '**/tests/broken/**',
    '**/*.d.ts',
    'quiz-solutions/**',
    'challenges/**',
  ],
  rules: {
    // === Correctness — TypeScript (errors) ===
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/only-throw-error': 'warn',
    '@typescript-eslint/no-unsafe-enum-comparison': 'warn',
    'no-case-declarations': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-namespace': 'off', // Required for `declare global` matcher augmentation
    '@typescript-eslint/require-await': 'off', // Async functions without await are fine in test helpers

    // === Type-info rules at external-library boundaries (warn — see Philosophy above) ===
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'warn',
    '@typescript-eslint/no-redundant-type-constituents': 'warn',
    '@typescript-eslint/restrict-template-expressions': 'warn',

    // === Correctness — Playwright ===
    // Real bug-prevention rules — kept at error / warn.
    'playwright/no-wait-for-timeout': 'warn',
    'playwright/no-force-option': 'warn',
    'playwright/no-focused-test': 'error',
    'playwright/no-networkidle': 'warn',
    'playwright/no-standalone-expect': 'warn',
    'playwright/missing-playwright-await': 'error',
    'playwright/no-page-pause': 'error',
    'playwright/no-element-handle': 'warn',
    'playwright/no-eval': 'error',
    'playwright/valid-expect': 'error',
    // The next three are turned off intentionally:
    //   no-skipped-test: `test.fixme` is the project's standard way to mark a
    //     test as known-broken (e.g. an OrangeHRM-demo limitation). Failing
    //     the suite when fixmes exist would defeat their purpose.
    //   expect-expect: POMs encapsulate assertions in `expectLoaded`,
    //     `expectAllWidgetsVisible`, etc. Lint cannot tell those are real
    //     assertions, so the rule produces false positives at scale.
    //   no-conditional-in-test / no-conditional-expect: search forms with
    //     "type-ahead optional inputs" need branching; the alternative is
    //     two duplicated specs.
    'playwright/no-skipped-test': 'off',
    'playwright/expect-expect': 'off',
    'playwright/no-conditional-in-test': 'off',
    'playwright/no-conditional-expect': 'off',

    // === Correctness — Imports ===
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-duplicates': 'error',
    'import/no-cycle': 'warn',
    'import/no-default-export': 'off',
    'import/no-unresolved': 'warn', // path aliases sometimes confuse the resolver

    // === General ===
    'no-console': ['warn', { allow: ['warn', 'error', 'info', 'log'] }],
    eqeqeq: ['error', 'always'],
    curly: ['warn', 'multi-line'],
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-irregular-whitespace': ['error', { skipStrings: true, skipComments: true, skipTemplates: true }],
  },
  overrides: [
    {
      files: ['playwright.config.ts'],
      rules: {
        'import/no-default-export': 'off',
      },
    },
    {
      // Test specs — relax matcher/dynamic-data rules.
      files: ['**/tests/**/*.ts', '**/*.spec.ts'],
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
      },
    },
    {
      // External-library boundary code — telemetry, matchers, analytics.
      files: [
        'utilities/api/telemetry.ts',
        'utilities/matchers/**/*.ts',
        'utilities/analytics/**/*.ts',
      ],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
    {
      // Plain JS/CJS files — outside the TS project; turn off all type-aware rules.
      files: ['scripts/**/*.js', '*.config.js', '*.config.cjs', '.eslintrc.cjs'],
      parserOptions: {
        project: null,
        program: null,
      },
      extends: ['plugin:@typescript-eslint/disable-type-checked'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-require-imports': 'off',
        'no-undef': 'off',
      },
    },
  ],
};
