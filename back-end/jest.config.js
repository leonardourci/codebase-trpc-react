module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/src', '<rootDir>/tests'],
	testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.js'],
	transform: {
		'^.+\\.ts$': 'ts-jest'
	},
	collectCoverageFrom: [
		'src/**/*.{ts,js}',
		'!src/app.ts',
		'!src/**/*.d.ts',
		'!src/server.ts',
		'!src/database/knexfile.ts',
		'!src/database/migrations/**',
		'!src/database/seeds/**',
		'!src/types/**',
		'!src/utils/global-config.ts',
		'!src/utils/validations/envs.schemas.ts'
	],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov', 'html'],
	setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
	globalSetup: '<rootDir>/tests/setup/global-setup.ts',
	globalTeardown: '<rootDir>/tests/setup/global-teardown.ts',
	testTimeout: 30000,
	maxWorkers: 1, // Disable parallel execution for database tests
	forceExit: true,
	clearMocks: true,
	restoreMocks: true,
	resetMocks: true,
	passWithNoTests: true
}
