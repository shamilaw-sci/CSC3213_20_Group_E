const createReadinessHandler = supabase => async (_req, res) => {
    const start = Date.now();
    const controller = new AbortController();
    let timer;
    const unavailable = () => res.status(503).json({
        status: 'unready', database: 'unavailable',
        error: 'Database readiness unavailable.', timestamp: new Date().toISOString()
    });
    try {
        const deadline = new Promise((_resolve, reject) => {
            timer = setTimeout(() => {
                controller.abort();
                reject(new Error('Readiness deadline exceeded'));
            }, 5000);
            timer.unref?.();
        });
        const query = supabase.from('platform_settings').select('id', { head: true })
            .limit(1).abortSignal(controller.signal);
        const result = await Promise.race([Promise.resolve(query), deadline]);
        if (controller.signal.aborted || !result || result.error !== null
            || !Number.isInteger(result.status) || result.status < 200 || result.status >= 300) {
            return unavailable();
        }
        return res.status(200).json({
            status: 'ready', database: 'connected', db_latency_ms: Date.now() - start,
            timestamp: new Date().toISOString()
        });
    } catch {
        return unavailable();
    } finally {
        clearTimeout(timer);
    }
};
module.exports = { createReadinessHandler };
