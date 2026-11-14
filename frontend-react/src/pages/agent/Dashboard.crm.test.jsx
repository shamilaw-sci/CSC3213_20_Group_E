import React from 'react';
import { cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import Dashboard from './Dashboard';
const mocks = vi.hoisted(() => ({ auth: { user: { id: 'agent', role: 'AGENT' } }, api: { get: vi.fn(), put: vi.fn(), delete: vi.fn() }, toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('../../context/api', () => ({ default: mocks.api }));
vi.mock('../../context/UserAuthContext', () => ({ useAuth: () => mocks.auth }));
vi.mock('../../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('../../components/layout/Footer', () => ({ default: () => null }));
vi.mock('react-hot-toast', () => ({ default: mocks.toast }));
let rows;
beforeEach(() => {
  vi.resetAllMocks();
  rows = [{ id: 'a', buyer: { name: 'Buyer', email: 'a@example.test', phone: '0771' }, lead_source: 'Visit • Note: "Source note"', notes: 'Explicit note', last_message: 'Latest message', properties: { id: 'house', title: 'House', images: ['house.jpg'] } }, { id: 'closed', buyer: { name: 'Closed Buyer' }, lead_status: 'Closed' }];
  mocks.api.get.mockImplementation(async path => ({ data: path === '/agents/leads' ? { leads: structuredClone(rows) } : path === '/agents/dashboard-stats' ? { stats: {} } : { properties: [] } }));
  mocks.api.put.mockResolvedValue({ data: {} }); mocks.api.delete.mockResolvedValue({ data: {} });
  vi.spyOn(window, 'confirm').mockReturnValue(false);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
async function show() {
  render(<MemoryRouter><Routes><Route path="/" element={<Dashboard />} /><Route path="/property/house" element={<p>House destination</p>} /></Routes></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: /Client Pipeline & CRM/ }));
  await screen.findAllByTitle('View Details');
}
const dossier = () => screen.getByText('Appointment & Lead Details').closest('.fixed');
const open = () => fireEvent.click(screen.getAllByTitle('View Details')[0]);
test('missing stage defaults to New and Closed history toggles without losing cards', async () => {
  await show(); expect(screen.getAllByRole('combobox')[0]).toHaveValue('New'); expect(screen.getByText('Closed Buyer')).toBeInTheDocument(); fireEvent.click(screen.getByTitle('Toggle visibility of completed deals')); expect(screen.queryByText('Closed Buyer')).not.toBeInTheDocument();
  expect(screen.getByText('1 Closed Deals Archived')).toBeInTheDocument(); fireEvent.click(screen.getByText('Click to View History'));
  expect(screen.getByText('Closed Buyer')).toBeInTheDocument(); expect(screen.getAllByRole('combobox').map(s => s.value)).toEqual(['New', 'Closed']);
  fireEvent.click(screen.getByTitle('Toggle visibility of completed deals')); expect(screen.queryByText('Closed Buyer')).not.toBeInTheDocument();
});
test.each([
  ['notes', {}, 'Explicit note'],
  ['message', { notes: '' }, 'Latest message'],
  ['source', { notes: '', last_message: 'No messages yet' }, 'Source note'],
  ['empty', { notes: '', last_message: '', lead_source: '', buyer: null, properties: null }, 'No additional notes provided during booking.'],
])('dossier %s fallback preserves optional contact/source/property sections', async (_, overrides, expected) => {
  Object.assign(rows[0], overrides); await show(); open(); const modal = within(dossier());
  expect(modal.getByText(expected)).toBeInTheDocument(); expect(modal.getByRole('combobox')).toHaveValue('New');
  if (rows[0].buyer) { expect(modal.getByRole('link', { name: '0771' })).toHaveAttribute('href', 'tel:0771'); expect(modal.getByRole('link', { name: 'a@example.test' })).toHaveAttribute('href', 'mailto:a@example.test'); }
  else { expect(modal.getByText('Prospective Buyer')).toBeInTheDocument(); expect(modal.queryAllByRole('link')).toHaveLength(0); }
  if (rows[0].lead_source) { expect(modal.getByText('Visit')).toBeInTheDocument(); expect(modal.getByText('Received: Unknown')).toBeInTheDocument(); }
  else expect(modal.queryByText('Requested Service / Format')).not.toBeInTheDocument();
  if (rows[0].properties) { expect(modal.getByText('Rs. 0')).toBeInTheDocument(); expect(modal.getByRole('img', { name: 'House' })).toHaveAttribute('src', 'house.jpg'); fireEvent.click(modal.getByTitle('View Property')); expect(screen.getByText('House destination')).toBeInTheDocument(); }
  else expect(modal.queryByText('Target Property')).not.toBeInTheDocument();
});
test('confirmation, modal stage, delete cancellation and direct chat use parent actions', async () => {
  await show(); fireEvent.click(screen.getByRole('button', { name: 'Confirm Appointment' }));
  await waitFor(() => expect(mocks.api.put).toHaveBeenCalledWith('/agents/leads/a', { lead_status: 'Showing' }));
  open(); fireEvent.change(within(dossier()).getByRole('combobox'), { target: { value: 'Offer' } });
  await waitFor(() => expect(mocks.api.put).toHaveBeenCalledWith('/agents/leads/a', { lead_status: 'Offer' }));
  fireEvent.click(within(dossier()).getByRole('button', { name: 'Delete Lead' })); expect(window.confirm).toHaveBeenCalled(); expect(mocks.api.delete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Direct Chat' })); expect(screen.queryByText('Appointment & Lead Details')).not.toBeInTheDocument(); expect(screen.getByText('Buyer Inquiries (2)')).toBeInTheDocument();
});

test('appointment notification deep link opens the exact booking dossier',async()=>{
 rows=[{id:'first',is_direct_booking:true,buyer:{name:'First booking'}},{id:'requested',is_direct_booking:true,buyer:{name:'Requested booking'}}];
 render(<MemoryRouter initialEntries={['/?appointment=requested']}><Dashboard/></MemoryRouter>);
 await screen.findByText('Appointment & Lead Details');
 expect(within(dossier()).getByText('Requested booking')).toBeInTheDocument();
 expect(within(dossier()).queryByText('First booking')).not.toBeInTheDocument();
});
