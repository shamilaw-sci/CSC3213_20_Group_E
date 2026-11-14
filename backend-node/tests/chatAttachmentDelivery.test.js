const { managedChatPath, withSignedAttachments } = require('../utils/chatAttachmentDelivery');
const origin = 'https://storage.example.test';
const conversation = '11111111-1111-4111-8111-111111111111';
const objectPath = `${conversation}/photo.png`;
const reference = `chat-attachments/${objectPath}`;
const publicUrl = `${origin}/storage/v1/object/public/${reference}`;

test.each([reference, publicUrl])('resolves managed reference %s', value => {
    expect(managedChatPath(value, conversation, origin)).toBe(objectPath);
});
test.each([
    `${origin}.evil.test/storage/v1/object/public/${reference}`,
    `https://elsewhere.example.test/storage/v1/object/public/${reference}`,
    `${origin}/storage/v1/object/public/properties/${objectPath}`,
    `${origin}/storage/v1/object/sign/${reference}?token=old`,
    `${publicUrl}?token=anything`, `${publicUrl}#fragment`,
    `https://user@storage.example.test/storage/v1/object/public/${reference}`,
    `chat-attachments/22222222-2222-4222-8222-222222222222/photo.png`,
    `chat-attachments/${conversation}/../photo.png`,
    `chat-attachments/${conversation}/%2e%2e/photo.png`,
    `chat-attachments/${conversation}/%2fprivate.png`,
    `chat-attachments/${conversation}/%252e%252e`,
    `chat-attachments/${conversation}/photo\\name.png`,
    `chat-attachments/${conversation}/photo\u0000.png`,
    `chat-attachments/${conversation}/`, null, 123
])('rejects unmanaged or ambiguous reference %#', value => {
    expect(managedChatPath(value, conversation, origin)).toBeNull();
});

const message = value => ({ id: 'message-1', conversation_id: conversation,
    body: 'Keep message text', attachment_url: value, attachment_name: 'photo.png' });
function client(result) {
    const createSignedUrl = jest.fn().mockResolvedValue(result);
    const from = jest.fn().mockReturnValue({ createSignedUrl });
    return { storage: { from }, createSignedUrl };
}
test('signs legacy/new references with bounded TTL without mutating persisted rows', async () => {
    const signedUrl = `${origin}/storage/v1/object/sign/${reference}?token=synthetic`;
    const db = client({ data: { signedUrl }, error: null });
    const rows = [message(reference), message(publicUrl)];
    const output = await withSignedAttachments(db, rows, origin);
    expect(db.storage.from).toHaveBeenCalledWith('chat-attachments');
    expect(db.createSignedUrl).toHaveBeenCalledWith(objectPath, 120);
    expect(output.map(row => row.attachment_url)).toEqual([signedUrl, signedUrl]);
    expect(rows[0].attachment_url).toBe(reference);
    expect(rows[1].attachment_url).toBe(publicUrl);
    expect(output[0].body).toBe('Keep message text');
});
test.each([
    { data: null, error: { message: 'synthetic signing failure' } },
    { data: {}, error: null }
])('signing failure preserves message without public fallback %#', async result => {
    const db = client(result);
    const [output] = await withSignedAttachments(db, [message(publicUrl)], origin);
    expect(output).toMatchObject({ body: 'Keep message text', attachment_url: null, attachment_unavailable: true });
});
test('thrown signing failure does not fail a persisted send', async () => {
    const db = client({});
    db.createSignedUrl.mockRejectedValue(new Error('synthetic signing failure'));
    const [output] = await withSignedAttachments(db, [message(publicUrl)], origin);
    expect(output.attachment_url).toBeNull();
    expect(output.attachment_unavailable).toBe(true);
});
test('foreign object is never signed or reflected', async () => {
    const db = client({});
    const [output] = await withSignedAttachments(db, [message('https://evil.example.test/file')], origin);
    expect(db.storage.from).not.toHaveBeenCalled();
    expect(output.attachment_url).toBeNull();
});
test('plain text rows do not need Storage configuration or calls', async () => {
    const rows = [{ id: 'plain', body: 'Text only' }];
    expect(await withSignedAttachments({}, rows, undefined)).toEqual(rows);
});
