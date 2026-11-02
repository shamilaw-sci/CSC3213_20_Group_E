import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import Dashboard from './Dashboard';
const mocks = vi.hoisted(() => ({ api: { get: vi.fn(), post: vi.fn() }, toast: { error: vi.fn() } }));
vi.mock('../../context/api', () => ({ default: mocks.api }));
vi.mock('../../context/UserAuthContext', () => ({ useAuth: () => ({ user: agent }) }));
vi.mock('../../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('../../components/layout/Footer', () => ({ default: () => null }));
vi.mock('react-hot-toast', () => ({ default: mocks.toast }));
const agent = { id: 7, role: 'AGENT' };
let leads, messages, scroll, scrollDescriptor;
const flush = async () => { await act(async () => { await Promise.resolve(); }); };
beforeEach(() => {
  vi.resetAllMocks();
  leads = [{ id: 'a', buyer: { name: 'Alice', phone: '0771', email: 'alice@example.test' }, properties: { title: 'House' } }, { id: 'b', buyer: { email: 'email@example.test' } }, { id: 'c' }];
  messages = [];
  scroll = vi.fn();
  scrollDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView');
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: scroll });
  mocks.api.get.mockImplementation(async path => ({ data: path === '/agents/leads' ? { leads } : path === '/agents/dashboard-stats' ? { stats: {} } : path.includes('/conversations/') ? { messages } : { properties: [] } }));
  mocks.api.post.mockResolvedValue({ data: {} });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); if (scrollDescriptor) Object.defineProperty(Element.prototype, 'scrollIntoView', scrollDescriptor); else delete Element.prototype.scrollIntoView; });
async function show() {
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: 'Unified Live Chat' }));
}
const select = () => fireEvent.click(screen.getByRole('button', { name: /AliceHouse/ }));
const input = () => screen.getByPlaceholderText('Type your reply to buyer...');
test('empty list and selection prompt remain explicit', async () => {
  leads = []; await show(); expect(screen.getByText('No active conversations yet')).toBeInTheDocument(); expect(screen.getByText('Select a buyer conversation')).toBeInTheDocument(); expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
});
test('selection preserves strict sender alignment, optional contacts and buyer/property defaults', async () => {
  messages = [{ sender_id: 7, body: 'Mine' }, { sender_id: '7', body: 'Theirs' }];
  await show(); select(); await screen.findByText('Mine');
  expect(screen.getByText('Mine').parentElement).toHaveClass('justify-end'); expect(screen.getByText('Theirs').parentElement).toHaveClass('justify-start');
  expect(screen.getByRole('link', { name: 'Call Buyer' })).toHaveAttribute('href', 'tel:0771');
  fireEvent.click(screen.getAllByRole('button', { name: /Buyer InquiryGeneral Consultation/ })[0]);
  expect(screen.getByText('email@example.test')).toBeInTheDocument(); expect(screen.queryByRole('link', { name: 'Call Buyer' })).not.toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('button', { name: /Buyer InquiryGeneral Consultation/ })[1]); expect(screen.getByText('Verified Inquirer')).toBeInTheDocument(); expect(screen.getByText('Buyer')).toBeInTheDocument();
});
test('draft and selection survive tab unmount while polling continues; cleanup clears interval and latest scroll', async () => {
  await show(); vi.useFakeTimers(); select(); await flush();
  expect(mocks.api.get).toHaveBeenCalledWith('/conversations/a/messages'); expect(screen.getByText('Start the conversation with this buyer')).toBeInTheDocument();
  fireEvent.change(input(), { target: { value: 'draft' } });
  await act(async () => { vi.advanceTimersByTime(100); }); expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth' });
  fireEvent.click(screen.getByRole('button', { name: 'Overview & Pulse' })); expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  await act(async () => { vi.advanceTimersByTime(3900); }); await flush();
  expect(mocks.api.get.mock.calls.filter(([p]) => p === '/conversations/a/messages')).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: 'Unified Live Chat' })); expect(input()).toHaveValue('draft'); expect(screen.getByRole('link', { name: 'Call Buyer' })).toBeInTheDocument();
  cleanup(); const count = mocks.api.get.mock.calls.length; await act(async () => { vi.advanceTimersByTime(8000); }); expect(mocks.api.get).toHaveBeenCalledTimes(count); expect(scroll).toHaveBeenCalledTimes(1);
});
test('send trims FormData, clears draft immediately and waits for post before refresh', async () => {
  let resolve; mocks.api.post.mockImplementation(() => new Promise(done => { resolve = done; }));
  await show(); select(); await flush(); fireEvent.change(input(), { target: { value: '  hello  ' } }); fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  expect(input()).toHaveValue(''); expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  expect(mocks.api.post.mock.calls[0][0]).toBe('/conversations/a/messages'); expect(mocks.api.post.mock.calls[0][1]).toBeInstanceOf(FormData); expect([...mocks.api.post.mock.calls[0][1].entries()]).toEqual([['body', 'hello']]);
  expect(mocks.api.get.mock.calls.filter(([p]) => p.includes('/conversations/'))).toHaveLength(1);
  fireEvent.change(input(), { target: { value: 'next' } }); expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  messages = [{ sender_id: 7, body: 'hello' }]; resolve({}); await screen.findByText('hello'); expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled(); expect(input()).toHaveValue('next');
});
test('blank draft is disabled and failed send loses submitted draft without refreshing', async () => {
  mocks.api.post.mockRejectedValue(new Error('offline')); await show(); select(); await flush(); fireEvent.change(input(), { target: { value: '   ' } }); expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  fireEvent.change(input(), { target: { value: 'lost' } }); fireEvent.click(screen.getByRole('button', { name: 'Send' })); await waitFor(() => expect(mocks.toast.error).toHaveBeenCalledWith('Failed to send message')); expect(input()).toHaveValue(''); expect(mocks.api.get.mock.calls.filter(([p]) => p.includes('/conversations/'))).toHaveLength(1);
});
