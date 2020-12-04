module.exports = {
    parser: '@typescript-eslint/parser',
    root: true,
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: ['./tsconfig.json', './packages/*/tsconfig.json'],
        tsconfigRootDir: __dirname,
    },
    extends: ['plugin:@typescript-eslint/recommended', 'prettier/@typescript-eslint', 'plugin:prettier/recommended'],
    plugins: ['simple-import-sort'],
    rules: {
        '@typescript-eslint/await-thenable': 'warn',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        'prettier/prettier': 'error',
        'simple-import-sort/sort': 'error',
        'sort-imports': 'off',
        'comma-dangle': [
            'error',
            {
                arrays: 'always-multiline',
                objects: 'always-multiline',
                imports: 'always-multiline',
                exports: 'always-multiline',
                functions: 'always-multiline',
            },
        ],
        quotes: [2, 'single', { avoidEscape: true }],
        semi: ['error', 'always'],
    },
};
