module.exports = {
    rootDir: '..', testMatch: ['<rootDir>/integration/saved-searches.integration.cjs'],
    setupFiles: ['<rootDir>/integration/setup.cjs', '<rootDir>/integration/saved-searches.setup.cjs'],
    testTimeout: 15000, verbose: true,
};
