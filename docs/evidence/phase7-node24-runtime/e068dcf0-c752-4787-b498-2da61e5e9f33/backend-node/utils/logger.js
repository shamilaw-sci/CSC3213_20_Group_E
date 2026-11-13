const levels = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};

const configuredLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const activeLevel = levels[configuredLevel] || levels.info;

const write = (level, message, meta) => {
    if (levels[level] < activeLevel) return;

    const payload = {
        level,
        time: new Date().toISOString(),
        message,
    };

    if (meta !== undefined) {
        payload.meta = meta instanceof Error
            ? { message: meta.message, stack: meta.stack }
            : meta;
    }

    const line = JSON.stringify(payload);
    if (level === 'error') {
        console.error(line);
        return;
    }
    if (level === 'warn') {
        console.warn(line);
        return;
    }
    console.log(line);
};

module.exports = {
    debug: (message, meta) => write('debug', message, meta),
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta),
};
