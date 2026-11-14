import { render, screen, cleanup, act } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import api from '../../context/api';
import SellerRequestNotice from './SellerRequestNotice';
vi.mock('../../context/api', () => ({ default: { get: vi.fn() } }));
afterEach(cleanup);

test('profile restores rejected message after reload', async () => {
  api.get.mockResolvedValue({ data: { request: { status: 'rejected' } } });
  const view = render(<SellerRequestNotice userId="buyer" />);
  expect(await screen.findByRole('status')).toHaveTextContent('Your Seller upgrade request was rejected');
  view.unmount();
  render(<SellerRequestNotice userId="buyer" />);
  expect(await screen.findByRole('status')).toHaveTextContent('Your Seller upgrade request was rejected');
});

test('an old account lookup cannot display its rejection for another account', async () => {
  let resolveFirst;
  api.get.mockReturnValueOnce(new Promise(resolve => { resolveFirst = resolve; }))
    .mockResolvedValueOnce({ data: { request: null } });
  const view = render(<SellerRequestNotice userId="first" />);
  view.rerender(<SellerRequestNotice userId="second" />);
  await act(async () => { resolveFirst({ data: { request: { status: 'rejected' } } }); });
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

test('pending status does not display an old rejection', async () => {
  api.get.mockResolvedValue({ data: { request: { status: 'pending' } } });
  await act(async () => { render(<SellerRequestNotice userId="buyer" />); });
  expect(screen.queryByText(/was rejected/)).not.toBeInTheDocument();
});
