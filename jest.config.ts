import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

// Dates render in the viewer's time zone; fix one (set here, so the workers inherit it) so
// calendar days ("today", "Fri") come out the same on every machine
process.env.TZ = 'Asia/Taipei';

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

// ESM-only packages (@sanity/image-url, groq) are transformed because next.config.ts lists them
// in transpilePackages, which next/jest reads
export default createJestConfig(config);
