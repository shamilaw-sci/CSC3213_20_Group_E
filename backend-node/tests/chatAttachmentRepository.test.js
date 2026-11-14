jest.mock('../config/supabase', () => ({
    from: jest.fn(), storage: { from: jest.fn() }
}));
const db = require('../config/supabase');
const repo = require('../repositories/conversationRepository');
const origin = 'https://storage.example.test';
const conversation = '11111111-1111-4111-8111-111111111111';
const objectPath = `${conversation}/file.pdf`;
const signedUrl = `${origin}/storage/v1/object/sign/chat-attachments/${objectPath}?token=synthetic`;
const previous = process.env.SUPABASE_URL;
let storage;
beforeEach(() => {
    jest.clearAllMocks();
    process.env.SUPABASE_URL = origin;
    storage = { upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'permanent-public-url' } }),
        createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl }, error: null }) };
    db.storage.from.mockReturnValue(storage);
    const query = { select: jest.fn().mockReturnThis(), in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(), range: jest.fn().mockResolvedValue({ data: [], error: null }) };
    db.from.mockReturnValue(query);
});
afterEach(() => {
    if (previous === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previous;
});
test('upload persists a managed reference, never a public or signed delivery URL', async () => {
    const result = await repo.uploadAttachment(objectPath, Buffer.from('synthetic'), 'application/pdf');
    expect(result).toBe(`chat-attachments/${objectPath}`);
    expect(storage.getPublicUrl).not.toHaveBeenCalled();
    expect(storage.createSignedUrl).not.toHaveBeenCalled();
});
test('receipt-decorated read signs historical attachment and preserves receipt fields', async () => {
    const rows = [{ id: 'm1', sender_id: 'buyer', conversation_id: conversation,
        attachment_url: `${origin}/storage/v1/object/public/chat-attachments/${objectPath}` }];
    const output = await repo.withReadReceipts(rows, 'buyer', [{ id: conversation, buyer_id: 'buyer', seller_id: 'seller' }]);
    expect(output[0]).toMatchObject({ attachment_url: signedUrl, viewer_read_at: null, recipient_read_at: null });
    expect(rows[0].attachment_url).toContain('/public/');
});
