jest.mock('node:child_process', () => ({ spawnSync: jest.fn() }));
jest.mock('pg', () => ({ Client: jest.fn() }));
jest.mock('../integration/local-stack.cjs', () => ({ inspectLocalStack: jest.fn(() => ({ database: {}, jwtSecret: 'synthetic-only', apiUrl: 'http://127.0.0.1:58321' })),
    validateDatabase: jest.fn(), identitySql: 'identity-fixture' }));
jest.mock('../integration/database-state.cjs', () => ({ snapshotState: jest.fn().mockResolvedValue({}), assertSameState: jest.fn() }));
const { Client } = require('pg');
const { spawnSync } = require('node:child_process');
const { snapshotState } = require('../integration/database-state.cjs');
const { runLocal } = require('../integration/run-local.cjs');
const previousExit = process.exitCode;
beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => [] });
    spawnSync.mockReturnValue({ status: 0 });
});
afterEach(() => { process.exitCode = previousExit; jest.restoreAllMocks(); });
test.each([false, undefined])('CRM missing owner schema (%s) refuses before snapshots/fixture child/API', async ready => {
    const query = jest.fn(async sql => ({ rows: sql === 'identity-fixture' ? [{}]
        : sql.startsWith('SELECT id FROM') ? [] : ready === undefined ? [] : [{ ready }] }));
    Client.mockImplementation(() => ({ connect: jest.fn(), query, end: jest.fn().mockResolvedValue() }));
    await runLocal('crm');
    expect(process.exitCode).toBe(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('appointment ownership schema'));
    expect(snapshotState).not.toHaveBeenCalled(); expect(spawnSync).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
});
