// Per-invocation provenance: never mark/mutate a shared driver error itself.
const returnedRejections = new WeakMap();
const definiteCodes = new Set(['23502', '23503', '23514', '22P02', '42501']);

function returnedMessageInsertError(error) {
    if (!error || typeof error !== 'object' || !definiteCodes.has(error.code)) return error;
    const failure = new Error('Message insert rejected.');
    returnedRejections.set(failure, error);
    return failure;
}

module.exports = {
    returnedMessageInsertError,
    isDefiniteMessageRejection: error => returnedRejections.has(error),
    originalMessageError: error => returnedRejections.get(error) || error,
};
