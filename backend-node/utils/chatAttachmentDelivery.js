const BUCKET = 'chat-attachments';
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`;
const SIGNED_PREFIX = `/storage/v1/object/sign/${BUCKET}/`;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function storageOrigin(value) {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
        || url.pathname !== '/' || url.search || url.hash) throw new Error('Invalid Storage origin.');
    return url.origin;
}

function managedChatPath(value, conversationId, supabaseUrl) {
    if (typeof value !== 'string' || !UUID.test(conversationId) || /[\\\x00-\x20\x7f?#]/.test(value)) return null;
    try {
        const origin = storageOrigin(supabaseUrl);
        let rawPath;
        if (value.startsWith(`${BUCKET}/`)) rawPath = value.slice(BUCKET.length + 1);
        else {
            const path = /^https?:\/\/[^/?#]+(\/[^?#]*)$/.exec(value)?.[1];
            const url = new URL(value);
            if (!path?.startsWith(PUBLIC_PREFIX) || url.origin !== origin || url.username || url.password) return null;
            rawPath = path.slice(PUBLIC_PREFIX.length);
        }
        const parts = rawPath.split('/').map(part => decodeURIComponent(part));
        if (parts.length !== 2 || parts[0] !== conversationId || parts.some(part => !part || part === '.' || part === '..'
            || /[\\/%\x00-\x1f\x7f]/.test(part))) return null;
        return parts.join('/');
    } catch { return null; }
}

function validSignedUrl(value, path, supabaseUrl) {
    try {
        if (typeof value !== 'string' || /[\\\x00-\x20\x7f]/.test(value)) return false;
        const url = new URL(value);
        return url.origin === storageOrigin(supabaseUrl) && !url.username && !url.password && !url.hash
            && url.pathname.startsWith(SIGNED_PREFIX)
            && decodeURIComponent(url.pathname.slice(SIGNED_PREFIX.length)) === path
            && !!url.searchParams.get('token');
    } catch { return false; }
}

async function withSignedAttachments(client, messages, supabaseUrl) {
    const output = [];
    // Sign sequentially to bound Storage concurrency on long conversations.
    for (const message of messages) {
        if (!message.attachment_url) { output.push(message); continue; }
        const row = { ...message, attachment_url: null, attachment_unavailable: true };
        const path = managedChatPath(message.attachment_url, message.conversation_id, supabaseUrl);
        if (path) {
            try {
                const { data, error } = await client.storage.from(BUCKET).createSignedUrl(path, 120);
                if (!error && validSignedUrl(data?.signedUrl, path, supabaseUrl)) {
                    row.attachment_url = data.signedUrl;
                    delete row.attachment_unavailable;
                }
            } catch { /* Preserve the persisted message, never expose a public fallback. */ }
        }
        output.push(row);
    }
    return output;
}

module.exports = { managedChatPath, withSignedAttachments };
