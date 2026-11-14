const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const httpUrl = value => {
    if (typeof value !== 'string' || !value || value.includes('\\')) return null;
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url : null;
    } catch {
        return null;
    }
};

const csrfProtection = (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();

    // PayHere is a server callback: its validator/signature/terms checks remain mandatory.
    if (req.method === 'POST' && /^\/api\/payment\/notify\/?$/.test(req.path)) return next();

    const configured = httpUrl(process.env.CLIENT_URL || 'http://localhost:5173');
    if (!configured || configured.pathname !== '/' || configured.search || configured.hash) {
        return res.status(503).json({ message: 'Request origin configuration unavailable.' });
    }
    const denied = () => res.status(403).json({ message: 'Request source is not allowed.' });

    if (req.headers.origin !== undefined) {
        const origin = httpUrl(req.headers.origin);
        if (!origin || req.headers.origin !== origin.origin || origin.origin !== configured.origin) return denied();
        return next();
    }
    if (req.headers.referer !== undefined) {
        const referer = httpUrl(req.headers.referer);
        if (!referer || referer.origin !== configured.origin) return denied();
        return next();
    }

    // Browser mutations must carry a verifiable source, including login requests
    // without a session. Explicit API credentials are handled by existing auth.
    if (['sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest', 'sec-fetch-user']
        .some(header => req.headers[header] !== undefined)) return denied();
    if (/^Bearer \S+$/.test(req.headers.authorization || '')) return next();
    if (Object.prototype.hasOwnProperty.call(req.cookies || {}, 'token')) return denied();
    return next();
};

module.exports = csrfProtection;
