module.exports = {
    rootDir: '..',
    testMatch: ['<rootDir>/integration/listings.integration.cjs'],
    setupFiles: ['<rootDir>/integration/setup.cjs', '<rootDir>/integration/listings.setup.cjs'],
    testTimeout: 15000,
    verbose: true,
};
