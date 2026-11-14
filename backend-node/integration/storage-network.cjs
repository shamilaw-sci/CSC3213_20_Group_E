const faults = { owner: null, count: 0, releaseFirst: null, firstDone: null, firstPath: null, firstSucceeded: false, injectedPaths: [] };
let observer = null;
function directStorageUrl(input) {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    if (url.origin !== 'http://127.0.0.1:58321' || url.username || url.password || !url.pathname.startsWith('/storage/v1/')) {
        throw new Error('Unexpected Storage transport refused.');
    }
    url.port = '58323';
    url.pathname = url.pathname.slice('/storage/v1'.length);
    return url;
}
const validOwner = owner => /^[0-9a-f-]{36}$/.test(owner);
function observeSuccessfulUploads(owner, callback) {
    if (!validOwner(owner) || typeof callback !== 'function') throw new Error('Exact synthetic owner and observer required.');
    observer = { owner, callback };
}
function clearUploadObserver() { observer = null; }
function injectSecondUploadFailure(owner) {
    if (!validOwner(owner)) throw new Error('Exact synthetic owner required for fault.');
    clearStorageFault();
    faults.owner = owner;
    faults.count = 0;
    faults.firstPath = null;
    faults.firstSucceeded = false;
    faults.injectedPaths = [];
    faults.firstDone = new Promise(resolve => { faults.releaseFirst = resolve; });
}
function storageFaultEvidence() {
    return { owner: faults.owner, attempts: faults.count, firstPath: faults.firstPath,
        firstSucceeded: faults.firstSucceeded, injectedPaths: [...faults.injectedPaths] };
}
function clearStorageFault() {
    faults.releaseFirst?.(false);
    faults.owner = null;
    faults.releaseFirst = null;
}
function storageFetch(realFetch, fallback) {
    return async (input, init) => {
        const raw = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
        if (!raw.pathname.startsWith('/storage/v1/')) return fallback(input, init);
        const url = directStorageUrl(input);
        const uploadPath = init?.method?.toUpperCase() === 'POST' && url.pathname.startsWith('/object/properties/')
            ? decodeURIComponent(url.pathname.slice('/object/properties/'.length)) : null;
        const targetFault = uploadPath?.startsWith(`${faults.owner}/`) && faults.owner;
        const attempt = targetFault ? ++faults.count : 0;
        if (attempt === 2) {
            if (!await faults.firstDone) throw new Error('First real upload or observer failed; second-upload fault not injected.');
            faults.injectedPaths.push(uploadPath);
            return new Response(JSON.stringify({ statusCode: '500', error: 'Injected upload failure', message: 'Injected upload failure' }),
                { status: 500, headers: { 'content-type': 'application/json' } });
        }
        try {
            const response = await realFetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(10000) });
            let observed = false;
            if (response.ok && uploadPath && observer && uploadPath.startsWith(`${observer.owner}/`)) {
                await observer.callback({ owner: observer.owner, path: uploadPath, status: response.status });
                observed = true;
            }
            if (attempt === 1) {
                faults.firstPath = uploadPath;
                faults.firstSucceeded = response.ok && observed;
                faults.releaseFirst?.(faults.firstSucceeded);
            }
            return response;
        } catch (error) {
            if (attempt === 1) faults.releaseFirst?.(false);
            throw error;
        }
    };
}
module.exports = { directStorageUrl, storageFetch, injectSecondUploadFailure, clearStorageFault,
    observeSuccessfulUploads, clearUploadObserver, storageFaultEvidence };
