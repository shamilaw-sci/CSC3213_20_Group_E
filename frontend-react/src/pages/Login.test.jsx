import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, test, vi } from 'vitest';
import Login from './Login';

const auth = vi.hoisted(() => ({ login: vi.fn(), loginWithGoogle: vi.fn() }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => auth }));
vi.mock('@lottiefiles/react-lottie-player', () => ({ Player: () => null }));
vi.mock('framer-motion', () => ({ m: { div: ({ children }) => <div>{children}</div> } }));
afterEach(() => { cleanup(); delete window.google; vi.clearAllMocks(); });

test('Google sign-in uses the current auth callback after a provider update', async () => {
  const initialLogin = vi.fn().mockResolvedValue({ user: { role: 'BUYER' } });
  const nextLogin = vi.fn().mockResolvedValue({ user: { role: 'BUYER' } });
  auth.loginWithGoogle = initialLogin;
  const initialize = vi.fn();
  window.google = { accounts: { id: { initialize, renderButton: vi.fn() } } };
  const view = render(<MemoryRouter><Login /></MemoryRouter>);
  auth.loginWithGoogle = nextLogin;
  view.rerender(<MemoryRouter><Login /></MemoryRouter>);
  await act(async () => {
    await initialize.mock.calls.at(-1)[0].callback({ credential: 'test-token' });
  });
  await waitFor(() => expect(nextLogin).toHaveBeenCalledWith('test-token'));
  expect(initialLogin).not.toHaveBeenCalled();
});

test('replaces a pending SDK load on provider update and removes it on unmount', () => {
  auth.loginWithGoogle = vi.fn();
  const view = render(<MemoryRouter><Login /></MemoryRouter>);
  const staleOnLoad = document.querySelector('script[src="https://accounts.google.com/gsi/client"]').onload;
  auth.loginWithGoogle = vi.fn();
  view.rerender(<MemoryRouter><Login /></MemoryRouter>);
  expect(document.querySelectorAll('script[src="https://accounts.google.com/gsi/client"]')).toHaveLength(1);
  const initialize = vi.fn();
  window.google = { accounts: { id: { initialize, renderButton: vi.fn() } } };
  staleOnLoad();
  expect(initialize).not.toHaveBeenCalled();
  document.querySelector('script[src="https://accounts.google.com/gsi/client"]').onload();
  expect(initialize).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(document.querySelectorAll('script[src="https://accounts.google.com/gsi/client"]')).toHaveLength(0);
});
