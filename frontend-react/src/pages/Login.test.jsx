import React from 'react';
import { act, cleanup, render, waitFor, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import Login from './Login';
import { saveConsent } from '../components/privacy/consentStore';

const auth = vi.hoisted(() => ({ login: vi.fn(), loginWithGoogle: vi.fn() }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => auth }));
vi.mock('@lottiefiles/react-lottie-player', () => ({ Player: () => null }));
vi.mock('framer-motion', () => ({ m: { div: ({ children }) => <div>{children}</div> } }));
beforeEach(() => { localStorage.clear(); saveConsent({ social: true, media: false }); });
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
  await waitFor(() => expect(initialize).toHaveBeenCalled());
  await act(async () => {
    await initialize.mock.calls.at(-1)[0].callback({ credential: 'test-token' });
  });
  await waitFor(() => expect(nextLogin).toHaveBeenCalledWith('test-token'));
  expect(initialLogin).not.toHaveBeenCalled();
});

test('shares a pending SDK across provider updates and ignores stale callbacks', async () => {
  auth.loginWithGoogle = vi.fn();
  const view = render(<MemoryRouter><Login /></MemoryRouter>);
  auth.loginWithGoogle = vi.fn();
  view.rerender(<MemoryRouter><Login /></MemoryRouter>);
  expect(document.querySelectorAll('script[src="https://accounts.google.com/gsi/client"]')).toHaveLength(1);
  const initialize = vi.fn();
  window.google = { accounts: { id: { initialize, renderButton: vi.fn() } } };
  await act(async () => { document.querySelector('script[src="https://accounts.google.com/gsi/client"]').onload(); });
  expect(initialize).toHaveBeenCalledTimes(1);
  view.unmount();
  document.querySelector('script[src="https://accounts.google.com/gsi/client"]').remove();
});

test('without consent email login remains available and Google never initializes', () => {
  saveConsent({ social: false, media: false });
  const initialize = vi.fn();
  window.google = { accounts: { id: { initialize, renderButton: vi.fn() } } };
  render(<MemoryRouter><Login /></MemoryRouter>);
  expect(screen.getByRole('button', { name: /Enable Google sign-in/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  expect(initialize).not.toHaveBeenCalled();
});
