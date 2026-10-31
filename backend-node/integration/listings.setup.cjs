// Moderation side effects are boundary spies; matching/delivery is a later flow.
jest.mock('../utils/emailService', () => ({ sendListingStatusEmail: jest.fn().mockResolvedValue() }));
jest.mock('../controllers/savedSearchController', () => ({
    ...jest.requireActual('../controllers/savedSearchController'),
    checkSavedSearchMatches: jest.fn().mockResolvedValue(),
}));

for (const method of ['log', 'warn']) {
    const original = console[method].bind(console);
    console[method] = (...args) => {
        if (args.length === 1 && typeof args[0] === 'string'
            && /^\[HTTP\] (GET|POST|PATCH|DELETE) \/api\/(properties(?:\/[^ ]*)?|admin\/listings(?:\/[^ ]*)?) -> [234]\d\d \(\d+ms\)$/.test(args[0])) return;
        original(...args);
    };
}
