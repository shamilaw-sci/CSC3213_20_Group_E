jest.mock('../config/supabase', () => ({ from: jest.fn(), storage: { from: jest.fn() } }));
const db = require('../config/supabase');
const repo = require('../repositories/conversationRepository');
const { sendMessage } = require('../controllers/conversationController');
const conversation = { id: '11111111-1111-4111-8111-111111111111', buyer_id: 'buyer', seller_id: 'seller' };
const raw = code => Object.assign(new Error('private-error-marker'), { code });
let storage, insert, timestamp, saved, next, res;
const req = file => ({ params: { id: conversation.id }, user: { id: 'buyer', role: 'BUYER' },
    body: { body: 'private-message-marker' }, ...(file ? { file: { originalname: 'original-private-name.pdf',
        buffer: Buffer.from('private-file-marker'), mimetype: 'application/pdf' } } : {}) });
beforeEach(() => {
    jest.clearAllMocks();
    saved = { id: 'message-id', conversation_id: conversation.id, sender_id: 'buyer', body: 'saved' };
    insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(async () => ({ data: saved, error: null })) };
    timestamp = { eq: jest.fn().mockResolvedValue({ error: null }) };
    const conversations = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: conversation, error: null }), update: jest.fn(() => timestamp) };
    db.from.mockImplementation(table => table === 'messages' ? insert : conversations);
    storage = { upload: jest.fn().mockResolvedValue({ error: null }), remove: jest.fn().mockResolvedValue({ error: null }) };
    db.storage.from.mockReturnValue(storage);
    jest.spyOn(repo, 'withAttachmentUrls').mockImplementation(async rows => rows);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() }; next = jest.fn();
});
afterEach(() => jest.restoreAllMocks());
const uploadedKey = () => storage.upload.mock.calls[0][0];
const noPrivateLogs = () => expect(JSON.stringify(console.error.mock.calls)).not.toMatch(/private-(error|message|file|name)-marker|original-private-name/);

test.each(['23502', '23503', '23514', '22P02', '42501'])('returned insert rejection %s removes exact newly uploaded key and preserves original error', async code => {
    const error = raw(code); insert.single.mockResolvedValue({ data: null, error });
    await sendMessage(req(true), res, next);
    expect(storage.remove).toHaveBeenCalledWith([uploadedKey()]);
    expect(db.storage.from).toHaveBeenLastCalledWith('chat-attachments');
    expect(next).toHaveBeenCalledWith(error); expect(res.json).not.toHaveBeenCalled();
    expect(timestamp.eq).not.toHaveBeenCalled();
});
test.each(['23505', '08006', '57014', 'PGRST116', 'UNKNOWN'])('unknown/ambiguous returned %s retains file', async code => {
    const error = raw(code); insert.single.mockResolvedValue({ data: null, error });
    await sendMessage(req(true), res, next);
    expect(storage.remove).not.toHaveBeenCalled(); expect(next).toHaveBeenCalledWith(error);
    expect(JSON.stringify(console.error.mock.calls)).toContain('chat_attachment_recovery_required');
    noPrivateLogs();
});
test.each(['23514', 'ETIMEDOUT', undefined])('thrown error %s never qualifies as definite rejection', async code => {
    const error = raw(code); insert.single.mockRejectedValue(error);
    await sendMessage(req(true), res, next);
    expect(storage.remove).not.toHaveBeenCalled(); expect(next).toHaveBeenCalledWith(error); noPrivateLogs();
});
test('cleanup is awaited before forwarding the original insert error', async () => {
    const error = raw('23514'); insert.single.mockResolvedValue({ data: null, error });
    let finish; storage.remove.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const pending = sendMessage(req(true), res, next);
    for (let count = 0; count < 12 && !finish; count++) await Promise.resolve();
    expect(finish).toBeDefined(); expect(next).not.toHaveBeenCalled();
    finish({ error: null }); await pending;
    expect(next).toHaveBeenCalledWith(error);
});
test.each(['returned', 'thrown'])('cleanup %s failure preserves insert error and safe metadata', async kind => {
    const error = raw('23514'); insert.single.mockResolvedValue({ data: null, error });
    if (kind === 'returned') storage.remove.mockResolvedValue({ error: raw('cleanup') });
    else storage.remove.mockRejectedValue(raw('cleanup'));
    await sendMessage(req(true), res, next);
    expect(next).toHaveBeenCalledWith(error);
    expect(JSON.stringify(console.error.mock.calls)).toContain('chat_attachment_cleanup_failed'); noPrivateLogs();
});
test.each([false, true])('timestamp failure after committed send still201 (file=%s)', async file => {
    timestamp.eq.mockResolvedValue({ error: raw('timestamp') });
    if (file) insert.single.mockImplementation(async () => ({ data: { ...saved,
        attachment_url: `chat-attachments/${uploadedKey()}` }, error: null }));
    await sendMessage(req(file), res, next);
    expect(res.status).toHaveBeenCalledWith(201); expect(res.json).toHaveBeenCalledWith({ message: expect.objectContaining({ id: saved.id }) });
    expect(next).not.toHaveBeenCalled(); expect(storage.remove).not.toHaveBeenCalled();
    expect(JSON.stringify(console.error.mock.calls)).toContain('chat_timestamp_recovery_required'); noPrivateLogs();
});
test.each([null, {}, { id: '' }, { id: 'other', conversation_id: 'foreign' }])('unconfirmed returned row %# never declares success or deletes file', async data => {
    insert.single.mockResolvedValue({ data, error: null });
    await sendMessage(req(true), res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error)); expect(res.json).not.toHaveBeenCalled();
    expect(storage.remove).not.toHaveBeenCalled(); expect(timestamp.eq).not.toHaveBeenCalled();
});
test('post-commit decoration failure retains persisted attachment', async () => {
    insert.single.mockImplementation(async () => ({ data: { ...saved, attachment_url: `chat-attachments/${uploadedKey()}` }, error: null }));
    const error = raw('decoration'); repo.withAttachmentUrls.mockRejectedValue(error);
    await sendMessage(req(true), res, next);
    expect(next).toHaveBeenCalledWith(error); expect(storage.remove).not.toHaveBeenCalled();
});
test('upload failure never inserts or removes', async () => {
    const error = raw('upload'); storage.upload.mockResolvedValue({ error });
    await sendMessage(req(true), res, next);
    expect(insert.insert).not.toHaveBeenCalled(); expect(storage.remove).not.toHaveBeenCalled(); expect(next).toHaveBeenCalledWith(error);
});
test('outsider cannot upload or clean up', async () => {
    const request = req(true); request.user.id = 'outsider';
    await sendMessage(request, res, next);
    expect(res.status).toHaveBeenCalledWith(403); expect(storage.upload).not.toHaveBeenCalled(); expect(storage.remove).not.toHaveBeenCalled();
});
test('successful send keeps role/body/reference and has no cleanup', async () => {
    await sendMessage(req(true), res, next);
    expect(insert.insert).toHaveBeenCalledWith([expect.objectContaining({ conversation_id: conversation.id,
        sender_id: 'buyer', sender_role: 'BUYER', body: 'private-message-marker', attachment_url: `chat-attachments/${uploadedKey()}` })]);
    expect(res.status).toHaveBeenCalledWith(201); expect(storage.remove).not.toHaveBeenCalled();
});
test('text-only returned rejection preserves error without storage operation', async () => {
    const error = raw('23514'); insert.single.mockResolvedValue({ data: null, error });
    await sendMessage(req(false), res, next);
    expect(next).toHaveBeenCalledWith(error); expect(db.storage.from).not.toHaveBeenCalled();
});
test('cleanup repository accepts only matching conversation and generated basename', async () => {
    const key = `${conversation.id}/1700000000000-${'a'.repeat(32)}.pdf`;
    await repo.removeAttachment(conversation.id, key);
    expect(storage.remove).toHaveBeenCalledWith([key]);
});
test.each(['../file.pdf', 'foreign/file.pdf', `${conversation.id}/../file.pdf`,
    `${conversation.id}/nested/file.pdf`, `${conversation.id}/plain.pdf`,
    `chat-attachments/${conversation.id}/1700000000000-${'a'.repeat(32)}.pdf`])('cleanup rejects unsafe/unowned path %#', async key => {
    await expect(repo.removeAttachment(conversation.id, key)).rejects.toThrow();
    expect(storage.remove).not.toHaveBeenCalled();
});
test('reused thrown DB error cannot inherit earlier returned-error provenance', async () => {
    const error = raw('23514'); insert.single.mockResolvedValueOnce({ data: null, error }).mockRejectedValueOnce(error);
    await sendMessage(req(true), res, next);
    expect(storage.remove).toHaveBeenCalledTimes(1);
    await sendMessage(req(true), res, next);
    expect(storage.remove).toHaveBeenCalledTimes(1); expect(next).toHaveBeenLastCalledWith(error);
});
