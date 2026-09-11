import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
    {
        ignores: [
            'node_modules/**',
            'playwright-report/**',
            'blob-report/**',
            'test-results/**',
            '.auth/**',
        ],
    },
    ...tseslint.configs.recommended,
    {
        files: ['tests/**/*.ts'],
        ...playwright.configs['flat/recommended'],
        rules: {
            ...playwright.configs['flat/recommended'].rules,
            // This app is a single-page app that keeps background polling alive, so
            // `networkidle` never truly fires cleanly - the suite relies on it anyway
            // as a pragmatic wait. Downgraded to a visible warning instead of banning
            // it outright so new tests are nudged toward web-first assertions instead.
            'playwright/no-networkidle': 'warn',
        },
    },
    {
        rules: {
            // Page Objects intentionally expose locators without an explicit return type annotation.
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        },
    }
);
