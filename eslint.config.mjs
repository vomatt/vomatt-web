import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

// Type sizes, leading and tracking come from the scale in src/styles/global.css (see DESIGN.md, Type)
const ARBITRARY_TYPE = String.raw`/(^|[\s:!])(text-(\[[-.0-9]|\[length:|\(length:)|(leading|tracking)-[[(])/`;
const DEFAULT_TEXT_SIZE = String.raw`/(^|[\s:!])text-(xs|sm|base|lg|[2-9]?xl)(!|\/\S*)?(\s|$)/`;
const typeScaleRules = [ARBITRARY_TYPE, DEFAULT_TEXT_SIZE].map((pattern) => ({
	selector: `:matches(Literal[value=${pattern}], TemplateElement[value.raw=${pattern}])`,
	message: 'Use the type scale (text-title-*, text-body-*, text-caption-*, leading-*, tracking-*) instead of a raw size.',
}));

export default defineConfig([
	...nextVitals,
	{
		// nextVitals already includes the base `next` config
		plugins: {
			'simple-import-sort': simpleImportSort,
		},

		rules: {
			'simple-import-sort/imports': 'warn',
			'simple-import-sort/exports': 'warn',
			'react-hooks/exhaustive-deps': 'error',
			'no-restricted-syntax': ['error', ...typeScaleRules],
		},
	},
	globalIgnores([
		// Default ignores of eslint-config-next:
		'.next/**',
		'out/**',
		'build/**',
		'next-env.d.ts',
	]),
]);
