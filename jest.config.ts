import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
	coverageProvider: 'v8',
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
	testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}'],
	collectCoverageFrom: [
		'src/**/*.{ts,tsx}',
		'!src/**/*.d.ts',
		'!src/__mocks__/**',
	],
};

// @sanity/image-url ships ESM only, so let next/jest transform it
const jestConfig = async () => {
	const resolved = await createJestConfig(config)();
	return {
		...resolved,
		transformIgnorePatterns: (resolved.transformIgnorePatterns ?? []).map(
			(pattern) => pattern.replace('(?!(geist|', '(?!(@sanity/image-url|geist|')
		),
	};
};

export default jestConfig;
