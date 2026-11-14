// Only delivery is replaced; matching, repositories, REST and moderation remain real.
jest.mock('../utils/emailService', () => ({
    sendSavedSearchAlertEmail: jest.fn().mockResolvedValue(),
    sendListingStatusEmail: jest.fn().mockResolvedValue(),
}));

// Observe detached approval coordination while retaining the real implementation.
jest.spyOn(require('../controllers/savedSearchController'), 'checkSavedSearchMatches');
