import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const client = vi.hoisted(() => ({ get: vi.fn(), interceptors: { request: { use: vi.fn() } } }));
vi.mock('axios', () => ({ default: { create: () => client } }));
import { exportReport } from './adminApi';
let click;
beforeEach(() => {
  vi.clearAllMocks(); client.get.mockResolvedValue({ data: new Blob(['synthetic']) });
  vi.stubGlobal('URL', class extends URL { static createObjectURL = vi.fn(() => 'blob:synthetic'); static revokeObjectURL = vi.fn(); });
  click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
test.each([['csv', 'text/csv;charset=utf-8'], ['json', 'application/json;charset=utf-8']])('downloads %s with matching extension and cleanup', async (format, mediaType) => {
  let anchor; click.mockImplementation(function () { anchor = this; });
  await exportReport('transactions', { format });
  expect(client.get).toHaveBeenCalledWith('/admin/reports/export/transactions', { params: { format }, responseType: 'blob' });
  expect(anchor.download).toBe(`thirasara-transactions-report.${format}`);
  expect(URL.createObjectURL.mock.calls[0][0].type).toBe(mediaType);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:synthetic');
});
test('click failure revokes URL and rejects without success', async () => {
  click.mockImplementation(() => { throw new Error('synthetic click failure'); });
  await expect(exportReport('transactions', { format: 'json' })).rejects.toThrow();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:synthetic');
});
test.each([['pdf', {}], ['transactions', { format: 'pdf' }], ['users', { format: ['json'] }]])('rejects unsupported type/format without request', async (type, options) => {
  await expect(exportReport(type, options)).rejects.toThrow(); expect(client.get).not.toHaveBeenCalled();
});
test('default remains CSV', async () => {
  let anchor; click.mockImplementation(function () { anchor = this; }); await exportReport('users'); expect(anchor.download).toBe('thirasara-users-report.csv');
});
