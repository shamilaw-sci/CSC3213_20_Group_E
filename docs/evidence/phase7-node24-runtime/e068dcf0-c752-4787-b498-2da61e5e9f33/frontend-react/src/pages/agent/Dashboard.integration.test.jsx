import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import Dashboard from './Dashboard';

const mocks = vi.hoisted(() => ({ api: { get: vi.fn(), put: vi.fn(), delete: vi.fn() },
  auth: { user: { id: 'agent', name: 'CRM Agent', role: 'AGENT' } }, toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../context/api', () => ({ default: mocks.api }));
vi.mock('../../context/UserAuthContext', () => ({ useAuth: () => mocks.auth }));
vi.mock('../../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('../../components/layout/Footer', () => ({ default: () => null }));
vi.mock('react-hot-toast', () => ({ default: mocks.toast }));
const lead = (id, direct = false) => ({ id, is_direct_booking: direct, lead_status: 'New',
  buyer: { name: direct ? 'Guest Buyer' : 'Conversation Buyer', email: `${id}@example.test`, phone: '0771234567' },
  properties: { id: 'house', title: 'CRM House', images: [], price: 1000 },
  notes: direct ? 'Guest note' : 'Latest inquiry', timeframe: 'ASAP', pre_approved: false,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' });
let rows;
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.user = { id: 'agent', name: 'CRM Agent', role: 'AGENT' };
  rows = [lead('direct', true), lead('conversation')];
  mocks.api.get.mockImplementation(async path => {
    if (path === '/agents/leads') return { data: { leads: structuredClone(rows) } };
    if (path === '/agents/dashboard-stats') return { data: { stats: { totalLeads: rows.length } } };
    if (path === '/properties/my-listings') return { data: { properties: [] } };
    throw new Error(`Unexpected API request: ${path}`);
  });
  mocks.api.put.mockImplementation(async (path, payload) => {
    rows = rows.map(row => path.endsWith(`/${row.id}`) ? { ...row, ...payload } : row);
    return { data: {} };
  });
  mocks.api.delete.mockImplementation(async path => { rows = rows.filter(row => !path.endsWith(`/${row.id}`)); return { data: {} }; });
  vi.spyOn(window, 'confirm').mockReturnValue(false);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function show() {
  return render(<MemoryRouter initialEntries={['/agent-dashboard']}><Routes>
    <Route path="/agent-dashboard" element={<Dashboard />} />
    <Route path="/profile" element={<p>Profile destination</p>} />
  </Routes></MemoryRouter>);
}
async function pipeline() {
  show(); fireEvent.click(await screen.findByRole('button', { name: /Client Pipeline & CRM/ }));
  await screen.findByText('Guest Buyer');
}
const stages = () => screen.getAllByRole('combobox');
const card = name => screen.getByRole('heading', { name }).closest('[class~="group/card"]');
test('renders both source notes, contact/property details and successful stages after reload', async () => {
  await pipeline();
  expect(screen.getByText('Conversation Buyer')).toBeInTheDocument();
  expect(screen.getAllByText('CRM House')).toHaveLength(2);
  for (const [index, id] of [[0, 'direct'], [1, 'conversation']]) {
    fireEvent.change(card(id === 'direct' ? 'Guest Buyer' : 'Conversation Buyer').querySelector('select'), { target: { value: 'Offer' } });
    await waitFor(() => expect(mocks.api.put).toHaveBeenCalledWith(`/agents/leads/${id}`, { lead_status: 'Offer' }));
    await waitFor(() => expect(stages().filter(select => select.value === 'Offer')).toHaveLength(index + 1));
    await waitFor(() => expect(mocks.api.get.mock.calls.filter(([path]) => path === '/agents/leads').length).toBeGreaterThan(index + 1));
  }
  fireEvent.click(card('Guest Buyer').querySelector('[title="View Details"]'));
  expect(screen.getByText('Appointment & Lead Details')).toBeInTheDocument();
  expect(screen.getByText('Guest note')).toBeInTheDocument();
  expect(stages().at(-1)).toHaveValue('Offer');
});
test('failed card stage reload restores authoritative stage', async () => {
  mocks.api.put.mockRejectedValue(new Error('Controlled rejection'));
  await pipeline();
  fireEvent.change(stages()[0], { target: { value: 'Closed' } });
  await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith('Failed to update lead status'));
  await waitFor(() => expect(stages().every(select => select.value === 'New')).toBe(true));
});
test('failed stage change while detail stays open restores authoritative modal and card', async () => {
  mocks.api.put.mockRejectedValue(new Error('Controlled rejection'));
  await pipeline(); fireEvent.click(screen.getAllByTitle('View Details')[0]);
  fireEvent.change(stages().at(-1), { target: { value: 'Closed' } });
  await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith('Failed to update lead status'));
  await waitFor(() => expect(mocks.api.get.mock.calls.filter(([path]) => path === '/agents/leads')).toHaveLength(2));
  await waitFor(() => expect(stages().every(select => select.value === 'New')).toBe(true));
  expect(screen.getByText('Appointment & Lead Details')).toBeInTheDocument();
});
test('rejected mutation and refresh restore the previous modal and card stages', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  await pipeline(); fireEvent.click(screen.getAllByTitle('View Details')[0]);
  mocks.api.put.mockRejectedValue(new Error('Controlled mutation rejection'));
  mocks.api.get.mockRejectedValue(new Error('Controlled refresh rejection'));
  fireEvent.change(stages().at(-1), { target: { value: 'Closed' } });
  await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith('Failed to load agent hub data'));
  await waitFor(() => expect(stages().every(select => select.value === 'New')).toBe(true));
});
const modalDelete = () => screen.getAllByRole('button', { name: 'Delete Lead' }).find(button => button.textContent.includes('Delete Lead'));
test('delete cancellation, failure recovery and successful removal close open detail', async () => {
  await pipeline(); fireEvent.click(screen.getAllByTitle('View Details')[0]);
  fireEvent.click(modalDelete());
  expect(mocks.api.delete).not.toHaveBeenCalled();
  window.confirm.mockReturnValue(true);
  mocks.api.delete.mockRejectedValueOnce({ response: { data: { message: 'Controlled delete failure' } } });
  fireEvent.click(modalDelete());
  await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith('Controlled delete failure'));
  expect(screen.getByText('Appointment & Lead Details')).toBeInTheDocument();
  expect(screen.getAllByText('Guest Buyer')).toHaveLength(2);
  fireEvent.click(modalDelete());
  await waitFor(() => expect(screen.queryByText('Guest Buyer')).not.toBeInTheDocument());
  expect(screen.queryByText('Appointment & Lead Details')).not.toBeInTheDocument();
  expect(screen.getByText('Conversation Buyer')).toBeInTheDocument();
});
test.each([null, 'BUYER', 'PENDING_AGENT', 'REJECTED_AGENT', 'BANNED'])('unauthorized %s redirects without API calls', async role => {
  mocks.auth.user = role ? { id: 'consumer', role } : null;
  show(); expect(await screen.findByText('Profile destination')).toBeInTheDocument();
  expect(mocks.api.get).not.toHaveBeenCalled();
});
test('initial load error remains recoverable with refresh', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  mocks.api.get.mockRejectedValueOnce(new Error('Controlled load failure'));
  show();
  await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith('Failed to load agent hub data'));
  fireEvent.click(await screen.findByTitle('Refresh Analytics'));
  fireEvent.click(screen.getByRole('button', { name: /Client Pipeline & CRM/ }));
  expect(await screen.findByText('Guest Buyer')).toBeInTheDocument();
});
