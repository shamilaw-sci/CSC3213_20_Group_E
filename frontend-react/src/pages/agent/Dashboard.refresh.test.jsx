import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import Dashboard from './Dashboard';
const mocks = vi.hoisted(() => ({ api: { get: vi.fn(), put: vi.fn(), delete: vi.fn() },
  auth: { user: { id: 'agent', name: 'Agent', role: 'AGENT' } }, toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../context/api', () => ({ default: mocks.api }));
vi.mock('../../context/UserAuthContext', () => ({ useAuth: () => mocks.auth }));
vi.mock('../../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('../../components/layout/Footer', () => ({ default: () => null }));
vi.mock('react-hot-toast', () => ({ default: mocks.toast }));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const lead = (id = 'a', stage = 'New') => ({ id, lead_status: stage, buyer: { name: `Buyer ${id}` } });
const snapshot = rows => ({ data: { leads: rows } });
let reads;
beforeEach(() => {
  vi.resetAllMocks();
  reads = [];
  mocks.api.get.mockImplementation(path => path === '/agents/leads'
    ? (reads.shift() || Promise.resolve(snapshot([lead()])))
    : Promise.resolve({ data: path === '/agents/dashboard-stats' ? { stats: {} } : { properties: [] } }));
  mocks.api.put.mockResolvedValue({}); mocks.api.delete.mockResolvedValue({});
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const flush = async () => { await act(async () => { await Promise.resolve(); }); };
async function show() {
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: /Client Pipeline & CRM/ }));
  await screen.findByText('Buyer a');
}
const refresh = () => screen.getByTitle('Refresh Analytics');
const stages = () => screen.getAllByRole('combobox');
const move = (index = 0) => fireEvent.change(stages()[index], { target: { value: 'Offer' } });

test('older manual refresh cannot replace a newer mutation snapshot', async () => {
  const old = deferred(), latest = deferred();
  reads.push(Promise.resolve(snapshot([lead()])), old.promise, latest.promise);
  await show(); fireEvent.click(refresh()); move(); await flush();
  await act(async () => { latest.resolve(snapshot([lead('a', 'Offer')])); });
  await act(async () => { old.resolve(snapshot([lead()])); });
  expect(stages()[0]).toHaveValue('Offer');
});

test('obsolete refresh error cannot toast after newer data succeeds', async () => {
  const old = deferred();
  reads.push(Promise.resolve(snapshot([lead()])), old.promise, Promise.resolve(snapshot([lead('a', 'Offer')])));
  await show(); fireEvent.click(refresh()); move(); await flush();
  await act(async () => { old.reject(new Error('Obsolete refresh')); });
  expect(mocks.toast.error).not.toHaveBeenCalled(); expect(stages()[0]).toHaveValue('Offer');
});

test('old refresh completion cannot release the latest pending refresh indicator', async () => {
  const old = deferred(), latest = deferred();
  reads.push(Promise.resolve(snapshot([lead()])), old.promise, latest.promise);
  await show(); fireEvent.click(refresh()); move(); await flush();
  await act(async () => { old.resolve(snapshot([lead()])); });
  expect(refresh()).toBeDisabled();
  await act(async () => { latest.resolve(snapshot([lead('a', 'Offer')])); });
  expect(refresh()).toBeEnabled(); expect(stages()[0]).toHaveValue('Offer');
});

test('pre-mutation refresh cannot erase an optimistic pending stage', async () => {
  const old = deferred(), mutation = deferred(); mocks.api.put.mockReturnValue(mutation.promise);
  reads.push(Promise.resolve(snapshot([lead()])), old.promise, Promise.resolve(snapshot([lead('a', 'Offer')])));
  await show(); fireEvent.click(refresh()); move();
  await act(async () => { old.resolve(snapshot([lead()])); });
  expect(stages()[0]).toHaveValue('Offer'); expect(refresh()).toBeDisabled();
  await act(async () => { mutation.resolve({}); });
});

test('old snapshot cannot resurrect a successfully deleted lead', async () => {
  const old = deferred();
  reads.push(Promise.resolve(snapshot([lead()])), old.promise, Promise.resolve(snapshot([])));
  await show(); fireEvent.click(refresh()); fireEvent.click(screen.getByTitle('Delete Lead')); await flush();
  expect(screen.queryByText('Buyer a')).not.toBeInTheDocument();
  await act(async () => { old.resolve(snapshot([lead()])); });
  expect(screen.queryByText('Buyer a')).not.toBeInTheDocument();
});

test('unmounted refresh failure does not toast or launch work', async () => {
  const old = deferred(); reads.push(Promise.resolve(snapshot([lead()])), old.promise);
  await show(); fireEvent.click(refresh()); cleanup();
  const count = mocks.api.get.mock.calls.length;
  await act(async () => { old.reject(new Error('Unmounted refresh')); });
  expect(mocks.toast.error).not.toHaveBeenCalled(); expect(mocks.api.get).toHaveBeenCalledTimes(count);
});

test('overlapping mutations reconcile only after all pending writes settle', async () => {
  const a = deferred(), b = deferred(); mocks.api.put.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
  reads.push(Promise.resolve(snapshot([lead(), lead('b')])), Promise.resolve(snapshot([lead('a', 'Offer'), lead('b', 'Offer')])));
  await show(); move(0); move(1);
  await act(async () => { a.resolve({}); });
  expect(mocks.api.get.mock.calls.filter(([path]) => path === '/agents/leads')).toHaveLength(1);
  expect(refresh()).toBeDisabled();
  await act(async () => { b.resolve({}); });
  expect(mocks.api.get.mock.calls.filter(([path]) => path === '/agents/leads')).toHaveLength(2);
  expect(stages().map(stage => stage.value)).toEqual(['Offer', 'Offer']);
});
