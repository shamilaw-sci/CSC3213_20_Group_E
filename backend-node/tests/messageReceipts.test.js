const { decorateMessages } = require('../utils/messageReceipts');

const conversation = { id: 'c1', buyer_id: 'buyer', seller_id: 'seller' };
const message = { id: 'm1', conversation_id: 'c1', sender_id: 'seller', recipient_receipts: true, read_at: null };
test('an admin receipt never clears buyer unread or signals recipient read', () => {
    const receipts = [{ message_id: 'm1', user_id: 'admin', read_at: 'admin-time' }];
    expect(decorateMessages([message], receipts, 'buyer', [conversation])[0]).toMatchObject({ viewer_read_at: null, recipient_read_at: null });
    expect(decorateMessages([message], receipts, 'admin', [conversation])[0].viewer_read_at).toBe('admin-time');
});
test('buyer and seller receipts are independent, and sender consults named recipient', () => {
    const receipts = [{ message_id: 'm1', user_id: 'buyer', read_at: 'buyer-time' }];
    expect(decorateMessages([message], receipts, 'buyer', [conversation])[0]).toMatchObject({ viewer_read_at: 'buyer-time', recipient_read_at: 'buyer-time' });
    expect(decorateMessages([message], receipts, 'other-admin', [conversation])[0].viewer_read_at).toBeNull();
});
test('preserves legacy read baseline without trusting shared read_at for new messages', () => {
    const old = { ...message, recipient_receipts: false, read_at: 'legacy-time' };
    expect(decorateMessages([old], [], 'buyer', [conversation])[0].viewer_read_at).toBe('legacy-time');
    expect(decorateMessages([{ ...old, recipient_receipts: true }], [], 'buyer', [conversation])[0].viewer_read_at).toBeNull();
    expect(decorateMessages([old], [], 'seller', [conversation])[0].recipient_read_at).toBeNull();
});
test('admin cannot stand in for a named recipient on support-assisted chats', () => {
    const adminMessage = { ...message, sender_id: 'admin' };
    expect(decorateMessages([adminMessage], [{ message_id: 'm1', user_id: 'buyer', read_at: 'x' }], 'admin', [conversation])[0].recipient_read_at).toBeNull();
});

jest.mock('../config/supabase', () => ({ from: jest.fn() }));
const db = require('../config/supabase');
const repo = require('../repositories/conversationRepository');
test('read writes only current viewer receipts, excludes own messages, and preserves first read', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    db.from.mockReturnValue({ upsert });
    await repo.markMessagesAsRead('c1', 'buyer', [message, { ...message, id: 'own', sender_id: 'buyer' }]);
    expect(db.from).toHaveBeenCalledWith('message_receipts');
    expect(upsert).toHaveBeenCalledWith([{ message_id: 'm1', user_id: 'buyer' }], { onConflict: 'message_id,user_id', ignoreDuplicates: true });
});
test('unread query finds older unread messages beyond a full page of read messages', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, i) => ({ ...message, id: String(i) }));
    const range = jest.fn().mockResolvedValueOnce({ data: firstPage }).mockResolvedValueOnce({ data: [{ ...message, id: 'older' }] });
    const query = { select: () => query, in: () => query, neq: () => query, order: () => query, range };
    db.from.mockReturnValue(query);
    const decorate = jest.spyOn(repo, 'withReadReceipts').mockImplementation(async messages => messages.map(m => ({ ...m, viewer_read_at: m.id === 'older' ? null : 'already-read' })));
    expect(await repo.getUnreadMessagesForConversations(['c1'], 'buyer')).toEqual([expect.objectContaining({ id: 'older' })]);
    expect(range).toHaveBeenNthCalledWith(2, 1000, 1999);
    decorate.mockRestore();
});
