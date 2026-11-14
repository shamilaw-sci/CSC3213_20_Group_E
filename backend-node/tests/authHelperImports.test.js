// Unrelated controller tests must not initialize a live database client.
jest.mock('../config/supabase', () => { throw new Error('Database configuration unavailable'); });
jest.mock('../utils/emailService', () => ({ sendEmail: jest.fn() }));

test.each(['emailVerification', 'adminMfa'])('%s can load without database configuration', name => {
    expect(() => require(`../utils/${name}`)).not.toThrow();
});
