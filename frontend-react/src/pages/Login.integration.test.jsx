import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Toaster, toast } from 'react-hot-toast';
import Login from './Login';
import { UserAuthProvider, useAuth } from '../context/UserAuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Only the HTTP boundary is controlled: Login, provider and route guards are real.
const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('../context/api', () => ({ default: api }));
vi.mock('@lottiefiles/react-lottie-player', () => ({ Player: () => null }));
vi.mock('framer-motion', () => ({ m: { div: ({ children }) => <div>{children}</div> } }));

const account = (role) => ({ id: `fixture-${role}`, name: 'Fixture user', email: 'login@example.test', role });
const unauthorized = () => Object.assign(new Error('Not authenticated'), { response: { status: 401 } });

function IdentityObserver() {
  const { user } = useAuth();
  return <output aria-label="Current identity">{user ? `${user.id}:${user.role}` : 'anonymous'}</output>;
}

function Destination({ name }) {
  const { logout } = useAuth();
  return <>
    <h1>{name}</h1>
    <button onClick={logout}>Sign out</button>
  </>;
}

function show(entry = '/login') {
  return render(<MemoryRouter initialEntries={[entry]}>
    <UserAuthProvider>
      <Toaster />
      <IdentityObserver />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Destination name="Home destination" />} />
        <Route path="/seller-dashboard" element={<ProtectedRoute allowedRoles={['SELLER']}><Destination name="Seller destination" /></ProtectedRoute>} />
        <Route path="/agent-dashboard" element={<ProtectedRoute allowedRoles={['AGENT', 'PENDING_AGENT', 'REJECTED_AGENT']}><Destination name="Agent destination" /></ProtectedRoute>} />
        <Route path="/buyer-dashboard" element={<ProtectedRoute allowedRoles={['BUYER', 'USER', 'ADMIN', 'AGENT', 'SELLER']}><Destination name="Buyer destination" /></ProtectedRoute>} />
        <Route path="/add-property" element={<ProtectedRoute allowedRoles={['SELLER', 'AGENT']}><Destination name="Listing destination" /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Destination name="Messages destination" /></ProtectedRoute>} />
      </Routes>
    </UserAuthProvider>
  </MemoryRouter>);
}

async function submitPassword() {
  fireEvent.change(await screen.findByLabelText(/Email Address/), { target: { value: 'login@example.test' } });
  fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'FixturePassword123!' } });
  const submit = screen.getByRole('button', { name: 'Sign In', exact: true });
  await waitFor(() => expect(submit).toBeEnabled());
  fireEvent.click(submit);
}

beforeEach(() => {
  vi.resetAllMocks();
  // jsdom lacks this browser API used by the real toast's reduced-motion check.
  vi.stubGlobal('matchMedia', vi.fn((media) => ({
    matches: false, media, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  })));
  api.get.mockRejectedValue(unauthorized());
  api.post.mockImplementation(async (path) => {
    if (path === '/auth/logout') return { data: { message: 'Logged out successfully' } };
    throw new Error(`Unexpected API request: ${path}`);
  });
  // Prevent Login from loading an external SDK; SDK behavior has its own tests.
  window.google = { accounts: { id: { initialize: vi.fn(), renderButton: vi.fn() } } };
});

afterEach(() => {
  cleanup();
  toast.remove();
  delete window.google;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Password login through the real auth provider and router', () => {
  test.each([
    ['BUYER', 'Home destination'],
    ['SELLER', 'Seller destination'],
    ['AGENT', 'Agent destination'],
  ])('%s login exposes the authenticated identity at its destination', async (role, destination) => {
    api.post.mockResolvedValueOnce({ data: { message: 'Login successful.', user: account(role) } });
    show();
    await submitPassword();
    expect(await screen.findByRole('heading', { name: destination })).toBeInTheDocument();
    expect(screen.getByLabelText('Current identity')).toHaveTextContent(`fixture-${role}:${role}`);
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'login@example.test', password: 'FixturePassword123!' });
  });

  test('an explicit allowed return destination takes precedence over the default dashboard', async () => {
    api.post.mockResolvedValueOnce({ data: { user: account('SELLER') } });
    show({ pathname: '/login', state: { from: { pathname: '/messages' } } });
    await submitPassword();
    expect(await screen.findByRole('heading', { name: 'Messages destination' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current identity')).toHaveTextContent('fixture-SELLER:SELLER');
  });

  test('invalid credentials keep the login form visible and show server feedback', async () => {
    const error = Object.assign(new Error('Invalid credentials'), { response: { status: 400, data: { message: 'Invalid email or password.' } } });
    api.post.mockRejectedValueOnce(error);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    show();
    await submitPassword();
    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sign In', exact: true })).toBeEnabled());
    expect(screen.getByLabelText('Current identity')).toHaveTextContent('anonymous');
    expect(consoleError).toHaveBeenCalledWith('password_signin_failed');
  });
});

describe('Session restoration and actual role guard decisions', () => {
  test('does not expose protected content while session restoration is pending', async () => {
    let finish;
    api.get.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    show('/seller-dashboard');
    expect(screen.queryByRole('heading', { name: 'Seller destination' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Email Address/)).not.toBeInTheDocument();
    await act(async () => finish({ data: { user: account('SELLER') } }));
    expect(await screen.findByRole('heading', { name: 'Seller destination' })).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/auth/me');
  });

  test('an expired or absent session redirects a protected page to login', async () => {
    show('/messages');
    expect(await screen.findByLabelText(/Email Address/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Messages destination' })).not.toBeInTheDocument();
  });

  test('a restored buyer cannot enter the seller dashboard', async () => {
    api.get.mockResolvedValueOnce({ data: { user: account('BUYER') } });
    show('/seller-dashboard');
    expect(await screen.findByRole('heading', { name: 'Home destination' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current identity')).toHaveTextContent('fixture-BUYER:BUYER');
    expect(screen.queryByRole('heading', { name: 'Seller destination' })).not.toBeInTheDocument();
  });

  test.each(['AGENT', 'PENDING_AGENT', 'REJECTED_AGENT'])('%s can restore the agent dashboard', async (role) => {
    api.get.mockResolvedValueOnce({ data: { user: account(role) } });
    show('/agent-dashboard');
    expect(await screen.findByRole('heading', { name: 'Agent destination' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current identity')).toHaveTextContent(`fixture-${role}:${role}`);
  });

  test.each(['PENDING_AGENT', 'REJECTED_AGENT', 'BUYER'])('%s cannot enter the listing form', async (role) => {
    api.get.mockResolvedValueOnce({ data: { user: account(role) } });
    show('/add-property');
    expect(await screen.findByRole('heading', { name: 'Home destination' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Listing destination' })).not.toBeInTheDocument();
  });

  test.each(['SELLER', 'AGENT'])('%s can enter the listing form', async (role) => {
    api.get.mockResolvedValueOnce({ data: { user: account(role) } });
    show('/add-property');
    expect(await screen.findByRole('heading', { name: 'Listing destination' })).toBeInTheDocument();
  });

  test.each(['BUYER', 'USER', 'ADMIN', 'AGENT', 'SELLER'])('preserves current buyer-dashboard allowance for %s', async (role) => {
    api.get.mockResolvedValueOnce({ data: { user: account(role) } });
    show('/buyer-dashboard');
    expect(await screen.findByRole('heading', { name: 'Buyer destination' })).toBeInTheDocument();
  });

  test.each(['success', 'network failure'])('consumer logout clears local auth and guards the page after %s', async (outcome) => {
    api.get.mockResolvedValueOnce({ data: { user: account('BUYER') } });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    if (outcome === 'network failure') api.post.mockRejectedValueOnce(new Error('Network unavailable'));
    show('/messages');
    await screen.findByRole('heading', { name: 'Messages destination' });
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByLabelText(/Email Address/)).toBeInTheDocument();
    expect(screen.getByLabelText('Current identity')).toHaveTextContent('anonymous');
    expect(screen.queryByRole('heading', { name: 'Messages destination' })).not.toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith('/auth/logout');
    if (outcome === 'network failure') expect(consoleError).toHaveBeenCalledWith('user_logout_failed');
  });
});
