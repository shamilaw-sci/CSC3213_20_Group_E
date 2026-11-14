module.exports = {
    rootDir: '..',
    testMatch: ['<rootDir>/integration/login-roles.integration.cjs'],
    setupFiles: ['<rootDir>/integration/setup.cjs'],
    testTimeout: 15000,
    verbose: true,
};
