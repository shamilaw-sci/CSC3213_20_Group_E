const appleSignin = require('apple-signin-auth');
const KEY_ENDPOINT = 'https://appleid.apple.com/auth/keys';

// Installed once for this SDK module. Other Apple SDK HTTP features are intentionally
// unsupported until given a separate transport policy; global fetch is never replaced.
appleSignin._setFetch(async (input, options = {}) => {
    const url = new URL(input);
    if (url.href !== KEY_ENDPOINT || (options.method !== undefined && options.method !== 'GET')
        || options.body !== undefined) throw new Error('Unsupported Apple key request.');

    const controller = new AbortController();
    const parent = options.signal;
    const cancel = () => controller.abort(parent.reason);
    if (parent?.aborted) cancel();
    else parent?.addEventListener('abort', cancel, { once: true });
    const timer = setTimeout(() => controller.abort(new Error('Apple key request timed out.')), 5000);
    timer.unref?.();
    try {
        controller.signal.throwIfAborted();
        const response = await globalThis.fetch(KEY_ENDPOINT, {
            ...options, method: 'GET', redirect: 'error', signal: controller.signal,
        });
        if (!response.ok || response.redirected || response.status !== 200) throw new Error('Apple keys unavailable.');
        // Keep cancellation active through body consumption, not just response headers.
        const text = await response.text();
        controller.signal.throwIfAborted();
        return new Response(text, { status: response.status, statusText: response.statusText, headers: response.headers });
    } finally {
        clearTimeout(timer);
        parent?.removeEventListener('abort', cancel);
    }
});

module.exports = { verifyIdToken: (token, options) => appleSignin.verifyIdToken(token, options) };
