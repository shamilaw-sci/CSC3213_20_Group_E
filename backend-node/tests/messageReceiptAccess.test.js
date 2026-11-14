jest.mock('../repositories/conversationRepository', () => ({
    getConversationById: jest.fn(), getMessagesByConversationId: jest.fn(),
    markMessagesAsRead: jest.fn(), withReadReceipts: jest.fn(),
    getUserConversations: jest.fn(), getPropertiesByIds: jest.fn(), getUsersByIds: jest.fn(),
    getMessagesByConversationIds: jest.fn(),
}));
const repo = require('../repositories/conversationRepository');
const { getMessages, getConversations } = require('../controllers/conversationController');
const conversation = { id: 'c1', buyer_id: 'buyer', seller_id: 'seller' };
const res = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
beforeEach(() => jest.resetAllMocks());
test('nonparticipant cannot write or read receipts', async () => {
    repo.getConversationById.mockResolvedValue(conversation);
    const response = res();
    await getMessages({ params: { id: 'c1' }, user: { id: 'outsider', role: 'BUYER' } }, response, jest.fn());
    expect(response.status).toHaveBeenCalledWith(403);
    expect(repo.markMessagesAsRead).not.toHaveBeenCalled();
});
test('receipt identity comes only from authenticated user, not body', async () => {
    repo.getConversationById.mockResolvedValue(conversation);
    const messages = [{ id: 'm1' }];
    repo.getMessagesByConversationId.mockResolvedValue(messages);
    repo.withReadReceipts.mockResolvedValue(messages);
    const next = jest.fn();
    await getMessages({ params: { id: 'c1' }, user: { id: 'buyer', role: 'BUYER' }, body: { user_id: 'seller' } }, res(), next);
    expect(next).not.toHaveBeenCalled();
    expect(repo.markMessagesAsRead).toHaveBeenCalledWith('c1', 'buyer', messages);
});
test('conversation unread count uses viewer receipt instead of legacy shared field', async () => {
    repo.getUserConversations.mockResolvedValue([conversation]);
    repo.getPropertiesByIds.mockResolvedValue([]);
    repo.getUsersByIds.mockResolvedValue([]);
    repo.getMessagesByConversationIds.mockResolvedValue([]);
    repo.withReadReceipts.mockResolvedValue([{ id: 'm1', conversation_id: 'c1', sender_id: 'seller', read_at: 'old-shared', viewer_read_at: null }]);
    const response = res();
    await getConversations({ user: { id: 'buyer', role: 'BUYER' } }, response, jest.fn());
    expect(response.json).toHaveBeenCalledWith({ conversations: [expect.objectContaining({ unread_count: 1 })] });
});
