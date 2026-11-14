import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import ReportsPage from './ReportsPage';
import { fetchTransactionHistory, exportReport } from '../api/adminApi';
vi.mock('../api/adminApi', () => ({ fetchTransactionHistory: vi.fn(), exportReport: vi.fn() }));
beforeEach(() => { vi.resetAllMocks(); fetchTransactionHistory.mockResolvedValue({ transactions: [] }); exportReport.mockResolvedValue(); });
afterEach(cleanup);
test.each([['Export spreadsheet CSV', 'csv'], ['Export data JSON', 'json']])('correct transaction export for %s', async (label, format) => {
  render(<ReportsPage />); fireEvent.click(screen.getByRole('button', { name: label }));
  await waitFor(() => expect(exportReport).toHaveBeenCalledWith('transactions', { format }));
  expect(await screen.findByText('Download started.')).toBeTruthy(); expect(screen.queryByText('Export PDF')).toBeNull();
});
test('failure never claims export success or audit logging', async () => {
  exportReport.mockRejectedValue(new Error('private-export')); render(<ReportsPage />); fireEvent.click(screen.getByRole('button', { name: 'Export spreadsheet CSV' }));
  expect(await screen.findByText('Report download failed. Please try again.')).toBeTruthy();
  expect(screen.queryByText(/Export generated and logged/)).toBeNull(); expect(screen.queryByText('Download started.')).toBeNull();
});
test('pending export disables both actions and unmount prevents feedback', async () => {
  let finish; exportReport.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const { unmount } = render(<ReportsPage />); const csv = screen.getByRole('button', { name: 'Export spreadsheet CSV' });
  fireEvent.click(csv); expect(csv.disabled).toBe(true); expect(screen.getByRole('button', { name: 'Export data JSON' }).disabled).toBe(true);
  unmount(); await act(async () => finish()); expect(exportReport).toHaveBeenCalledTimes(1);
});
