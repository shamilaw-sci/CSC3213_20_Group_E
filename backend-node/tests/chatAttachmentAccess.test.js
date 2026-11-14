const request = require('supertest');
const express = require('express');
jest.mock('../config/supabase', () => ({}));
jest.mock('../repositories/conversationRepository', () => ({
    getConversationById: jest.fn(), getMessagesByConversationId: jest.fn(), markMessagesAsRead: jest.fn(),
    withReadReceipts: jest.fn(), uploadAttachment: jest.fn(), createMessage: jest.fn(),
    updateConversationTimestamp: jest.fn(), withAttachmentUrls: jest.fn()
}));
const repo = require('../repositories/conversationRepository');
const { sendMessage, getMessages } = require('../controllers/conversationController');
const conversation = { id: '11111111-1111-4111-8111-111111111111', buyer_id: 'buyer', seller_id: 'seller' };
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
beforeEach(() => {
    jest.clearAllMocks();
    repo.getConversationById.mockResolvedValue(conversation);
});
test('outsider cannot reach messages, upload or signed delivery', async () => {
    const req = { params: { id: conversation.id }, user: { id: 'outsider', role: 'BUYER' }, body: { body: 'Text' },
        file: { originalname: 'photo.png', buffer: Buffer.from('synthetic'), mimetype: 'image/png' } };
    for (const handler of [sendMessage, getMessages]) {
        const res = response();
        await handler(req, res, jest.fn());
        expect(res.status).toHaveBeenCalledWith(403);
    }
    expect(repo.uploadAttachment).not.toHaveBeenCalled();
    expect(repo.getMessagesByConversationId).not.toHaveBeenCalled();
    expect(repo.withAttachmentUrls).not.toHaveBeenCalled();
});
test('anonymous attachment requests cannot pass the real router auth', async () => {
    const app = express();
    app.use('/conversations', require('../routes/conversationRoutes'));
    expect((await request(app).get(`/conversations/${conversation.id}/messages`)).status).toBe(401);
    expect(repo.getConversationById).not.toHaveBeenCalled();
});
test.each(['BUYER', 'ADMIN'])('authorized %s send persists reference but returns decorated URL', async role => {
    repo.uploadAttachment.mockResolvedValue(`chat-attachments/${conversation.id}/photo.png`);
    const stored = { id: 'm1', conversation_id: conversation.id,
        attachment_url: `chat-attachments/${conversation.id}/photo.png` };
    repo.createMessage.mockResolvedValue(stored);
    repo.withAttachmentUrls.mockResolvedValue([{ ...stored, attachment_url: 'https://storage.example.test/signed' }]);
    const res = response();
    const next = jest.fn();
    await sendMessage({ params: { id: conversation.id }, user: { id: role === 'ADMIN' ? 'admin' : 'buyer', role },
        body: {}, file: { originalname: 'photo.png', buffer: Buffer.from('synthetic'), mimetype: 'image/png' } }, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(repo.createMessage).toHaveBeenCalledWith(expect.objectContaining({ attachment_url: stored.attachment_url }));
    expect(repo.withAttachmentUrls).toHaveBeenCalledWith([stored]);
    expect(res.json).toHaveBeenCalledWith({ message: expect.objectContaining({ attachment_url: 'https://storage.example.test/signed' }) });
});
