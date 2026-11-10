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
const selectBob = () => fireEvent.click(screen.getAllByRole('button', { name: /Buyer InquiryGeneral Consultation/ })[0]);
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
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

test('late response from A cannot replace messages after B is selected', async () => {
  const old = deferred(); const base = mocks.api.get.getMockImplementation();
  mocks.api.get.mockImplementation(path => path === '/conversations/a/messages' ? old.promise
    : path === '/conversations/b/messages' ? Promise.resolve({ data: { messages: [{ body: 'Current B' }] } }) : base(path));
  await show(); select(); await flush(); selectBob(); await screen.findByText('Current B');
  await act(async () => { old.resolve({ data: { messages: [{ body: 'Stale A' }] } }); });
  expect(screen.getByText('Current B')).toBeInTheDocument(); expect(screen.queryByText('Stale A')).not.toBeInTheDocument();
});

test('selecting B clears A messages while B response is pending', async () => {
  const pending = deferred(); const base = mocks.api.get.getMockImplementation();
  messages = [{ body: 'Visible A' }];
  mocks.api.get.mockImplementation(path => path === '/conversations/b/messages' ? pending.promise : base(path));
  await show(); select(); await screen.findByText('Visible A'); selectBob();
  expect(screen.queryByText('Visible A')).not.toBeInTheDocument();
  await act(async () => { pending.resolve({ data: { messages: [{ body: 'Visible B' }] } }); });
  expect(screen.getByText('Visible B')).toBeInTheDocument();
});

test('older overlapping poll cannot overwrite the latest same-chat response', async () => {
  const old = deferred(); const base = mocks.api.get.getMockImplementation(); let reads = 0;
  mocks.api.get.mockImplementation(path => path === '/conversations/a/messages'
    ? (++reads === 1 ? old.promise : Promise.resolve({ data: { messages: [{ body: 'Newest poll' }] } })) : base(path));
  await show(); vi.useFakeTimers(); select(); await flush();
  await act(async () => { vi.advanceTimersByTime(4000); }); await flush();
  expect(screen.getByText('Newest poll')).toBeInTheDocument();
  await act(async () => { old.resolve({ data: { messages: [{ body: 'Older poll' }] } }); });
  expect(screen.getByText('Newest poll')).toBeInTheDocument(); expect(screen.queryByText('Older poll')).not.toBeInTheDocument();
});

test('late A send completion neither refreshes A nor overwrites B', async () => {
  const post = deferred(); const base = mocks.api.get.getMockImplementation();
  mocks.api.post.mockReturnValue(post.promise);
  mocks.api.get.mockImplementation(path => path === '/conversations/b/messages'
    ? Promise.resolve({ data: { messages: [{ body: 'B stays visible' }] } }) : base(path));
  await show(); select(); await flush(); fireEvent.change(input(), { target: { value: 'A reply' } }); fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  selectBob(); await screen.findByText('B stays visible');
  await act(async () => { post.resolve({ data: {} }); });
  expect(screen.getByText('B stays visible')).toBeInTheDocument();
  expect(mocks.api.get.mock.calls.filter(([path]) => path === '/conversations/a/messages')).toHaveLength(1);
});

test('old send cannot release a new chat pending-send flag', async () => {
  const a = deferred(), b = deferred(); mocks.api.post.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);
  await show(); select(); await flush(); fireEvent.change(input(), { target: { value: 'A reply' } }); fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  selectBob(); await flush(); fireEvent.change(input(), { target: { value: 'B reply' } });
  expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled(); fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  await act(async () => { a.resolve({}); });
  expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  await act(async () => { b.resolve({}); });
  expect(mocks.api.post.mock.calls.map(([path]) => path)).toEqual(['/conversations/a/messages', '/conversations/b/messages']);
});

test('pending read completing after unmount cannot schedule a scroll timer', async () => {
  const read = deferred(); const base = mocks.api.get.getMockImplementation();
  mocks.api.get.mockImplementation(path => path.includes('/conversations/') ? read.promise : base(path));
  await show(); vi.useFakeTimers(); select(); await flush(); cleanup();
  await act(async () => { read.resolve({ data: { messages: [] } }); });
  expect(vi.getTimerCount()).toBe(0); expect(scroll).not.toHaveBeenCalled();
});

test('unmount clears scroll work from both polling and successful send', async () => {
  await show(); vi.useFakeTimers(); select(); await flush();
  fireEvent.change(input(), { target: { value: 'Reply' } }); fireEvent.click(screen.getByRole('button', { name: 'Send' })); await flush();
  cleanup(); expect(vi.getTimerCount()).toBe(0);
  await act(async () => { vi.advanceTimersByTime(100); }); expect(scroll).not.toHaveBeenCalled();
});
