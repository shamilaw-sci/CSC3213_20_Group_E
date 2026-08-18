// Ensures the test environment always has the secrets the app needs,
// regardless of whether a local .env file exists (it won't in CI).
// Real values are never used here — this is a fixed dummy secret for
// signing/verifying JWTs inside the test suite only.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-ci-only';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';