module.exports = {
    rootDir: '..',
    testMatch: ['<rootDir>/integration/storage.integration.cjs'],
    setupFiles: ['<rootDir>/integration/setup.cjs', '<rootDir>/integration/storage.setup.cjs'],
    testTimeout: 20000,
    verbose: true,
};
