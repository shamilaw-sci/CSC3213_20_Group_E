import React from 'react';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { afterEach, test, expect, vi } from 'vitest';
import { UpgradeToSellerTab } from '../../pages/BuyerDashboard';
import api from '../../context/api';
vi.mock('../../context/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
afterEach(cleanup);
test('restores rejection after remount and replaces it with pending on resubmission', async () => {
  api.get.mockResolvedValue({ data: { request: { id: 'rejected', status: 'rejected' } } });
  api.post.mockResolvedValue({ data: {} });
  const first = render(<UpgradeToSellerTab user={{ id: 'buyer', role: 'BUYER' }} />);
  expect(await screen.findByText(/Your Seller upgrade request was rejected/)).toBeInTheDocument();
  first.unmount();
  render(<UpgradeToSellerTab user={{ id: 'buyer', role: 'BUYER' }} />);
  expect(await screen.findByText(/Your Seller upgrade request was rejected/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Request Seller Upgrade' }));
  expect(await screen.findByText(/Request submitted!/)).toBeInTheDocument();
  expect(screen.queryByText(/Your Seller upgrade request was rejected/)).not.toBeInTheDocument();
});
test('restores pending request on mount and prevents resubmission', async () => {
  api.get.mockResolvedValue({ data: { request: { id: 'pending', status: 'pending' } } });
  render(<UpgradeToSellerTab user={{ id: 'buyer', role: 'BUYER' }} />);
  expect(await screen.findByText(/Request submitted!/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Request Seller Upgrade' })).not.toBeInTheDocument();
});
test('failed status lookup offers retry instead of enabling duplicate request', async () => {
  api.get.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ data: { request: null } });
  render(<UpgradeToSellerTab user={{ id: 'buyer', role: 'BUYER' }} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Retry status check' }));
  expect(await screen.findByRole('button', { name: 'Request Seller Upgrade' })).toBeEnabled();
});
test('a previous account submission cannot mark the new account as pending', async () => {
  api.get.mockResolvedValue({ data: { request: null } });
  let resolveSubmission;
  api.post.mockReturnValue(new Promise(resolve => { resolveSubmission = resolve; }));
  const view = render(<UpgradeToSellerTab user={{ id: 'first', role: 'BUYER' }} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Request Seller Upgrade' }));
  view.rerender(<UpgradeToSellerTab user={{ id: 'second', role: 'BUYER' }} />);
  await screen.findByRole('button', { name: /Submitting|Request Seller Upgrade/ });
  await act(async () => { resolveSubmission({ data: {} }); });
  expect(screen.queryByText(/Request submitted!/)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Request Seller Upgrade' })).toBeEnabled();
});
