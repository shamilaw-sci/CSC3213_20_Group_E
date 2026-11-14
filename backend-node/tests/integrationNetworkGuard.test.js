const { allowSocket, directRestUrl } = require('../integration/network-policy.cjs');

describe('Integration outbound policy without network calls', () => {
    test.each([
        [{ host: '127.0.0.1', port: 58322 }],
        [[{ host: '127.0.0.1', port: 12345, path: '/api/auth/login' }, () => {}]],
        [58321, '127.0.0.1'],
    ])('accepts only verified stack ports or the registered app listener %j', (...args) => {
        expect(allowSocket(args, new Set([12345]))).toBe(true);
    });
    test.each([
        [{ host: 'example.com', port: 443 }], [{ host: 'localhost', port: 5000 }],
        [{ path: '/tmp/socket' }], [{ host: '127.0.0.1', port: 0 }],
        [{ host: '127.0.0.1', port: 99999 }], [{ port: 80 }], [null],
        [{ host: '127.0.0.1', port: 5000 }], [{ host: '::1', port: 5000 }],
        [{ host: '::1', port: 12345 }], [{ host: '::1', port: 58322 }],
        [[{ host: '127.0.0.1', port: 5000, path: '/api/auth/login' }, () => {}]],
        [{ host: '127.0.0.1', port: 12346 }], ['/tmp/socket'],
        [[{ host: 'example.com', port: 58321 }, () => {}]],
    ])('refuses non-loopback/implicit/IPC sockets %j', (...args) => {
        expect(allowSocket(args, new Set([12345, 5000]))).toBe(false);
    });
    test('a listener port is allowed only while explicitly registered', () => {
        const ports = new Set();
        const args = [{ host: '127.0.0.1', port: 12345 }];
        expect(allowSocket(args, ports)).toBe(false);
        ports.add(12345);
        expect(allowSocket(args, ports)).toBe(true);
        ports.delete(12345);
        expect(allowSocket(args, ports)).toBe(false);
    });
    test('maps only the verified direct PostgREST route, preserving query', () => {
        expect(directRestUrl('http://127.0.0.1:58321/rest/v1/users?select=id').href)
            .toBe('http://127.0.0.1:58321/users?select=id');
    });
    test.each([
        'https://hosted.example/rest/v1/users', 'http://127.0.0.1:5000/rest/v1/users',
        'http://127.0.0.1:58321/auth/v1/users', 'http://127.0.0.1:58321/rest/v1/../../users',
        'http://credential@127.0.0.1:58321/rest/v1/users',
    ])('rejects unexpected fetch URL %s', url => {
        expect(() => directRestUrl(url)).toThrow(/refused/);
    });
});
