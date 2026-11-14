jest.mock('../repositories/propertyRepository', () => ({
    uploadImage: jest.fn(), addProperty: jest.fn(), removeImages: jest.fn()
}));
jest.mock('../utils/logger', () => ({ error: jest.fn() }));
const repo = require('../repositories/propertyRepository');
const logger = require('../utils/logger');
const { addProperty } = require('../controllers/property/propertyWriteController');
const deferred = () => {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
};
const turn = () => new Promise(resolve => setImmediate(resolve));
const file = name => ({ originalname: `${name}.png`, buffer: name, mimetype: 'image/png' });
const request = files => ({ user: { id: 'synthetic-seller', role: 'SELLER' }, body: {}, files });
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
beforeEach(() => {
    jest.resetAllMocks();
    repo.removeImages.mockResolvedValue();
    repo.addProperty.mockImplementation(async row => ({ id: 'synthetic-property', ...row }));
});

test.each(['images', 'virtualTours'])('%s rollback waits for late upload before removal', async kind => {
    const first = deferred(), late = deferred();
    const objects = new Set();
    const error = new Error('synthetic first upload failure');
    repo.uploadImage.mockImplementation((path, name) => {
        if (name === 'baseline') { objects.add(path); return Promise.resolve('baseline-url'); }
        return (name === 'fail' ? first.promise : late.promise).then(url => { objects.add(path); return url; });
    });
    repo.removeImages.mockImplementation(async paths => { for (const path of paths) objects.delete(path); });
    const req = request(kind === 'images' ? { images: [file('fail'), file('late')] }
        : { images: [file('baseline')], virtualTours: [file('fail'), file('late')] });
    const next = jest.fn();
    const run = addProperty(req, response(), next);
    await turn();
    first.reject(error);
    await turn();
    const removedEarly = repo.removeImages.mock.calls.length;
    late.resolve('late-url');
    await run;
    await turn();
    expect(removedEarly).toBe(0);
    expect(repo.removeImages).toHaveBeenCalledWith(repo.uploadImage.mock.calls.map(call => call[0]));
    expect(objects.size).toBe(0);
    expect(repo.addProperty).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
});

test('insert failure is forwarded only after cleanup settles', async () => {
    const cleanup = deferred();
    const error = new Error('synthetic insert failure');
    repo.uploadImage.mockResolvedValue('photo-url');
    repo.addProperty.mockRejectedValue(error);
    repo.removeImages.mockReturnValue(cleanup.promise);
    const next = jest.fn();
    const run = addProperty(request({ images: [file('photo')] }), response(), next);
    await turn();
    const forwardedEarly = next.mock.calls.length;
    cleanup.resolve();
    await run;
    expect(forwardedEarly).toBe(0);
    expect(next).toHaveBeenCalledWith(error);
});

test('cleanup failure preserves original error and sanitized recovery metadata', async () => {
    const original = new Error('synthetic insert failure');
    repo.uploadImage.mockResolvedValue('photo-url');
    repo.addProperty.mockRejectedValue(original);
    repo.removeImages.mockRejectedValue(new Error('synthetic-private-storage-error'));
    const next = jest.fn();
    await addProperty(request({ images: [file('photo')] }), response(), next);
    expect(next).toHaveBeenCalledWith(original);
    expect(logger.error).toHaveBeenCalledWith('Property upload rollback requires recovery.', {
        event: 'property_upload_rollback_failed', sellerId: 'synthetic-seller',
        paths: repo.uploadImage.mock.calls.map(call => call[0])
    });
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain('synthetic-private-storage-error');
});

test('successful out-of-order uploads preserve input order and pending defaults', async () => {
    const first = deferred(), second = deferred();
    repo.uploadImage.mockImplementation((_path, name) => name === 'first' ? first.promise : second.promise);
    const res = response();
    const next = jest.fn();
    const run = addProperty(request({ images: [file('first'), file('second')] }), res, next);
    second.resolve('second-url'); first.resolve('first-url');
    await run;
    expect(repo.addProperty).toHaveBeenCalledWith(expect.objectContaining({ images: ['first-url', 'second-url'],
        status: 'pending', payment_status: 'Unpaid', seller_id: 'synthetic-seller' }));
    expect(repo.removeImages).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(next).not.toHaveBeenCalled();
});

test('multiple failures preserve the first observed rejection', async () => {
    const first = deferred(), second = deferred();
    repo.uploadImage.mockImplementation((_path, name) => name === 'first' ? first.promise : second.promise);
    const next = jest.fn();
    const run = addProperty(request({ images: [file('first'), file('second')] }), response(), next);
    const original = new Error('first observed failure');
    second.reject(original);
    await turn();
    first.reject(new Error('later failure'));
    await run;
    expect(next).toHaveBeenCalledWith(original);
});

test('unauthorized role cannot start uploads or cleanup', async () => {
    const req = request({ images: [file('photo')] });
    req.user.role = 'BUYER';
    const res = response();
    await addProperty(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
    expect(repo.uploadImage).not.toHaveBeenCalled();
    expect(repo.removeImages).not.toHaveBeenCalled();
    expect(repo.addProperty).not.toHaveBeenCalled();
});
