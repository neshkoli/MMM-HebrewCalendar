module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'MMM-HebrewCalendar.js',
    'node_helper.js'
  ],
  coverageReporters: ['lcov', 'text'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapper: {
    '^node_helper$': '<rootDir>/tests/mocks/node_helper_mock.js'
  }
};
