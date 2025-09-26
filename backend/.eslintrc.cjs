module.exports = {
	env: { node: true, es2022: true },
	extends: ['eslint:recommended', 'plugin:import/recommended', 'plugin:import/typescript', 'prettier'],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint', 'import', 'prettier'],
	rules: {
		'prettier/prettier': 'warn',
		'import/order': ['warn', { 'newlines-between': 'always' }],
	},
	overrides: [
		{
			files: ['*.ts'],
			extends: ['plugin:@typescript-eslint/recommended'],
			rules: {
				'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			},
		},
	],
};
