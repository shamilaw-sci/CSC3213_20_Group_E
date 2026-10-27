// These controller tests never query Supabase; repository auto-mocks still load
// their modules, so isolate the client before those modules are evaluated.
jest.mock('../config/supabase', () => ({}));
const { postReview, bookViewing } = require('../controllers/agentController');
const { toggleFavorite } = require('../controllers/favoritesController');
const agentRepository = require('../repositories/agentRepository');
const propertyRepository = require('../repositories/propertyRepository');
const favoritesRepository = require('../repositories/favoritesRepository');

// Mock the repositories
jest.mock('../repositories/agentRepository');
jest.mock('../repositories/propertyRepository');
jest.mock('../repositories/favoritesRepository');

describe('Backend Authorization & Self-Action Prevention', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            params: {},
            body: {},
            user: { id: 'user-123', role: 'BUYER' }
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        mockNext = jest.fn();
    });

    describe('postReview - Agent Reviews Authorization', () => {
        it('should block an agent from reviewing their own profile (self-review)', async () => {
            mockReq.params.id = 'agent-456';
            mockReq.user = { id: 'agent-456', role: 'AGENT' };
            mockReq.body = { rating: 5, comment: 'I am the best!' };

            await postReview(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringMatching(/cannot review your own profile/i)
            }));
            expect(agentRepository.postReview).not.toHaveBeenCalled();
        });

        it('should block agents from reviewing other agents', async () => {
            mockReq.params.id = 'agent-other';
            mockReq.user = { id: 'agent-456', role: 'AGENT' };
            mockReq.body = { rating: 5, comment: 'Nice agent!' };

            await postReview(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringMatching(/only buyers and sellers/i)
            }));
            expect(agentRepository.postReview).not.toHaveBeenCalled();
        });

        it('should block admin from reviewing an agent', async () => {
            mockReq.params.id = 'agent-other';
            mockReq.user = { id: 'admin-1', role: 'ADMIN' };
            mockReq.body = { rating: 5, comment: 'Admin review' };

            await postReview(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(agentRepository.postReview).not.toHaveBeenCalled();
        });

        it('should allow a verified buyer to review an agent', async () => {
            mockReq.params.id = 'agent-456';
            mockReq.user = { id: 'buyer-789', role: 'BUYER' };
            mockReq.body = { rating: 5, comment: 'Great agent!' };

            agentRepository.postReview.mockResolvedValueOnce({ id: 'rev-1', rating: 5, comment: 'Great agent!' });

            await postReview(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(agentRepository.postReview).toHaveBeenCalledWith('agent-456', 'buyer-789', 5, 'Great agent!');
        });

        it('should allow a verified seller to review an agent', async () => {
            mockReq.params.id = 'agent-456';
            mockReq.user = { id: 'seller-321', role: 'SELLER' };
            mockReq.body = { rating: 4, comment: 'Helped sell my house.' };

            agentRepository.postReview.mockResolvedValueOnce({ id: 'rev-2', rating: 4, comment: 'Helped sell my house.' });

            await postReview(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(agentRepository.postReview).toHaveBeenCalledWith('agent-456', 'seller-321', 4, 'Helped sell my house.');
        });
    });

    describe('bookViewing - Agent Self-Booking Prevention', () => {
        it('should block an agent from booking a viewing/consultation with themselves', async () => {
            mockReq.params.id = 'agent-456';
            mockReq.user = { id: 'agent-456', role: 'AGENT' };
            mockReq.body = {
                client_name: 'Agent Self',
                client_email: 'agent@thirasara.lk'
            };

            await bookViewing(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringMatching(/cannot book a viewing or consultation with yourself/i)
            }));
            expect(agentRepository.createViewingLead).not.toHaveBeenCalled();
        });
    });

    describe('toggleFavorite - Property Self-Favoriting Prevention', () => {
        it('should return 404 if property does not exist', async () => {
            mockReq.params.propertyId = 'non-existent-prop';
            mockReq.user = { id: 'buyer-1' };

            propertyRepository.getPropertyById.mockResolvedValueOnce(null);

            await toggleFavorite(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringMatching(/not found/i)
            }));
            expect(favoritesRepository.findFavorite).not.toHaveBeenCalled();
        });

        it('should block a seller from favoriting their own property listing', async () => {
            mockReq.params.propertyId = 'prop-100';
            mockReq.user = { id: 'seller-100', role: 'SELLER' };

            propertyRepository.getPropertyById.mockResolvedValueOnce({
                id: 'prop-100',
                seller_id: 'seller-100',
                title: 'Luxury Villa'
            });

            await toggleFavorite(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringMatching(/cannot favorite your own property/i)
            }));
            expect(favoritesRepository.insertFavorite).not.toHaveBeenCalled();
        });

        it('should allow a buyer to favorite another user\'s property listing', async () => {
            mockReq.params.propertyId = 'prop-100';
            mockReq.user = { id: 'buyer-200', role: 'BUYER' };

            propertyRepository.getPropertyById.mockResolvedValueOnce({
                id: 'prop-100',
                seller_id: 'seller-100',
                title: 'Luxury Villa'
            });

            favoritesRepository.findFavorite.mockResolvedValueOnce({ data: null, error: null });
            favoritesRepository.insertFavorite.mockResolvedValueOnce({ id: 'fav-1' });

            await toggleFavorite(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                isFavorite: true
            }));
            expect(favoritesRepository.insertFavorite).toHaveBeenCalledWith('buyer-200', 'prop-100');
        });
    });
});
