import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
	coverageProvider: 'v8',
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	moduleNameMapper: {
		'^@payload-config$': '<rootDir>/src/__mocks__/payload-config.ts',
	},
	testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}'],
	collectCoverageFrom: [
		'src/**/*.{ts,tsx}',
		'!src/**/*.d.ts',
		'!src/payload-types.ts',
		'!src/payload.config.ts',
		'!src/app/(payload)/**',
		'!src/__mocks__/**',
	],
};

export default createJestConfig(config);
